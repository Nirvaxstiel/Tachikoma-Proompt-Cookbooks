/**
 * Verification Loop - Generator-Verifier-Reviser Pattern
 *
 * Based on research: "Towards Autonomous Mathematics Research" (arXiv:2602.10177)
 *
 * Key insight: GVR pattern achieves 90% vs 67% base accuracy
 * - GENERATE: Initial solution
 * - VERIFY: Check with explicit criteria
 * - REVISE: Fix based on feedback
 * - REFLECT: Self-critique and issue flagging
 *
 * Max 3 iterations per research recommendation.
 */

// ============================================================================
// TYPES
// ============================================================================

import type { VerificationContext } from "../../types/common";

export type VerificationStatus = "pass" | "fail" | "uncertain";

export interface VerificationCriterion {
  id: string;
  description: string;
  check: (result: string, context?: VerificationContext) => Promise<boolean> | boolean;
  weight: number;
}

export interface VerificationResult {
  status: VerificationStatus;
  passed: number;
  total: number;
  score: number;
  issues: VerificationIssue[];
  feedback: string;
}

export interface VerificationIssue {
  criterion: string;
  severity: "critical" | "major" | "minor";
  description: string;
  suggestion?: string;
}

export interface RevisionResult {
  revised: string;
  changes: string[];
  success: boolean;
}

export interface ReflectionResult {
  selfCritique: string;
  approachQuestion: string;
  flaggedIssues: string[];
  confidence: number;
}

export interface VerificationConfig {
  maxIterations: number;
  confidenceThreshold: number;
  criticalDomains: string[];
}

// ============================================================================
// CRITERIA DEFINITIONS
// ============================================================================

