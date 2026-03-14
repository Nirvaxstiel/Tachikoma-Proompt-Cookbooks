import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  TrackingConfig,
  RoutingConfig,
  LearningMetrics,
} from "./types";
import { DEFAULT_TRACKING_CONFIG, DEFAULT_ROUTING_CONFIG } from "./tracking-config";
import { SkillExecutionTracker } from "./execution-tracker";
import { CompetenceModelBuilder } from "./competence-model";
import { AdaptiveSkillRouter } from "./adaptive-router";

export interface SkillTrackingManagerConfig {
  worktree: string;
  tracking?: Partial<TrackingConfig>;
  routing?: Partial<RoutingConfig>;
}

export class SkillTrackingManager {
  private tracker: SkillExecutionTracker;
  private competenceModel: CompetenceModelBuilder;
  private router: AdaptiveSkillRouter;
  private worktree: string;
  private initialized: boolean;
  private metricsFile: string;
  private metrics: {
    startTime: number;
    totalExecutions: number;
    learningRate: number;
    routingAccuracy: number;
    lastUpdateTime: number;
  };

  constructor(config: SkillTrackingManagerConfig) {
    this.worktree = config.worktree;

    const tracker = new SkillExecutionTracker(config.tracking);
    const competenceModel = new CompetenceModelBuilder(config.tracking);
    const router = new AdaptiveSkillRouter(competenceModel, config.routing);

    this.tracker = tracker;
    this.competenceModel = competenceModel;
    this.router = router;
    this.metricsFile = join(this.worktree, ".opencode", "skill-learning-metrics.json");
    this.initialized = false;

    this.metrics = {
      startTime: Date.now(),
      totalExecutions: 0,
      learningRate: this.tracker.getConfig().learningRate,
      routingAccuracy: 0,
      lastUpdateTime: Date.now(),
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log("Initializing SkillTrackingManager...");

    await ensureDir(join(this.worktree, ".opencode"));

    await this.loadMetrics();

    this.initialized = true;

    console.log("SkillTrackingManager initialized successfully");
  }

  async destroy(): Promise<void> {
    console.log("Destroying SkillTrackingManager...");

    await this.saveMetrics();

    this.tracker.reset();
    this.competenceModel.reset();
    this.router.reset();

    this.initialized = false;

    console.log("SkillTrackingManager destroyed");
  }

  async trackSkillExecution(
    skillId: string,
    taskId: string,
    context: {
      taskType: string;
      complexity: "low" | "medium" | "high" | "unknown";
      domain?: string;
    },
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error("SkillTrackingManager not initialized");
    }

    this.tracker.startExecution(skillId, taskId, {
      taskType: context.taskType,
      complexity: context.complexity,
      domain: context.domain,
    });

    this.metrics.totalExecutions++;
  }

  async completeSkillExecution(
    taskId: string,
    result: {
      success: boolean;
      errorMessage?: string;
    },
    metrics?: {
      toolCalls?: number;
      llmCalls?: number;
      cost?: number;
      quality?: number;
      latency?: number;
    },
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error("SkillTrackingManager not initialized");
    }

    const trace = this.tracker.endExecution(
      taskId,
      result,
      metrics,
    );

