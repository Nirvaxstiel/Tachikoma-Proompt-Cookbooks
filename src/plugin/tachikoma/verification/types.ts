import type { VerificationContext } from "../../../types/common";

export type { VerificationContext } from "../../../types/common";

export type SeverityLevel = "low" | "medium" | "high" | "critical";
export type VerificationVerdict = "pass" | "fail" | "needs_revision" | "cant_evaluate";

export type VerdictConfidence = "very_low" | "low" | "medium" | "high" | "very_high";

export interface Rubric {
  id: string;
  name: string;
  description: string;
  evaluate: (outcome: VerificationOutcome, context: VerificationContext) => Promise<RubricEvaluation>;
  weight?: number;
  suggestions: string[];
  severityLevel?: "low" | "medium" | "high" | "critical";
}

export interface RubricEvaluation {
  passed: boolean;
  score: number;
  verdict: VerificationVerdict;
  rubric: Rubric;
  feedback?: string;
}

export interface VerificationOutcome {
  id: string;
  content: string;
  timestamp: number;
  verdict: VerificationVerdict;
  verdictConfidenceValue: number;
  verdictConfidence?: VerdictConfidence;
  suggestions?: string[];
  rubricResults?: Map<string, RubricEvaluation>;
}

export interface VerificationResult {
  outcome: VerificationOutcome;
  verdict: VerificationVerdict;
  verdictConfidence: number;
  suggestions: string[];
}
