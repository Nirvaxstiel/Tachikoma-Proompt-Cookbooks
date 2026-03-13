// Topology types for orchestration

/**
 * Four canonical topologies for agent orchestration
 * Based on AdaptOrch research (arXiv:2602.16873)
 */

export type TopologyType = "parallel" | "sequential" | "hierarchical" | "hybrid";

export interface Topology {
  type: TopologyType;
  description: string;
  optimalFor: TaskCharacteristics;
  examples: string[];
}

export interface TaskCharacteristics {
  hasIndependentSubtasks: boolean;
  hasSequentialDependencies: boolean;
  hasHierarchicalStructure: boolean;
  hasCrossCuttingTies: boolean;
  requiresCoordination: boolean;
  requiresConsensus: boolean;
  complexity: number; // 1-10 scale
}

export interface TopologyClassificationResult {
  recommendedTopology: TopologyType;
  confidence: number; // 0-1
  rationale: string;
}

/**
 * Map task characteristics to optimal topology
 * Based on AdaptOrch: Task-Adaptive Multi-Agent Orchestration
 */
export class TopologyClassifier {
  /**
   * Classify task DAG and characteristics into topology
   * O(|V| + |E|) mapping algorithm
   */
  static classify(taskDAG: TaskDAG): TopologyClassificationResult {
    const characteristics = this.analyzeCharacteristics(taskDAG);

    // Topology selection matrix
    const topologyScore = {
      parallel: this.scoreParallel(characteristics),
      sequential: this.scoreSequential(characteristics),
      hierarchical: this.scoreHierarchical(characteristics),
      hybrid: this.scoreHybrid(characteristics),
    };

    // Select topology with highest score
    const bestTopology = Object.entries(topologyScore).reduce((best, [type, score]) => {
      return score > best.score ? { type: type as TopologyType, score } : best;
    }, { type: "parallel" as TopologyType, score: 0 });

    const confidence = bestTopology.score / 10; // Normalize to 0-1

    return {
      recommendedTopology: bestTopology.type,
      confidence,
      rationale: this.generateRationale(bestTopology.type, characteristics),
    };
  }

  /**
   * Analyze task structure and dependencies
   */
  private static analyzeCharacteristics(taskDAG: TaskDAG): TaskCharacteristics {
    return {
      hasIndependentSubtasks: this.checkIndependentSubtasks(taskDAG),
      hasSequentialDependencies: this.checkSequentialDependencies(taskDAG),
      hasHierarchicalStructure: this.checkHierarchicalStructure(taskDAG),
      hasCrossCuttingTies: this.checkCrossCuttingTies(taskDAG),
      requiresCoordination: this.checkCoordinationNeeded(taskDAG),
      requiresConsensus: this.checkConsensusNeeded(taskDAG),
      complexity: this.estimateComplexity(taskDAG),
    };
  }

  /**
   * Scoring functions for each topology
   */
  private static scoreParallel(characteristics: TaskCharacteristics): number {
    let score = 0;

    // Parallel excels at independent subtasks
    if (characteristics.hasIndependentSubtasks) score += 4;
    if (!characteristics.hasSequentialDependencies) score += 3;
    if (!characteristics.requiresCoordination) score += 2;

    // Penalty for consensus or coordination needs
    if (characteristics.requiresConsensus) score -= 2;
    if (characteristics.hasHierarchicalStructure) score -= 2;

    // Complexity penalty
    score -= characteristics.complexity * 0.2;

    return Math.max(0, score);
  }

  private static scoreSequential(characteristics: TaskCharacteristics): number {
    let score = 0;

    // Sequential excels at ordered dependencies
    if (characteristics.hasSequentialDependencies) score += 4;
    if (!characteristics.hasIndependentSubtasks) score += 2;
    if (characteristics.hasHierarchicalStructure) score += 1;

    // Penalty for complex structures that don't fit sequential
    if (characteristics.hasCrossCuttingTies) score -= 3;
    if (characteristics.requiresConsensus) score -= 2;

    score -= characteristics.complexity * 0.1;

    return Math.max(0, score);
  }

