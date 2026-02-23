/**
 * Cost-Aware Intent Router
 *
 * Based on research: "When Do Tools and Planning Help LLMs Think?" (arXiv:2601.02663)
 *
 * Key insight: Tools improve accuracy +20% but add 40x latency
 * Solution: Match strategy to task complexity
 */

import { CONFIG } from "../../../constants/config";
import type {
  ComplexityLevel,
  ExecutionStrategy,
  IntentClassification,
  RouteConfig,
  RouteMatch,
  RoutingDecision,
} from "../../../types/router";
import { resolveToConfig } from "../../../utils/path";
import { IntentClassifier } from "./intent-classifier";
import { PatternMatcher } from "./pattern-matcher";
import { RouteConfigManager } from "./route-config";

export class CostAwareRouter {
  private routes: Map<string, RouteConfig>;
  private intentClassifier: IntentClassifier;
  private patternMatcher: PatternMatcher;
  private routeConfigManager: RouteConfigManager;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || resolveToConfig("config/intent-routes.yaml");
    this.routeConfigManager = new RouteConfigManager(this.configPath);
    this.routes = this.routeConfigManager.loadRoutes();
    this.intentClassifier = new IntentClassifier();
    this.patternMatcher = new PatternMatcher(this.routes);
  }

  async classifyAndRoute(request: string, contextSize = 0): Promise<RoutingDecision> {
    const intent = this.intentClassifier.classifyIntent(request);

    if (contextSize > CONFIG.CONTEXT.SIZE_THRESHOLD) {
      return {
        strategy: "rlm",
        intent,
        needsClarification: false,
      };
    }

    if (this.intentClassifier.needsClarification(intent.confidence)) {
      return {
        strategy: "direct",
        intent,
        needsClarification: true,
        clarificationPrompt: this.intentClassifier.generateClarificationPrompt(request),
      };
    }

    const routeMatch = this.patternMatcher.matchPattern(request);
    const strategy = this.selectStrategy(intent.complexity, contextSize, routeMatch);

    return {
      strategy,
      intent,
      skill: routeMatch?.skill,
      skillChain: routeMatch?.skillChain,
      needsClarification: false,
    };
  }

  classifyIntent(request: string): IntentClassification {
    return this.intentClassifier.classifyIntent(request);
  }

  selectStrategy(
    complexity: ComplexityLevel,
    contextSize = 0,
    routeMatch?: RouteMatch | null,
  ): ExecutionStrategy {
    if (routeMatch?.strategy) {
      return routeMatch.strategy;
    }

    if (contextSize > CONFIG.CONTEXT.SIZE_THRESHOLD) {
      return "rlm";
    }

    const strategyConfig = this.routeConfigManager.getStrategyConfig();
    return strategyConfig[complexity].strategy;
  }

  matchPattern(request: string) {
    return this.patternMatcher.matchPattern(request);
  }

  addRoute(name: string, config: RouteConfig): void {
    this.routeConfigManager.addRoute(this.routes, name, config);
  }

  explainDecision(decision: RoutingDecision): string {
    const strategyConfig = this.routeConfigManager.getStrategyConfig();
    const parts = [
      `Intent: ${decision.intent.type} (${(decision.intent.confidence * 100).toFixed(0)}% confidence)`,
      `Complexity: ${decision.intent.complexity}`,
      `Strategy: ${decision.strategy}`,
      `Latency target: ${strategyConfig[decision.intent.complexity].latencyTarget}`,
    ];

    if (decision.skill) {
      parts.push(`Skill: ${decision.skill}`);
    }

    if (decision.skillChain) {
      parts.push(`Skill chain: ${decision.skillChain.join(" → ")}`);
    }

    if (decision.needsClarification) {
      parts.push(`⚠️ ${decision.clarificationPrompt}`);
    }

    return parts.join("\n");
  }
}

export const router = new CostAwareRouter();

export async function classifyAndRoute(
  request: string,
  contextSize?: number,
): Promise<RoutingDecision> {
  return router.classifyAndRoute(request, contextSize);
}

export function classifyIntent(request: string): IntentClassification {
  return router.classifyIntent(request);
}

export function selectStrategy(
  complexity: ComplexityLevel,
  contextSize?: number,
): ExecutionStrategy {
  return router.selectStrategy(complexity, contextSize);
}

export { DEFAULT_ROUTES, STRATEGY_CONFIG } from "../../../constants/router";
