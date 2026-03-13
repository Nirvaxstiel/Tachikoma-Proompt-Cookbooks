import { FailureTaxonomyFactory } from "./failure-taxonomy";
import type {
  Rubric,
  VerificationContext,
  VerdictConfidence,
  VerificationOutcome,
  VerificationVerdict,
  VerificationResult,
  RubricEvaluation,
} from "./types";

export interface DeepVerifierConfig {
  enableTestTimeScaling: boolean;
  maxHistorySize: number;
  lazyUpdate: boolean;
  confidenceThresholds: Record<string, number>;
}

const DEFAULT_CONFIG: DeepVerifierConfig = {
  enableTestTimeScaling: true,
  maxHistorySize: 1000,
  lazyUpdate: true,
  confidenceThresholds: {
    very_low: 0.1,
    low: 0.25,
    medium: 0.5,
    high: 0.75,
    very_high: 0.95,
    critical: 1.0,
  },
};

export class DeepVerifier {
  private config: DeepVerifierConfig;
  private rubrics: Map<string, Rubric>;
  private history: VerificationOutcome[];
  private taxonomy: typeof FailureTaxonomyFactory;

  constructor(config?: Partial<DeepVerifierConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rubrics = new Map();
    this.history = [];
    this.taxonomy = FailureTaxonomyFactory;
  }

  registerRubric(rubric: Rubric): void {
    this.rubrics.set(rubric.id, rubric);
  }

  async verifyOutcome(
    outcome: VerificationOutcome,
    context: VerificationContext,
  ): Promise<VerificationResult> {
    const verifications = new Map<string, RubricEvaluation>();

    for (const [rubricId, rubric] of this.rubrics.entries()) {
      const evaluation = await rubric.evaluate(outcome, context);
      verifications.set(rubricId, evaluation);
    }

    const verdict = this.computeVerdict(verifications);
    const confidence = this.computeConfidence(verifications);
    const suggestions = this.generateSuggestions(verifications, context);

    const result: VerificationResult = {
      outcome,
      verdict: verdict.verdict,
      verdictConfidence: confidence,
      suggestions,
    };

    if (this.config.enableTestTimeScaling) {
      this.addToHistory(outcome);
    }

    return result;
  }

  async verifyAgainstRubric(
    rubricId: string,
    outcome: VerificationOutcome,
    context: VerificationContext,
  ): Promise<RubricEvaluation> {
    const rubric = this.rubrics.get(rubricId);

    if (!rubric) {
      throw new Error(`Rubric ${rubricId} not found`);
    }

    return rubric.evaluate(outcome, context);
  }

  private computeVerdict(
    verifications: Map<string, RubricEvaluation>,
  ): { verdict: VerificationVerdict; confidence: VerdictConfidence } {
    const passCount = this.countVerdicts(verifications, "pass");
    const failCount = this.countVerdicts(verifications, "fail");
    const revisionCount = this.countVerdicts(verifications, "needs_revision");
    const cantEvaluateCount = this.countVerdicts(verifications, "cant_evaluate");

    const total = verifications.size;

    if (total === 0) {
      return { verdict: "cant_evaluate", confidence: "very_low" };
    }

    let verdict: VerificationVerdict = "pass";
    let confidence: VerdictConfidence = "medium";

    const severity = this.getHighestSeverity(verifications);

    if (severity === "critical" || cantEvaluateCount / total > 0.1) {
      verdict = "cant_evaluate";
      confidence = "very_low";
    } else if (revisionCount / total > 0.05) {
      verdict = "needs_revision";
      confidence = this.getConfidenceLevel(revisionCount / total);
    } else if (failCount / total > 0.25) {
      verdict = "fail";
      confidence = this.getConfidenceLevel(failCount / total);
    } else if (passCount / total > 0.3) {
      verdict = "pass";
      confidence = this.getConfidenceLevel(passCount / total);
    }

    return { verdict, confidence };
  }

  private computeConfidence(
    verifications: Map<string, RubricEvaluation>,
  ): number {
    if (verifications.size === 0) {
      return 0.5;
    }

    const scores = Array.from(verifications.values()).map((v) => v.score);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return avgScore;
  }

  private countVerdicts(
    verifications: Map<string, RubricEvaluation>,
    verdict: VerificationVerdict,
  ): number {
    return Array.from(verifications.values()).filter(
      (v) => v.verdict === verdict,
    ).length;
  }

  private getHighestSeverity(
    verifications: Map<string, RubricEvaluation>,
  ): "low" | "medium" | "high" | "critical" {
    const severities = ["critical", "high", "medium", "low"] as const;

    for (const severity of severities) {
      for (const evaluation of verifications.values()) {
        if (evaluation.rubric.severityLevel === severity) {
          return severity;
        }
      }
    }

    return "low";
  }

  private getConfidenceLevel(ratio: number): VerdictConfidence {
    if (ratio >= 0.95) return "very_high";
    if (ratio >= 0.75) return "high";
    if (ratio >= 0.5) return "medium";
    if (ratio >= 0.25) return "low";
    return "very_low";
  }

  private generateSuggestions(
    verifications: Map<string, RubricEvaluation>,
    _context: VerificationContext,
  ): string[] {
    const suggestions: string[] = [];

    for (const evaluation of verifications.values()) {
      if (!evaluation.passed) {
        suggestions.push(...evaluation.rubric.suggestions);
      }
    }

    return Array.from(new Set(suggestions));
  }

  private addToHistory(outcome: VerificationOutcome): void {
    this.history.push(outcome);

    while (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }
  }

  clearHistory(): void {
    this.history = [];
  }

  getStatistics(): {
    verificationCount: number;
    passRate: number;
    avgConfidence: number;
    history: VerificationOutcome[];
  } {
    const verificationCount = this.history.length;
    const passCount = this.history.filter((o) => o.verdict === "pass").length;
    const passRate = verificationCount > 0 ? passCount / verificationCount : 0;
    const avgConfidence =
      verificationCount > 0
        ? this.history.reduce((sum, o) => sum + o.verdictConfidenceValue, 0) /
          verificationCount
        : 0;

    return {
      verificationCount,
      passRate,
      avgConfidence,
      history: [...this.history],
    };
  }

  getAllRubrics(): string[] {
    return Array.from(this.rubrics.keys());
  }

  getRubric(rubricId: string): Rubric | undefined {
    return this.rubrics.get(rubricId);
  }

  getFailureTaxonomy(): {
    categories: ReturnType<typeof FailureTaxonomyFactory.getAllCategories>;
    subcategories: ReturnType<typeof FailureTaxonomyFactory.getAllSubcategories>;
  } {
    return {
      categories: this.taxonomy.getAllCategories(),
      subcategories: this.taxonomy.getAllSubcategories(),
    };
  }
}