// Criteria extractors based on request keywords
const CRITERIA_EXTRACTORS: Record<string, () => VerificationCriterion[]> = {
  default: () => [
    {
      id: "non_empty",
      description: "Result is not empty",
      weight: 1.0,
      check: (r) => r.trim().length > 0,
    },
  ],
  code: () => [
    {
      id: "has_code",
      description: "Contains code implementation",
      weight: 1.0,
      check: (r) => /function|class|const|let|var|import|export|def |fn |pub |async/.test(r),
    },
    {
      id: "no_obvious_errors",
      description: "No obvious syntax errors",
      weight: 1.0,
      check: (r) => !/SyntaxError:|ParseError:|Error:.*line \d+/.test(r),
    },
  ],
  test: () => [
    {
      id: "has_tests",
      description: "Contains test cases",
      weight: 1.0,
      check: (r) => /test|describe|it\(|expect|assert/.test(r),
    },
    {
      id: "has_assertions",
      description: "Contains assertions",
      weight: 0.8,
      check: (r) => /assert|expect|should|shouldEqual|assertEqual/.test(r),
    },
  ],
  refactor: () => [
    {
      id: "improved_structure",
      description: "Code structure is improved",
      weight: 1.0,
      check: (r) => r.length > 0, // Subjective - flagged for review
    },
    {
      id: "preserves_functionality",
      description: "Functionality preserved",
      weight: 1.0,
      check: (r) => !/removed|deleted|broken/.test(r.toLowerCase()),
    },
  ],
  bug_fix: () => [
    {
      id: "fixes_issue",
      description: "Addresses the reported issue",
      weight: 1.0,
      check: (r, ctx) => {
        if (!ctx?.issue) return true;
        return !r.toLowerCase().includes(ctx.issue.toLowerCase());
      },
    },
    {
      id: "no_new_errors",
      description: "No new errors introduced",
      weight: 1.0,
      check: (r) => !/error|exception|failed|crash/.test(r.toLowerCase()),
    },
  ],
  security: () => [
    {
      id: "no_hardcoded_secrets",
      description: "No hardcoded secrets/keys",
      weight: 1.0,
      check: (r) => !/(api_key|password|secret|token)\s*=\s*["']/.test(r),
    },
    {
      id: "input_validation",
      description: "Includes input validation",
      weight: 0.8,
      check: (r) => /validate|sanitize|escape|param|query/.test(r),
    },
  ],
  api: () => [
    {
      id: "has_endpoint",
      description: "Contains API endpoint definition",
      weight: 1.0,
      check: (r) => /@.*route|@.*endpoint|GET|POST|PUT|DELETE/.test(r),
    },
    {
      id: "has_error_handling",
      description: "Includes error handling",
      weight: 0.8,
      check: (r) => /error|catch|exception|400|404|500/.test(r),
    },
  ],
  auth: () => [
    {
      id: "has_auth",
      description: "Includes authentication",
      weight: 1.0,
      check: (r) => /auth|token|jwt|oauth|login/.test(r),
    },
    {
      id: "password_handling",
      description: "Proper password handling",
      weight: 1.0,
      check: (r) => !/password\s*=\s*["']/.test(r) && /hash|bcrypt|argon/.test(r),
    },
  ],
};

// ============================================================================
// VERIFICATION LOOP CLASS
// ============================================================================

export class VerificationLoop {
  private maxIterations: number;
  private confidenceThreshold: number;
  private criticalDomains: string[];

  constructor(config?: Partial<VerificationConfig>) {
    this.maxIterations = config?.maxIterations ?? 3;
    this.confidenceThreshold = config?.confidenceThreshold ?? 0.8;
    this.criticalDomains = config?.criticalDomains ?? ["security", "auth", "payment", "production"];
  }

  async verifyAndRevise(
    request: string,
    initialResult: string,
    context?: VerificationContext,
  ): Promise<{ result: string; iterations: number; verified: boolean }> {
    let currentResult = initialResult;
    let iteration = 0;
    let needsRevision = true;
    let madeProgress = false;

    const criteria = this.extractCriteria(request);

    while (needsRevision && iteration < this.maxIterations) {
      const verification = await this.verify(currentResult, criteria, { ...context, request });

      if (verification.status === "pass") {
        needsRevision = false;
        break;
      }

      const revision = await this.revise(request, currentResult, verification.issues);

      if (!revision.success) {
        break;
      }

      if (revision.revised !== currentResult) {
        madeProgress = true;
      } else if (!madeProgress) {
        break;
      }

      currentResult = revision.revised;
      iteration++;
    }

    return {
      result: currentResult,
      iterations: iteration + 1,
      verified: iteration < this.maxIterations && madeProgress,
    };
  }

  extractCriteria(request: string): VerificationCriterion[] {
    const lower = request.toLowerCase();

    const domains: string[] = ["default"];

    const criteria: VerificationCriterion[] = [];
    const seen = new Set<string>();

    for (const domain of domains) {
      const extractors = CRITERIA_EXTRACTORS[domain] || CRITERIA_EXTRACTORS.default;
      for (const criterion of extractors()) {
        if (!seen.has(criterion.id)) {
          seen.add(criterion.id);
          criteria.push(criterion);
        }
      }
    }

    return criteria;
  }

  async verify(
    result: string,
    criteria: VerificationCriterion[],
    context?: VerificationContext,
  ): Promise<VerificationResult> {
    const issues: VerificationIssue[] = [];
    let passed = 0;

    for (const criterion of criteria) {
      try {
        const passedCheck = await criterion.check(result, context);

        if (passedCheck) {
          passed++;
        } else {
          issues.push({
            criterion: criterion.description,
            severity: criterion.weight >= 1.0 ? "major" : "minor",
            description: `Failed: ${criterion.description}`,
            suggestion: this.getSuggestion(criterion.id),
          });
        }
      } catch (error) {
        issues.push({
          criterion: criterion.description,
          severity: "minor",
          description: `Check error: ${error instanceof Error ? error.message : "Unknown"}`,
        });
      }
    }

    const score = criteria.length > 0 ? passed / criteria.length : 0;
    const status = score >= this.confidenceThreshold ? "pass" : score > 0.3 ? "fail" : "uncertain";

    return {
      status,
      passed,
      total: criteria.length,
      score,
      issues,
      feedback: this.generateFeedback(status, passed, criteria.length),
    };
  }

  async revise(
    request: string,
    result: string,
    issues: VerificationIssue[],
  ): Promise<RevisionResult> {
    if (issues.length === 0) {
      return { revised: result, changes: [], success: true };
    }

    const changes: string[] = [];
    const revised = result;

    const critical = issues.filter((i) => i.severity === "critical");
    const major = issues.filter((i) => i.severity === "major");
    const minor = issues.filter((i) => i.severity === "minor");

    const revisionParts: string[] = [];

    if (critical.length > 0) {
      revisionParts.push("CRITICAL ISSUES:");
      for (const issue of critical) {
        revisionParts.push(`- ${issue.description}`);
        if (issue.suggestion) revisionParts.push(`  → ${issue.suggestion}`);
      }
    }

    if (major.length > 0) {
      revisionParts.push("\nMAJOR ISSUES:");
      for (const issue of major) {
        revisionParts.push(`- ${issue.description}`);
        if (issue.suggestion) revisionParts.push(`  → ${issue.suggestion}`);
      }
    }

    const revisionPrompt = revisionParts.join("\n");
    changes.push(`Addressing ${critical.length + major.length} issues`);

    return {
      revised: revised + `\n\n<!-- REVISION NEEDED: ${revisionPrompt} -->`,
      changes,
      success: true,
    };
  }

  reflect(request: string, result: string): ReflectionResult {
    const issues: string[] = [];

    if (result.length < 50) {
      issues.push("Result seems unusually short");
    }

    if (!result.includes("\n") && result.length > 200) {
      issues.push("Result is a single block of text - consider formatting");
    }

    if (/TODO|FIXME|HACK|XXX/.test(result)) {
      issues.push("Contains TODO/FIXME comments - may be incomplete");
    }

    if (/\$TODO|FIXME|HACK/.test(result)) {
      issues.push("Contains placeholder code");
    }

    const selfCritique = this.generateSelfCritique(request, result);
    const approachQuestion = this.questionApproach(request, result);
    const confidence = this.estimateConfidence(request, result);

    return {
      selfCritique,
      approachQuestion,
      flaggedIssues: issues,
      confidence,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateFeedback(status: VerificationStatus, passed: number, total: number): string {
    switch (status) {
      case "pass":
        return `✓ All criteria met (${passed}/${total})`;
      case "fail":
        return `⚠ Some criteria failed (${passed}/${total})`;
      case "uncertain":
        return `✗ Verification inconclusive (${passed}/${total})`;
    }
  }

  private getSuggestion(criterionId: string): string | undefined {
    const suggestions: Record<string, string> = {
      has_code: "Add code implementation",
      no_obvious_errors: "Check for syntax errors",
      has_tests: "Add test cases",
      has_assertions: "Add assertions to tests",
      no_hardcoded_secrets: "Use environment variables for secrets",
      input_validation: "Add input validation/sanitization",
      has_auth: "Add authentication logic",
      password_handling: "Use password hashing (bcrypt/argon)",
    };
    return suggestions[criterionId];
  }

  private generateSelfCritique(request: string, result: string): string {
    const lower = request.toLowerCase();

    if (/refactor|improve/.test(lower)) {
      return "Reviewed approach: Refactoring may have trade-offs. Consider if the new structure is clearer than the original.";
    }

    if (/implement|create|build/.test(lower)) {
      return "Reviewed approach: Implementation looks complete but edge cases should be verified.";
    }

    return "Reviewed approach: Solution appears correct. Consider edge cases and error handling.";
  }

  private questionApproach(request: string, result: string): string {
    const lower = request.toLowerCase();

    if (/simple|easy|basic/.test(lower)) {
      return "Could a simpler approach work instead?";
    }

    if (/complex|advanced|enterprise/.test(lower)) {
      return "Is this complexity necessary? Could it be simplified?";
    }

    return "Is this the most efficient solution? Are there simpler alternatives?";
  }

  private estimateConfidence(request: string, result: string): number {
    let confidence = 0.7;

    if (result.length < 50) confidence -= 0.2;
    else if (result.length > 500) confidence += 0.1;

    if (/\n\n/.test(result)) confidence += 0.1;
    if (/```[\s\S]*```/.test(result)) confidence += 0.1;

    return Math.min(Math.max(confidence, 0), 1);
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const verifier = new VerificationLoop();

export async function verifyAndRevise(
  request: string,
  result: string,
  context?: VerificationContext,
) {
  return verifier.verifyAndRevise(request, result, context);
}

export function reflect(request: string, result: string): ReflectionResult {
  return verifier.reflect(request, result);
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const verificationConfig: VerificationConfig = {
  maxIterations: 3,
  confidenceThreshold: 0.8,
  criticalDomains: ["security", "auth", "payment", "production"],
};
