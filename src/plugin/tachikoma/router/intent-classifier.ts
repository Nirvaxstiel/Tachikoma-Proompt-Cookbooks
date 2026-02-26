/**
 * Intent classification logic
 */

import {
  CLARIFICATION_CONFIDENCE_THRESHOLD,
  COMPLEXITY_THRESHOLDS,
  INTENT_KEYWORDS,
  INTENT_PRIORITY_ORDER,
} from "../../../constants/router";
import type { ComplexityLevel, IntentClassification, IntentType } from "../../../types/router";
import { logger } from "../../../utils/logger";

export class IntentClassifier {
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
    const scores: Record<IntentType, number> = {
      code: 0,
      debug: 0,
      research: 0,
      refactor: 0,
      test: 0,
      verify: 0,
      explain: 0,
      plan: 0,
      query: 0,
      unknown: 0,
    };

    for (const [intentType, keywords] of Object.entries(INTENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerRequest.includes(keyword)) {
          const isSpecificIntent = [
            "test",
            "verify",
            "debug",
            "refactor",
            "research",
            "explain",
          ].includes(intentType);
          const weight = isSpecificIntent ? 2 : 1;
          scores[intentType as IntentType] += weight;
        }
      }
    }

    let bestIntent: IntentType = "unknown";
    let bestScore = 0;

    for (const intentType of INTENT_PRIORITY_ORDER) {
      const score = scores[intentType];
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intentType;
      }
    }

    return { bestIntent, bestScore };
  }

  private calculateConfidence(bestScore: number, bestIntent: IntentType): number {
    const totalKeywords = INTENT_KEYWORDS[bestIntent].length;
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

    const isVeryHigh = this.hasIndicators(lowerRequest, [
      "refactor entire",
      "migrate entire",
      "rewrite",
      "redesign",
    ]);

    const tokenCount = words.length;

    if (
      isVeryHigh ||
      (tokenCount > COMPLEXITY_THRESHOLDS.VERY_HIGH_TOKEN_THRESHOLD && hasMultiFile)
    ) {
      return "very_high";
    }

    if (
      tokenCount < COMPLEXITY_THRESHOLDS.LOW_COMPLEXITY_TOKENS &&
      !hasMultiFile &&
      !hasCrossDomain &&
      !isBugFix &&
      intent !== "code"
    ) {
      return "low";
    }

    if (
      tokenCount < COMPLEXITY_THRESHOLDS.MEDIUM_COMPLEXITY_TOKENS &&
      !hasMultiFile &&
      !hasHighStakes &&
      !isBugFix
    ) {
      return "medium";
    }

    if (
      tokenCount < COMPLEXITY_THRESHOLDS.HIGH_COMPLEXITY_TOKENS ||
      hasMultiFile ||
      hasCrossDomain ||
      isBugFix
    ) {
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
    const allKeywords = Object.values(INTENT_KEYWORDS).flat() as string[];
    return allKeywords.filter((keyword) => lower.includes(keyword));
  }

  needsClarification(confidence: number): boolean {
    return confidence < CLARIFICATION_CONFIDENCE_THRESHOLD;
  }

  generateClarificationPrompt(request: string): string {
    return `Your request "${request.substring(0, 50)}..." is unclear. Could you provide more details about what you'd like to accomplish?`;
  }
}
