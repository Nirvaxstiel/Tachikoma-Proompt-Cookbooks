#!/usr/bin/env bun

/**
 * Smart Context Loader
 *
 * Loads only relevant sections from context modules based on intent and complexity
 * Implements token-saving extraction strategies
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import yaml from "js-yaml";

interface ExtractionRule {
  intents_to_load?: string[];
  intents_to_skip?: string[];
  sections?: Record<string, string[]>;
  skip?: string[];
  intent_specific?: Record<string, { sections: string[] }>;
}

interface ExtractionRules {
  extraction_rules: Record<string, ExtractionRule>;
  lite_mode_thresholds: Record<string, number>;
  cache_config: Record<string, number>;
}

interface CacheEntry {
  content: string;
  extractedAt: number;
  moduleMtime: number;
}

const CLI_DIR = import.meta.dir;
const CONFIG_DIR = join(CLI_DIR, "..", "agents", "tachikoma", "config");
const CONTEXT_DIR = join(CLI_DIR, "..", "context-modules");
const EXTRACTION_CONFIG = join(CONFIG_DIR, "context-extraction.yaml");

let _extractionRules: ExtractionRules | null = null;
let _extractionRulesMtime = 0;
const _contentCache = new Map<string, CacheEntry>();

/**
 * Load extraction rules from config
 */
function loadExtractionRules(): ExtractionRules {
  const stats = statSync(EXTRACTION_CONFIG);
  const mtime = stats.mtimeMs;

  if (_extractionRules && mtime === _extractionRulesMtime) {
    return _extractionRules;
  }

  const content = readFileSync(EXTRACTION_CONFIG, "utf-8");
  const docs = yaml.loadAll(content);

  // Merge all documents
  _extractionRules = {
    extraction_rules: {},
    lite_mode_thresholds: {},
    cache_config: {},
  } as ExtractionRules;
  for (const doc of docs) {
    if (doc && typeof doc === "object") {
      const d = doc as any;
      if (d.extraction_rules) {
        Object.assign(_extractionRules.extraction_rules, d.extraction_rules);
      }
      if (d.lite_mode_thresholds) {
        Object.assign(
          _extractionRules.lite_mode_thresholds,
          d.lite_mode_thresholds,
        );
      }
      if (d.cache_config) {
        Object.assign(_extractionRules.cache_config, d.cache_config);
      }
    }
  }

  _extractionRulesMtime = mtime;

  return _extractionRules;
}

/**
 * Extract specific sections from a markdown file
 */
