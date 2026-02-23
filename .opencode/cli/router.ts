#!/usr/bin/env bun

import { parseArgs } from "node:util";
import { join } from "node:path";
import { existsSync, statSync, readFileSync } from "node:fs";
import yaml from "js-yaml";
import {
  colors,
  printHeader,
  printSuccess,
  printError,
  printWarning,
  printStep,
} from "./lib/colors";
import type {
  RoutesConfig,
  ClassificationResult,
  IntentRoute,
} from "./lib/types";

const CLI_DIR = import.meta.dir;
const OPENCODE_DIR = join(CLI_DIR, "..");
const CONTEXT_DIR = `${OPENCODE_DIR}/context-modules`;
const CONFIG_DIR = `${OPENCODE_DIR}/agents/tachikoma/config`;
const ROUTING_DIR = `${CONFIG_DIR}/routing`;

interface CachedConfig {
  data: any;
  mtime: number;
}

const _configCache: Map<string, CachedConfig> = new Map();

// Classification cache for avoiding repeated LLM calls
interface ClassificationCacheEntry {
  result: ClassifyResult;
  timestamp: number;
  conversationState: "same_task" | "context_switch" | "new_conversation";
}

interface ConversationContext {
  lastQuery: string;
  lastIntent: string;
  lastTimestamp: number;
  messageHistory: string[];
}

const _classificationCache = new Map<string, ClassificationCacheEntry>();
const _conversationContext: ConversationContext = {
  lastQuery: "",
  lastIntent: "",
  lastTimestamp: 0,
  messageHistory: [],
};
const CLASSIFICATION_CACHE_TTL = 300000; // 5 minutes (reduced from 10min)
const MAX_HISTORY_SIZE = 10;

function detectConversationState(
  currentQuery: string,
): "same_task" | "context_switch" | "new_conversation" {
  // Check for explicit context switch keywords
  const contextSwitchKeywords = [
    "new task",
    "different",
    "separate",
    "unrelated",
    "besides",
    "additionally",
    "also",
    "another topic",
    "move on",
  ];

  const queryLower = currentQuery.toLowerCase();
  const hasContextSwitch = contextSwitchKeywords.some((kw) =>
    queryLower.includes(kw),
  );

  if (hasContextSwitch) {
    return "context_switch";
  }

  // Check if same conversation (recent query, same intent)
  const timeSinceLastQuery = Date.now() - _conversationContext.lastTimestamp;
  const isRecent = timeSinceLastQuery < CLASSIFICATION_CACHE_TTL;

  // Check query similarity
  const currentWords = new Set(queryLower.split(/\s+/));
  const lastWords = new Set(
    _conversationContext.lastQuery.toLowerCase().split(/\s+/),
  );
  const intersection = new Set(
    [...currentWords].filter((x) => lastWords.has(x)),
  );
  const similarity =
    intersection.size / Math.max(currentWords.size, lastWords.size);

  if (isRecent && similarity > 0.5 && _conversationContext.lastIntent !== "") {
    return "same_task";
  }

  return "new_conversation";
}

function updateConversationContext(query: string, intent: string): void {
  _conversationContext.lastQuery = query;
  _conversationContext.lastIntent = intent;
  _conversationContext.lastTimestamp = Date.now();

  // Keep last N messages in history
  _conversationContext.messageHistory.push(query);
  if (_conversationContext.messageHistory.length > MAX_HISTORY_SIZE) {
    _conversationContext.messageHistory.shift();
  }
}

function loadYamlConfig(filename: string, useMultiDoc = false): any {
  const filepath = `${ROUTING_DIR}/${filename}`;

  try {
    const stats = statSync(filepath);
    const mtime = stats.mtimeMs;

    const cached = _configCache.get(filepath);
    if (cached && cached.mtime === mtime) {
      return cached.data;
    }

    const content = readFileSync(filepath, "utf-8");
    let data: any;

    if (useMultiDoc) {
      const docs = yaml.loadAll(content);
      data = {};
      for (const doc of docs) {
        if (doc && typeof doc === "object") {
          Object.assign(data, doc);
        }
      }
    } else {
      data = yaml.load(content);
    }

    _configCache.set(filepath, { data, mtime });
    return data;
  } catch (e) {
    const error = e as Error;
    printError(`Error loading ${filename}: ${error.message}`);
    return useMultiDoc ? { intents: {} } : {};
  }
}

