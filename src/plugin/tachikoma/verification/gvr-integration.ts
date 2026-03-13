import { DeepVerifier } from "./deep-verifier";
import { FailureTaxonomyFactory } from "./failure-taxonomy";
import type { VerificationLoop } from "../verifier";
import type {
  Rubric,
  VerificationContext,
  VerificationOutcome,
  VerificationVerdict,
} from "./types";

export interface GVRIntegrationConfig {
  enableRubricVerification: boolean;
  combineWithGVR: boolean;
  rubricWeight: number;
  gvrWeight: number;
}

const DEFAULT_GVR_CONFIG: GVRIntegrationConfig = {
  enableRubricVerification: true,
  combineWithGVR: true,
  rubricWeight: 0.5,
  gvrWeight: 0.5,
};

export class GVRRubricIntegration {
  private verifier: VerificationLoop;
  private deepVerifier: DeepVerifier;
  private config: GVRIntegrationConfig;

  constructor(
    verifier: VerificationLoop,
    deepVerifier?: DeepVerifier,
    config?: Partial<GVRIntegrationConfig>,
  ) {
    this.verifier = verifier;
    this.deepVerifier = deepVerifier || new DeepVerifier();
    this.config = { ...DEFAULT_GVR_CONFIG, ...config };

    this.initializeDefaultRubrics();
  }

  private initializeDefaultRubrics(): void {
    const taxonomy = FailureTaxonomyFactory.getAllCategories();

    for (const category of taxonomy) {
      this.createRubricForCategory(category);
    }
  }

  private createRubricForCategory(category: {
    id: string;
    name: string;
    description: string;
    severity: string;
    subcategories: string[];
    examples: string[];
    mitigationStrategies: string[];
  }): void {
    const rubric: Rubric = {
      id: `rubric-${category.id}`,
      name: category.name,
      description: category.description,
      severityLevel: category.severity as "low" | "medium" | "high" | "critical",
      weight: category.severity === "critical" ? 1.0 : 0.5,
      suggestions: category.mitigationStrategies,
      evaluate: async (
        outcome: VerificationOutcome,
        context: VerificationContext,
      ) => {
        const failures = this.detectFailures(outcome.content, category.id);

        const passed = failures.length === 0;
        const score = passed ? 1.0 : 1.0 - failures.length * 0.2;

        let verdict: VerificationVerdict = "pass";
        if (category.severity === "critical" && !passed) {
          verdict = "fail";
        } else if (!passed) {
          verdict = "needs_revision";
        }

        return {
          passed,
          score: Math.max(0, score),
          verdict,
          rubric: category.id as unknown as Rubric,
          feedback: failures.length > 0 ? failures.join("\n") : undefined,
        };
      },
    };

    this.deepVerifier.registerRubric(rubric);
  }

