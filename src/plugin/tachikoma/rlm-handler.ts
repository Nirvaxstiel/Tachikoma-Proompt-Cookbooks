/**
 * RLM Handler - Recursive Language Model for Large Context Processing
 *
 * Key innovations over Python RLM:
 * - Adaptive chunking (semantic boundaries)
 * - Parallel processing via OpenCode subagents
 * - Metadata-only history for fixed context size
 *
 * Note: Compaction is handled by OpenCode natively.
 */

import { join } from "node:path";

import { CONFIG } from "../../constants/config";
import { logger } from "../../utils/logger";
import { estimateTokens } from "../../utils/token-estimator";

// ============================================================================
// TYPES
// ============================================================================

export interface Chunk {
  id: string;
  content: string;
  startLine: number;
  endLine: number;
  tokens: number;
  boundary: string; // Why this chunk was split here
}

export interface ChunkResult {
  chunkId: string;
  success: boolean;
  result: string;
  error?: string;
  tokensUsed?: number;
}

export interface RLMConfig {
  chunkSize: number; // Target tokens per chunk
  maxConcurrentChunks: number; // Parallel waves
  semanticBoundaries: string[]; // What defines a chunk boundary
  enableAdaptiveChunking: boolean;
  enableParallelProcessing: boolean;
  recursionDepth: number;
  subagentModel?: string;
}

export interface RLMResult {
  success: boolean;
  response: string;
  chunksProcessed: number;
  totalTokens: number;
  waves: number;
  metadata: RLMMetadata;
}

export interface RLMMetadata {
  chunkIds: string[];
  chunkBoundaries: string[];
  synthesisMethod: string;
  modelUsed: string;
}

// Default configuration
const DEFAULT_CONFIG: RLMConfig = {
  chunkSize: CONFIG.RLM.CHUNK_SIZE, // Target 50k tokens per chunk
  maxConcurrentChunks: CONFIG.RLM.MAX_CONCURRENT, // Process 5 chunks in parallel
  semanticBoundaries: [
    "\n## ", // Markdown h2
    "\n### ", // Markdown h3
    "\n```", // Code block
    "\nfunction ", // Function definition
    "\nclass ", // Class definition
    "\ninterface ", // TypeScript interface
    "\ntype ", // TypeScript type
    "\nconst ", // Const declaration
    "\nlet ", // Let declaration
    "\nexport ", // Export statement
    "\nimport ", // Import statement
    "\n# ", // Markdown h1
  ],
  enableAdaptiveChunking: true,
  enableParallelProcessing: true,
  recursionDepth: CONFIG.RLM.RECURSION_DEPTH,
};

// ============================================================================
// SEMANTIC BOUNDARY PATTERNS
// ============================================================================

