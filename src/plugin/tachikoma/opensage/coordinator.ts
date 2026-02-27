import type {
  AgentSpec,
  AgentTopology,
  HorizontalEnsemble,
  VerticalDecomposition,
} from "../../../types/opensage";
import { AgentRegistry } from "./agent-registry";

export interface OpenSageConfig {
  worktree: string;
  enableMemory: boolean;
  enableTools: boolean;
  enableAgents: boolean;
  maxAgents: number;
  maxTools: number;
}

export interface ExecutionPlan {
  type: "vertical" | "horizontal" | "single";
  topology?: AgentTopology;
  agents: AgentSpec[];
  estimatedCost: number;
  estimatedLatency: number;
}

export interface ExecutionResult {
  success: boolean;
  results: any[];
  metrics: {
    agentsUsed: string[];
    totalCost: number;
    totalTime: number;
    toolsGenerated: number;
    knowledgeStored: number;
  };
  errors?: string[];
}

export class OpensageCoordinator {
  private registry: AgentRegistry;
  private config: OpenSageConfig;
  private sessionHistory: Map<string, any[]>;

  constructor(config: Partial<OpenSageConfig> = {}) {
    this.config = {
      worktree: config.worktree || process.cwd(),
      enableMemory: config.enableMemory ?? true,
      enableTools: config.enableTools ?? true,
      enableAgents: config.enableAgents ?? true,
      maxAgents: config.maxAgents ?? 10,
      maxTools: config.maxTools ?? 20,
      ...config,
    };

    this.sessionHistory = new Map();
  }

  async initialize(): Promise<void> {
    this.registry = await AgentRegistry.create(this.config.worktree);
  }

  async planExecution(
    task: string,
    options: {
      forceVertical?: boolean;
      forceHorizontal?: boolean;
      enableEnsemble?: boolean;
      agentLimit?: number;
    } = {},
  ): Promise<ExecutionPlan> {
    const taskComplexity = await this.analyzeComplexity(task);

    if (options.forceVertical || taskComplexity.isMultiStep) {
      return this.planVertical(task, options.agentLimit);
    }

    if (options.forceHorizontal || options.enableEnsemble || taskComplexity.hasAlternatives) {
      return this.planHorizontal(task, options.agentLimit);
    }

    return this.planSingle(task);
  }