  private static scoreHierarchical(characteristics: TaskCharacteristics): number {
    let score = 0;

    // Hierarchical excels at structured decomposition
    if (characteristics.hasHierarchicalStructure) score += 4;
    if (characteristics.hasSequentialDependencies) score += 2;
    if (characteristics.requiresCoordination) score += 2;

    // Penalty for independent tasks or cross-cutting
    if (characteristics.hasIndependentSubtasks) score -= 2;
    if (characteristics.hasCrossCuttingTies) score -= 2;

    score -= characteristics.complexity * 0.15;

    return Math.max(0, score);
  }

  private static scoreHybrid(characteristics: TaskCharacteristics): number {
    let score = 0;

    // Hybrid balances multiple characteristics
    if (characteristics.hasHierarchicalStructure && characteristics.hasIndependentSubtasks) score += 3;
    if (characteristics.hasSequentialDependencies && characteristics.hasCrossCuttingTies) score += 2;
    if (characteristics.requiresCoordination && characteristics.requiresConsensus) score += 2;

    // Hybrid handles complexity well
    if (characteristics.complexity > 5) score += 2;

    return Math.max(0, score);
  }

  /**
   * Analysis helpers
   */
  private static checkIndependentSubtasks(taskDAG: TaskDAG): boolean {
    // Check if subtasks can be executed in parallel without dependencies
    return taskDAG.nodes.every(node => node.incomingEdges.length === 0);
  }

  private static checkSequentialDependencies(taskDAG: TaskDAG): boolean {
    // Check if dependencies form a linear chain
    return this.isLinearChain(taskDAG);
  }

  private static checkHierarchicalStructure(taskDAG: TaskDAG): boolean {
    // Check if DAG has clear hierarchical patterns (tree-like or layered)
    return this.isTreeLike(taskDAG) || this.isLayered(taskDAG);
  }

  private static checkCrossCuttingTies(taskDAG: TaskDAG): boolean {
    // Check if there are cross-cutting ties between subtasks
    // (subtasks from different branches that need to coordinate)
    return taskDAG.edges.some(edge => this.isCrossCutting(edge));
  }

  private static checkCoordinationNeeded(taskDAG: TaskDAG): boolean {
    // Check if tasks require explicit coordination/merge points
    return taskDAG.nodes.length > 5 || taskDAG.hasMultipleMergePoints();
  }

  private static checkConsensusNeeded(taskDAG: TaskDAG): boolean {
    // Check if tasks have conflicting approaches requiring resolution
    return this.hasConflictingApproaches(taskDAG);
  }

  private static estimateComplexity(taskDAG: TaskDAG): number {
    // Estimate complexity based on task count, depth, and branching
    const taskCount = taskDAG.nodes.length;
    const depth = this.calculateDepth(taskDAG);
    const branching = this.calculateBranching(taskDAG);

    return (taskCount * 0.3) + (depth * 0.4) + (branching * 0.3);
  }

  /**
   * Utility functions
   */
  private static isLinearChain(dag: TaskDAG): boolean {
    // A DAG is linear if each node has at most one incoming and one outgoing edge
    return dag.nodes.every(node =>
      node.incomingEdges.length <= 1 && node.outgoingEdges.length <= 1
    );
  }

  private static isTreeLike(dag: TaskDAG): boolean {
    // Check if DAG forms a tree structure (single root, no cycles in subtrees)
    return dag.roots.length === 1 && !this.hasCrossEdges(dag);
  }

  private static isLayered(dag: TaskDAG): boolean {
    // Check if DAG can be partitioned into layers
    return this.hasValidLayering(dag);
  }

  private static isCrossCutting(edge: Edge): boolean {
    // Detect if an edge creates a cross-cutting tie
    // (simplified: edges between nodes at different depths that don't follow hierarchy)
    return edge.source.depth !== edge.target.depth && !edge.isParentChild;
  }

  private static hasCrossEdges(dag: TaskDAG): boolean {
    return dag.edges.some(edge => this.isCrossCutting(edge));
  }

  private static hasMultipleMergePoints(dag: TaskDAG): boolean {
    // Count nodes with multiple incoming edges (merge points)
    return dag.nodes.filter(node => node.incomingEdges.length > 1).length > 2;
  }

  private static hasConflictingApproaches(dag: TaskDAG): boolean {
    // Check if there are multiple valid approaches to the same subtask
    const nodeNames = dag.nodes.map((n: TaskDAGNode) => n.name);
    const subtaskNames = nodeNames.filter((name, index, self) => self.indexOf(name) === index);
    const conflicts = [];

    for (const node of dag.nodes) {
      if (node.approaches && node.approaches.length > 1) {
        conflicts.push(node.name);
      }
    }

    return conflicts.length > 0;
  }

