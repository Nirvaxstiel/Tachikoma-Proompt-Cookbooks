import type {
  SkillExecutionTrace,
  SkillCompetence,
  CompetenceModel,
  SkillExecutionContext,
  TrackingConfig,
  AnomalyDetection,
  LearningMetrics,
} from "./types";
import { DEFAULT_TRACKING_CONFIG } from "./tracking-config";

export class CompetenceModelBuilder
  implements CompetenceModel, AnomalyDetection
{
  public skills: Map<string, SkillCompetence>;
  private config: Required<TrackingConfig>;
  private anomalies: Map<string, Array<{ timestamp: number; score: number; reason: string }>>;

  constructor(config?: Partial<TrackingConfig>) {
    this.config = { ...DEFAULT_TRACKING_CONFIG, ...config } as Required<TrackingConfig>;
    this.skills = new Map();
    this.anomalies = new Map();
  }

  updateCompetence(skillId: string, trace: SkillExecutionTrace): void {
    let competence = this.skills.get(skillId);

    if (!competence) {
      competence = this.initializeCompetence(skillId, trace);
    }

    competence = this.updateCompetenceWithTrace(competence, trace);
    competence.lastUpdated = Date.now();

    this.skills.set(skillId, competence);

    if (this.config.anomalyDetection) {
      this.checkForAnomalies(skillId);
    }
  }

  batchUpdate(traces: SkillExecutionTrace[]): void {
    for (const trace of traces) {
      this.updateCompetence(trace.skillId, trace);
    }
  }

  getCompetence(skillId: string): SkillCompetence | undefined {
    return this.skills.get(skillId);
  }

  getAllCompetences(): Map<string, SkillCompetence> {
    return new Map(this.skills);
  }

  predictPerformance(
    skillId: string,
    task: SkillExecutionContext,
  ): number {
    const competence = this.skills.get(skillId);

    if (!competence) {
      return 0.5;
    }

    if (competence.totalExecutions < this.config.minExecutionsForConfidence) {
      return 0.5;
    }

    const taskTypeMatch = competence.taskTypes.includes(task.taskType);
    const taskMatchFactor = taskTypeMatch ? 1.0 : 0.8;

    const complexityAdjustment = this.getComplexityAdjustment(task.complexity);

    const predictedPerformance =
      competence.competence *
      taskMatchFactor *
      complexityAdjustment;

    return Math.max(0, Math.min(1, predictedPerformance));
  }

  getTopCompetentSkills(
    task: SkillExecutionContext,
    limit: number,
  ): string[] {
    const scores: Array<{ skillId: string; score: number }> = [];

    for (const [skillId, competence] of this.skills.entries()) {
      if (competence.totalExecutions < this.config.minExecutionsForConfidence) {
        continue;
      }

      const score = this.predictPerformance(skillId, task);
      scores.push({ skillId, score });
    }

    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, limit).map((s) => s.skillId);
  }

  reset(): void {
    this.skills.clear();
    this.anomalies.clear();
  }

  export(): string {
    const data = {
      skills: Array.from(this.skills.entries()),
      config: this.config,
      anomalies: Array.from(this.anomalies.entries()),
    };
    return JSON.stringify(data, null, 2);
  }

  import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.skills = new Map(parsed.skills);
      this.anomalies = new Map(parsed.anomalies);

      if (parsed.config) {
        this.config = { ...DEFAULT_TRACKING_CONFIG, ...parsed.config };
      }
    } catch (error) {
      console.error("Failed to import competence model:", error);
      throw error;
    }
  }

  private initializeCompetence(
    skillId: string,
    trace: SkillExecutionTrace,
  ): SkillCompetence {
    return {
      skillId,
      competence: 0.5,
      confidence: 0.1,
      taskTypes: trace.context ? [trace.context.taskType] : [],
      lastUpdated: Date.now(),
      totalExecutions: 0,
      successCount: 0,
      successRate: 0,
      avgDuration: 0,
      avgCost: 0,
      avgQuality: 0,
      avgToolCalls: 0,
      avgLLMCalls: 0,
      trend: "stable",
      lastTrendUpdate: Date.now(),
    };
  }

  private updateCompetenceWithTrace(
    competence: SkillCompetence,
    trace: SkillExecutionTrace,
  ): SkillCompetence {
    const newSuccessRate = this.updateSuccessRate(
      competence.successRate,
      trace.success,
      competence.totalExecutions,
    );

    const newAvgDuration = this.updateAverage(
      competence.avgDuration,
      trace.duration,
      competence.totalExecutions,
    );

    const newAvgCost = this.updateAverage(
      competence.avgCost,
      trace.metrics.cost,
      competence.totalExecutions,
    );

    const newAvgQuality = this.updateAverage(
      competence.avgQuality,
      trace.metrics.quality,
      competence.totalExecutions,
    );

    const newAvgToolCalls = this.updateAverage(
      competence.avgToolCalls,
      trace.metrics.toolCalls,
      competence.totalExecutions,
    );

    const newAvgLLMCalls = this.updateAverage(
      competence.avgLLMCalls,
      trace.metrics.llmCalls,
      competence.totalExecutions,
    );

    const newCompetence = this.calculateCompetence({
      successRate: newSuccessRate,
      avgQuality: newAvgQuality,
      avgCost: newAvgCost,
      avgDuration: newAvgDuration,
      avgToolCalls: newAvgToolCalls,
      avgLLMCalls: newAvgLLMCalls,
    });

    const newTrend = this.calculateTrend(competence, newCompetence);
    const newConfidence = this.calculateConfidence(competence.totalExecutions);

    const taskTypes = new Set([...competence.taskTypes]);

    if (trace.context && !taskTypes.has(trace.context.taskType)) {
      taskTypes.add(trace.context.taskType);
    }

    return {
      ...competence,
      totalExecutions: competence.totalExecutions + 1,
      successCount: trace.success
        ? competence.successCount + 1
        : competence.successCount,
      successRate: newSuccessRate,
      avgDuration: newAvgDuration,
      avgCost: newAvgCost,
      avgQuality: newAvgQuality,
      avgToolCalls: newAvgToolCalls,
      avgLLMCalls: newAvgLLMCalls,
      competence: newCompetence,
      confidence: newConfidence,
      taskTypes: Array.from(taskTypes),
      trend: newTrend,
      lastTrendUpdate: Date.now(),
    };
  }

  private updateSuccessRate(
    currentRate: number,
    success: boolean,
    count: number,
  ): number {
    const value = success ? 1.0 : 0.0;
    return currentRate + this.config.learningRate * (value - currentRate);
  }

  private updateAverage(
    currentAvg: number,
    newValue: number,
    count: number,
  ): number {
    return currentAvg + this.config.learningRate * (newValue - currentAvg);
  }

  private calculateCompetence(metrics: {
    successRate: number;
    avgQuality: number;
    avgCost: number;
    avgDuration: number;
    avgToolCalls: number;
    avgLLMCalls: number;
  }): number {
    const successWeight = 0.4;
    const qualityWeight = 0.25;
    const costWeight = 0.15;
    const speedWeight = 0.1;
    const efficiencyWeight = 0.1;

    const normalizedCost = 1 - Math.min(1, metrics.avgCost / 100);
    const normalizedDuration = 1 - Math.min(1, metrics.avgDuration / 10000);
    const normalizedToolCalls = 1 - Math.min(1, metrics.avgToolCalls / 50);
    const normalizedLLMCalls = 1 - Math.min(1, metrics.avgLLMCalls / 20);

    const competence =
      metrics.successRate * successWeight +
      metrics.avgQuality * qualityWeight +
      normalizedCost * costWeight +
      normalizedDuration * speedWeight +
      normalizedToolCalls * efficiencyWeight * 0.5 +
      normalizedLLMCalls * efficiencyWeight * 0.5;

    return Math.max(0, Math.min(1, competence));
  }

  private calculateTrend(
    competence: SkillCompetence,
    newCompetence: number,
  ): "improving" | "stable" | "declining" {
    const threshold = 0.05;
    const delta = newCompetence - competence.competence;

    if (Math.abs(delta) < threshold) {
      return "stable";
    }

    return delta > 0 ? "improving" : "declining";
  }

  private calculateConfidence(totalExecutions: number): number {
    const minExecutions = this.config.minExecutionsForConfidence;
    const maxExecutions = 100;

    if (totalExecutions >= maxExecutions) {
      return 1.0;
    }

    if (totalExecutions < minExecutions) {
      return 0.1;
    }

    const normalized = (totalExecutions - minExecutions) /
      (maxExecutions - minExecutions);
    return 0.1 + 0.9 * normalized;
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

  detectAnomalies(skillId: string): boolean {
    const skillAnomalies = this.anomalies.get(skillId);
    if (!skillAnomalies || skillAnomalies.length === 0) {
      return false;
    }

    const latestAnomaly = skillAnomalies[skillAnomalies.length - 1];
    const timeSinceLastAnomaly = Date.now() - latestAnomaly.timestamp;

    return timeSinceLastAnomaly < 3600000 && latestAnomaly.score > this.config.anomalyThreshold;
  }

  getAnomalyScore(skillId: string): number {
    const skillAnomalies = this.anomalies.get(skillId);
    if (!skillAnomalies || skillAnomalies.length === 0) {
      return 0;
    }

    const latestAnomaly = skillAnomalies[skillAnomalies.length - 1];
    return latestAnomaly.score;
  }

  getLastAnomaly(skillId: string): { timestamp: number; reason: string } | undefined {
    const skillAnomalies = this.anomalies.get(skillId);
    if (!skillAnomalies || skillAnomalies.length === 0) {
      return undefined;
    }

    const latestAnomaly = skillAnomalies[skillAnomalies.length - 1];
    return {
      timestamp: latestAnomaly.timestamp,
      reason: latestAnomaly.reason,
    };
  }

  private checkForAnomalies(skillId: string): void {
    const competence = this.skills.get(skillId);

    if (!competence || competence.totalExecutions < 10) {
      return;
    }

    const recentTraces = competence.totalExecutions > 10
      ? competence.totalExecutions - 10
      : 0;

    if (recentTraces < 5) {
      return;
    }

    const expectedSuccessRate = competence.successRate;
    const expectedAvgCost = competence.avgCost;

    const currentSuccessRate = competence.successRate;
    const currentAvgCost = competence.avgCost;

    const successRateDeviation = Math.abs(currentSuccessRate - expectedSuccessRate);
    const costDeviation = Math.abs(currentAvgCost - expectedAvgCost) / (expectedAvgCost || 1);

    const deviationScore = successRateDeviation + costDeviation;

    if (deviationScore > this.config.anomalyThreshold) {
      const anomalies = this.anomalies.get(skillId) || [];

      anomalies.push({
        timestamp: Date.now(),
        score: deviationScore,
        reason: `Performance deviation: success rate ${successRateDeviation.toFixed(2)}, cost ${costDeviation.toFixed(2)}`,
      });

      this.anomalies.set(skillId, anomalies.slice(-10));
    }
  }

  getLearningMetrics(): LearningMetrics {
    const totalSkills = this.skills.size;

    if (totalSkills === 0) {
      return {
        totalTraces: 0,
        totalSkills: 0,
        avgCompetence: 0,
        avgConfidence: 0,
        learningRate: this.config.learningRate,
        convergenceRate: 0,
        routingAccuracy: 0,
        lastUpdateTime: Date.now(),
      };
    }

    const competences = Array.from(this.skills.values());
    const avgCompetence =
      competences.reduce((sum, c) => sum + c.competence, 0) /
      competences.length;

    const avgConfidence =
      competences.reduce((sum, c) => sum + c.confidence, 0) /
      competences.length;

    const highConfidenceSkills = competences.filter((c) => c.confidence > 0.8).length;
    const convergenceRate = totalSkills > 0 ? highConfidenceSkills / totalSkills : 0;

    return {
      totalTraces: competences.reduce((sum, c) => sum + c.totalExecutions, 0),
      totalSkills,
      avgCompetence,
      avgConfidence,
      learningRate: this.config.learningRate,
      convergenceRate,
      routingAccuracy: 0,
      lastUpdateTime: Date.now(),
    };
  }

  getConfig(): Required<TrackingConfig> {
    return { ...this.config };
  }

  updateConfig(config: Partial<TrackingConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
