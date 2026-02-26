/**
 * Position-Aware Context Manager
 *
 * Implements context loading with U-shaped attention bias optimization.
 * Based on research: "Found in the Middle" (Hsieh et al., ACL 2024)
 *
 * Key concepts:
 * - Start position: 100% attention weight
 * - Middle position: 50% attention weight
 * - End position: 100% attention weight
 *
 * Place critical info at boundaries, supporting details in middle.
 */

import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";

import { CONFIG } from "../../constants/config";
import { TOKEN_ESTIMATION } from "../../constants/tokenization";
import { readTextFileSafe } from "../../utils/file-utils";
import { logger } from "../../utils/logger";
import {
  getConfigPath,
  resolveContextModulePath,
  resolveToConfig,
} from "../../utils/platform-paths";
import { estimateTokens } from "../../utils/token-estimator";

// ============================================================================
// TYPES
// ============================================================================
// CONSTANTS
// ============================================================================

export type Priority = "critical" | "high" | "medium" | "low";

export interface ContextSource {
  type: "agents" | "module" | "file" | "injected";
  path: string;
  content: string;
  priority: Priority;
  tokens: number;
}

export interface ContextModule {
  name: string;
  path: string;
  content: string;
  priority: Priority;
}

export interface PositionConfig {
  startWeight: number;
  middleWeight: number;
  endWeight: number;
  maxMiddleRatio: number;
}

export interface CompressionResult {
  original: ContextSource[];
  compressed: string;
  tokenReduction: number;
  preservedSections: string[];
}

export interface ContextLoadOptions {
  cwd: string;
  modules?: string[];
  injectedContext?: string;
  maxTokens?: number;
  compressionThreshold?: number;
}

export interface LoadedContext {
  sources: ContextSource[];
  totalTokens: number;
  optimized: string;
  compressed: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const POSITION_CONFIG: PositionConfig = {
  startWeight: CONFIG.POSITION.START_WEIGHT,
  middleWeight: CONFIG.POSITION.MIDDLE_WEIGHT,
  endWeight: CONFIG.POSITION.END_WEIGHT,
  maxMiddleRatio: CONFIG.POSITION.MAX_MIDDLE_RATIO,
};

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// ============================================================================
// CONTEXT MANAGER CLASS
// ============================================================================

export class PositionAwareContext {
  private maxTokens: number;
  private compressionThreshold: number;
  private positionConfig: PositionConfig;

  constructor(options?: { maxTokens?: number; compressionThreshold?: number }) {
    this.maxTokens = options?.maxTokens ?? CONFIG.CONTEXT.MAX_TOKENS;
    this.compressionThreshold =
      options?.compressionThreshold ?? CONFIG.CONTEXT.COMPRESSION_THRESHOLD;
    this.positionConfig = POSITION_CONFIG;
  }

  async loadContext(options: ContextLoadOptions): Promise<LoadedContext> {
    const sources: ContextSource[] = [];

    this.addAgentsSource(sources, options.cwd);
    await this.addModuleSources(sources, options);
    this.addInjectedSource(sources, options);

    const totalTokens = this.calculateTotalTokens(sources);
    const optimized = this.positionOptimize(sources);
    const needsCompression = this.checkCompressionNeeded(totalTokens);

    return {
      sources,
      totalTokens,
      optimized,
      compressed: needsCompression,
    };
  }

  private async addModuleSources(
    sources: ContextSource[],
    options: ContextLoadOptions,
  ): Promise<void> {
    if (!options.modules || options.modules.length === 0) {
      return;
    }

    for (const moduleName of options.modules) {
      const moduleContent = await this.loadModule(moduleName, options.cwd);
      if (moduleContent) {
        sources.push({
          type: "module",
          path: moduleContent.path,
          content: moduleContent.content,
          priority: moduleContent.priority,
          tokens: this.estimateTokens(moduleContent.content),
        });
      }
    }
  }

  private addInjectedSource(sources: ContextSource[], options: ContextLoadOptions): void {
    if (!options.injectedContext) {
      return;
    }

    sources.push({
      type: "injected",
      path: "<injected>",
      content: options.injectedContext,
      priority: "high",
      tokens: this.estimateTokens(options.injectedContext),
    });
  }

  private calculateTotalTokens(sources: ContextSource[]): number {
    return sources.reduce((sum, s) => sum + s.tokens, 0);
  }

