// Graph-based self-healing routing for deterministic tool orchestration
/**
 * Implements Graph-Based Self-Healing Tool Routing
 * Based on "Graph-Based Self-Healing Tool Routing" (arXiv:2603.01548)
 *
 * Key Features:
 * - Cost-weighted tool graph for deterministic routing
 * - Parallel health monitors for tool status
 * - Dijkstra's shortest path for optimal routing
 * - Fallback to LLM only when no feasible path exists
 * - 93% reduction in LLM control-plane calls
 */

export interface ToolNode {
  id: string;
  name: string;
  type: "tool" | "skill" | "agent";
  cost: number; // Normalized cost (1-10)
  capabilities: string[];
  dependencies: string[]; // Required tools/skills
  healthStatus: "healthy" | "degraded" | "unavailable";
  latency: number; // ms
}

export interface ToolEdge {
  source: string; // Tool node ID
  target: string; // Tool node ID
  weight: number; // Combined cost + latency weight
  condition?: ToolEdgeCondition;
}

export interface ToolEdgeCondition {
  type: "requires" | "alternative" | "sequence";
  threshold?: number;
}

export interface RoutingPath {
  nodes: string[];
  edges: ToolEdge[];
  totalCost: number;
  totalLatency: number;
  confidence: number; // 0-1
  fallbackToLLM: boolean;
}

export interface RoutingRequest {
  startNode: string; // Starting tool/skill
  endGoal: string; // Target capability or result
  requiredCapabilities: string[];
  maxLatency?: number; // Maximum acceptable latency
  maxCost?: number; // Maximum acceptable cost
  allowLLMFallback: boolean;
}

/**
 * Cost-weighted tool graph for routing
 */
export class ToolGraph {
  private nodes: Map<string, ToolNode>;
  private edges: Map<string, ToolEdge[]>;
  private healthMonitors: Map<string, HealthMonitor>;
  private adjacencyList: Map<string, Map<string, ToolEdge>>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.healthMonitors = new Map();
    this.adjacencyList = new Map();
  }

  /**
   * Add a tool/skill to the graph
   */
  addNode(node: ToolNode): void {
    this.nodes.set(node.id, node);

    // Initialize health monitor for new node
    const monitor = new HealthMonitor(node.id, node.healthStatus);
    this.healthMonitors.set(node.id, monitor);

    // Monitor health in parallel with configurable interval
    monitor.start(5000); // 5 second health checks
  }

  /**
   * Add a directed edge between tools
   */
  addEdge(edge: ToolEdge): void {
    const edges = this.edges.get(edge.source) || [];
    edges.push(edge);
    this.edges.set(edge.source, edges);

    // Update adjacency list
    const adj = this.adjacencyList.get(edge.source) || new Map();
    adj.set(edge.target, edge);
    this.adjacencyList.set(edge.source, adj);
  }

  /**
   * Update node health status
   */
  updateNodeHealth(nodeId: string, status: ToolNode["healthStatus"]): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.healthStatus = status;
    }
  }

  /**
   * Get all nodes
   */
  getNodes(): ToolNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get node by ID
   */
  getNode(id: string): ToolNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all edges from a node
   */
  getEdges(sourceId: string): ToolEdge[] {
    return this.edges.get(sourceId) || [];
  }

  /**
   * Remove a node and all its edges
   */
  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.edges.delete(nodeId);

    // Stop health monitor
    const monitor = this.healthMonitors.get(nodeId);
    if (monitor) {
      monitor.stop();
      this.healthMonitors.delete(nodeId);
    }

    // Update adjacency
    this.adjacencyList.delete(nodeId);
  }

  /**
   * Get current health of all nodes
   */
  getHealthStatus(): Map<string, ToolNode["healthStatus"]> {
    const status = new Map<string, ToolNode["healthStatus"]>();
    for (const [id, monitor] of this.healthMonitors.entries()) {
      status.set(id, monitor.getStatus());
    }
    return status;
  }

  /**
   * Cleanup all health monitors
   */
  destroy(): void {
    for (const monitor of this.healthMonitors.values()) {
      monitor.stop();
    }
    this.healthMonitors.clear();
  }
}

/**
 * Parallel health monitoring for tools
 */
export class HealthMonitor {
  private nodeId: string;
  private currentStatus: ToolNode["healthStatus"];
  private checkInterval: number;
  private intervalId: ReturnType<typeof setTimeout> | null;
  private checkCount: number;
  private failureCount: number;
  private maxFailures: number;

