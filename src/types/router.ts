/**
 * Router type definitions
 */

export type ComplexityLevel = "low" | "medium" | "high" | "very_high";
export type ExecutionStrategy = "direct" | "single_skill" | "skill_chain" | "rlm";
export type IntentType =
  | "code"
  | "debug"
  | "research"
  | "refactor"
  | "test"
  | "verify"
  | "explain"
  | "plan"
  | "query"
  | "unknown";

export interface IntentClassification {
  type: IntentType;
  confidence: number;
  complexity: ComplexityLevel;
  keywords: string[];
  requiresTools: boolean;
}

export interface RouteMatch {
  route: string;
  pattern: string;
  confidence: number;
  skill?: string;
  skillChain?: string[];
  strategy: ExecutionStrategy;
}

export interface RoutingDecision {
  strategy: ExecutionStrategy;
  intent: IntentClassification;
  skill?: string;
  skillChain?: string[];
  needsClarification: boolean;
  clarificationPrompt?: string;
}

export interface RouteConfig {
  patterns: string[];
  confidenceThreshold: number;
  skill?: string;
  skillChain?: string[];
  strategy: ExecutionStrategy;
}