function clearCache(): void {
  _configCache.clear();
}

function clearClassificationCache(): void {
  _classificationCache.clear();
}

function loadIntentsConfig(): any {
  return loadYamlConfig("intents.yaml", true);
}

function loadSkillsConfig(): any {
  return loadYamlConfig("skills.yaml", false);
}

function loadRoutes(): RoutesConfig {
  const intentsConfig = loadIntentsConfig();

  // Convert new format to legacy format for compatibility
  const routes: Record<string, any> = {};
  const keywords: Record<string, string[]> = {};

  if (intentsConfig.intents) {
    for (const [name, intent] of Object.entries(intentsConfig.intents)) {
      const i = intent as any;
      routes[name] = {
        description: i.description || "",
        confidence_threshold: i.confidence_threshold || 0.5,
        context_modules: i.context_modules || [],
        skill: i.skill || "code-agent",
      };
      keywords[name] = i.keywords || [];
    }
  }

  return { routes, keywords };
}

function loadIntentKeywords(): Record<string, string[]> {
  const intentsConfig = loadIntentsConfig();
  const keywords: Record<string, string[]> = {};

  if (intentsConfig.intents) {
    for (const [name, intent] of Object.entries(intentsConfig.intents)) {
      keywords[name] = (intent as any).keywords || [];
    }
  }

  return keywords;
}

interface ClassifyResult {
  intent: string;
  confidence: number;
  reasoning: string;
  suggested_action: string;
  keywords_matched: string[];
  alternative_intents: Array<{ intent: string; score: number }>;
  workflow: { needed: boolean; name?: string };
  skills_bulk: { needed: boolean; name?: string };
  complexity: number;
}

function classifyIntent(
  query: string,
  useCache: boolean = true,
): ClassifyResult {
  const queryLower = query.toLowerCase().trim();

  // Detect conversation state
  const conversationState = detectConversationState(query);

  // Check cache first with conversation awareness
  if (useCache) {
    // Check for context switch - invalidate cache on context switch
    if (conversationState === "context_switch") {
      console.log(
        `  ${colors.dim}[Context switch detected - ignoring cache]${colors.reset}`,
      );
    } else {
      // Check exact match cache
      const cached = _classificationCache.get(queryLower);
      if (cached && Date.now() - cached.timestamp < CLASSIFICATION_CACHE_TTL) {
        // Only use cache if conversation state matches
        if (
          cached.conversationState === "same_task" ||
          conversationState === "same_task"
        ) {
          console.log(
            `  ${colors.dim}[Using cached classification]${colors.reset}`,
          );
          return cached.result;
        }
      }
    }
  }

  const keywordsMap = loadIntentKeywords();

  if (Object.keys(keywordsMap).length === 0) {
    return {
      intent: "unclear",
      confidence: 0.3,
      reasoning: "No intent keywords configured",
      suggested_action: "llm",
      keywords_matched: [],
      alternative_intents: [],
      workflow: { needed: false },
      skills_bulk: { needed: false },
      complexity: 0.0,
    };
  }

  // Score each intent based on keyword matches
  const scores: Record<string, number> = {};
  const matchedKeywords: Record<string, string[]> = {};

  for (const [intent, keywords] of Object.entries(keywordsMap)) {
    const matches: string[] = [];

    for (const keyword of keywords) {
      // Use word boundary matching for accuracy
      const pattern = new RegExp(`\\b${escapeRegex(keyword.toLowerCase())}\\b`);
      if (pattern.test(queryLower)) {
        matches.push(keyword);
      }
    }

    if (matches.length > 0) {
      scores[intent] = matches.length;
      matchedKeywords[intent] = matches;
    }
  }

  if (Object.keys(scores).length === 0) {
    return {
      intent: "unclear",
      confidence: 0.3,
      reasoning: "No keyword matches found",
      suggested_action: "llm",
      keywords_matched: [],
      alternative_intents: [],
      workflow: { needed: false },
      skills_bulk: { needed: false },
      complexity: detectComplexity(query),
    };
  }

  // Sort by score
  const sortedIntents = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  const primaryIntent = sortedIntents[0][0];
  const primaryScore = sortedIntents[0][1];

  // Calculate confidence
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  let confidence = Math.min(primaryScore / Math.max(totalScore, 1), 1.0);

  // Boost confidence if primary is significantly higher
  if (sortedIntents.length > 1) {
    const ratio = primaryScore / Math.max(sortedIntents[1][1], 1);
    if (ratio > 2) {
      confidence = Math.min(confidence * 1.2, 1.0);
    }
  }

  // Determine action based on confidence
  let action: string;
  if (confidence >= 0.7) {
    action = "skill";
  } else if (confidence >= 0.5) {
    action = "llm";
  } else {
    action = "llm";
  }

  // Detect workflow/skills_bulk need
  const workflow = detectWorkflowNeed(query);
  const skillsBulk = detectSkillsBulkNeed(query);

  if (workflow.needed) {
    action = "workflow";
  } else if (skillsBulk.needed) {
    action = "skills_bulk";
  }

  const complexity = detectComplexity(query);

  const result: ClassifyResult = {
    intent: primaryIntent,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: `Matched keywords: ${matchedKeywords[primaryIntent]?.join(", ") || "none"}`,
    suggested_action: action,
    keywords_matched: matchedKeywords[primaryIntent] || [],
    alternative_intents: sortedIntents
      .slice(1, 3)
      .map(([intent, score]) => ({ intent, score })),
    workflow,
    skills_bulk: skillsBulk,
    complexity: Math.round(complexity * 100) / 100,
  };

  // Cache the result with conversation state
  if (useCache) {
    _classificationCache.set(queryLower, {
      result,
      timestamp: Date.now(),
      conversationState: detectConversationState(query),
    });
  }

  // Update conversation context
  updateConversationContext(query, primaryIntent);

  return result;
}