  private checkCompressionNeeded(totalTokens: number): boolean {
    const compressionTarget = this.maxTokens * this.compressionThreshold;
    return totalTokens > compressionTarget;
  }

  private async addAgentsSource(sources: ContextSource[], cwd: string): Promise<void> {
    const agentsContent = await this.loadAGENTS(cwd);
    if (!agentsContent) {
      return;
    }

    sources.push({
      type: "agents",
      path: join(cwd, "AGENTS.md"),
      content: agentsContent,
      priority: "critical",
      tokens: this.estimateTokens(agentsContent),
    });
  }

  /**
   * Load AGENTS.md from project root
   *
   * Priority locations:
   * 1. cwd/AGENTS.md
   * 2. Parent directories (up to 3 levels)
   */
  async loadAGENTS(cwd: string): Promise<string | null> {
    const candidates = [join(cwd, "AGENTS.md"), join(cwd, "agents.md"), join(cwd, ".agents.md")];

    // Also check parent directories
    let currentDir = cwd;
    for (let i = 0; i < 3; i++) {
      candidates.push(join(currentDir, "AGENTS.md"));
      const parent = dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        const content = await readTextFileSafe(candidate, "");
        if (content) {
          return content.trim();
        }
      }
    }

    return null;
  }

  /**
   * Load a context module from .opencode/context-modules/
   *
   * Locations checked:
   * 1. cwd/.opencode/context-modules/{name}.md
   * 2. ~/.config/opencode/context-modules/{name}.md
   */
  async loadModule(name: string, cwd: string): Promise<ContextModule | null> {
    const modulePaths = resolveContextModulePath(name, cwd);

    for (const modulePath of modulePaths) {
      if (existsSync(modulePath)) {
        const content = await readTextFileSafe(modulePath, "");
        if (content) {
          const priority = this.extractPriority(content);

          return {
            name,
            path: modulePath,
            content: content.trim(),
            priority,
          };
        }
      }
    }

    return null;
  }

  /**
   * Optimize content placement using U-shaped attention bias
   *
   * Strategy:
   * - Critical priority → start
   * - High priority → end
   * - Medium/Low priority → middle
   */
  positionOptimize(sources: ContextSource[]): string {
    if (sources.length === 0) return "";
    if (sources.length === 1) return sources[0].content;

    // Sort by priority
    const sorted = [...sources].sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
    );

    const sections: string[] = [];

    // Group by priority
    const critical = sorted.filter((s) => s.priority === "critical");
    const high = sorted.filter((s) => s.priority === "high");
    const medium = sorted.filter((s) => s.priority === "medium");
    const low = sorted.filter((s) => s.priority === "low");

    // START: Critical content (100% weight)
    if (critical.length > 0) {
      sections.push(this.formatSection("Critical Rules", critical));
    }

    // MIDDLE: Medium and low priority (50% weight)
    if (medium.length > 0 || low.length > 0) {
      sections.push(this.formatSection("Supporting Context", [...medium, ...low]));
    }

    // END: High priority (95% weight)
    if (high.length > 0) {
      sections.push(this.formatSection("Important Guidelines", high));
    }