  private detectFailures(
    content: string,
    categoryId: string,
  ): string[] {
    const failures: string[] = [];

    if (categoryId === "syntax") {
      if (/undefined\s*=/.test(content)) {
        failures.push("Undefined variable detected");
      }
      if (/:\s*undefined\b/.test(content)) {
        failures.push("Type mismatch: undefined type");
      }
    }

    if (categoryId === "logic") {
      if (/==\s*(true|false)/.test(content)) {
        failures.push("Weak equality with boolean");
      }
      if (/<=\s*array\.length/.test(content)) {
        failures.push("Potential off-by-one error");
      }
    }

    if (categoryId === "runtime") {
      if (/\.toString\(\)/.test(content) && !/null\./.test(content)) {
        failures.push("Potential null reference error");
      }
    }

    if (categoryId === "security") {
      if (/\+\s*input\b/.test(content)) {
        failures.push("Potential injection vulnerability");
      }
      if (/eval\(/.test(content)) {
        failures.push("Unsafe eval() usage");
      }
    }

    if (categoryId === "performance") {
      if (/for\s*\(.*\)\s*{\s*for\s*\(/.test(content)) {
        failures.push("Nested loops detected - consider optimization");
      }
    }

    return failures;
  }

  async verifyWithGVRAndRubric(
    request: string,
    result: string,
    context?: VerificationContext,
  ): Promise<{
    result: string;
    iterations: number;
    verified: boolean;
    rubricVerdict?: VerificationVerdict;
    gvrVerdict?: "pass" | "fail" | "uncertain";
    combinedVerdict: boolean;
  }> {
    if (!this.config.combineWithGVR) {
      return this.verifyWithRubricOnly(request, result, context);
    }

    const gvrResult = await this.verifier.verifyAndRevise(request, result, context);

    const rubricOutcome: VerificationOutcome = {
      id: `outcome-${Date.now()}`,
      content: gvrResult.result,
      timestamp: Date.now(),
      verdict: gvrResult.verified ? "pass" : "fail",
      verdictConfidenceValue: gvrResult.verified ? 0.9 : 0.4,
    };

    const rubricResult = await this.deepVerifier.verifyOutcome(
      rubricOutcome,
      context || {},
    );

    const combinedVerdict =
      this.config.gvrWeight * (gvrResult.verified ? 1 : 0) +
      this.config.rubricWeight * (rubricResult.verdict === "pass" ? 1 : 0);

    return {
      result: rubricResult.outcome.content,
      iterations: gvrResult.iterations,
      verified: gvrResult.verified && rubricResult.verdict === "pass",
      rubricVerdict: rubricResult.verdict,
      gvrVerdict: gvrResult.verified ? "pass" : "fail",
      combinedVerdict: combinedVerdict >= 0.5,
    };
  }

  async verifyWithRubricOnly(
    request: string,
    result: string,
    context?: VerificationContext,
  ): Promise<{
    result: string;
    iterations: number;
    verified: boolean;
    rubricVerdict?: VerificationVerdict;
    combinedVerdict: boolean;
  }> {
    const outcome: VerificationOutcome = {
      id: `outcome-${Date.now()}`,
      content: result,
      timestamp: Date.now(),
      verdict: "pass",
      verdictConfidenceValue: 0.7,
    };

    const rubricResult = await this.deepVerifier.verifyOutcome(
      outcome,
      context || {},
    );

    return {
      result: rubricResult.outcome.content,
      iterations: 1,
      verified: rubricResult.verdict === "pass",
      rubricVerdict: rubricResult.verdict,
      combinedVerdict: rubricResult.verdict === "pass",
    };
  }

  loadRubric(rubricConfig: {
    id: string;
    name: string;
    description: string;
    severity?: "low" | "medium" | "high" | "critical";
    weight?: number;
    suggestions: string[];
    evaluate: (
      outcome: VerificationOutcome,
      context: VerificationContext,
    ) => Promise<{ passed: boolean; score: number; verdict: VerificationVerdict; feedback?: string }>;
  }): void {
    const rubric: Rubric = {
      id: rubricConfig.id,
      name: rubricConfig.name,
      description: rubricConfig.description,
      severityLevel: rubricConfig.severity || "medium",
      weight: rubricConfig.weight || 0.5,
      suggestions: rubricConfig.suggestions,
      evaluate: async (outcome, context) => {
        const result = await rubricConfig.evaluate(outcome, context);
        const rubric = {
          id: rubricConfig.id,
          name: rubricConfig.name,
          description: rubricConfig.description,
          evaluate: rubricConfig.evaluate,
          severityLevel: rubricConfig.severity || "medium",
          weight: rubricConfig.weight || 0.5,
          suggestions: rubricConfig.suggestions,
        } as Rubric;

        return {
          passed: result.passed,
          score: result.score,
          verdict: result.verdict,
          rubric,
          feedback: result.feedback,
        };
      },
    };

    this.deepVerifier.registerRubric(rubric);
  }

  getRubricReport(): {
    rubrics: string[];
    statistics: ReturnType<DeepVerifier["getStatistics"]>;
    taxonomy: ReturnType<DeepVerifier["getFailureTaxonomy"]>;
  } {
    return {
      rubrics: this.deepVerifier.getAllRubrics(),
      statistics: this.deepVerifier.getStatistics(),
      taxonomy: this.deepVerifier.getFailureTaxonomy(),
    };
  }

  getDeepVerifier(): DeepVerifier {
    return this.deepVerifier;
  }

  getGVRVerifier(): VerificationLoop {
    return this.verifier;
  }
}

export async function verifyWithRubric(
  gvrVerifier: VerificationLoop,
  deepVerifier: DeepVerifier,
  request: string,
  result: string,
  context?: VerificationContext,
) {
  const integration = new GVRRubricIntegration(gvrVerifier, deepVerifier);
  return integration.verifyWithGVRAndRubric(request, result, context);
}