function extractSections(
  content: string,
  sections: string[],
  skip: string[] = [],
): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let inSection = false;
  let skipSection = false;
  let currentSection = "";

  for (const line of lines) {
    // Detect markdown headers (## or ###)
    const headerMatch = line.match(/^(##+)\s+(.+)/);

    if (headerMatch) {
      currentSection = headerMatch[2].toLowerCase().trim();
      inSection = sections.some((s) =>
        currentSection.includes(s.toLowerCase()),
      );
      skipSection = skip.some((s) => currentSection.includes(s.toLowerCase()));

      if (inSection && !skipSection) {
        result.push(line);
      }
    } else if (inSection && !skipSection) {
      result.push(line);
    }
  }

  return result.join("\n");
}

/**
 * Get relevant sections for a specific intent
 */
function getRelevantSections(
  intent: string,
  module: string,
): { sections: string[]; skip: string[] } {
  const rules = loadExtractionRules();

  // Try both with and without .md extension
  let rule = rules.extraction_rules[module];
  if (!rule) {
    const normalizedModule = module.endsWith(".md") ? module : `${module}.md`;
    rule = rules.extraction_rules[normalizedModule];
  }
  if (!rule) {
    const normalizedModule = module.endsWith(".md")
      ? module.slice(0, -3)
      : module;
    rule = rules.extraction_rules[normalizedModule];
  }

  if (!rule) {
    return { sections: [], skip: [] };
  }

  // Check if intent should skip this module entirely
  if (rule.intents_to_skip && rule.intents_to_skip.includes(intent)) {
    return { sections: [], skip: ["ALL"] };
  }

  // Check for intent-specific sections
  if (rule.intent_specific && rule.intent_specific[intent]) {
    return {
      sections: rule.intent_specific[intent].sections,
      skip: rule.skip || [],
    };
  }

  // Use default sections for this intent type
  if (rule.sections) {
    const sections: string[] = [];

    if (intent === "implement" || intent === "debug" || intent === "refactor") {
      sections.push(...(rule.sections.coding_tasks || []));
    } else if (intent === "review") {
      sections.push(...(rule.sections.review_tasks || []));
    } else if (intent === "research") {
      sections.push(...(rule.sections.research_tasks || []));
    }

    return {
      sections,
      skip: rule.skip || [],
    };
  }

  return { sections: [], skip: [] };
}

/**
 * Load a context module with smart extraction
 */
function loadContextModule(
  module: string,
  intent: string,
  complexity: number = 0.5,
): {
  content: string;
  tokenEstimate: number;
  extractionMethod: "full" | "partial" | "skipped" | "cached" | "not-found";
  lines: number;
  savings?: number;
  fullLines?: number;
} {
  const modulePath = module.endsWith(".md")
    ? `${CONTEXT_DIR}/${module}`
    : `${CONTEXT_DIR}/${module}.md`;

  if (!existsSync(modulePath)) {
    return {
      content: "",
      tokenEstimate: 0,
      extractionMethod: "not-found",
      lines: 0,
    };
  }

  // Check cache first
  const cacheKey = `${module}:${intent}`;
  const cached = _contentCache.get(cacheKey);
  const stats = statSync(modulePath);

  if (cached && cached.moduleMtime === stats.mtimeMs) {
    // Check cache age
    const rules = loadExtractionRules();
    const cacheTTL = rules.cache_config.extraction_ttl || 86400000;

    if (Date.now() - cached.extractedAt < cacheTTL) {
      return {
        content: cached.content,
        tokenEstimate: estimateTokens(cached.content),
        extractionMethod: "cached",
        lines: cached.content.split("\n").length,
      };
    }
  }

  // Load content
  const fullContent = readFileSync(modulePath, "utf-8");
  const fullLines = fullContent.split("\n").length;

  // Get extraction rules for this intent
  const { sections, skip } = getRelevantSections(intent, module);

  // Check if intent should skip this module
  if (skip.includes("ALL")) {
    return {
      content: "",
      tokenEstimate: 0,
      extractionMethod: "skipped",
      lines: 0,
    };
  }

  // Extract relevant sections if specified
  let content: string;
  let extractionMethod: "full" | "partial" | "skipped";

  if (sections.length > 0) {
    content = extractSections(fullContent, sections, skip);
    extractionMethod = "partial";
  } else {
    content = fullContent;
    extractionMethod = "full";
  }

  // Calculate savings
  const extractedLines = content.split("\n").length;
  const savings = fullLines - extractedLines;

  // Cache the result
  _contentCache.set(cacheKey, {
    content,
    extractedAt: Date.now(),
    moduleMtime: stats.mtimeMs,
  });

  return {
    content,
    tokenEstimate: estimateTokens(content),
    extractionMethod,
    lines: extractedLines,
    savings,
    fullLines,
  };
}

/**
 * Estimate token count (simplified heuristic)
 */
function estimateTokens(content: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(content.length / 4);
}

/**
 * Load all context modules for a route with smart extraction
 */
export function loadContextModules(
  intent: string,
  modules: string[],
  complexity: number = 0.5,
): {
  loaded: Record<
    string,
    {
      content: string;
      tokenEstimate: number;
      extractionMethod: "full" | "partial" | "skipped";
      lines: number;
      savings?: number;
      fullLines?: number;
    }
  >;
  totalTokens: number;
  totalSavings: number;
  summary: string[];
} {
  const loaded: any = {};
  let totalTokens = 0;
  let totalSavings = 0;
  const summary: string[] = [];

  for (const module of modules) {
    const result = loadContextModule(module, intent, complexity);
    loaded[module] = result;

    totalTokens += result.tokenEstimate;

    if (result.savings) {
      totalSavings += result.savings;
    }

    // Build summary
    let methodIcon = "";
    switch (result.extractionMethod) {
      case "full":
        methodIcon = "📄";
        break;
      case "partial":
        methodIcon = "✂️";
        break;
      case "skipped":
        methodIcon = "⏭️";
        break;
      case "cached":
        methodIcon = "💾";
        break;
      case "not-found":
        methodIcon = "❌";
        break;
    }

    const lineInfo =
      result.lines > 0
        ? `(${result.lines} lines${result.savings ? `, -${result.savings} saved` : ""})`
        : "";

    summary.push(`  ${methodIcon} ${module}${lineInfo ? " " + lineInfo : ""}`);
  }

  return {
    loaded,
    totalTokens,
    totalSavings,
    summary,
  };
}

/**
 * Check if a module should be skipped for an intent
 */
export function shouldSkipModule(intent: string, module: string): boolean {
  const rules = loadExtractionRules();
  const rule = rules.extraction_rules[module];

  if (!rule || !rule.intents_to_skip) {
    return false;
  }

  return rule.intents_to_skip.includes(intent);
}

/**
 * Get lite mode threshold
 */
export function getLiteThreshold(thresholdName: string): number {
  const rules = loadExtractionRules();
  return rules.lite_mode_thresholds[thresholdName] || 0.5;
}

/**
 * Clear extraction cache
 */
export function clearExtractionCache(): void {
  _contentCache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ key: string; age: number }>;
} {
  const entries = Array.from(_contentCache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.extractedAt,
  }));

  return {
    size: _contentCache.size,
    entries,
  };
}

// CLI interface for testing
if (import.meta.main) {
  const args = process.argv.slice(2);
  const intent = args[0];
  const modules = args.slice(1);

  if (!intent) {
    console.log(
      "Usage: bun run smart-context-loader.ts <intent> [module1 module2 ...]",
    );
    console.log("");
    console.log("Example:");
    console.log(
      "  bun run smart-context-loader.ts debug 00-core-contract.md 12-commenting-rules.md",
    );
    process.exit(1);
  }

  // If no modules specified, load all for the intent from intents.yaml
  let modulesToLoad = modules;
  if (modulesToLoad.length === 0) {
    const intentsConfig = loadExtractionRules();
    const intentsPath = join(CONFIG_DIR, "intents.yaml");
    const intents = yaml.load(readFileSync(intentsPath, "utf-8")) as any;
    modulesToLoad = intents.intents[intent]?.context_modules || [];
  }

  const result = loadContextModules(intent, modulesToLoad);

  console.log(`Smart Context Loading for intent: ${intent}`);
  console.log("");
  console.log("Modules loaded:");
  result.summary.forEach((line) => console.log(line));
  console.log("");
  console.log(`Total tokens: ${result.totalTokens}`);
  console.log(`Lines saved: ${result.totalSavings}`);
  console.log("");
}