    return sections.join("\n\n---\n\n");
  }

  /**
   * Compress context when exceeding threshold
   *
   * Creates structured summary with:
   * - Explicit sections
   * - Key decisions
   * - Files changed (grouped)
   */
  async compress(sources: ContextSource[], targetTokens: number): Promise<CompressionResult> {
    const originalTokens = sources.reduce((sum, s) => sum + s.tokens, 0);

    // Build structured summary
    const sections: string[] = [];
    const preservedSections: string[] = [];

    // Always preserve critical content
    const critical = sources.filter((s) => s.priority === "critical");
    if (critical.length > 0) {
      const criticalSection = this.formatSection("Project Rules (Preserved)", critical);
      sections.push(criticalSection);
      preservedSections.push("critical");
    }

    // Summarize other content
    const nonCritical = sources.filter((s) => s.priority !== "critical");
    if (nonCritical.length > 0) {
      const summarySection = this.createSummary(nonCritical);
      sections.push(summarySection);
    }

    const compressed = sections.join("\n\n");
    const compressedTokens = this.estimateTokens(compressed);

    return {
      original: sources,
      compressed,
      tokenReduction: originalTokens - compressedTokens,
      preservedSections,
    };
  }

  private createSummary(sources: ContextSource[]): string {
    const byType = this.groupByType(sources);
    const lines: string[] = ["## Context Summary\n"];

    if (byType.module && byType.module.length > 0) {
      lines.push("### Modules Loaded");
      for (const m of byType.module) {
        lines.push(`- ${m.path}`);
      }
    }

    if (byType.file && byType.file.length > 0) {
      lines.push("\n### Files Referenced");
      for (const f of byType.file) {
        lines.push(`- ${f.path}`);
      }
    }

    if (byType.injected && byType.injected.length > 0) {
      lines.push("\n### Additional Context");
      lines.push(`${byType.injected.length} context items injected`);
    }

    return lines.join("\n");
  }

  private groupByType(sources: ContextSource[]): Record<string, ContextSource[]> {
    return sources.reduce(
      (acc, source) => {
        const type = source.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(source);
        return acc;
      },
      {} as Record<string, ContextSource[]>,
    );
  }

  private formatSection(title: string, sources: ContextSource[]): string {
    const parts: string[] = [`## ${title}\n`];

    for (const source of sources) {
      parts.push(source.content);
      parts.push("");
    }

    return parts.join("\n").trim();
  }

  private extractPriority(content: string): Priority {
    const match = content.match(/<!--\s*priority:\s*(critical|high|medium|low)\s*-->/i);
    if (match) {
      return match[1].toLowerCase() as Priority;
    }
    return "medium"; // Default
  }

  /**
   * Estimate token count
   *
   * Uses improved estimation:
   * - Words / 0.75 (roughly 4 chars per token average)
   * - Adjusted for code (more tokens per word)
   */
  estimateTokens(text: string): number {
    if (!text) return 0;

    // Count words (split by whitespace)
    const words = text.split(/\s+/).filter(Boolean).length;

    // Count code-like patterns (functions, brackets, etc add tokens)
    const codePatterns = (text.match(/[{}\[\]()<>:=;,.]/g) || []).length;

    const naturalTokens = Math.ceil(words / TOKEN_ESTIMATION.WORDS_PER_TOKEN_NATURAL);
    const codeTokens = Math.ceil(codePatterns * TOKEN_ESTIMATION.CODE_PATTERN_TOKEN_MULTIPLIER);

    return naturalTokens + codeTokens;
  }

  /**
   * Create metadata-only history for RLM
   * Reduces history to just IDs and status, not full content
   */
  createMetadataOnly(
    history: Array<{ id: string; type: string; status: string; timestamp?: number }>,
  ): Array<{
    id: string;
    type: string;
    status: string;
    timestamp?: number;
  }> {
    return history.map((entry) => ({
      id: entry.id,
      type: entry.type,
      status: entry.status,
      timestamp: entry.timestamp,
    }));
  }

  /**
   * List available context modules in a directory
   */
  async listModules(cwd: string): Promise<string[]> {
    const moduleDirs = [
      resolveToConfig("context-modules"),
      join(cwd, "context-modules"),
      getConfigPath("context-modules"),
    ];

    const modules: Set<string> = new Set();

    for (const dir of moduleDirs) {
      if (existsSync(dir)) {
        try {
          const files = await readdir(dir);
          for (const file of files) {
            if (file.endsWith(".md")) {
              modules.add(file.replace(".md", ""));
            }
          }
        } catch {
          continue;
        }
      }
    }

    return Array.from(modules).sort();
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Default context manager instance
 */
export const contextManager = new PositionAwareContext();

/**
 * Quick load context for a project
 */
export async function loadProjectContext(cwd: string, modules?: string[]): Promise<LoadedContext> {
  return contextManager.loadContext({ cwd, modules });
}

// ============================================================================
// CONFIGURATION EXPORT
// ============================================================================

export const positionBiasConfig = {
  uShapedBias: true,
  priorityPositions: {
    start: POSITION_CONFIG.startWeight,
    end: POSITION_CONFIG.endWeight,
    middle: POSITION_CONFIG.middleWeight,
  },
  improvementTarget: "25-30%",
  maxMiddlePlacement: POSITION_CONFIG.maxMiddleRatio,
  compressionThreshold: CONFIG.CONTEXT.COMPRESSION_THRESHOLD,
};
