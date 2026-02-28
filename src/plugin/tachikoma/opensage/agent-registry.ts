import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type { AgentMetrics, PerformanceStats, TaskRecord } from "../../types/opensage";

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

const METRICS_SCHEMA = z.object({
  agents: z.array(
    z.object({
      name: z.string(),
      taskType: z.string(),
      successCount: z.number(),
      failureCount: z.number(),
      totalCost: z.number(),
      avgLatency: z.number(),
      lastUsed: z.string(),
    }),
  ),
  tasks: z.array(
    z.object({
      taskId: z.string(),
      agentName: z.string(),
      taskType: z.string(),
      timestamp: z.number(),
      duration: z.number(),
      cost: z.number(),
      success: z.boolean(),
      context: z.record(z.string(), z.any()).optional(),
    }),
  ),
});

type MetricsData = z.infer<typeof METRICS_SCHEMA>;

export class AgentRegistry {
  private metricsFile: string;
  private data: MetricsData;

  constructor(worktree: string, initialData?: MetricsData) {
    this.metricsFile = join(worktree, ".opencode", "agent-metrics.json");
    this.data = initialData || { agents: [], tasks: [] };
  }

  static async create(worktree: string): Promise<AgentRegistry> {
    const metricsFile = join(worktree, ".opencode", "agent-metrics.json");
    const file = Bun.file(metricsFile);

    if (!file.exists()) {
      return new AgentRegistry(worktree, { agents: [], tasks: [] });
    }

    try {
      const content = await file.text();
      const data = METRICS_SCHEMA.parse(JSON.parse(content));
      return new AgentRegistry(worktree, data);
    } catch (error) {
      console.error("Failed to load metrics, using empty state", error);
      return new AgentRegistry(worktree, { agents: [], tasks: [] });
    }
  }

  async loadMetrics(): Promise<MetricsData> {
    const file = Bun.file(this.metricsFile);
    if (!file.exists()) {
      return { agents: [], tasks: [] };
    }
    try {
      const content = await file.text();
      return METRICS_SCHEMA.parse(JSON.parse(content));
    } catch (error) {
      console.error("Failed to load metrics, using empty state", error);
      return { agents: [], tasks: [] };
    }
  }

  async saveMetrics(): Promise<void> {
    await ensureDir(join(this.metricsFile, ".."));
    await writeFile(this.metricsFile, JSON.stringify(this.data, null, 2));
  }

  async recordSuccess(
    agentName: string,
    taskType: string,
    cost: number,
    latency: number,
    taskId?: string,
  ): Promise<void> {
    const agent = this.data.agents.find((a) => a.name === agentName && a.taskType === taskType);

    if (agent) {
      agent.successCount++;
      agent.totalCost += cost;
      agent.avgLatency =
        (agent.avgLatency * (agent.successCount - 1) + latency) / agent.successCount;
      agent.lastUsed = new Date().toISOString();
    } else {
      this.data.agents.push({
        name: agentName,
        taskType,
        successCount: 1,
        failureCount: 0,
        totalCost: cost,
        avgLatency: latency,
        lastUsed: new Date().toISOString(),
      });
    }

    if (taskId) {
      this.data.tasks.push({
        taskId,
        agentName,
        taskType,
        timestamp: Date.now(),
        duration: latency,
        cost,
        success: true,
      });
    }

    await this.saveMetrics();
  }

  async recordFailure(
    agentName: string,
    taskType: string,
    error: string,
    taskId?: string,
  ): Promise<void> {
    const agent = this.data.agents.find((a) => a.name === agentName && a.taskType === taskType);

    if (agent) {
      agent.failureCount++;
      agent.lastUsed = new Date().toISOString();
    } else {
      this.data.agents.push({
        name: agentName,
        taskType,
        successCount: 0,
        failureCount: 1,
        totalCost: 0,
        avgLatency: 0,
        lastUsed: new Date().toISOString(),
      });
    }

    if (taskId) {
      this.data.tasks.push({
        taskId,
        agentName,
        taskType,
        timestamp: Date.now(),
        duration: 0,
        cost: 0,
        success: false,
        context: { error },
      });
    }

    await this.saveMetrics();
  }

  async recordTask(record: TaskRecord): Promise<void> {
    this.data.tasks.push(record);

    const agent = this.data.agents.find(
      (a) => a.name === record.agentName && a.taskType === record.taskType,
    );

    if (record.success) {
      await this.recordSuccess(record.agentName, record.taskType, record.cost, record.duration);
    } else {
      await this.recordFailure(
        record.agentName,
        record.taskType,
        record.context?.error || "Unknown error",
        record.taskId,
      );
    }
  }

  getStats(agentName: string, taskType: string): PerformanceStats | null {
    const agent = this.data.agents.find((a) => a.name === agentName && a.taskType === taskType);

    if (!agent) return null;

    const totalTasks = agent.successCount + agent.failureCount;
    return {
      successRate: totalTasks > 0 ? agent.successCount / totalTasks : 0,
      avgCost: totalTasks > 0 ? agent.totalCost / totalTasks : 0,
      avgLatency: agent.avgLatency,
      totalTasks,
    };
  }

  recommendAgent(taskType: string, criteria: "success" | "cost" | "latency"): string | null {
    const candidates = this.data.agents.filter((a) => a.taskType === taskType);

    if (candidates.length === 0) return null;

    const stats = candidates.map((agent) => ({
      agent,
      stats: this.getStats(agent.name, taskType)!,
    }));

    const best = stats.sort((a, b) => {
      switch (criteria) {
        case "success":
          return b.stats.successRate - a.stats.successRate;
        case "cost":
          return a.stats.avgCost - b.stats.avgCost;
        case "latency":
          return a.stats.avgLatency - b.stats.avgLatency;
      }
    })[0];

    return best.agent.name;
  }

  getTaskHistory(agentName: string, limit = 10): TaskRecord[] {
    return this.data.tasks
      .filter((t) => t.agentName === agentName)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getAllAgents(): AgentMetrics[] {
    return this.data.agents;
  }

  async clearMetrics(agentName?: string): Promise<void> {
    if (agentName) {
      this.data.agents = this.data.agents.filter((a) => a.name !== agentName);
    } else {
      this.data.agents = [];
      this.data.tasks = [];
    }
    await this.saveMetrics();
  }
}
