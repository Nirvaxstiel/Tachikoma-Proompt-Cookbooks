import type {
  SkillExecutionTrace,
  ExecutionMetrics,
  SkillExecutionContext,
  TrackingConfig,
} from "./types";

export interface ActiveExecution {
  skillId: string;
  taskId: string;
  startTime: number;
  context?: SkillExecutionContext;
  metrics: Partial<ExecutionMetrics>;
}

export class SkillExecutionTracker {
  private config: Required<TrackingConfig>;
  private activeExecutions: Map<string, ActiveExecution>;
  private traces: SkillExecutionTrace[];
  private traceCache: Map<string, SkillExecutionTrace>;

  constructor(config?: Partial<TrackingConfig>) {
    this.config = { ...DEFAULT_TRACKING_CONFIG, ...config } as Required<TrackingConfig>;
    this.activeExecutions = new Map();
    this.traces = [];
    this.traceCache = new Map();
  }

  startExecution(
    skillId: string,
    taskId: string,
    context?: SkillExecutionContext,
  ): void {
    if (!this.config.enableTracking) {
      return;
    }

    const activeExecution: ActiveExecution = {
      skillId,
      taskId,
      startTime: Date.now(),
      context,
      metrics: {
        toolCalls: 0,
        llmCalls: 0,
        cost: 0,
        quality: 0,
        latency: 0,
      },
    };

    this.activeExecutions.set(taskId, activeExecution);
  }

  endExecution(
    taskId: string,
    result: { success: boolean; errorMessage?: string },
    metrics?: Partial<ExecutionMetrics>,
  ): SkillExecutionTrace | undefined {
    if (!this.config.enableTracking) {
      return undefined;
    }

    const activeExecution = this.activeExecutions.get(taskId);

    if (!activeExecution) {
      console.warn(`No active execution found for task ${taskId}`);
      return undefined;
    }

    const endTime = Date.now();
    const duration = endTime - activeExecution.startTime;

    const executionMetrics: ExecutionMetrics = {
      toolCalls: metrics?.toolCalls ?? activeExecution.metrics.toolCalls ?? 0,
      llmCalls: metrics?.llmCalls ?? activeExecution.metrics.llmCalls ?? 0,
      cost: metrics?.cost ?? activeExecution.metrics.cost ?? 0,
      quality: metrics?.quality ?? activeExecution.metrics.quality ?? 0.5,
      latency: duration,
      tokensUsed: metrics?.tokensUsed,
      outputLength: metrics?.outputLength,
      resourceUsage: metrics?.resourceUsage,
    };

    const trace: SkillExecutionTrace = {
      skillId: activeExecution.skillId,
      taskId,
      startTime: activeExecution.startTime,
      endTime,
      duration,
      success: result.success,
      errorMessage: result.errorMessage,
      metrics: executionMetrics,
      context: activeExecution.context,
    };

    this.traces.push(trace);

    this.activeExecutions.delete(taskId);

    this.traceCache.set(taskId, trace);

    this.trimHistory();

    return trace;
  }

  recordMetrics(taskId: string, metrics: Partial<ExecutionMetrics>): void {
    if (!this.config.enableTracking) {
      return;
    }

    const activeExecution = this.activeExecutions.get(taskId);

    if (!activeExecution) {
      console.warn(`No active execution found for task ${taskId}`);
      return;
    }

    activeExecution.metrics = {
      ...activeExecution.metrics,
      ...metrics,
    };
  }

  getExecutionTrace(taskId: string): SkillExecutionTrace | undefined {
    return this.traceCache.get(taskId);
  }

  getAllTraces(): SkillExecutionTrace[] {
    return [...this.traces];
  }

  getTracesForSkill(skillId: string): SkillExecutionTrace[] {
    return this.traces.filter((trace) => trace.skillId === skillId);
  }

  getRecentTraces(limit: number = 100): SkillExecutionTrace[] {
    return this.traces.slice(-limit);
  }

  getActiveExecutions(): Map<string, ActiveExecution> {
    return new Map(this.activeExecutions);
  }

  getTraceStatistics(): {
    totalTraces: number;
    bySkill: Map<string, number>;
    avgDuration: number;
    avgCost: number;
    successRate: number;
  } {
    if (this.traces.length === 0) {
      return {
        totalTraces: 0,
        bySkill: new Map(),
        avgDuration: 0,
        avgCost: 0,
        successRate: 0,
      };
    }

    const totalTraces = this.traces.length;

    const bySkill = new Map<string, number>();
    for (const trace of this.traces) {
      const count = bySkill.get(trace.skillId) || 0;
      bySkill.set(trace.skillId, count + 1);
    }

    const avgDuration =
      this.traces.reduce((sum, trace) => sum + trace.duration, 0) /
      this.traces.length;

    const avgCost =
      this.traces.reduce((sum, trace) => sum + trace.metrics.cost, 0) /
      this.traces.length;

    const successCount = this.traces.filter((trace) => trace.success).length;
    const successRate = successCount / this.traces.length;

    return {
      totalTraces,
      bySkill,
      avgDuration,
      avgCost,
      successRate,
    };
  }

  private trimHistory(): void {
    while (this.traces.length > this.config.maxHistorySize) {
      const removed = this.traces.shift();
      if (removed) {
        this.traceCache.delete(removed.taskId);
      }
    }
  }

  async saveTraces(filePath: string): Promise<void> {
    try {
      const data = JSON.stringify(this.traces, null, 2);
      await Bun.write(filePath, data);
    } catch (error) {
      console.error("Failed to save traces:", error);
      throw error;
    }
  }

  async loadTraces(filePath: string): Promise<void> {
    try {
      const data = await Bun.file(filePath).text();
      const loadedTraces = JSON.parse(data) as SkillExecutionTrace[];

      this.traces = loadedTraces;

      for (const trace of loadedTraces) {
        this.traceCache.set(trace.taskId, trace);
      }
    } catch (error) {
      console.error("Failed to load traces:", error);
      throw error;
    }
  }

  clearTraces(): void {
    this.traces = [];
    this.traceCache.clear();
  }

  clearActiveExecutions(): void {
    this.activeExecutions.clear();
  }

  getConfig(): Required<TrackingConfig> {
    return { ...this.config };
  }

  updateConfig(config: Partial<TrackingConfig>): void {
    const validation = validateTrackingConfig(config);

    if (!validation.valid) {
      throw new Error(`Invalid tracking config: ${validation.errors.join(", ")}`);
    }

    this.config = { ...this.config, ...config };
  }

  reset(): void {
    this.activeExecutions.clear();
    this.traces = [];
    this.traceCache.clear();
  }
}

import { DEFAULT_TRACKING_CONFIG, validateTrackingConfig } from "./tracking-config";
