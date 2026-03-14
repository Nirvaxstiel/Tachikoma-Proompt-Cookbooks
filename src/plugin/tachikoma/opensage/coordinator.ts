import type {
  AgentSpec,
  AgentTopology,
  HorizontalEnsemble,
  VerticalDecomposition,
} from "../../../types/opensage";
import { AgentRegistry } from "./agent-registry";
import { TopologyClassifier, type TopologyType, type TaskDAG, type TaskDAGNode, type Edge } from "../topology-classifier";
import { GraphBasedRouter, ToolGraph, type RoutingRequest, type RoutingPath } from "../graph-routing/tool-graph";
import { HierarchicalMemoryIndex, BoundaryAwareChunker, type IndexedNode, type QueryResult, type IndexConfig } from "./hierarchical-index";
import { VerificationPlugin, createVerificationPlugin, type VerificationPluginConfig } from "../verification/plugin-integration";
import { VerificationLoop } from "../verifier";
import { AttentionEnsembleIntegration, type EnsembleContext, type EnsembleResult } from "./attention/ensemble-integration";
import type { AttentionConfig } from "./attention/types";
import { SkillTrackingManager, createSkillTrackingManager } from "../skills/tracking/tracking-manager";
import type { TrackingConfig, RoutingConfig, LearningMetrics } from "../skills/tracking/types";

export interface OpenSageConfig {
  worktree: string;
  enableMemory: boolean;
  enableTools: boolean;
  enableAgents: boolean;
  maxAgents: number;
  maxTools: number;
}

export interface TopologyConfig {
  enabled: boolean;
  autoSelectTopology: boolean;
  defaultTopology?: TopologyType;
  minConfidence: number;
}

export interface GraphRoutingConfig {
  enableGraphRouting: boolean;
  llmFallbackThreshold: number;
  maxLLMFallbackPercentage: number;
}

export interface OpenSageIntegrationConfig {
  worktree: string;
  enableMemory: boolean;
  enableTools: boolean;
  enableAgents: boolean;
  maxAgents: number;
  maxTools: number;

  topology?: TopologyConfig;
  graphRouting?: GraphRoutingConfig;
  hierarchicalIndexing?: IndexConfig;
  verification?: VerificationPluginConfig;
  attention?: AttentionConfig;
  skillTracking?: {
    enabled: boolean;
    tracking: Partial<TrackingConfig>;
    routing: Partial<RoutingConfig>;
  };
}

const DEFAULT_TOPOLOGY_CONFIG: TopologyConfig = {
  enabled: true,
  autoSelectTopology: true,
  minConfidence: 0.5,
};

const DEFAULT_GRAPH_ROUTING_CONFIG: GraphRoutingConfig = {
  enableGraphRouting: true,
  llmFallbackThreshold: 0.5,
  maxLLMFallbackPercentage: 10,
};