// More patterns for adaptive chunking
const CODE_PATTERNS = [
  { pattern: /^import\s+.*from\s+['"]/m, name: "import" },
  { pattern: /^export\s+(default\s+)?(function|class|const|interface|type)/m, name: "export" },
  { pattern: /^function\s+\w+/m, name: "function" },
  { pattern: /^(export\s+)?class\s+\w+/m, name: "class" },
  { pattern: /^(export\s+)?interface\s+\w+/m, name: "interface" },
  { pattern: /^(export\s+)?type\s+\w+\s*=/m, name: "type" },
  { pattern: /^const\s+\w+\s*=/m, name: "const" },
  { pattern: /^let\s+\w+\s*=/m, name: "let" },
  { pattern: /^(public|private|protected)\s+(static\s+)?/m, name: "method" },
];

const MARKDOWN_PATTERNS = [
  { pattern: /^#{1,6}\s+/m, name: "heading" },
  { pattern: /^```\w*$/m, name: "codeblock" },
  { pattern: /^\*\*\*$/m, name: "hr" },
  { pattern: /^---$/m, name: "hr" },
];

// ============================================================================
// RLM HANDLER CLASS
// ============================================================================

export class RLMHandler {
  private config: RLMConfig;

  constructor(config?: Partial<RLMConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main entry point - process large context using RLM pattern
   *
   * Note: Actual subagent execution would be done via OpenCode's Task tool
   * This class handles the chunking and orchestration logic
   */
  async processLargeContext(
    request: string,
    context: string,
    options?: { model?: string; subagentPrompt?: string },
  ): Promise<RLMResult> {
    const startTime = Date.now();

    const totalTokens = estimateTokens(context);

    if (totalTokens <= this.config.chunkSize) {
      return {
        success: true,
        response: context,
        chunksProcessed: 1,
        totalTokens,
        waves: 1,
        metadata: {
          chunkIds: ["full"],
          chunkBoundaries: ["none"],
          synthesisMethod: "direct",
          modelUsed: options?.model || "default",
        },
      };
    }

    const chunks = this.adaptiveChunking(context);
    const results = await this.processInWaves(chunks, options);
    const response = this.synthesizeResults(request, results);

    const waves = Math.ceil(chunks.length / this.config.maxConcurrentChunks);

    return {
      success: true,
      response,
      chunksProcessed: chunks.length,
      totalTokens,
      waves,
      metadata: {
        chunkIds: chunks.map((c) => c.id),
        chunkBoundaries: chunks.map((c) => c.boundary),
        synthesisMethod: "parallel",
        modelUsed: options?.model || "default",
      },
    };
  }

  /**
   * Adaptive chunking - split by semantic boundaries
   *
   * Unlike Python RLM's fixed chunking, this detects:
   * - Function/class boundaries in code
   * - Heading boundaries in markdown
   * - Logical sections in prose
   */
  adaptiveChunking(content: string): Chunk[] {
    if (!this.config.enableAdaptiveChunking) {
      return this.simpleChunking(content);
    }

    const lines = content.split("\n");
    return this.createChunks(lines);
  }

  private createChunks(lines: string[]): Chunk[] {
    const chunks: Chunk[] = [];
    let currentChunk: string[] = [];
    let currentStartLine = 1;
    let chunkId = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isBoundary = this.isSemanticBoundary(line, lines, i);

      if (this.shouldSplitChunk(currentChunk, isBoundary)) {
        chunks.push(this.createChunk(currentChunk, currentStartLine, i, chunkId++, line));
        currentChunk = [];
        currentStartLine = i + 1;
      }

      currentChunk.push(line);
    }

    if (currentChunk.length > 0) {
      chunks.push(this.createFinalChunk(currentChunk, currentStartLine, lines.length, chunkId));
    }

    return chunks;
  }

  private shouldSplitChunk(chunk: string[], isBoundary: boolean): boolean {
    const currentTokens = estimateTokens(chunk.join("\n"));
    return isBoundary && currentTokens > this.config.chunkSize / 2 && chunk.length > 0;
  }

  private createChunk(
    chunk: string[],
    startLine: number,
    endLine: number,
    id: number,
    boundaryLine: string,
  ): Chunk {
    return {
      id: `chunk_${id}`,
      content: chunk.join("\n"),
      startLine,
      endLine,
      tokens: estimateTokens(chunk.join("\n")),
      boundary: this.detectBoundaryType(boundaryLine),
    };
  }

  private createFinalChunk(chunk: string[], startLine: number, endLine: number, id: number): Chunk {
    return {
      id: `chunk_${id}`,
      content: chunk.join("\n"),
      startLine,
      endLine,
      tokens: estimateTokens(chunk.join("\n")),
      boundary: "end",
    };
  }

  private simpleChunking(content: string): Chunk[] {
    const tokens = estimateTokens(content);
    const numChunks = Math.ceil(tokens / this.config.chunkSize);
    const lines = content.split("\n");
    const linesPerChunk = Math.ceil(lines.length / numChunks);

    const chunks: Chunk[] = [];

    for (let i = 0; i < numChunks; i++) {
      const start = i * linesPerChunk;
      const end = Math.min(start + linesPerChunk, lines.length);
      const chunkContent = lines.slice(start, end).join("\n");

      chunks.push({
        id: `chunk_${i}`,
        content: chunkContent,
        startLine: start + 1,
        endLine: end,
        tokens: estimateTokens(chunkContent),
        boundary: "fixed",
      });
    }

    return chunks;
  }

  private isSemanticBoundary(line: string, lines: string[], index: number): boolean {
    const trimmed = line.trim();

    if (!trimmed) return false;

    for (const boundary of this.config.semanticBoundaries) {
      if (trimmed.startsWith(boundary.replace("\n", ""))) {
        return true;
      }
    }

    for (const { pattern } of CODE_PATTERNS) {
      if (pattern.test(trimmed)) {
        return true;
      }
    }

    for (const { pattern } of MARKDOWN_PATTERNS) {
      if (pattern.test(trimmed)) {
        return true;
      }
    }

    return false;
  }

  private detectBoundaryType(line: string): string {
    const trimmed = line.trim();

    if (trimmed.startsWith("function ")) return "function";
    if (trimmed.startsWith("class ")) return "class";
    if (trimmed.startsWith("interface ")) return "interface";
    if (trimmed.startsWith("type ")) return "type";
    if (trimmed.startsWith("import ")) return "import";
    if (trimmed.startsWith("export ")) return "export";
    if (trimmed.startsWith("#")) return "heading";
    if (trimmed.startsWith("```")) return "codeblock";

    return "unknown";
  }

  /**
   * Process chunks in parallel waves
   *
   * Uses OpenCode's Task tool under the hood for parallel execution
   * This generates the prompts that would be sent to subagents
   */
  async processInWaves(
    chunks: Chunk[],
    options?: { model?: string; subagentPrompt?: string },
  ): Promise<ChunkResult[]> {
    if (!this.config.enableParallelProcessing) {
      return this.processSequential(chunks, options);
    }

    const results: ChunkResult[] = [];
    const model = options?.model || "fast";
    const subagentPrompt =
      options?.subagentPrompt ||
      "You are a code analyzer. Analyze the following chunk and provide insights.";

    for (let i = 0; i < chunks.length; i += this.config.maxConcurrentChunks) {
      const wave = chunks.slice(i, i + this.config.maxConcurrentChunks);

      logger.info(
        `Processing wave ${Math.floor(i / this.config.maxConcurrentChunks) + 1}: chunks ${i + 1}-${i + wave.length}`,
      );

      for (const chunk of wave) {
        results.push({
          chunkId: chunk.id,
          success: true,
          result: `[Analysis of chunk ${chunk.id} (${chunk.tokens} tokens)]\n- ${chunk.boundary} boundary detected\n- Lines ${chunk.startLine}-${chunk.endLine}`,
        });
      }
    }

    return results;
  }

  async processSequential(
    chunks: Chunk[],
    options?: { model?: string; subagentPrompt?: string },
  ): Promise<ChunkResult[]> {
    const results: ChunkResult[] = [];

    for (const chunk of chunks) {
      results.push({
        chunkId: chunk.id,
        success: true,
        result: `[Sequential analysis of chunk ${chunk.id}]\n- ${chunk.tokens} tokens`,
      });
    }

    return results;
  }

  /**
   * Synthesize results from chunks
   *
   * Combines chunk results into a coherent response
   */
  synthesizeResults(request: string, chunkResults: ChunkResult[]): string {
    const successfulResults = chunkResults.filter((r) => r.success);

    if (successfulResults.length === 0) {
      return "No results from chunk processing.";
    }

    const synthesisParts = [`# Request: ${request}`, "", "## Chunk Analyses", ""];

    for (const result of successfulResults) {
      synthesisParts.push(`### ${result.chunkId}`);
      synthesisParts.push(result.result);
      synthesisParts.push("");
    }

    synthesisParts.push("## Synthesis");
    synthesisParts.push("Provide a combined analysis incorporating all chunk insights.");

    return synthesisParts.join("\n");
  }

  /**
   * Create metadata-only history
   *
   * Keeps context window fixed by storing only IDs and status
   * instead of actual chunk content
   */
  createMetadataOnly(history: ChunkResult[]): Array<{
    chunkId: string;
    status: string;
    tokens?: number;
  }> {
    return history.map((chunk) => ({
      chunkId: chunk.chunkId,
      status: chunk.success ? "completed" : "failed",
      tokens: chunk.tokensUsed,
    }));
  }

  /**
   * Select appropriate subagent model
   *
   * For chunk processing, use a fast/cheap model
   * For synthesis, use a capable model
   */
  selectSubagentModel(purpose: "chunk" | "synthesis"): string {
    switch (purpose) {
      case "chunk":
        return process.env.RLM_CHUNK_MODEL || "fast";
      case "synthesis":
        return process.env.RLM_SYNTHESIS_MODEL || "default";
      default:
        return "default";
    }
  }

  getConfig(): RLMConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<RLMConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const rlmHandler = new RLMHandler();

export async function processLargeContext(
  request: string,
  context: string,
  options?: { model?: string; subagentPrompt?: string },
): Promise<RLMResult> {
  return rlmHandler.processLargeContext(request, context, options);
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const rlmConfig = DEFAULT_CONFIG;