  private static calculateDepth(dag: TaskDAG): number {
    // Calculate maximum depth from root to any node
    return Math.max(...dag.nodes.map(node => node.depth));
  }

  private static calculateBranching(dag: TaskDAG): number {
    // Calculate average branching factor
    const totalEdges = dag.nodes.reduce((sum, node) => sum + node.outgoingEdges.length, 0);
    return totalEdges / dag.nodes.length;
  }

  private static hasValidLayering(dag: TaskDAG): boolean {
    // Check if DAG can be partitioned into layers without cycles within layers
    return this.canTopologicalSort(dag) && this.canPartitionLayers(dag);
  }

  private static canTopologicalSort(dag: TaskDAG): boolean {
    // Basic DAG validation - can be topologically sorted
    const visited: Set<string> = new Set();
    const temp: Set<string> = new Set();

    // Simplified topological sort check
    for (const node of dag.nodes) {
      if (!visited.has(node.name)) {
        if (this.hasCycle(node, visited, temp)) {
          return false;
        }
        visited.add(node.name);
      }
    }

    return true;
  }

  private static hasCycle(node: TaskDAGNode, visited: Set<string>, temp: Set<string>): boolean {
    // DFS-based cycle detection (simplified)
    temp.add(node.name);
    for (const edge of node.outgoingEdges) {
      if (!visited.has(edge.target.name)) {
        if (temp.has(edge.target.name)) {
          return true;
        }
        if (this.hasCycle(edge.target, visited, temp)) {
          return true;
        }
      }
    }
    temp.delete(node.name);
    return false;
  }

  private static canPartitionLayers(dag: TaskDAG): boolean {
    // Check if DAG can be partitioned into dependency-free layers
    const layers = this.extractLayers(dag);
    return layers.every(layer => this.isLayerDependencyFree(layer, dag));
  }

  private static extractLayers(dag: TaskDAG): TaskDAGNode[][] {
    // Extract layers using topological ordering
    const layers: TaskDAGNode[][] = [];
    const remaining = [...dag.nodes];

    while (remaining.length > 0) {
      const layer = remaining.filter(node =>
        node.incomingEdges.every(edge => !layers.flat().includes(edge.source))
      );
      layers.push(layer);
      layer.forEach(node => {
        const index = remaining.indexOf(node);
        if (index !== -1) remaining.splice(index, 1);
      });
    }

    return layers;
  }

  private static isLayerDependencyFree(layer: TaskDAGNode[], dag: TaskDAG): boolean {
    // Check if no dependencies exist within a layer
    for (const node of layer) {
      for (const edge of node.incomingEdges) {
        if (layer.includes(edge.source)) {
          return false;
        }
      }
      for (const edge of node.outgoingEdges) {
        if (layer.includes(edge.target) && edge.target !== node) {
          return false;
        }
      }
    }
    return true;
  }

  private static generateRationale(topology: TopologyType, characteristics: TaskCharacteristics): string {
    const reasons = {
      parallel: "Subtasks can execute independently without coordination needs. Parallel topology maximizes throughput for independent tasks.",
      sequential: "Subtasks have clear linear dependencies. Sequential topology ensures correctness when order matters.",
      hierarchical: "Task decomposes naturally into hierarchical structure. Hierarchical topology enables master-slave coordination with clear ownership",
      hybrid: "Task has mixed characteristics requiring flexible orchestration. Hybrid topology combines benefits of multiple patterns.",
    };

    return reasons[topology];
  }
}

/**
 * Task DAG representation for topology classification
 */
export interface TaskDAGNode {
  name: string;
  depth: number;
  incomingEdges: Edge[];
  outgoingEdges: Edge[];
  approaches?: string[];
  isParentChild?: boolean; // For cross-cutting detection
}

export interface Edge {
  source: TaskDAGNode;
  target: TaskDAGNode;
  isParentChild?: boolean;
}

export interface TaskDAG {
  nodes: TaskDAGNode[];
  edges: Edge[];
  roots: TaskDAGNode[];

  hasMultipleMergePoints(): boolean;
}
