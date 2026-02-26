/**
 * Router constants and configuration
 */

import type { ComplexityLevel, ExecutionStrategy, IntentType, RouteConfig } from "../types/router";

// Intent keywords for semantic classification
export const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  code: ["create", "implement", "build", "write", "add", "make", "develop", "new feature"],
  debug: ["debug", "fix", "bug", "error", "issue", "problem", "crash", "broken"],
  research: ["research", "explore", "find", "investigate", "analyze", "understand", "how does"],
  refactor: ["refactor", "improve", "clean", "restructure", "optimize", "simplify"],
  test: ["test", "testing", "spec", "assert", "verify"],
  verify: ["verify", "validate", "check", "ensure", "confirm", "audit"],
  explain: ["explain", "what is", "how do", "describe", "tell me", "show me"],
  plan: ["plan", "roadmap", "design", "architecture", "approach", "strategy"],
  query: ["query", "get", "fetch", "list", "show", "display"],
  unknown: [],
};

// Strategy complexity mapping
export const STRATEGY_CONFIG: Record<
  ComplexityLevel,
  {
    strategy: ExecutionStrategy;
    confidenceThreshold: number;
    latencyTarget: string;
    requiresTools: boolean;
  }
> = {
  low: {
    strategy: "direct",
    confidenceThreshold: 0.9,
    latencyTarget: "1-2s",
    requiresTools: false,
  },
  medium: {
    strategy: "single_skill",
    confidenceThreshold: 0.7,
    latencyTarget: "5-15s",
    requiresTools: true,
  },
  high: {
    strategy: "skill_chain",
    confidenceThreshold: 0.5,
    latencyTarget: "15-45s",
    requiresTools: true,
  },
  very_high: {
    strategy: "rlm",
    confidenceThreshold: 0.3,
    latencyTarget: "45-120s",
    requiresTools: true,
  },
};

// Default routes
export const DEFAULT_ROUTES: RouteConfig[] = [
  {
    patterns: ["debug", "fix bug", "troubleshoot"],
    confidenceThreshold: 0.7,
    skill: "code",
    strategy: "single_skill",
  },
  {
    patterns: ["verify", "test", "validate"],
    confidenceThreshold: 0.6,
    skillChain: ["code", "verification"],
    strategy: "skill_chain",
  },
  {
    patterns: ["refactor", "improve", "clean up"],
    confidenceThreshold: 0.6,
    skill: "refactor",
    strategy: "single_skill",
  },
  {
    patterns: ["research", "explore", "find"],
    confidenceThreshold: 0.7,
    skill: "research",
    strategy: "single_skill",
  },
  {
    patterns: ["implement", "create", "build"],
    confidenceThreshold: 0.7,
    skillChain: ["code", "verification"],
    strategy: "skill_chain",
  },
  {
    patterns: ["what is", "how do", "explain"],
    confidenceThreshold: 0.9,
    strategy: "direct",
  },
];

// Complexity thresholds
export const COMPLEXITY_THRESHOLDS = {
  MIN_KEYWORDS: 3,
  LOW_COMPLEXITY_TOKENS: 20,
  MEDIUM_COMPLEXITY_TOKENS: 50,
  HIGH_COMPLEXITY_TOKENS: 100,
  VERY_HIGH_TOKEN_THRESHOLD: 80,
} as const;

// Clarification confidence threshold
export const CLARIFICATION_CONFIDENCE_THRESHOLD = 0.5;

// Priority order for intent resolution
export const INTENT_PRIORITY_ORDER: IntentType[] = [
  "test",
  "verify",
  "debug",
  "refactor",
  "research",
  "code",
  "plan",
  "explain",
  "query",
  "unknown",
];