    if (trace) {
      this.competenceModel.updateCompetence(trace.skillId, trace);

      await this.saveMetrics();
    }
  }

  async routeTask(
    task: string,
    context: {
      taskType: string;
      complexity: "low" | "medium" | "high" | "unknown";
      domain?: string;
    },
    availableSkills: string[],
  ): Promise<{
    skillId: string;
    confidence: number;
    reason: string;
    alternativeSkills: Array<{ skillId: string; confidence: number }>;
  }> {
    if (!this.initialized) {
      throw new Error("SkillTrackingManager not initialized");
    }

    const decision = await this.router.routeTask(task, context, availableSkills);

    return {
      skillId: decision.skillId,
      confidence: decision.confidence,
      reason: decision.reason,
      alternativeSkills: decision.alternativeSkills.map((alt) => ({
        skillId: alt.skillId,
        confidence: alt.confidence,
      })),
    };
  }

  getExecutionTracker(): SkillExecutionTracker {
    return this.tracker;
  }

  getCompetenceModel(): CompetenceModelBuilder {
    return this.competenceModel;
  }

  getRouter(): AdaptiveSkillRouter {
    return this.router;
  }

  getTrackingConfig(): Required<TrackingConfig> {
    return this.tracker.getConfig();
  }

  getRoutingConfig(): Required<RoutingConfig> {
    return this.router.getConfig();
  }

  async updateTrackingConfig(config: Partial<TrackingConfig>): Promise<void> {
    this.tracker.updateConfig(config);
    this.metrics.learningRate = this.tracker.getConfig().learningRate;

    await this.saveMetrics();
  }

  async updateRoutingConfig(config: Partial<RoutingConfig>): Promise<void> {
    this.router.updateConfig(config);

    await this.saveMetrics();
  }

  getStatistics(): LearningMetrics {
    const learningStats = this.competenceModel.getLearningMetrics();
    const routingStats = this.router.getRoutingStats();

    const routingAccuracy = this.calculateRoutingAccuracy();

    return {
      ...learningStats,
      routingAccuracy,
      lastUpdateTime: Date.now(),
    };
  }

  getAllCompetences() {
    return this.competenceModel.getAllCompetences();
  }

  getSkillCompetence(skillId: string) {
    return this.competenceModel.getCompetence(skillId);
  }

  getTopCompetentSkills(
    task: {
      taskType: string;
      complexity: "low" | "medium" | "high" | "unknown";
      domain?: string;
    },
    limit: number,
  ): string[] {
    const skillIds = this.competenceModel.getTopCompetentSkills(task, limit);

    return skillIds;
  }

  async exportCompetenceModels(filePath: string): Promise<void> {
    const data = this.competenceModel.export();
    await writeFile(filePath, data);
  }

  async exportExecutionTraces(filePath: string): Promise<void> {
    const traces = this.tracker.getAllTraces();
    const data = JSON.stringify(traces, null, 2);
    await writeFile(filePath, data);
  }

  async saveMetrics(): Promise<void> {
    const metrics = {
      trackingConfig: this.tracker.getConfig(),
      routingConfig: this.router.getConfig(),
      statistics: this.getStatistics(),
      timestamp: Date.now(),
    };

    await ensureDir(join(this.metricsFile, ".."));
    await writeFile(this.metricsFile, JSON.stringify(metrics, null, 2));

    this.metrics.lastUpdateTime = Date.now();
  }

  private async loadMetrics(): Promise<void> {
    try {
      const file = Bun.file(this.metricsFile);

      if (!file.exists()) {
        console.log("No existing metrics file, starting fresh");
        return;
      }

      const content = await file.text();
      const data = JSON.parse(content);

      if (data.statistics) {
        this.metrics = {
          ...this.metrics,
          ...data.statistics,
        };
      }

      if (data.trackingConfig) {
        this.tracker.updateConfig(data.trackingConfig);
      }

      if (data.routingConfig) {
        this.router.updateConfig(data.routingConfig);
      }

      console.log("Loaded previous metrics:", data);
    } catch (error) {
      console.error("Failed to load metrics:", error);
      console.log("Starting with fresh metrics");
    }
  }

  private calculateRoutingAccuracy(): number {
    const routingStats = this.router.getRoutingStats();
    const learningStats = this.competenceModel.getLearningMetrics();

    if (routingStats.totalRoutings === 0) {
      return 0;
    }

    const avgConfidence = routingStats.avgConfidence;
    const convergenceRate = learningStats.convergenceRate;

    const accuracy = avgConfidence * 0.7 + convergenceRate * 0.3;

    return Math.max(0, Math.min(1, accuracy));
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  reset(): void {
    this.tracker.reset();
    this.competenceModel.reset();
    this.router.reset();

    this.metrics = {
      startTime: Date.now(),
      totalExecutions: 0,
      learningRate: this.tracker.getConfig().learningRate,
      routingAccuracy: 0,
      lastUpdateTime: Date.now(),
    };
  }

  async exportFullState(exportDir: string): Promise<{
    tracking: string;
    competence: string;
    routing: string;
    metrics: string;
  }> {
    await ensureDir(exportDir);

    const trackingFile = join(exportDir, "execution-traces.json");
    const competenceFile = join(exportDir, "competence-models.json");
    const routingFile = join(exportDir, "routing-decisions.json");
    const metricsFile = join(exportDir, "learning-metrics.json");

    const trackingData = await this.tracker.getAllTraces();
    const competenceData = this.competenceModel.getAllCompetences();
    const routingDecisions = this.router.getRoutingStats();
    const learningMetrics = this.getStatistics();

    await Promise.all([
      writeFile(trackingFile, JSON.stringify(trackingData, null, 2)),
      writeFile(competenceFile, JSON.stringify(Array.from(competenceData.entries()), null, 2)),
      writeFile(routingFile, JSON.stringify(routingDecisions, null, 2)),
      writeFile(metricsFile, JSON.stringify(learningMetrics, null, 2)),
    ]);

    return {
      tracking: trackingFile,
      competence: competenceFile,
      routing: routingFile,
      metrics: metricsFile,
    };
  }
}

async function ensureDir(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "EEXIST") {
      throw error;
    }
  }
}

let trackingManager: SkillTrackingManager | null = null;

export async function createSkillTrackingManager(
  config: SkillTrackingManagerConfig,
): Promise<SkillTrackingManager> {
  if (trackingManager === null) {
    trackingManager = new SkillTrackingManager(config);
    await trackingManager.initialize();
  }

  return trackingManager;
}

export function getSkillTrackingManager(): SkillTrackingManager | null {
  return trackingManager;
}

export async function destroySkillTrackingManager(): Promise<void> {
  if (trackingManager !== null) {
    await trackingManager.destroy();
    trackingManager = null;
  }
}