function detectComplexity(query: string): number {
  let complexity = 0.0;

  const words = query.split(/\s+/);
  if (words.length > 10) complexity += 0.2;
  if (words.length > 20) complexity += 0.1;

  const multiStepPatterns = [
    /\band\b/i,
    /\bthen\b/i,
    /\bafter\b/i,
    /\bbefore\b/i,
    /\bfirst\b/i,
    /\bnext\b/i,
    /\bfinally\b/i,
  ];

  for (const pattern of multiStepPatterns) {
    if (pattern.test(query)) complexity += 0.15;
  }

  // High-stakes keywords
  if (/\b(secure|safe|critical|production|auth|payment)\b/i.test(query)) {
    complexity += 0.2;
  }

  return Math.min(complexity, 1.0);
}

function detectWorkflowNeed(query: string): { needed: boolean; name?: string } {
  const workflowPatterns: Array<[RegExp, string]> = [
    [/research.*implement/i, "research-implement"],
    [/implement.*verify/i, "implement-verify"],
    [/implement.*test/i, "implement-verify"],
    [/security.*implement/i, "security-implement"],
    [/review.*reflect/i, "deep-review"],
    [/add.*authentication/i, "complex-workflow"],
    [/add.*oauth/i, "complex-workflow"],
    [/implement\s+system/i, "complex-workflow"],
    [/build\s+feature/i, "complex-workflow"],
    [/create\s+new\s+feature/i, "complex-workflow"],
    [/quality\s+checks/i, "complex-workflow"],
    [/production-grade/i, "complex-workflow"],
    [/with\s+validation/i, "complex-workflow"],
    [/step\s+by\s+step/i, "complex-workflow"],
  ];

  for (const [pattern, name] of workflowPatterns) {
    if (pattern.test(query)) {
      return { needed: true, name };
    }
  }

  return { needed: false };
}

function detectSkillsBulkNeed(query: string): {
  needed: boolean;
  name?: string;
} {
  const bulkIndicators = [
    "thoroughly",
    "comprehensive",
    "full analysis",
    "multiple",
    "all angles",
    "deep dive",
  ];

  const queryLower = query.toLowerCase();
  for (const indicator of bulkIndicators) {
    if (queryLower.includes(indicator)) {
      return { needed: true, name: "full-stack" };
    }
  }

  return { needed: false };
}

function getRoute(intent: string): IntentRoute | null {
  const routes = loadRoutes();
  return routes.routes?.[intent] || null;
}