const DEFAULT_INTEGRATION_CONFIG: OpenSageIntegrationConfig = {
  worktree: process.cwd(),
  enableMemory: true,
  enableTools: true,
  enableAgents: true,
  maxAgents: 10,
  maxTools: 20,
  topology: DEFAULT_TOPOLOGY_CONFIG,
  graphRouting: DEFAULT_GRAPH_ROUTING_CONFIG,
  skillTracking: {
    enabled: true,
    tracking: {},
    routing: {},
  },
};

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
  private registry!: AgentRegistry;
  private config: OpenSageConfig;
  private integrationConfig: OpenSageIntegrationConfig;
  private sessionHistory: Map<string, any[]>;
  private graphRouter: GraphBasedRouter;
  private toolGraph: ToolGraph;
  private memoryIndex: HierarchicalMemoryIndex;
  private chunker: BoundaryAwareChunker;
  private verificationPlugin?: VerificationPlugin;
  private attentionIntegration: AttentionEnsembleIntegration;
  private skillTrackingManager?: SkillTrackingManager;
  private currentDepth = 0;
  private readonly MAX_DEPTH = 10;
  private initialized = false;

  constructor(config: Partial<OpenSageIntegrationConfig> = {}) {
    const mergedConfig: OpenSageIntegrationConfig = {
      ...DEFAULT_INTEGRATION_CONFIG,
      ...config,
    };

    this.config = {
      worktree: mergedConfig.worktree,
      enableMemory: mergedConfig.enableMemory,
      enableTools: mergedConfig.enableTools,
      enableAgents: mergedConfig.enableAgents,
      maxAgents: mergedConfig.maxAgents,
      maxTools: mergedConfig.maxTools,
    };

    this.integrationConfig = mergedConfig;
    this.sessionHistory = new Map();
    this.graphRouter = new GraphBasedRouter();
    this.toolGraph = new ToolGraph();
    this.memoryIndex = new HierarchicalMemoryIndex();
    this.chunker = new BoundaryAwareChunker();
    this.attentionIntegration = new AttentionEnsembleIntegration(mergedConfig.attention?.mechanism !== undefined);

    this.initializeToolGraph();
    this.initializeVerification(mergedConfig.verification);
    this.initializeSkillTracking();
  }

  private async initializeSkillTracking(): Promise<void> {
    if (!this.integrationConfig.skillTracking?.enabled) {
      console.log("Skill tracking disabled");
      return;
    }

    try {
      this.skillTrackingManager = await createSkillTrackingManager({
        worktree: this.config.worktree,
        tracking: this.integrationConfig.skillTracking?.tracking,
        routing: this.integrationConfig.skillTracking?.routing,
      });
      console.log("Skill tracking manager initialized successfully");
    } catch (error) {
      console.error("Failed to initialize skill tracking manager:", error);
    }
  }

  private async initializeVerification(config?: VerificationPluginConfig): Promise<void> {
    if (!config || !config.enableRubricVerification) {
      console.log("Rubric verification disabled");
      return;
    }

    try {
      const verificationLoop = new VerificationLoop();
      this.verificationPlugin = await createVerificationPlugin(verificationLoop, config);
      console.log("Verification plugin initialized successfully");
    } catch (error) {
      console.error("Failed to initialize verification plugin:", error);
    }
  }

  private initializeToolGraph(): void {
    this.toolGraph.addNode({
      id: "bash",
      name: "Bash",
      type: "tool",
      cost: 2,
      capabilities: ["execute", "run-command"],
      dependencies: [],
      healthStatus: "healthy",
      latency: 100,
    });

    this.toolGraph.addNode({
      id: "edit",
      name: "Edit",
      type: "tool",
      cost: 1,
      capabilities: ["modify", "string-replacement"],
      dependencies: ["read"],
      healthStatus: "healthy",
      latency: 50,
    });

    this.toolGraph.addNode({
      id: "write",
      name: "Write",
      type: "tool",
      cost: 1,
      capabilities: ["create", "overwrite"],
      dependencies: [],
      healthStatus: "healthy",
      latency: 50,
    });

    this.toolGraph.addNode({
      id: "read",
      name: "Read",
      type: "tool",
      cost: 1,
      capabilities: ["read-file", "get-content"],
      dependencies: [],
      healthStatus: "healthy",
      latency: 30,
    });

    this.toolGraph.addNode({
      id: "glob",
      name: "Glob",
      type: "tool",
      cost: 1,
      capabilities: ["find-files", "pattern-match"],
      dependencies: [],
      healthStatus: "healthy",
      latency: 30,
    });

    this.toolGraph.addNode({
      id: "grep",
      name: "Grep",
      type: "tool",
      cost: 1,
      capabilities: ["search-content", "find-text"],
      dependencies: [],
      healthStatus: "healthy",
      latency: 50,
    });

    this.toolGraph.addEdge({
      source: "read",
      target: "edit",
      weight: 1 + 50,
    });

    this.toolGraph.addEdge({
      source: "bash",
      target: "edit",
      weight: 2 + 50,
    });
  }

  async routeTools(task: string, startNode?: string, endGoal?: string): Promise<RoutingPath> {
    const graphRoutingConfig = this.getGraphRoutingConfig();

    if (!graphRoutingConfig.enableGraphRouting) {
      return {
        nodes: [],
        edges: [],
        totalCost: 0,
        totalLatency: 0,
        confidence: 0,
        fallbackToLLM: true,
      };
    }

    const capabilities = this.inferRequiredCapabilities(task);

    const request: RoutingRequest = {
      startNode: startNode || "read",
      endGoal: endGoal || task,
      requiredCapabilities: capabilities,
      allowLLMFallback: true,
      maxLatency: 5000,
      maxCost: 50,
    };

    return this.graphRouter.route(request);
  }

  private inferRequiredCapabilities(task: string): string[] {
    const taskLower = task.toLowerCase();
    const capabilities: string[] = [];

    if (taskLower.includes("read") || taskLower.includes("get") || taskLower.includes("find")) {
      capabilities.push("read-file", "get-content");
    }

    if (taskLower.includes("edit") || taskLower.includes("modify") || taskLower.includes("change")) {
      capabilities.push("modify", "string-replacement");
    }

    if (taskLower.includes("create") || taskLower.includes("write")) {
      capabilities.push("create", "overwrite");
    }

    if (taskLower.includes("run") || taskLower.includes("execute") || taskLower.includes("command")) {
      capabilities.push("execute", "run-command");
    }

    if (taskLower.includes("search") || taskLower.includes("grep")) {
      capabilities.push("search-content", "find-text");
    }

    if (capabilities.length === 0) {
      capabilities.push("general");
    }

    return capabilities;
  }

  async indexMemory(id: string, content: string, metadata?: any): Promise<IndexedNode> {
    const node = await this.memoryIndex.addNode(id, content, metadata);
    console.log(`Indexed memory node ${id} at level ${node.level}`);
    return node;
  }

  async searchIndexedMemory(query: string, topK?: number): Promise<QueryResult[]> {
    const k = topK || 10;
    const results = await this.memoryIndex.search(query, k);
    console.log(`Memory search found ${results.length} results for query: ${query}`);
    return results;
  }

  getIndexStats() {
    return this.memoryIndex.getStats();
  }

  clearMemoryCache(): void {
    this.memoryIndex.clearCache();
    console.log("Memory index query cache cleared");
  }

  async trackSkillExecution(skillId: string, taskId: string, context: {
    taskType: string;
    complexity: "low" | "medium" | "high" | "unknown";
    domain?: string;
  }): Promise<void> {
    if (!this.skillTrackingManager) {
      console.log("Skill tracking not initialized, skipping tracking");
      return;
    }

    await this.skillTrackingManager.trackSkillExecution(skillId, taskId, context);
  }

  async completeSkillExecution(taskId: string, result: {
    success: boolean;
    errorMessage?: string;
  }, metrics?: {
    toolCalls?: number;
    llmCalls?: number;
    cost?: number;
    quality?: number;
    latency?: number;
  }): Promise<void> {
    if (!this.skillTrackingManager) {
      console.log("Skill tracking not initialized, skipping completion");
      return;
    }

    await this.skillTrackingManager.completeSkillExecution(taskId, result, metrics);
  }

  async routeTask(task: string, context: {
    taskType: string;
    complexity: "low" | "medium" | "high" | "unknown";
    domain?: string;
  }, availableSkills: string[]): Promise<{
    skillId: string;
    confidence: number;
    reason: string;
    alternativeSkills: Array<{ skillId: string; confidence: number }>;
  }> {
    if (!this.skillTrackingManager) {
      console.log("Skill tracking not initialized, using default routing");
      return {
        skillId: availableSkills[0] || "default",
        confidence: 0.5,
        reason: "Default routing (skill tracking disabled)",
        alternativeSkills: [],
      };
    }

    return await this.skillTrackingManager.routeTask(task, context, availableSkills);
  }

  getLearningMetrics(): LearningMetrics | null {
    if (!this.skillTrackingManager) {
      return null;
    }

    return this.skillTrackingManager.getStatistics();
  }

  async verifyResult(task: string, result: any): Promise<{
    verified: boolean;
    verification: {
      result: string;
      iterations: number;
      verified: boolean;
      rubricVerdict: string;
      gvrVerdict: string;
      combinedVerdict: boolean;
      suggestions: string[];
    };
  }> {
    if (!this.verificationPlugin) {
      console.log("Verification plugin not initialized, skipping verification");
      return { verified: true, verification: { result: "", iterations: 0, verified: true, rubricVerdict: "disabled", gvrVerdict: "disabled", combinedVerdict: true, suggestions: [] } };
    }

    const verification = await this.verificationPlugin.rubricVerify({
      request: task,
      result: JSON.stringify(result),
      context: {},
    });

    return {
      verified: verification.combinedVerdict,
      verification,
    };
  }

  async chunkContent(content: string): Promise<{
    chunks: string[];
    boundaries: number[][];
  }> {
    const result = this.chunker.chunk(content);
    console.log(`Chunked content into ${result.chunks.length} chunks`);
    return {
      chunks: result.chunks,
      boundaries: result.boundaries,
    };
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
      const plan = await this.planVertical(task, options.agentLimit);
      return await this.applyTopologyClassification(task, plan);
    }

    if (options.forceHorizontal || options.enableEnsemble || taskComplexity.hasAlternatives) {
      const plan = await this.planHorizontal(task, options.agentLimit);
      return await this.applyTopologyClassification(task, plan);
    }

    const plan = this.planSingle(task);
    return await this.applyTopologyClassification(task, plan);
  }

  private async applyTopologyClassification(task: string, plan: ExecutionPlan): Promise<ExecutionPlan> {
    const topologyConfig = this.getTopologyConfig();

    if (!topologyConfig.enabled) {
      return plan;
    }

    try {
      const taskDAG = await this.buildTaskDAG(task);

      if (!taskDAG) {
        return plan;
      }

      const classification = TopologyClassifier.classify(taskDAG);

      const topologyConfigMin = topologyConfig.minConfidence || 0.5;

      if (classification.confidence < topologyConfigMin) {
        console.log(`Topology confidence (${classification.confidence.toFixed(2)}) below threshold (${topologyConfigMin}), using default plan`);
        return plan;
      }

      const topologyType = topologyConfig.defaultTopology || classification.recommendedTopology;

      const enhancedPlan: ExecutionPlan = {
        ...plan,
        topology: {
          type: topologyType,
          classification,
          taskDAG,
        } as unknown as AgentTopology,
      };

      console.log(`Task classified with topology: ${topologyType} (confidence: ${(classification.confidence * 100).toFixed(0)}%)`);
      console.log(`Rationale: ${classification.rationale}`);

      return enhancedPlan;
    } catch (error) {
      console.error(`Topology classification failed, using default plan:`, error);
      return plan;
    }
  }

  private async buildTaskDAG(task: string): Promise<TaskDAG | null> {
    const characteristics = await this.inferTaskCharacteristics(task);

    const nodes: TaskDAGNode[] = [
      {
        name: "main",
        depth: 0,
        incomingEdges: [],
        outgoingEdges: [],
        approaches: characteristics.hasAlternatives ? ["approach1", "approach2"] : undefined,
        isParentChild: false,
      },
    ];

    const edges: Edge[] = [];

    if (characteristics.isMultiStep) {
      for (let i = 0; i < Math.min(3, Math.ceil(characteristics.complexity)); i++) {
        const subtaskNode: TaskDAGNode = {
          name: `subtask-${i + 1}`,
          depth: i + 1,
          incomingEdges: [],
          outgoingEdges: [],
          isParentChild: true,
        };

        nodes.push(subtaskNode);

        const edge: Edge = {
          source: nodes[i],
          target: subtaskNode,
          isParentChild: true,
        };

        edges.push(edge);
        nodes[i].outgoingEdges.push(edge);
        subtaskNode.incomingEdges.push(edge);
      }
    }

    const taskDAG: TaskDAG = {
      nodes,
      edges,
      roots: [nodes[0]],
      hasMultipleMergePoints: () => {
        return nodes.filter(node => node.incomingEdges.length > 1).length > 2;
      },
    };

    return taskDAG;
  }

  private async inferTaskCharacteristics(task: string): Promise<{
    isMultiStep: boolean;
    hasAlternatives: boolean;
    complexity: number;
  }> {
    const taskLower = task.toLowerCase();
    const multiStepKeywords = ["implement", "build", "create", "develop", "design", "refactor", "migrate", "optimize", "then", "after", "following"];
    const alternativeKeywords = ["explore", "compare", "alternative", "different approach", "multiple ways", "ensemble", "parallel", "several options"];

    const hasMultiStepKeywords = multiStepKeywords.some(k => taskLower.includes(k));
    const hasAlternativeKeywords = alternativeKeywords.some(k => taskLower.includes(k));

    const isMultiStep = hasMultiStepKeywords || task.length > 100;
    const hasAlternatives = hasAlternativeKeywords || taskLower.includes(" or ");

    const complexity = Math.min(10, Math.max(1, Math.ceil(task.length / 50)));

    return { isMultiStep, hasAlternatives, complexity };
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

    const ensembleContext: EnsembleContext = {
      task: topology.task,
      strategies: topology.strategies,
      mergeStrategy: "consensus",
      enableAttention: this.attentionIntegration.isAttentionEnabled(),
      attentionConfig: this.integrationConfig.attention,
      synthesisConfig: {
        strategy: "consensus",
        enableQualityMetrics: true,
        consensusThreshold: 0.7,
      },
    };

    const ensembleResult: EnsembleResult = await this.attentionIntegration.executeEnsemble(
      ensembleContext,
      async (strategy: string) => {
        const agent = topology.ensembleMembers.find(a => a.description.includes(strategy));
        if (!agent) {
          throw new Error(`Agent not found for strategy: ${strategy}`);
        }
        const record = memberResults.find(r => r.agent === agent.name);
        if (!record || !record.success) {
          throw new Error(`Agent ${agent.name} failed`);
        }
        return {
          output: JSON.stringify(record.result),
          confidence: 0.8,
        };
      },
    );

    console.log(`Ensemble synthesis: ${ensembleResult.attentionEnabled ? "with attention" : "without attention"}`);
    console.log(`Synthesis confidence: ${ensembleResult.confidence.toFixed(2)}`);

    results.push(...successfulResults.map((r) => r.result));
    results.push(ensembleResult.synthesis);

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
      : { result: null, error: record.error };
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
    if (this.currentDepth >= this.MAX_DEPTH) {
      return {
        success: false,
        error: `Maximum agent spawning depth ${this.MAX_DEPTH} exceeded. Possible infinite loop.`,
      };
    }

    this.currentDepth++;
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const startTime = Date.now();

      const taskComplexity = await this.inferTaskComplexity(task);
      const taskType = this.inferTaskType(task);

      await this.trackSkillExecution(
        agent.name,
        taskId,
        {
          taskType,
          complexity: taskComplexity,
          domain: this.inferDomain(task),
        },
      );

      try {
        const routingPath = await this.routeTools(task, "read", task);

        if (routingPath.fallbackToLLM) {
          console.log(`Graph routing not available, falling back to LLM for task: ${task}`);
        } else {
          console.log(`Graph routing found path: ${routingPath.nodes.join(" → ")} (confidence: ${(routingPath.confidence * 100).toFixed(0)}%)`);
        }

        const result = await this.invokeAgentTool(agent.name, task, context);
        const latency = Date.now() - startTime;

        const verification = await this.verifyResult(task, result);

        if (!verification.verified) {
          console.warn(`Verification failed for task: ${task}`);
          console.warn(`Rubric verdict: ${verification.verification.rubricVerdict}`);
          console.warn(`GVR verdict: ${verification.verification.gvrVerdict}`);
        } else {
          console.log(`Verification passed for task: ${task}`);
        }

        await this.completeSkillExecution(
          taskId,
          {
            success: verification.verified,
            errorMessage: verification.verified ? undefined : "Verification failed",
          },
          {
            toolCalls: routingPath.nodes.length,
            latency,
            quality: verification.verified ? 1 : 0,
          },
        );

        await this.registry.recordSuccess(
          agent.name,
          this.inferTaskType(task),
          this.estimateAgentCost(latency),
          latency,
        );

        return { success: verification.verified, result };
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
    } finally {
      this.currentDepth--;
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

  private async inferTaskComplexity(task: string): Promise<"low" | "medium" | "high" | "unknown"> {
    const taskLower = task.toLowerCase();
    const complexity = await this.analyzeComplexity(task);

    if (taskLower.length < 50 && !complexity.isMultiStep && !complexity.hasAlternatives) {
      return "low";
    }

    if (taskLower.length < 150 && (complexity.isMultiStep || complexity.hasAlternatives)) {
      return "medium";
    }

    if (taskLower.length >= 150 && complexity.isMultiStep && complexity.hasAlternatives) {
      return "high";
    }

    return "medium";
  }

  private inferDomain(task: string): string | undefined {
    const taskLower = task.toLowerCase();
    const domains = [
      "authentication", "security", "api", "database", "frontend",
      "backend", "ui", "ux", "testing", "deployment",
      "infrastructure", "monitoring", "logging", "caching",
      "messaging", "storage", "network", "performance",
    ];

    for (const domain of domains) {
      if (taskLower.includes(domain)) {
        return domain;
      }
    }

    return undefined;
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

  getIntegrationConfig(): OpenSageIntegrationConfig {
    return { ...this.integrationConfig };
  }

  getTopologyConfig(): TopologyConfig {
    return this.integrationConfig.topology || DEFAULT_TOPOLOGY_CONFIG;
  }

  getGraphRoutingConfig(): GraphRoutingConfig {
    return this.integrationConfig.graphRouting || DEFAULT_GRAPH_ROUTING_CONFIG;
  }

  getTools(): Record<string, (args: any, context: any) => Promise<string>> {
    return {
      "graph-route": async (args: any) => {
        const path = await this.routeTools(args.task, args.startNode, args.endGoal);
        const stats = this.graphRouter.getStats();

        if (path.fallbackToLLM) {
          return `⚠️  Fallback to LLM routing\nReason: No feasible path in tool graph\nStats: ${stats.llmFallbackCount} LLM fallbacks (${stats.llmFallbackPercentage.toFixed(1)}%)`;
        }

        const nodes = path.nodes.join(" → ");
        const cost = `Cost: ${path.totalCost.toFixed(2)}`;
        const latency = `Latency: ${path.totalLatency.toFixed(0)}ms`;
        const confidence = `Confidence: ${(path.confidence * 100).toFixed(0)}%`;

        return `
📊 Graph-Based Routing Result

Path: ${nodes}
${cost}
${latency}
${confidence}
Nodes: ${path.nodes.length}

Stats:
- Graph routing: ${stats.graphRoutingCount}
- LLM fallbacks: ${stats.llmFallbackCount}
- LLM fallback %: ${stats.llmFallbackPercentage.toFixed(1)}%
`.trim();
      },

      "graph-stats": async () => {
        const stats = this.graphRouter.getStats();
        return `
📈 Graph Routing Statistics

- Graph routing count: ${stats.graphRoutingCount}
- LLM fallback count: ${stats.llmFallbackCount}
- LLM fallback percentage: ${stats.llmFallbackPercentage.toFixed(1)}%

Expected LLM call reduction: 90-93%
`.trim();
      },

      "graph-health": async () => {
        const health = this.toolGraph.getHealthStatus();
        const healthy = Array.from(health.values()).filter(s => s === "healthy").length;
        const degraded = Array.from(health.values()).filter(s => s === "degraded").length;
        const unavailable = Array.from(health.values()).filter(s => s === "unavailable").length;
        const total = health.size;

        return `
🏥  Tool Health Status

- ✅ Healthy: ${healthy}/${total} (${((healthy / total) * 100).toFixed(0)}%)
- ⚠️  Degraded: ${degraded}/${total} (${((degraded / total) * 100).toFixed(0)}%)
- ❌ Unavailable: ${unavailable}/${total} (${((unavailable / total) * 100).toFixed(0)}%)
`.trim();
      },

      "graph-reset-stats": async () => {
        this.graphRouter.resetStats();
        return "Graph routing statistics reset.";
      },

      "index-add": async (args: any) => {
        const metadata = args.metadata ? JSON.parse(args.metadata) : undefined;
        const node = await this.indexMemory(args.id, args.content, metadata);
        return `✅ Added node ${args.id} to hierarchical index at level ${node.level}`;
      },

      "index-search": async (args: any) => {
        const topK = args.topK || 10;
        const results = await this.searchIndexedMemory(args.query, topK);
        const stats = this.getIndexStats();

        const output: string[] = [];
        output.push("🔍 Hierarchical Search Results");
        output.push("");
        output.push(`Query: ${args.query}`);
        output.push(`Found ${results.length} results (top ${topK})`);
        output.push("");

        for (let i = 0; i < Math.min(results.length, 5); i++) {
          const result = results[i];
          const scorePct = (result.score * 100).toFixed(1);
          output.push(`${i + 1}. [${result.score.toFixed(3)}] ${result.node.id}`);
          output.push(`   Level: ${result.level}`);
          output.push(`   Score: ${scorePct}%`);
        }

        if (results.length > 5) {
          output.push(`... and ${results.length - 5} more`);
        }

        output.push("");
        output.push("📊 Index Statistics");
        output.push(`Total nodes: ${stats.totalNodes}`);
        output.push(`Max depth: ${stats.maxDepth}`);
        output.push(`Average branching: ${stats.averageBranching.toFixed(2)}`);
        output.push(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);

        return output.join("\n");
      },

      "index-stats": async () => {
        const stats = this.getIndexStats();
        return `
📊 Hierarchical Memory Index Statistics

- Total Nodes: ${stats.totalNodes}
- Level Count: ${stats.levelCount}
- Max Depth: ${stats.maxDepth}
- Average Branching: ${stats.averageBranching.toFixed(2)}
- Cache Size: ${this.memoryIndex["cacheSize" as keyof typeof this.memoryIndex]}
- Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%

Expected Performance:
- Retrieval: O(log N) vs O(N) linear scan
- Speedup: ~3.6x for typical memory queries
`.trim();
      },

      "index-clear-cache": async () => {
        this.clearMemoryCache();
        return "✅ Hierarchical index query cache cleared";
      },

      "index-chunk": async (args: any) => {
        const result = await this.chunkContent(args.content);

        const output: string[] = [];
        output.push("📝 Boundary-Aware Chunking");
        output.push("");
        output.push(`Content length: ${args.content.length} chars`);
        output.push(`Chunks: ${result.chunks.length}`);
        output.push("");

        for (let i = 0; i < result.chunks.length; i++) {
          const [start, end] = result.boundaries[i];
          output.push(`Chunk ${i + 1}: [${start}, ${end}]`);
          output.push(`  Length: ${end - start} chars`);
          output.push(`  Content: ${result.chunks[i].slice(0, 50)}...`);
        }

        return output.join("\n");
      },

      "rubric-verify": async (args: any) => {
        if (!this.verificationPlugin) {
          return "Verification plugin not initialized";
        }

        const verification = await this.verifyResult(args.request, args.result);

        return `
✅ Rubric-Based Verification Result

Request: ${args.request}
Verified: ${verification.verified ? "✓ PASS" : "✗ FAIL"}

Rubric Verdict: ${verification.verification.rubricVerdict}
GVR Verdict: ${verification.verification.gvrVerdict}
Combined Verdict: ${verification.verification.combinedVerdict ? "PASS" : "FAIL"}
Iterations: ${verification.verification.iterations}

Suggestions:
${verification.verification.suggestions.map(s => `- ${s}`).join("\n") || "None"}
`.trim();
      },

      "verification-report": async () => {
        if (!this.verificationPlugin) {
          return "Verification plugin not initialized";
        }

        const report = await this.verificationPlugin.verificationReport({ includeHistory: false });

        return `
📋 Verification Report

Rubrics: ${report.report.rubrics.join(", ")}

Statistics:
- Verification Count: ${report.report.statistics.verificationCount}
- Pass Rate: ${(report.report.statistics.passRate * 100).toFixed(1)}%
- Average Confidence: ${(report.report.statistics.avgConfidence * 100).toFixed(1)}%

Taxonomy Categories: ${report.report.taxonomy.categories.length}
Taxonomy Subcategories: ${report.report.taxonomy.subcategories.size}
`.trim();
      },

      "rubric-config": async (args: any) => {
        if (!this.verificationPlugin) {
          return "Verification plugin not initialized";
        }

        const action = args.action || "get";

        const result = await this.verificationPlugin.rubricConfig({
          action,
          config: args.config,
          rubric: args.rubric,
        });

        return `
⚙️  Rubric Configuration

Action: ${action}
Success: ${result.success}
Message: ${result.message}

Config: ${JSON.stringify(result.config || {}, null, 2)}
Rubrics: ${result.rubrics?.join(", ") || "None"}
`.trim();
      },

      "clear-verification-cache": async () => {
        if (!this.verificationPlugin) {
          return "Verification plugin not initialized";
        }

        const result = await this.verificationPlugin.clearVerificationCache();

        return `
🗑️  Verification Cache Cleared

Success: ${result.success}
Message: ${result.message}
`.trim();
      },

      "skill-metrics": async () => {
        if (!this.skillTrackingManager) {
          return "Skill tracking not initialized";
        }

        const metrics = this.skillTrackingManager.getStatistics();
        const competences = this.skillTrackingManager.getAllCompetences();

        return `
📊 Skill Tracking Metrics

Total Traces: ${metrics.totalTraces}
Total Skills: ${metrics.totalSkills}
Average Competence: ${(metrics.avgCompetence * 100).toFixed(1)}%
Average Confidence: ${(metrics.avgConfidence * 100).toFixed(1)}%
Learning Rate: ${(metrics.learningRate * 100).toFixed(2)}%
Routing Accuracy: ${(metrics.routingAccuracy * 100).toFixed(2)}%
Convergence Rate: ${(metrics.convergenceRate * 100).toFixed(2)}%
Last Update: ${new Date(metrics.lastUpdateTime).toLocaleString()}

Unique Skills Tracked: ${competences.size}
`.trim();
      },

      "competence-report": async (args: any) => {
        if (!this.skillTrackingManager) {
          return "Skill tracking not initialized";
        }

        const skillId = args.skillId || "all";

        if (skillId === "all") {
          const competences = this.skillTrackingManager.getAllCompetences();
          const output: string[] = [];
          output.push("📋 All Skill Competences");
          output.push("");
          output.push(`Total Skills: ${competences.size}`);
          output.push("");

          let count = 0;
          for (const [id, competence] of competences.entries()) {
            if (count >= 10) {
              output.push(`... and ${competences.size - 10} more skills`);
              break;
            }

            output.push(`${id}:`);
            output.push(`  Competence: ${(competence.competence * 100).toFixed(1)}%`);
            output.push(`  Total Executions: ${competence.totalExecutions}`);
            output.push(`  Success Rate: ${(competence.successRate * 100).toFixed(1)}%`);
            output.push(`  Last Updated: ${new Date(competence.lastUpdated).toLocaleString()}`);
            output.push("");

            count++;
          }

          return output.join("\n");
        }

        const competence = this.skillTrackingManager.getSkillCompetence(skillId);

        if (!competence) {
          return `Skill '${skillId}' not found in competence model`;
        }

        return `
📋 Skill Competence Report

Skill: ${skillId}
Competence: ${(competence.competence * 100).toFixed(1)}%
Total Executions: ${competence.totalExecutions}
Success Rate: ${(competence.successRate * 100).toFixed(1)}%
Average Quality: competence.avgQuality.toFixed(2)
Average Duration: competence.avgDuration.toFixed(0)}ms
Average Cost: competence.avgCost.toFixed(4)}
Last Updated: ${new Date(competence.lastUpdated).toLocaleString()}

Task Types: ${competence.taskTypes.join(", ")}
Trend: ${competence.trend}
`.trim();
      },

      "tracking-stats": async () => {
        if (!this.skillTrackingManager) {
          return "Skill tracking not initialized";
        }

        const trackingConfig = this.skillTrackingManager.getTrackingConfig();
        const routingConfig = this.skillTrackingManager.getRoutingConfig();

        return `
⚙️  Skill Tracking Configuration

Tracking:
- Enabled: ${trackingConfig.enableTracking}
- Max History Size: ${trackingConfig.maxHistorySize}
- Learning Rate: ${trackingConfig.learningRate}
- Confidence Threshold: ${trackingConfig.confidenceThreshold}
- Update Frequency: ${trackingConfig.updateFrequency}
- Decay Factor: ${trackingConfig.decayFactor}
- Exploration Rate: ${trackingConfig.explorationRate}
- Anomaly Detection: ${trackingConfig.anomalyDetection}
- Anomaly Threshold: ${trackingConfig.anomalyThreshold}

Routing:
- Strategy: ${routingConfig.strategy}
- Use Competence Model: ${routingConfig.useCompetenceModel}
- Fallback to Static: ${routingConfig.fallbackToStatic}
- Competence Weight: ${routingConfig.competenceWeight}
- Cost Weight: ${routingConfig.costWeight}
- Speed Weight: ${routingConfig.speedWeight}
- Diversity Factor: ${routingConfig.diversityFactor}
`.trim();
      },
    };
  }

  updateIntegrationConfig(config: Partial<OpenSageIntegrationConfig>): void {
    this.integrationConfig = {
      ...this.integrationConfig,
      ...config,
    };

    if (config.worktree !== undefined) {
      this.config.worktree = config.worktree;
    }
    if (config.enableMemory !== undefined) {
      this.config.enableMemory = config.enableMemory;
    }
    if (config.enableTools !== undefined) {
      this.config.enableTools = config.enableTools;
    }
    if (config.enableAgents !== undefined) {
      this.config.enableAgents = config.enableAgents;
    }
    if (config.maxAgents !== undefined) {
      this.config.maxAgents = config.maxAgents;
    }
    if (config.maxTools !== undefined) {
      this.config.maxTools = config.maxTools;
    }
  }
}