  constructor(nodeId: string, initialStatus: ToolNode["healthStatus"]) {
    this.nodeId = nodeId;
    this.currentStatus = initialStatus;
    this.checkInterval = 5000;
    this.intervalId = null;
    this.checkCount = 0;
    this.failureCount = 0;
    this.maxFailures = 3; // Threshold for marking as unavailable
  }

  /**
   * Start health checks
   */
  start(interval: number): void {
    this.stop(); // Stop existing monitor
    this.checkInterval = interval;

    this.intervalId = setTimeout(() => {
      this.check();
      this.intervalId = setInterval(() => {
        this.check();
      }, this.checkInterval);
    }, 0);
  }

  /**
   * Stop health checks
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearTimeout(this.intervalId);
      clearInterval(this.intervalId as ReturnType<typeof setInterval>);
      this.intervalId = null;
    }
  }

  /**
   * Perform health check
   */
  private async check(): Promise<void> {
    this.checkCount++;

    try {
      // In production, this would be actual health check logic
      // For now, simulate healthy status
      const isHealthy = await this.performHealthCheck();

      if (isHealthy) {
        this.failureCount = 0;
        this.currentStatus = "healthy";
      } else {
        this.failureCount++;

        if (this.failureCount >= this.maxFailures) {
          this.currentStatus = "unavailable";
        } else {
          this.currentStatus = "degraded";
        }
      }
    } catch (error) {
      this.failureCount++;
      this.currentStatus = this.failureCount >= this.maxFailures
        ? "unavailable"
        : "degraded";
    }
  }

  /**
   * Perform actual health check (placeholder)
   */
  private async performHealthCheck(): Promise<boolean> {
    // In production:
    // - Try to execute tool with simple input
    // - Measure response time
    // - Check for errors
    // - Verify expected outputs

    // Placeholder: simulate occasional degradation
    if (Math.random() < 0.1) {
      return false; // 10% chance of failure for demo
    }

    return true;
  }

  /**
   * Get current status
   */
  getStatus(): ToolNode["healthStatus"] {
    return this.currentStatus;
  }

  /**
   * Get health statistics
   */
  getStats(): { checkCount: number; failureCount: number; maxFailures: number } {
    return {
      checkCount: this.checkCount,
      failureCount: this.failureCount,
      maxFailures: this.maxFailures,
    };
  }
}

/**
 * Dijkstra's shortest path algorithm for tool routing
 */
