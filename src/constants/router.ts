import type { ComplexityLevel, ExecutionStrategy } from "../types/router";

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

export const COMPLEXITY_THRESHOLDS = {
  MIN_KEYWORDS: 3,
  LOW_COMPLEXITY_TOKENS: 20,
  MEDIUM_COMPLEXITY_TOKENS: 50,
  HIGH_COMPLEXITY_TOKENS: 100,
  VERY_HIGH_TOKEN_THRESHOLD: 80,
} as const;

export const CLARIFICATION_CONFIDENCE_THRESHOLD = 0.5;

export const CONFIDENCE_THRESHOLDS = {
  VERIFICATION_PASS: 0.8,
  CLARIFICATION_ASK: 0.5,
} as const;

export interface ConfidenceThresholds {
  VERIFICATION_PASS: number;
  CLARIFICATION_ASK: number;
}

export function getConfidenceThresholds(): ConfidenceThresholds {
  return CONFIDENCE_THRESHOLDS;
}

export function explainThresholds(): string {
  return `VERIFICATION_PASS (0.8): Internal GVR quality control threshold\nCLARIFICATION_ASK (0.5): When to ask user for clarification\nSee: docs/architecture/confidence-thresholds.md`;
}
