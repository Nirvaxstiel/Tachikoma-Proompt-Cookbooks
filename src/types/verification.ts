/**
 * Verification type definitions
 */

export interface VerificationCriterion {
  name: string;
  check: (result: string, context?: unknown) => boolean | Promise<boolean>;
  description?: string;
  critical?: boolean;
}

export interface VerificationResult {
  passed: boolean;
  criteria: string[];
  failedCriteria: string[];
  issues: string[];
  suggestions?: string[];
}

export interface RevisionRequest {
  original: string;
  issues: string[];
  suggestion?: string;
  retryCount?: number;
}
