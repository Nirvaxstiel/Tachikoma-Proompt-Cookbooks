import {
  CLARIFICATION_CONFIDENCE_THRESHOLD,
  COMPLEXITY_THRESHOLDS,
} from "../../../constants/router";
import type {
  ComplexityLevel,
  IntentClassification,
  IntentType,
  RouteConfig,
} from "../../../types/router";
import { logger } from "../../../utils/logger";

export class IntentClassifier {
  constructor(private routes: Map<string, RouteConfig>) {}

  private getIntentKeywords(intent: IntentType): string[] {
    const route = this.routes.get(intent);
    return route?.patterns || [];
  }

  private getIntentPriorityOrder(): IntentType[] {
    return Array.from(this.routes.keys()) as IntentType[];
  }
  classifyIntent(request: string): IntentClassification {
    const lowerRequest = request.toLowerCase();
    const words = lowerRequest.split(/\s+/);

    const { bestIntent, bestScore } = this.scoreIntentType(lowerRequest);
    const confidence = this.calculateConfidence(bestScore, bestIntent);
    const complexity = this.determineComplexity(request, bestIntent, words);
    const requiresTools = this.requiresTools(bestIntent, complexity);
    const keywords = this.extractKeywords(request);

    return {
      type: bestIntent,
      confidence,
      complexity,
      keywords,
      requiresTools,
    };
  }

  private scoreIntentType(lowerRequest: string): { bestIntent: IntentType; bestScore: number } {
    const scores = {} as Record<IntentType, number>;

    for (const [routeName, config] of this.routes.entries()) {
      const intentType = routeName as IntentType;
      scores[intentType] = 0;

      for (const keyword of config.patterns) {
        if (lowerRequest.includes(keyword.toLowerCase())) {
          const isSpecificIntent = [
            "test",
            "verify",
            "debug",
            "refactor",
            "research",
            "explain",
          ].includes(intentType);
          const weight = isSpecificIntent ? 2 : 1;
          scores[intentType] += weight;
        }
      }
    }

    const priorityOrder = this.getIntentPriorityOrder();
    let bestIntent: IntentType = "unknown";
    let bestScore = 0;

    for (const intentType of priorityOrder) {
      const score = scores[intentType];
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intentType;
      }
    }

    return { bestIntent, bestScore };
  }

  private calculateConfidence(bestScore: number, bestIntent: IntentType): number {
    const keywords = this.getIntentKeywords(bestIntent);
    const totalKeywords = keywords.length;
    return totalKeywords > 0
      ? Math.min(bestScore / Math.max(totalKeywords, COMPLEXITY_THRESHOLDS.MIN_KEYWORDS), 1.0)
      : 0.3;
  }

  private determineComplexity(
    request: string,
    intent: IntentType,
    words: string[],
  ): ComplexityLevel {
    const lowerRequest = request.toLowerCase();
    const tokenCount = words.length;

    const isVeryHigh = this.hasIndicators(lowerRequest, [
      "refactor entire",
      "migrate entire",
      "rewrite",
      "redesign",
    ]);

    const hasMultiFile = this.hasIndicators(lowerRequest, [
      "and",
      "also",
      "multiple",
      "all",
      "entire",
      "whole",
      "full",
      "system",
    ]);

    const hasCrossDomain = this.hasIndicators(lowerRequest, [
      "with",
      "using",
      "integration",
      "migrate",
      "between",
    ]);

    const hasHighStakes = this.hasIndicators(lowerRequest, [
      "production",
      "security",
      "auth",
      "payment",
      "critical",
      "password",
    ]);

    const isBugFix =
      intent === "debug" || lowerRequest.includes("bug") || lowerRequest.includes("fix");

    const hasComplexityIndicators = hasMultiFile || hasCrossDomain || hasHighStakes || isBugFix;

    if (
      isVeryHigh ||
      (tokenCount > COMPLEXITY_THRESHOLDS.VERY_HIGH_TOKEN_THRESHOLD && hasMultiFile)
    ) {
      return "very_high";
    }

    const isSimpleTask =
      tokenCount < COMPLEXITY_THRESHOLDS.LOW_COMPLEXITY_TOKENS &&
      !hasComplexityIndicators &&
      intent !== "code";

    if (isSimpleTask) {
      return "low";
    }

    const isMediumTask =
      tokenCount < COMPLEXITY_THRESHOLDS.MEDIUM_COMPLEXITY_TOKENS &&
      !hasMultiFile &&
      !hasHighStakes &&
      !isBugFix;

    if (isMediumTask) {
      return "medium";
    }

    const isHighTask =
      tokenCount < COMPLEXITY_THRESHOLDS.HIGH_COMPLEXITY_TOKENS || hasComplexityIndicators;

    if (isHighTask) {
      return "high";
    }

    return "very_high";
  }

  private hasIndicators(text: string, indicators: string[]): boolean {
    return indicators.some((ind) => text.includes(ind));
  }

  private requiresTools(intent: IntentType, complexity: ComplexityLevel): boolean {
    if (intent === "explain" || intent === "query") {
      return complexity === "low";
    }
    return true;
  }

  private extractKeywords(request: string): string[] {
    const lower = request.toLowerCase();
    const allKeywords: string[] = [];
    for (const config of this.routes.values()) {
      allKeywords.push(...config.patterns);
    }
    return allKeywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
  }

  needsClarification(confidence: number): boolean {
    return confidence < CLARIFICATION_CONFIDENCE_THRESHOLD;
  }

  generateClarificationPrompt(request: string): string {
    return `Your request "${request.substring(0, 50)}..." is unclear. Could you provide more details about what you'd like to accomplish?`;
  }
}
