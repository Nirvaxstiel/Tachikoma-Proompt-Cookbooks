import { CONFIG } from "../../../constants/config";
import type {
  ComplexityLevel,
  ExecutionStrategy,
  IntentClassification,
  IntentType,
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
  private initialized = false;

  constructor(configPath?: string) {
    this.configPath = configPath || resolveToConfig("config/intent-routes.yaml");
    this.routeConfigManager = new RouteConfigManager(this.configPath);
    this.routes = new Map();
    this.intentClassifier = new IntentClassifier(this.routes);
    this.patternMatcher = new PatternMatcher(this.routes);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.routes = await this.routeConfigManager.loadRoutes();
    this.intentClassifier = new IntentClassifier(this.routes);
    this.patternMatcher = new PatternMatcher(this.routes);
    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("CostAwareRouter not initialized. Call initialize() first.");
    }
  }

  async classifyAndRoute(request: string, contextSize = 0): Promise<RoutingDecision> {
    this.ensureInitialized();

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
    this.ensureInitialized();
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
    this.ensureInitialized();
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

export async function initializeRouter(): Promise<void> {
  await router.initialize();
}

export async function classifyAndRoute(
  request: string,
  contextSize?: number,
): Promise<RoutingDecision> {
  await router.initialize();
  return router.classifyAndRoute(request, contextSize);
}

export async function classifyIntent(request: string): Promise<IntentClassification> {
  await router.initialize();
  return router.classifyIntent(request);
}

export function selectStrategy(
  complexity: ComplexityLevel,
  contextSize?: number,
): ExecutionStrategy {
  return router.selectStrategy(complexity, contextSize);
}

export { STRATEGY_CONFIG } from "../../../constants/router";
export type { ComplexityLevel, ExecutionStrategy, IntentType } from "../../../types/router";
