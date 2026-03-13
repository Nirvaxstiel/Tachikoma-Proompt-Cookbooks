import type {
  AgentOutput,
  AttentionContext,
  AttentionWeights,
  InterAgentAttention,
  AttentionConfig,
  AttentionPerformanceMetrics,
} from "./types";

export class ScaledDotProductAttention implements InterAgentAttention {
  private config: Required<AttentionConfig>;
  private cache: Map<string, AttentionWeights>;
  private performanceMetrics: AttentionPerformanceMetrics;

  constructor(config?: Partial<AttentionConfig>) {
    const DEFAULT_ATTENTION_CONFIG: Required<AttentionConfig> = {
      mechanism: "scaled-dot-product",
      numHeads: 8,
      temperature: 1.0,
      dropout: 0.1,
      enableCaching: true,
      cacheSize: 1000,
    };

    this.config = { ...DEFAULT_ATTENTION_CONFIG, ...config } as Required<AttentionConfig>;
    this.cache = new Map();

    this.performanceMetrics = {
      totalAttentionComputations: 0,
      averageAttentionTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      agentConfidenceScores: new Map(),
    };
  }

  async computeAttention(
    agentOutputs: AgentOutput[],
    context: AttentionContext,
  ): Promise<AttentionWeights> {
    const startTime = performance.now();

    const cacheKey = this.generateCacheKey(agentOutputs, context);

    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      this.updatePerformanceMetrics(performance.now() - startTime, true);
      return cached;
    }

    const weights = await this.computeScaledDotProductAttention(
      agentOutputs,
      context,
    );

    if (this.config.enableCaching) {
      this.cache.set(cacheKey, weights);
      this.trimCache();
    }

    this.updatePerformanceMetrics(performance.now() - startTime, false);