function getWorkflow(workflowName: string): any {
  const routes = loadRoutes() as any;
  return routes.workflows?.[workflowName] || null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cmdClassify(query: string): number {
  if (!query) {
    printError("Query required");
    console.log('Usage: bun run router.ts classify "fix the bug in auth"');
    return 1;
  }

  const result = classifyIntent(query);

  printHeader(`INTENT CLASSIFICATION: "${query}"`);
  console.log();

  const {
    intent,
    confidence,
    suggested_action: action,
    complexity,
    keywords_matched: keywords,
  } = result;

  // Color-code confidence
  let confColor: string;
  if (confidence >= 0.8) {
    confColor = colors.green;
  } else if (confidence >= 0.5) {
    confColor = colors.yellow;
  } else {
    confColor = colors.red;
  }

  console.log(`  Intent:        ${colors.cyan}${intent}${colors.reset}`);
  console.log(
    `  Confidence:    ${confColor}${(confidence * 100).toFixed(0)}%${colors.reset}`,
  );
  console.log(`  Action:        ${action}`);
  console.log(`  Complexity:    ${(complexity * 100).toFixed(0)}%`);
  console.log(
    `  Keywords:      ${keywords.length > 0 ? keywords.join(", ") : "none"}`,
  );

  if (result.workflow?.needed) {
    console.log(
      `  Workflow:      ${colors.magenta}${result.workflow.name}${colors.reset}`,
    );
  }

  if (result.skills_bulk?.needed) {
    console.log(
      `  Skills Bulk:   ${colors.magenta}${result.skills_bulk.name}${colors.reset}`,
    );
  }

  const altIntents = result.alternative_intents;
  if (altIntents.length > 0) {
    console.log(
      `  Alternatives:  ${altIntents.map((a) => a.intent).join(", ")}`,
    );
  }

  console.log();
  return 0;
}

function cmdRoute(intent: string | undefined, list: boolean): number {
  const routes = loadRoutes();

  if (list || !intent) {
    printHeader("AVAILABLE ROUTES");

    for (const [name, config] of Object.entries(routes.routes || {})) {
      const skill = (config as any).skill || (config as any).subagent || "none";
      const invoke = config.invoke_via || "unknown";
      console.log(
        `  ${colors.cyan}${name.padEnd(15)}${colors.reset} -> ${(skill as string).padEnd(25)} (${invoke})`,
      );
    }

    console.log();
    return 0;
  }

  const route = getRoute(intent);

  printHeader(`ROUTE: ${intent}`);
  console.log();

  if (!route) {
    printError(`No route found for intent: ${intent}`);
    console.log("Use --list to see available routes");
    return 1;
  }

  const r = route as any;
  console.log(`  Description:   ${r.description || "N/A"}`);
  console.log(`  Skill:         ${r.skill || r.subagent || "N/A"}`);
  console.log(`  Invoke via:    ${r.invoke_via || "N/A"}`);
  console.log(`  Strategy:      ${r.strategy || "N/A"}`);

  const ctxModules = route.context_modules || [];
  if (ctxModules.length > 0) {
    console.log(`  Context:       ${ctxModules.join(", ")}`);
  }

  const tools = route.tools || [];
  if (tools.length > 0) {
    console.log(`  Tools:         ${tools.join(", ")}`);
  }

  console.log();
  return 0;
}

interface RoutingResult {
  query: string;
  intent: string;
  confidence: number;
  route: IntentRoute | null;
  skill: string;
  invokeVia: string;
  classification: ClassifyResult;
}

function classifyStep(query: string): ClassifyResult {
  printStep("[1/3]", "Classifying intent...");
  const classification = classifyIntent(query);
  printSuccess(
    `Intent: ${classification.intent} (confidence: ${(classification.confidence * 100).toFixed(0)}%)`,
  );
  console.log();
  return classification;
}

function routeStep(classification: ClassifyResult): RoutingResult {
  printStep("[2/3]", "Looking up route...");

  let { intent, confidence } = classification;
  let route: IntentRoute | null = null;

  if (classification.workflow?.needed) {
    const workflowName = classification.workflow.name || "";
    const wfConfig = getWorkflow(workflowName);

    if (wfConfig?.skills?.length > 0) {
      intent = workflowName;
      route = getRoute(workflowName);
      printSuccess(`Detected workflow: ${workflowName}`);
    } else {
      route = getRoute(intent);
    }
  } else {
    route = getRoute(intent);
  }

  const r = route as any;
  const skill = r?.skill || r?.subagent || "N/A";
  const invokeVia = r?.invoke_via || "skill";

  if (route) {
    printSuccess(`Route: ${skill} (via ${invokeVia})`);
  }
  console.log();

  return {
    query:
      classification.reasoning
        .replace("Matched keywords: ", "")
        .split(", ")[0] || "",
    intent,
    confidence,
    route,
    skill,
    invokeVia,
    classification,
  };
}

function contextStep(
  route: IntentRoute | null,
  intent?: string,
  complexity: number = 0.5,
): {
  ctxModules: string[];
  tokenEstimate: number;
  tokenSavings: number;
} {
  printStep("[3/3]", "Context modules to load:");
  const ctxModules = route?.context_modules || [];

  let totalTokens = 0;
  let totalSavings = 0;

  for (const ctx of ctxModules) {
    const ctxPath = ctx.endsWith(".md")
      ? `${CONTEXT_DIR}/${ctx}`
      : `${CONTEXT_DIR}/${ctx}.md`;
    const exists = existsSync(ctxPath);

    if (!exists) {
      console.log(`  ${colors.red}[x]${colors.reset} ${ctx} (NOT FOUND)`);
      continue;
    }

    // Check if module should be skipped for this intent
    const skipPatterns: Array<[string, string[]]> = [
      ["research", ["12-commenting-rules.md", "10-coding-standards.md"]],
      [
        "git",
        [
          "12-commenting-rules.md",
          "10-coding-standards.md",
          "30-research-methods.md",
        ],
      ],
      ["document", ["30-research-methods.md"]],
    ];

    let skip = false;
    for (const [skipIntent, modules] of skipPatterns) {
      if (intent === skipIntent && modules.includes(ctx)) {
        skip = true;
        break;
      }
    }

    if (skip) {
      console.log(
        `  ${colors.dim}⏭️${colors.reset} ${ctx} (skipped for ${intent} intent)`,
      );
      continue;
    }

    // Estimate tokens for this module
    const stats = statSync(ctxPath);
    const moduleTokens = Math.ceil(stats.size / 4); // ~4 chars per token

    totalTokens += moduleTokens;

    // Estimate savings for large modules
    let savings = 0;
    if (ctx === "12-commenting-rules.md") {
      // For coding intents, we extract ~20% of content
      savings = Math.floor(moduleTokens * 0.8);
      totalSavings += savings;
    } else if (ctx === "00-core-contract.md") {
      // For specific intents, we extract ~40% of content
      savings = Math.floor(moduleTokens * 0.6);
      totalSavings += savings;
    }

    let status = "";
    if (savings > 0) {
      status = ` (extracting ~${Math.floor((1 - savings / moduleTokens) * 100)}%, ~${Math.floor(savings)} tokens saved)`;
    }

    console.log(`  ${colors.green}[+]${colors.reset} ${ctx}${status}`);
  }

  console.log();
  if (totalSavings > 0) {
    console.log(
      `  ${colors.green}Estimated savings: ~${totalSavings} tokens${colors.reset}`,
    );
    console.log();
  }

  return { ctxModules, tokenEstimate: totalTokens, tokenSavings: totalSavings };
}

function outputResult(
  result: RoutingResult,
  ctxModules: string[],
  tokenEstimate: number,
  tokenSavings: number,
  json: boolean,
): number {
  if (!result.route) {
    printError(`No route found for intent: ${result.intent}`);
    const availableIntents = Object.keys(loadRoutes().routes || {});
    console.log(`Available intents: ${availableIntents.join(", ")}`);
    return 1;
  }

  const r = result.route as any;

  printHeader("ROUTING DECISION");
  console.log();

  console.log(
    `  Query:         ${result.classification.reasoning.includes("Matched") ? result.query : result.query}`,
  );
  console.log(`  Intent:        ${colors.cyan}${result.intent}${colors.reset}`);
  console.log(`  Confidence:    ${(result.confidence * 100).toFixed(0)}%`);
  console.log(`  Route to:      ${colors.green}${result.skill}${colors.reset}`);
  console.log(`  Invoke:        ${result.invokeVia}`);
  console.log(`  Strategy:      ${r.strategy || "N/A"}`);

  if (result.classification.workflow?.needed) {
    console.log(
      `  Workflow:      ${colors.magenta}${result.classification.workflow.name}${colors.reset}`,
    );
  }

  if (result.classification.skills_bulk?.needed) {
    console.log(
      `  Skills Bulk:   ${colors.magenta}${result.classification.skills_bulk.name}${colors.reset}`,
    );
  }

  const tools = result.route.tools || [];
  if (tools.length > 0) {
    console.log(`  Tools:         ${tools.join(", ")}`);
  }

  if (tokenSavings > 0) {
    console.log(
      `  Token Savings: ${colors.green}~${tokenSavings} tokens${colors.reset}`,
    );
  }

  console.log();

  if (json) {
    const output = {
      query: result.query,
      intent: result.intent,
      confidence: result.confidence,
      route: result.skill,
      invoke_via: result.invokeVia,
      strategy: r.strategy || null,
      context_modules: ctxModules,
      token_estimate: tokenEstimate,
      token_savings: tokenSavings,
      tools,
      workflow: result.classification.workflow?.name || "",
      skills_bulk: result.classification.skills_bulk?.name || "",
    };
    console.log(JSON.stringify(output, null, 2));
  }

  return 0;
}

function cmdFull(query: string, json: boolean): number {
  if (!query) {
    printError("Query required");
    console.log('Usage: bun run router.ts full "fix the bug in auth" --json');
    return 1;
  }

  printHeader(`FULL ROUTING: "${query}"`);
  console.log();

  const classification = classifyStep(query);
  const result = routeStep(classification);
  const ctxResult = contextStep(
    result.route,
    result.intent,
    classification.complexity,
  );

  return outputResult(
    result,
    ctxResult.ctxModules,
    ctxResult.tokenEstimate,
    ctxResult.tokenSavings,
    json,
  );
}

function printUsage(): void {
  console.log(`
Tachikoma CLI Router - Fast intent classification and routing

Usage:
  bun run router.ts <command> [options]

Commands:
  classify <query>    Classify intent from query
  route [intent]      Show route for intent (or --list for all)
  full <query>        Full routing workflow
  cache               Show cache status
  cache --clear       Clear config cache

Options:
  --json              Output as JSON
  --list              List all available routes

Examples:
  bun run router.ts classify "fix the bug in auth"
  bun run router.ts route debug
  bun run router.ts full "fix the bug in auth" --json
  bun run router.ts cache --clear
`);
}

function cmdCache(clear: boolean): number {
  if (clear) {
    clearCache();
    clearClassificationCache();
    printSuccess("All caches cleared");
    return 0;
  }

  printHeader("CACHE STATUS");
  console.log();

  // Config cache
  console.log("Config Cache:");
  if (_configCache.size === 0) {
    console.log("  Empty");
  } else {
    for (const [path, cached] of _configCache) {
      const filename = path.split("/").pop();
      const age = Date.now() - cached.mtime;
      const ageStr =
        age < 60000
          ? `${(age / 1000).toFixed(1)}s`
          : `${(age / 60000).toFixed(1)}m`;
      console.log(
        `  ${colors.cyan}${filename}${colors.reset} - cached ${ageStr} ago`,
      );
    }
  }

  console.log();

  // Classification cache
  console.log("Classification Cache:");
  if (_classificationCache.size === 0) {
    console.log("  Empty");
  } else {
    for (const [query, cached] of _classificationCache) {
      const age = Date.now() - cached.timestamp;
      const ageStr =
        age < 60000
          ? `${(age / 1000).toFixed(1)}s`
          : age < 3600000
            ? `${(age / 60000).toFixed(1)}m`
            : `${(age / 3600000).toFixed(1)}h`;

      console.log(
        `  ${colors.cyan}"${query.slice(0, 40)}${query.length > 40 ? "..." : ""}"${colors.reset} - ${colors.green}${cached.result.intent}${colors.reset} (${ageStr} ago)`,
      );
    }
  }

  console.log();
  return 0;
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    return 0;
  }

  const command = args[0];
  const restArgs = args.slice(1);

  const json = restArgs.includes("--json");
  const list = restArgs.includes("--list");
  const clear = restArgs.includes("--clear");
  const queryArgs = restArgs.filter((a) => !a.startsWith("--"));
  const query = queryArgs.join(" ");

  switch (command) {
    case "classify":
      return cmdClassify(query);
    case "route":
      return cmdRoute(queryArgs[0], list);
    case "full":
      return cmdFull(query, json);
    case "cache":
      return cmdCache(clear);
    case "help":
    case "--help":
    case "-h":
      printUsage();
      return 0;
    default:
      printError(`Unknown command: ${command}`);
      printUsage();
      return 1;
  }
}

// Run
main().then((code) => process.exit(code));