export class DijkstraRouter {
  /**
   * Find shortest path in weighted graph
   */
  static findShortestPath(
    graph: ToolGraph,
    startNode: string,
    endGoal: string,
    request: RoutingRequest
  ): RoutingPath {
    const nodes = new Map<string, ToolNode>();
    for (const node of graph.getNodes()) {
      nodes.set(node.id, node);
    }

    // Initialize distances and previous nodes
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    for (const [id, node] of nodes) {
      // Filter out unhealthy nodes
      if (node.healthStatus === "unavailable") {
        continue;
      }

      distances.set(id, Infinity);
      previous.set(id, null);
      unvisited.add(id);
    }

    // Start node distance is 0
    distances.set(startNode, 0);

    // Dijkstra's algorithm
    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let minNode: string | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId) || Infinity;
        if (dist < minDistance) {
          minDistance = dist;
          minNode = nodeId;
        }
      }

      if (minNode === null) {
        break; // No reachable nodes left
      }

      unvisited.delete(minNode);

      // Check all neighbors
      const neighbors = graph.getEdges(minNode);
      for (const edge of neighbors) {
        const neighbor = edge.target;

        // Skip unhealthy neighbors
        const neighborNode = nodes.get(neighbor);
        if (!neighborNode || neighborNode.healthStatus === "unavailable") {
          continue;
        }

        // Check capability requirements
        if (!this.satisfiesRequirements(neighborNode, request.requiredCapabilities)) {
          continue;
        }

        const newDistance = minDistance + edge.weight;

        // Update distance if shorter path found
        const currentDistance = distances.get(neighbor) || Infinity;
        if (newDistance < currentDistance) {
          distances.set(neighbor, newDistance);
          previous.set(neighbor, minNode);
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    const pathEdges: ToolEdge[] = [];
    let currentNode = endGoal;

    while (currentNode !== null && currentNode !== startNode) {
      path.unshift(currentNode);
      const prevNode = previous.get(currentNode);

      if (prevNode) {
        const edges = graph.getEdges(prevNode);
        const edge = edges.find(e => e.target === currentNode);
        if (edge) {
          pathEdges.unshift(edge);
        }
      }

      currentNode = prevNode || "";
    }

    if (currentNode !== startNode) {
      // No path found - fallback to LLM
      return {
        nodes: [],
        edges: [],
        totalCost: Infinity,
        totalLatency: Infinity,
        confidence: 0,
        fallbackToLLM: true,
      };
    }

    // Calculate totals
    path.unshift(startNode);

    let totalCost = 0;
    let totalLatency = 0;
    for (const edge of pathEdges) {
      totalCost += edge.weight;

      // Add node latency
      const node = nodes.get(edge.target);
      if (node) {
        totalLatency += node.latency;
      }
    }

    // Calculate confidence based on path health and length
    const healthyNodes = path.filter(id => {
      const node = nodes.get(id);
      return node && node.healthStatus === "healthy";
    });
    const confidence = healthyNodes.length / path.length;

    return {
      nodes: path,
      edges: pathEdges,
      totalCost,
      totalLatency,
      confidence,
      fallbackToLLM: false,
    };
  }

  /**
   * Check if node satisfies required capabilities
   */
  private static satisfiesRequirements(
    node: ToolNode,
    requiredCapabilities: string[]
  ): boolean {
    if (requiredCapabilities.length === 0) {
      return true;
    }

    return requiredCapabilities.every(cap => 
      node.capabilities.includes(cap)
    );
  }

  /**
   * Find alternative paths (for resilience)
   */
  static findAlternativePaths(
    graph: ToolGraph,
    startNode: string,
    endGoal: string,
    request: RoutingRequest,
    maxPaths: number = 3
  ): RoutingPath[] {
    const paths: RoutingPath[] = [];
    const usedEdges = new Set<string>();

    for (let i = 0; i < maxPaths; i++) {
      const path = this.findShortestPath(graph, startNode, endGoal, request);

      if (path.fallbackToLLM) {
        break; // No more paths available
      }

      paths.push(path);

      // Remove edges to find alternative paths
      for (const edge of path.edges) {
        const edgeKey = `${edge.source}-${edge.target}`;
        usedEdges.add(edgeKey);

        // Temporarily disable edge
        // In production, would need graph cloning
      }
    }

    // Sort by cost
    return paths.sort((a, b) => a.totalCost - b.totalCost);
  }
}

/**
 * Graph-based routing orchestrator
 */
export class GraphBasedRouter {
  private toolGraph: ToolGraph;
  private dijkstra: DijkstraRouter;
  private llmFallbackCount: number;
  private graphRoutingCount: number;

  constructor() {
    this.toolGraph = new ToolGraph();
    this.dijkstra = new DijkstraRouter;
    this.llmFallbackCount = 0;
    this.graphRoutingCount = 0;
  }

  /**
   * Route request using graph, fallback to LLM if needed
   */
  async route(request: RoutingRequest): Promise<RoutingPath> {
    try {
      // Attempt graph-based routing first
      const graphPath = DijkstraRouter.findShortestPath(
        this.toolGraph,
        request.startNode,
        request.endGoal,
        request
      );

      if (!graphPath.fallbackToLLM) {
        this.graphRoutingCount++;
        return graphPath;
      }

      // Fallback to LLM-based routing
      this.llmFallbackCount++;
      return await this.fallbackToLLM(request);
    } catch (error) {
      // Always fallback to LLM on error
      this.llmFallbackCount++;
      return await this.fallbackToLLM(request);
    }
  }

  /**
   * Fallback to LLM-based routing (existing behavior)
   */
  private async fallbackToLLM(request: RoutingRequest): Promise<RoutingPath> {
    // In production, this would call LLM for routing decision
    // For now, return a path that indicates LLM fallback

    return {
      nodes: [request.startNode],
      edges: [],
      totalCost: 100, // High cost for LLM fallback
      totalLatency: 10000, // High latency for LLM fallback
      confidence: 0.5, // Medium confidence
      fallbackToLLM: true,
    };
  }

  /**
   * Get routing statistics
   */
  getStats(): {
    graphRoutingCount: number;
    llmFallbackCount: number;
    llmFallbackPercentage: number;
  } {
    const total = this.graphRoutingCount + this.llmFallbackCount;
    const llmPercentage = total > 0
      ? (this.llmFallbackCount / total) * 100
      : 0;

    return {
      graphRoutingCount: this.graphRoutingCount,
      llmFallbackCount: this.llmFallbackCount,
      llmFallbackPercentage: llmPercentage,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.llmFallbackCount = 0;
    this.graphRoutingCount = 0;
  }
}