    return weights;
  }

  private async computeScaledDotProductAttention(
    agentOutputs: AgentOutput[],
    context: AttentionContext,
  ): Promise<AttentionWeights> {
    const numAgents = agentOutputs.length;

    if (numAgents === 0) {
      return {
        agentWeights: new Map(),
        confidenceScore: 0,
        attentionMatrix: [],
      };
    }

    const embeddingDim = 128;
    const queries = this.embedOutputs(agentOutputs, embeddingDim);
    const keys = this.embedOutputs(agentOutputs, embeddingDim);
    const values = this.embedOutputs(agentOutputs, embeddingDim);

    const headOutputs: number[][][] = [];

    for (let h = 0; h < this.config.numHeads; h++) {
      const headDim = embeddingDim / this.config.numHeads;

      const Qh = queries.map((q) =>
        q.slice(h * headDim, (h + 1) * headDim),
      );
      const Kh = keys.map((k) => k.slice(h * headDim, (h + 1) * headDim));
      const Vh = values.map((v) =>
        v.slice(h * headDim, (h + 1) * headDim),
      );

      const attentionScores = this.computeAttentionScores(Qh, Kh);
      const attendedValues = this.applyAttentionWeights(attentionScores, Vh);

      headOutputs.push(attendedValues);
    }

    const attendedOutput = this.concatenateHeads(headOutputs);

    const agentWeights = new Map<string, number>();
    agentOutputs.forEach((output, i) => {
      const baseWeight = 1.0 / numAgents;
      const confidenceAdjustment =
        context.historicalPerformance.get(output.agentId) || 0.5;
      const finalWeight = baseWeight * (1 + confidenceAdjustment);
      agentWeights.set(output.agentId, finalWeight);
    });

    const weights = this.normalizeWeights(agentWeights);

    const attentionMatrix = this.computeAttentionMatrix(agentOutputs, context);

    const confidenceScore = this.computeConfidenceScore(
      weights,
      attentionMatrix,
    );

    return {
      agentWeights: weights,
      confidenceScore,
      attentionMatrix,
    };
  }

  private embedOutputs(
    outputs: AgentOutput[],
    dim: number,
  ): number[][] {
    return outputs.map((output) => {
      const embedding = new Array(dim).fill(0);

      const text = output.output.toLowerCase();

      const words = text.split(/\s+/).slice(0, dim / 4);

      for (let i = 0; i < words.length; i++) {
        for (let j = 0; j < 4; j++) {
          const charCode = words[i].charCodeAt(j) || 0;
          embedding[i * 4 + j] = charCode / 256;
        }
      }

      return embedding;
    });
  }

  private computeAttentionScores(
    queries: number[][],
    keys: number[][],
  ): number[][] {
    const numQueries = queries.length;
    const numKeys = keys.length;
    const d_k = queries[0].length;

    const scores: number[][] = [];

    for (let i = 0; i < numQueries; i++) {
      const row: number[] = [];
      for (let j = 0; j < numKeys; j++) {
        const dotProduct = queries[i].reduce(
          (sum, val, idx) => sum + val * keys[j][idx],
          0,
        );
        const scaledScore = dotProduct / Math.sqrt(d_k);
        row.push(scaledScore);
      }
      scores.push(row);
    }

    return this.applySoftmaxWithTemperature(scores);
  }

  private applySoftmaxWithTemperature(scores: number[][]): number[][] {
    return scores.map((row) => {
      const maxScore = Math.max(...row);
      const expScores = row.map((s) =>
        Math.exp((s - maxScore) / this.config.temperature),
      );
      const sumExp = expScores.reduce((sum, s) => sum + s, 0);
      return expScores.map((s) => s / sumExp);
    });
  }

  private applyAttentionWeights(
    weights: number[][],
    values: number[][],
  ): number[][] {
    const numQueries = weights.length;
    const valueDim = values[0].length;

    const outputs: number[][] = [];

    for (let i = 0; i < numQueries; i++) {
      const output = new Array(valueDim).fill(0);
      for (let j = 0; j < values.length; j++) {
        for (let k = 0; k < valueDim; k++) {
          output[k] += weights[i][j] * values[j][k];
        }
      }
      outputs.push(output);
    }

    return outputs;
  }

  private concatenateHeads(headOutputs: number[][][]): number[][] {
    if (headOutputs.length === 0) return [];

    const numAgents = headOutputs[0].length;
    const output: number[][] = [];

    for (let i = 0; i < numAgents; i++) {
      const concatenated: number[] = [];
      for (const head of headOutputs) {
        concatenated.push(...head[i]);
      }
      output.push(concatenated);
    }

    return output;
  }

  private normalizeWeights(
    weights: Map<string, number>,
  ): Map<string, number> {
    const sum = Array.from(weights.values()).reduce((a, b) => a + b, 0);
    const normalized = new Map<string, number>();

    for (const [key, value] of weights.entries()) {
      normalized.set(key, value / sum);
    }

    return normalized;
  }

  private computeAttentionMatrix(
    agentOutputs: AgentOutput[],
    context: AttentionContext,
  ): number[][] {
    const numAgents = agentOutputs.length;
    const matrix: number[][] = [];

    for (let i = 0; i < numAgents; i++) {
      const row: number[] = [];
      for (let j = 0; j < numAgents; j++) {
        const iAgent = agentOutputs[i];
        const jAgent = agentOutputs[j];

        const similarity = this.computeOutputSimilarity(
          iAgent.output,
          jAgent.output,
        );

        const historicalFactor = this.getHistoricalFactor(
          iAgent.agentId,
          jAgent.agentId,
          context,
        );

        row.push(similarity * historicalFactor);
      }
      matrix.push(row);
    }

    const normalizedMatrix = matrix.map((row) => {
      const sum = row.reduce((a, b) => a + b, 0);
      return row.map((val) => val / sum);
    });

    return normalizedMatrix;
  }

  private computeOutputSimilarity(output1: string, output2: string): number {
    const words1 = new Set(output1.toLowerCase().split(/\s+/));
    const words2 = new Set(output2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private getHistoricalFactor(
    agent1Id: string,
    agent2Id: string,
    context: AttentionContext,
  ): number {
    const perf1 = context.historicalPerformance.get(agent1Id) || 0.5;
    const perf2 = context.historicalPerformance.get(agent2Id) || 0.5;

    return (perf1 + perf2) / 2;
  }

  private computeConfidenceScore(
    agentWeights: Map<string, number>,
    attentionMatrix: number[][],
  ): number {
    const weightVariance = this.computeVariance(Array.from(agentWeights.values()));

    const maxAttention = Math.max(
      ...attentionMatrix.map((row) => Math.max(...row)),
    );

    const avgAttention =
      attentionMatrix.reduce((sum, row) => {
        return sum + row.reduce((rSum, val) => rSum + val, 0);
      }, 0) /
      attentionMatrix.reduce((sum, row) => sum + row.length, 0);

    const confidence = 1.0 - weightVariance * (1.0 - avgAttention);

    return Math.max(0, Math.min(1, confidence));
  }

  private computeVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return (
      squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
    );
  }

  private generateCacheKey(
    agentOutputs: AgentOutput[],
    context: AttentionContext,
  ): string {
    const outputsHash = agentOutputs
      .map((o) => `${o.agentId}:${o.output.slice(0, 100)}`)
      .join("|");
    const contextHash = `${context.task}:${context.taskComplexity}`;
    return `${outputsHash}:${contextHash}`;
  }

  private trimCache(): void {
    if (this.cache.size <= this.config.cacheSize) {
      return;
    }

    const entries = Array.from(this.cache.entries());
    entries.slice(0, entries.length - this.config.cacheSize);
    this.cache = new Map(entries);
  }

  private updatePerformanceMetrics(
    computationTime: number,
    cacheHit: boolean,
  ): void {
    this.performanceMetrics.totalAttentionComputations++;

    if (cacheHit) {
      const hits = this.cache.size;
      const total = this.performanceMetrics.totalAttentionComputations;
      this.performanceMetrics.cacheHitRate = hits / total;
    }

    const totalTime =
      this.performanceMetrics.averageAttentionTime *
      (this.performanceMetrics.totalAttentionComputations - 1) +
      computationTime;
    this.performanceMetrics.averageAttentionTime =
      totalTime / this.performanceMetrics.totalAttentionComputations;

    this.performanceMetrics.memoryUsage =
      this.cache.size * 1024;
  }

  async applyAttention(
    weights: AttentionWeights,
    outputs: AgentOutput[],
  ): Promise<any> {
    const attended = new Map<string, AgentOutput>();

    for (const [agentId, weight] of weights.agentWeights.entries()) {
      const agentOutput = outputs.find((o) => o.agentId === agentId);
      if (agentOutput) {
        attended.set(agentId, {
          ...agentOutput,
          confidence: agentOutput.confidence * weight,
        });
      }
    }

    return {
      output: this.synthesizeAttendedOutputs(attended),
      confidence: weights.confidenceScore,
      attentionWeights: weights,
    };
  }

  private synthesizeAttendedOutputs(
    attended: Map<string, AgentOutput>,
  ): string {
    if (attended.size === 0) return "";

    const attendedArray = Array.from(attended.values());

    if (attendedArray.length === 1) {
      return attendedArray[0].output;
    }

    const sortedByWeight = attendedArray.sort(
      (a, b) => b.confidence - a.confidence,
    );

    const bestOutput = sortedByWeight[0];

    if (sortedByWeight[0].confidence > sortedByWeight[1].confidence * 1.5) {
      return bestOutput.output;
    }

    const parts: string[] = [];
    for (const output of sortedByWeight.slice(0, 3)) {
      parts.push(output.output);
    }

    return parts.join("\n\n");
  }

  getAttentionScores(): Map<string, number> {
    return new Map(this.performanceMetrics.agentConfidenceScores);
  }

  getAttentionMatrix(): number[][] {
    const lastKey = Array.from(this.cache.keys()).pop();
    if (lastKey) {
      const cached = this.cache.get(lastKey);
      if (cached) {
        return cached.attentionMatrix;
      }
    }
    return [];
  }

  getPerformanceMetrics(): AttentionPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  reset(): void {
    this.cache.clear();
    this.performanceMetrics = {
      totalAttentionComputations: 0,
      averageAttentionTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      agentConfidenceScores: new Map(),
    };
  }
}
