import type {
  SkillRoutingDecision,
  SkillExecutionContext,
  RoutingConfig,
} from "./types";
import { CompetenceModelBuilder } from "./competence-model";
import { DEFAULT_ROUTING_CONFIG } from "./tracking-config";

export class AdaptiveSkillRouter {
  private competenceModel: CompetenceModelBuilder;
  private routingConfig: Required<RoutingConfig>;
  private routingHistory: SkillRoutingDecision[];
  private explorationCounter: number;
  private explorationEnabled: boolean;

  constructor(
    competenceModel: CompetenceModelBuilder,
    config?: Partial<RoutingConfig>,
  ) {
    this.competenceModel = competenceModel;
    this.routingConfig = { ...DEFAULT_ROUTING_CONFIG, ...config } as Required<RoutingConfig>;
    this.routingHistory = [];
    this.explorationCounter = 0;
    this.explorationEnabled = config?.strategy === "exploration" || config?.strategy === "hybrid";
  }

  async routeTask(
    task: string,
    context: SkillExecutionContext,
    availableSkills: string[],
  ): Promise<SkillRoutingDecision> {
    if (availableSkills.length === 0) {
      throw new Error("No available skills for routing");
    }

    const skillId = this.selectSkill(task, context, availableSkills);

    const confidence = this.calculateConfidence(skillId, task, context);
    const alternativeSkills = this.getAlternativeSkills(
      skillId,
      availableSkills,
      context,
      3,
    );

    const decision: SkillRoutingDecision = {
      skillId,
      confidence,
      reason: this.getRoutingReason(skillId, confidence),
      alternativeSkills,
      timestamp: Date.now(),
    };

    this.routingHistory.push(decision);

    this.trimHistory();

    return decision;
  }

  private selectSkill(
    task: string,
    context: SkillExecutionContext,
    availableSkills: string[],
  ): string {
    switch (this.routingConfig.strategy) {
      case "competence-based":
        return this.routeByCompetence(task, context, availableSkills);

      case "exploration":
        return this.routeByExploration(availableSkills);

      case "hybrid":
        return this.routeByHybrid(task, context, availableSkills);

      case "static":
      default:
        return this.routeByFallback(task, context, availableSkills);
    }
  }

  private routeByCompetence(
    task: string,
    context: SkillExecutionContext,
    availableSkills: string[],
  ): string {
    if (!this.routingConfig.useCompetenceModel) {
      return availableSkills[0];
    }

    const topSkills = this.competenceModel.getTopCompetentSkills(
      context,
      Math.min(5, availableSkills.length),
    );

    const validTopSkills = topSkills.filter((skillId) =>
      availableSkills.includes(skillId),
    );

    if (validTopSkills.length > 0) {
      return validTopSkills[0];
    }

    return availableSkills[0];
  }

  private routeByExploration(availableSkills: string[]): string {
    if (availableSkills.length === 1) {
      return availableSkills[0];
    }

    const randomIndex = Math.floor(Math.random() * availableSkills.length);
    return availableSkills[randomIndex];
  }

  private routeByHybrid(
    task: string,
    context: SkillExecutionContext,
    availableSkills: string[],
  ): string {
    const shouldExplore = this.shouldExplore();

    if (shouldExplore) {
      this.explorationCounter++;
      return this.routeByExploration(availableSkills);
    }

    return this.routeByCompetence(task, context, availableSkills);
  }

  private routeByFallback(
    task: string,
    context: SkillExecutionContext,
    availableSkills: string[],
  ): string {
    return availableSkills[0];
  }

  private shouldExplore(): boolean {
    return this.routingConfig.strategy === "exploration" || this.routingConfig.strategy === "hybrid"
      ? Math.random() < this.routingConfig.diversityFactor
      : false;
  }

  private calculateConfidence(
    skillId: string,
    task: string,
    context: SkillExecutionContext,
  ): number {
    const competence = this.competenceModel.getCompetence(skillId);

    if (!competence) {
      return 0.5;
    }

    let baseConfidence = competence.confidence;

    const taskTypeMatch = competence.taskTypes.includes(context.taskType);
    if (!taskTypeMatch) {
      baseConfidence *= 0.8;
    }

    const complexityAdjustment = this.getComplexityAdjustment(context.complexity);
    baseConfidence *= complexityAdjustment;

    return Math.max(0, Math.min(1, baseConfidence));
  }

  private getAlternativeSkills(
    selectedSkillId: string,
    availableSkills: string[],
    context: SkillExecutionContext,
    limit: number,
  ): Array<{ skillId: string; confidence: number }> {
    const alternatives = availableSkills
      .filter((skillId) => skillId !== selectedSkillId)
      .slice(0, limit);

    return alternatives.map((skillId) => ({
      skillId,
      confidence: this.calculateConfidence(skillId, "", context),
    }));
  }

  private getRoutingReason(skillId: string, confidence: number): string {
    const competence = this.competenceModel.getCompetence(skillId);

    if (!competence) {
      return "Default skill selected (no competence data)";
    }

    if (confidence >= 0.8) {
      return `High confidence: skill has ${competence.successRate.toFixed(1)}% success rate`;
    } else if (confidence >= 0.6) {
      return `Moderate confidence: skill competence ${competence.competence.toFixed(2)}`;
    } else if (confidence >= 0.4) {
      return `Low confidence: limited execution history`;
    } else {
      return `Very low confidence: unknown skill performance`;
    }
  }

  private getComplexityAdjustment(
    complexity: "low" | "medium" | "high" | "unknown",
  ): number {
    const adjustments: Record<string, number> = {
      low: 1.1,
      medium: 1.0,
      high: 0.9,
      unknown: 1.0,
    };

    return adjustments[complexity] || 1.0;
  }

  private trimHistory(): void {
    while (this.routingHistory.length > 1000) {
      this.routingHistory.shift();
    }
  }

  getRoutingStats(): {
    totalRoutings: number;
    explorationRate: number;
    avgConfidence: number;
    routingStrategy: string;
    recentDecisions: SkillRoutingDecision[];
  } {
    const totalRoutings = this.routingHistory.length;

    if (totalRoutings === 0) {
      return {
        totalRoutings: 0,
        explorationRate: 0,
        avgConfidence: 0,
        routingStrategy: this.routingConfig.strategy,
        recentDecisions: [],
      };
    }

    const explorationCount = this.routingHistory.filter((decision) => {
      return decision.confidence < 0.7;
    }).length;

    const explorationRate = totalRoutings > 0 ? explorationCount / totalRoutings : 0;

    const avgConfidence =
      this.routingHistory.reduce((sum, decision) => sum + decision.confidence, 0) /
      this.routingHistory.length;

    const recentDecisions = this.routingHistory.slice(-10);

    return {
      totalRoutings,
      explorationRate,
      avgConfidence,
      routingStrategy: this.routingConfig.strategy,
      recentDecisions,
    };
  }

  setRoutingStrategy(strategy: RoutingConfig["strategy"]): void {
    this.routingConfig.strategy = strategy;
  }

  updateSkillCompetence(skillId: string, trace: any): void {
    this.competenceModel.updateCompetence(skillId, trace);
  }

  getConfig(): Required<RoutingConfig> {
    return { ...this.routingConfig };
  }

  updateConfig(config: Partial<RoutingConfig>): void {
    this.routingConfig = { ...this.routingConfig, ...config };
  }

  reset(): void {
    this.routingHistory = [];
    this.explorationCounter = 0;
  }
}
