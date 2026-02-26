/**
 * Pattern matching logic
 */

import type { RouteConfig, RouteMatch } from "../../../types/router";

export class PatternMatcher {
  constructor(private routes: Map<string, RouteConfig>) {}

  matchPattern(request: string): RouteMatch | null {
    const lowerRequest = request.toLowerCase();
    let bestMatch: RouteMatch | null = null;
    let bestScore = 0;

    for (const [routeName, config] of this.routes) {
      for (const pattern of config.patterns) {
        const lowerPattern = pattern.toLowerCase();

        const patternWords = lowerPattern.split(/\s+/);
        let matchCount = 0;

        for (const word of patternWords) {
          if (word.length > 2 && lowerRequest.includes(word)) {
            matchCount++;
          }
        }

        if (matchCount === patternWords.filter((w) => w.length > 2).length && matchCount > 0) {
          const score = lowerPattern.length;

          if (score > bestScore) {
            bestScore = score;
            bestMatch = {
              route: routeName,
              pattern,
              confidence: config.confidenceThreshold,
              skill: config.skill,
              skillChain: config.skillChain,
              strategy: config.strategy,
            };
          }
        }
      }
    }

    return bestMatch;
  }
}