  async executePlan(plan: ExecutionPlan, context: any): Promise<ExecutionResult> {
    const startTime = Date.now();
    const results: any[] = [];
    const errors: string[] = [];
    const agentsUsed = new Set<string>();

    try {
      switch (plan.type) {
        case "vertical":
          const verticalResult = await this.executeVertical(plan, context);
          results.push(...verticalResult.results);
          errors.push(...verticalResult.errors);
          verticalResult.agentsUsed.forEach((a) => agentsUsed.add(a));
          break;

        case "horizontal":
          const horizontalResult = await this.executeHorizontal(plan, context);
          results.push(...horizontalResult.results);
          errors.push(...horizontalResult.errors);
          horizontalResult.agentsUsed.forEach((a) => agentsUsed.add(a));
          break;

        case "single":
          const singleResult = await this.executeSingle(plan, context);
          results.push(singleResult.result);
          if (singleResult.error) errors.push(singleResult.error);
          agentsUsed.add(plan.agents[0].name);
          break;
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    const totalTime = Date.now() - startTime;
    const totalCost = this.calculateCost(results);

    return {
      success: errors.length === 0,
      results,
      metrics: {
        agentsUsed: Array.from(agentsUsed),
        totalCost,
        totalTime,
        toolsGenerated: 0,
        knowledgeStored: 0,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async analyzeComplexity(task: string): Promise<{
    isMultiStep: boolean;
    hasAlternatives: boolean;
    confidence: number;
  }> {
    const keywords = {
      multiStep: [
        "implement",
        "build",
        "create",
        "develop",
        "design",
        "refactor",
        "migrate",
        "optimize",
        "multi-step",
        "then",
        "after",
        "following",
        "next",
        "subtask",
      ],
      alternatives: [
        "explore",
        "compare",
        "alternative",
        "different approach",
        "multiple ways",
        "ensemble",
        "parallel",
        "several options",
        "best approach",
        "optimize",
        "improve",
      ],
    };

    const taskLower = task.toLowerCase();
    const hasMultiStepKeywords = keywords.multiStep.some((k) => taskLower.includes(k));
    const hasAlternativeKeywords = keywords.alternatives.some((k) => taskLower.includes(k));

    const isMultiStep = hasMultiStepKeywords || task.length > 100;
    const hasAlternatives = hasAlternativeKeywords || taskLower.includes(" or ");

    const confidence = Math.min(0.5 + (isMultiStep ? 0.3 : 0) + (hasAlternatives ? 0.2 : 0), 1.0);

    return { isMultiStep, hasAlternatives, confidence };
  }

  private async planVertical(task: string, limit?: number): Promise<ExecutionPlan> {
    const subtasks = await this.decomposeTask(task, limit || 3);

    const agents: AgentSpec[] = await Promise.all(
      subtasks.map((subtask) => this.createAgentSpec(subtask, "subagent")),
    );

    const topology: VerticalDecomposition = {
      task,
      subtasks,
      agents,
      executionOrder: "sequential",
      strategy: "vertical_decomposition",
    };

    return {
      type: "vertical",
      topology,
      agents,
      estimatedCost: this.estimateCost(agents.length, 10),
      estimatedLatency: this.estimateLatency(agents.length, 5000),
    };
  }

  private async planHorizontal(task: string, limit?: number): Promise<ExecutionPlan> {
    const strategies = await this.generateStrategies(task, limit || 3);

    const members = await Promise.all(
      strategies.map((strategy) =>
        this.createAgentSpec(`${task} using ${strategy} approach`, "subagent"),
      ),
    );

    const coordinator = await this.createAgentSpec(
      "Coordinate ensemble results and select best solution",
      "primary",
    );

    const topology: HorizontalEnsemble = {
      task,
      strategies,
      ensembleMembers: members,
      coordinator,
      executionMode: "parallel",
      mergeStrategy: "consensus",
    };

    return {
      type: "horizontal",
      topology,
      agents: [coordinator, ...members],
      estimatedCost: this.estimateCost(members.length + 1, 8000),
      estimatedLatency: this.estimateLatency(members.length + 1, 3000),
    };
  }

  private planSingle(task: string): ExecutionPlan {
    const agent: AgentSpec = {
      name: `task-${Date.now()}`,
      description: `Agent for: ${task.substring(0, 50)}`,
      mode: "subagent",
      prompt: `You are a specialized agent. Complete this task: ${task}`,
    };

    return {
      type: "single",
      agents: [agent],
      estimatedCost: this.estimateCost(1, 5000),
      estimatedLatency: this.estimateLatency(1, 10000),
    };
  }

  private async executeVertical(
    plan: ExecutionPlan,
    context: any,
  ): Promise<{
    results: any[];
    errors: string[];
    agentsUsed: string[];
  }> {
    const results: any[] = [];
    const errors: string[] = [];
    const agentsUsed: string[] = [];

    const topology = plan.topology as VerticalDecomposition;

    let accumulatedContext: any = { ...context };

    for (let i = 0; i < topology.agents.length; i++) {
      const agent = topology.agents[i];
      const subtask = topology.subtasks[i];

      agentsUsed.push(agent.name);

      const record = await this.executeAgent(agent, subtask, accumulatedContext);

      if (record.success) {
        results.push(record.result);
        accumulatedContext = {
          ...accumulatedContext,
          [agent.name]: record.result,
        };
      } else {
        errors.push(`Agent ${agent.name} failed: ${record.error}`);
        break;
      }
    }

    return { results, errors, agentsUsed };
  }

  private async executeHorizontal(
    plan: ExecutionPlan,
    context: any,
  ): Promise<{
    results: any[];
    errors: string[];
    agentsUsed: string[];
  }> {
    const topology = plan.topology as HorizontalEnsemble;
    const results: any[] = [];
    const errors: string[] = [];
    const agentsUsed: string[] = [];

    const memberResults = await Promise.all(
      topology.ensembleMembers.map((agent) =>
        this.executeAgent(agent, topology.task, context).then((record) => ({
          agent: agent.name,
          ...record,
        })),
      ),
    );

    topology.ensembleMembers.forEach((agent) => agentsUsed.push(agent.name));

    const successfulResults = memberResults.filter((r) => r.success);
    const failedResults = memberResults.filter((r) => !r.success);

    failedResults.forEach((r) => {
      errors.push(`Agent ${r.agent} failed: ${r.error}`);
    });

    if (successfulResults.length === 0) {
      return { results: [], errors, agentsUsed };
    }

    const coordinatorResult = await this.executeAgent(
      topology.coordinator,
      `Merge these results: ${JSON.stringify(successfulResults.map((r) => ({ agent: r.agent, result: r.result })))}`,
      context,
    );

    agentsUsed.push(topology.coordinator.name);

    if (coordinatorResult.success) {
      results.push(...successfulResults.map((r) => r.result), coordinatorResult.result);
    } else {
      errors.push(`Coordinator failed: ${coordinatorResult.error}`);
    }

    return { results, errors, agentsUsed };
  }

  private async executeSingle(
    plan: ExecutionPlan,
    context: any,
  ): Promise<{
    result: any;
    error?: string;
  }> {
    const agent = plan.agents[0];
    const record = await this.executeAgent(agent, plan.topology?.task || "Execute task", context);

    return record.success
      ? { result: record.result || "Completed successfully" }
      : { error: record.error };
  }

  private async executeAgent(
    agent: AgentSpec,
    task: string,
    context: any,
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const result = await this.invokeAgentTool(agent.name, task, context);
      const latency = Date.now() - startTime;

      await this.registry.recordSuccess(
        agent.name,
        this.inferTaskType(task),
        this.estimateAgentCost(latency),
        latency,
      );

      return { success: true, result };
    } catch (error) {
      const latency = Date.now() - startTime;
      await this.registry.recordFailure(
        agent.name,
        this.inferTaskType(task),
        error instanceof Error ? error.message : String(error),
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async invokeAgentTool(agentName: string, task: string, context: any): Promise<any> {
    return {
      success: true,
      result: `Agent ${agentName} would execute: ${task}`,
      context,
    };
  }

  private async decomposeTask(task: string, limit: number): Promise<string[]> {
    return [
      `${task} - Phase 1: Analysis`,
      `${task} - Phase 2: Implementation`,
      `${task} - Phase 3: Testing`,
    ].slice(0, limit);
  }

  private async generateStrategies(task: string, limit: number): Promise<string[]> {
    return ["Aggressive optimization", "Conservative approach", "Balanced solution"].slice(
      0,
      limit,
    );
  }

  private async createAgentSpec(task: string, mode: "primary" | "subagent"): Promise<AgentSpec> {
    return {
      name: task.toLowerCase().replace(/\W+/g, "-"),
      description: `Specialized agent for: ${task}`,
      mode,
      prompt: `You are a specialized agent focused on: ${task}
\n- Analyze the task thoroughly
- Apply domain-specific knowledge
- Provide detailed, actionable output
- Handle edge cases explicitly`,
    };
  }

  private inferTaskType(task: string): string {
    const taskLower = task.toLowerCase();

    if (taskLower.includes("test") || taskLower.includes("verify")) {
      return "testing";
    }
    if (taskLower.includes("optimize") || taskLower.includes("improve")) {
      return "optimization";
    }
    if (taskLower.includes("implement") || taskLower.includes("create")) {
      return "implementation";
    }
    if (taskLower.includes("review") || taskLower.includes("audit")) {
      return "review";
    }
    if (taskLower.includes("design") || taskLower.includes("plan")) {
      return "design";
    }

    return "general";
  }

  private estimateCost(agentCount: number, baseCost: number): number {
    return agentCount * baseCost;
  }

  private estimateLatency(agentCount: number, baseLatency: number): number {
    return agentCount * baseLatency;
  }

  private estimateAgentCost(latency: number): number {
    return latency * 0.001;
  }

  private calculateCost(results: any[]): number {
    return results.length * 0.01;
  }

  async getSessionMetrics(sessionId: string): Promise<any> {
    return this.sessionHistory.get(sessionId) || {};
  }

  async getSessionSummary(sessionId: string): Promise<string> {
    const metrics = await this.getSessionMetrics(sessionId);
    return JSON.stringify(metrics, null, 2);
  }

  getRegistry(): AgentRegistry {
    return this.registry;
  }

  getConfig(): OpenSageConfig {
    return { ...this.config };
  }
}
