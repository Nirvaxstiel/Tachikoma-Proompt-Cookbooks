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
  private performanceMetrics: {
    verificationCount: number;
    totalVerificationTime: number;
    avgVerificationTime: number;
    cacheHitRate: number;
    cacheHits: number;
    cacheMisses: number;
    rubricEvaluationTimes: Map<string, number[]>;
  };

  constructor(config?: Partial<DeepVerifierConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rubrics = new Map();
    this.history = [];
    this.taxonomy = FailureTaxonomyFactory;
    this.performanceMetrics = {
      verificationCount: 0,
      totalVerificationTime: 0,
      avgVerificationTime: 0,
      cacheHitRate: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rubricEvaluationTimes: new Map(),
    };
  }

  registerRubric(rubric: Rubric): void {
    this.rubrics.set(rubric.id, rubric);
  }

  async verifyOutcome(
    outcome: VerificationOutcome,
    context: VerificationContext,
  ): Promise<VerificationResult> {
    const startTime = performance.now();
    const verifications = new Map<string, RubricEvaluation>();

    for (const [rubricId, rubric] of this.rubrics.entries()) {
      const rubricStartTime = performance.now();
      const evaluation = await rubric.evaluate(outcome, context);
      const rubricTime = performance.now() - rubricStartTime;

      verifications.set(rubricId, evaluation);

      this.trackRubricPerformance(rubricId, rubricTime);
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

    this.trackVerificationPerformance(performance.now() - startTime);

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

  private trackVerificationPerformance(timeMs: number): void {
    this.performanceMetrics.verificationCount++;
    this.performanceMetrics.totalVerificationTime += timeMs;
    this.performanceMetrics.avgVerificationTime =
      this.performanceMetrics.totalVerificationTime / this.performanceMetrics.verificationCount;
  }

  private trackRubricPerformance(rubricId: string, timeMs: number): void {
    if (!this.performanceMetrics.rubricEvaluationTimes.has(rubricId)) {
      this.performanceMetrics.rubricEvaluationTimes.set(rubricId, []);
    }

    const times = this.performanceMetrics.rubricEvaluationTimes.get(rubricId);
    times?.push(timeMs);

    if (times && times.length > 100) {
      times.shift();
    }
  }

  getPerformanceMetrics(): {
    verificationCount: number;
    avgVerificationTime: number;
    cacheHitRate: number;
    rubricPerformance: Map<string, { avg: number; min: number; max: number; count: number }>;
  } {
    const rubricPerformance = new Map();

    for (const [rubricId, times] of this.performanceMetrics.rubricEvaluationTimes.entries()) {
      if (times.length === 0) continue;

      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);

      rubricPerformance.set(rubricId, { avg, min, max, count: times.length });
    }

    return {
      verificationCount: this.performanceMetrics.verificationCount,
      avgVerificationTime: this.performanceMetrics.avgVerificationTime,
      cacheHitRate: this.performanceMetrics.cacheHitRate,
      rubricPerformance,
    };
  }

  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      verificationCount: 0,
      totalVerificationTime: 0,
      avgVerificationTime: 0,
      cacheHitRate: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rubricEvaluationTimes: new Map(),
    };
  }

  enableLazyRubricLoading(): void {
    this.config.lazyUpdate = true;
  }

  disableLazyRubricLoading(): void {
    this.config.lazyUpdate = false;
  }

  optimizeRubricWeights(): void {
    const performance = this.getPerformanceMetrics();

    for (const [rubricId, rubric] of this.rubrics.entries()) {
      const rubricPerf = performance.rubricPerformance.get(rubricId);

      if (rubricPerf && rubricPerf.count > 10) {
        if (rubricPerf.avg > 100) {
          rubric.weight = Math.max(0.1, (rubric.weight || 0.5) * 0.8);
        }
      }
    }
  }
}
