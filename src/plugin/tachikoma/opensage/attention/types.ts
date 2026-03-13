export type AttentionMechanism = "scaled-dot-product" | "additive" | "multi-head";

export interface AgentCapability {
  name: string;
  taskTypes: string[];
  performance: number;
  cost: number;
  reliability: number;
}

export type SynthesisStrategy =
  | "weighted-average"
  | "concatenation"
  | "consensus"
  | "selection";

export interface AgentOutput {
  agentId: string;
  output: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface LayerOutput {
  layerId: string;
  agentId: string;
  output: string;
  confidence: number;
}

export interface AttentionContext {
  task: string;
  agentCapabilities: Map<string, AgentCapability>;
  historicalPerformance: Map<string, number>;
  taskComplexity: "low" | "medium" | "high" | "unknown";
  metadata?: Record<string, unknown>;
}

export interface AttentionWeights {
  agentWeights: Map<string, number>;
  confidenceScore: number;
  attentionMatrix: number[][];
  headWeights?: number[][];
}

export interface AttendedOutput {
  output: string;
  confidence: number;
  attentionWeights: AttentionWeights;
  synthesisStrategy: SynthesisStrategy;
  metadata?: Record<string, unknown>;
}

export interface InterAgentAttention {
  computeAttention(
    agentOutputs: AgentOutput[],
    context: AttentionContext,
  ): Promise<AttentionWeights>;

  applyAttention(
    weights: AttentionWeights,
    outputs: AgentOutput[],
  ): Promise<AttendedOutput>;

  getAttentionScores(): Map<string, number>;

  getAttentionMatrix(): number[][];

  reset(): void;
}

export interface InterLayerResidualModule {
  computeResidual(
    layerOutputs: LayerOutput[],
    context: AttentionContext,
  ): Promise<LayerOutput>;

  updateWeights(delta: number[][]): void;

  getWeights(): number[][];

  reset(): void;
}

export interface AttentionConfig {
  mechanism: AttentionMechanism;
  numHeads: number;
  temperature: number;
  dropout: number;
  enableCaching: boolean;
  cacheSize: number;
}

export interface ResidualConfig {
  residualWeight: number;
  enableLayerNorm: boolean;
  enableGating: boolean;
  adaptiveResidual: boolean;
  learningRate: number;
}

export interface SynthesisConfig {
  strategy: SynthesisStrategy;
  temperature: number;
  enableQualityMetrics: boolean;
  consensusThreshold: number;
}

export interface AttentionPerformanceMetrics {
  totalAttentionComputations: number;
  averageAttentionTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  agentConfidenceScores: Map<string, number>;
}
