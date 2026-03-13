import type {
  LayerOutput,
  AttentionContext,
  InterLayerResidualModule,
  ResidualConfig,
} from "./types";

export class InterLayerResidual implements InterLayerResidualModule {
  private config: Required<ResidualConfig>;
  private weights: number[][];
  private gateValues: number[];

  constructor(config?: Partial<ResidualConfig>) {
    const DEFAULT_RESIDUAL_CONFIG: Required<ResidualConfig> = {
      residualWeight: 0.5,
      enableLayerNorm: true,
      enableGating: true,
      adaptiveResidual: true,
      learningRate: 0.001,
    };

    this.config = {
      ...DEFAULT_RESIDUAL_CONFIG,
      ...config,
    } as Required<ResidualConfig>;

    this.weights = [];
    this.gateValues = [];
  }

  async computeResidual(
    layerOutputs: LayerOutput[],
    context: AttentionContext,
  ): Promise<LayerOutput> {
    const numLayers = layerOutputs.length;

    if (numLayers === 0) {
      return {
        layerId: "empty",
        agentId: "empty",
        output: "",
        confidence: 0,
      };
    }

    if (numLayers === 1) {
      return layerOutputs[0];
    }

    this.initializeWeights(numLayers, 128);
    this.initializeGates(numLayers);

    const normalizedOutputs = this.config.enableLayerNorm
      ? this.applyLayerNormalization(layerOutputs)
      : layerOutputs;

    const gateValues = this.config.enableGating
      ? this.computeGateValues(normalizedOutputs)
      : new Array(numLayers).fill(1.0);

    const residualWeight = this.computeAdaptiveResidualWeight(context);

    const combinedOutput = this.combineWithResidual(
      normalizedOutputs,
      gateValues,
      residualWeight,
    );

    const enhancedOutput = this.enhanceOutput(combinedOutput);

    return {
      layerId: `residual-${numLayers}`,
      agentId: context.task || "unknown",
      output: enhancedOutput.output,
      confidence: enhancedOutput.confidence,
    };
  }

  private initializeWeights(numLayers: number, dim: number): void {
    if (this.weights.length === numLayers && this.weights[0].length === dim) {
      return;
    }

    this.weights = [];

    for (let i = 0; i < numLayers; i++) {
      const row: number[] = [];
      for (let j = 0; j < dim; j++) {
        const weight = this.xavierInitialization(dim, dim);
        row.push(weight);
      }
      this.weights.push(row);
    }
  }

  private initializeGates(numLayers: number): void {
    if (this.gateValues.length === numLayers) {
      return;
    }

    this.gateValues = new Array(numLayers).fill(0.5);
  }

  private xavierInitialization(fanIn: number, fanOut: number): number {
    const limit = Math.sqrt(6 / (fanIn + fanOut));
    return Math.random() * 2 * limit - limit;
  }

  private applyLayerNormalization(
    outputs: LayerOutput[],
  ): LayerOutput[] {
    if (outputs.length === 0) return outputs;

    const normalizedOutputs: LayerOutput[] = [];

    for (const output of outputs) {
      const tokens = output.output.split(/\s+/);
      const mean = tokens.reduce((sum, token) => sum + token.length, 0) / tokens.length;
      const variance =
        tokens.reduce(
          (sum, token) => sum + Math.pow(token.length - mean, 2),
          0,
        ) / tokens.length;
      const std = Math.sqrt(variance + 1e-5);

      const normalizedTokens = tokens.map(
        (token) => (token.length - mean) / std,
      );

      const normalizedOutput = normalizedTokens.join(" ");

      normalizedOutputs.push({
        ...output,
        output: normalizedOutput,
      });
    }

    return normalizedOutputs;
  }

  private computeGateValues(outputs: LayerOutput[]): number[] {
    const gateValues: number[] = [];

    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];

      const confidenceScore = output.confidence;
      const lengthScore = Math.min(1.0, output.output.length / 500);
      const qualityScore = this.computeQualityScore(output.output);

      const gateInput =
        confidenceScore * 0.5 + lengthScore * 0.3 + qualityScore * 0.2;

      const gateValue = this.sigmoid(gateInput + this.gateValues[i]);
      gateValues.push(gateValue);
    }

    return gateValues;
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private computeQualityScore(output: string): number {
    let score = 0.5;

    const sentences = output.split(/[.!?]/).filter((s) => s.trim().length > 0);
    if (sentences.length > 0) {
      const avgSentenceLength =
        output.length / sentences.length;
      score += Math.min(0.2, avgSentenceLength / 100);
    }

    const words = output.split(/\s+/);
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    const vocabularyDiversity = uniqueWords.size / Math.max(1, words.length);
    score += vocabularyDiversity * 0.3;

    return Math.min(1.0, score);
  }

  private computeAdaptiveResidualWeight(context: AttentionContext): number {
    if (!this.config.adaptiveResidual) {
      return this.config.residualWeight;
    }

    const complexityScores: Record<string, number> = {
      low: 0.3,
      medium: 0.5,
      high: 0.7,
      unknown: 0.5,
    };

    const baseWeight = this.config.residualWeight;
    const complexityFactor = complexityScores[context.taskComplexity] || 0.5;

    const adaptiveWeight = baseWeight * (1 + complexityFactor * 0.5);

    return Math.min(1.0, adaptiveWeight);
  }

  private combineWithResidual(
    outputs: LayerOutput[],
    gateValues: number[],
    residualWeight: number,
  ): { output: string; confidence: number } {
    const gatedOutputs: { output: string; confidence: number }[] = [];

    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      const gate = gateValues[i];

      gatedOutputs.push({
        output: output.output,
        confidence: output.confidence * gate,
      });
    }

    const avgConfidence =
      gatedOutputs.reduce((sum, o) => sum + o.confidence, 0) /
      gatedOutputs.length;

    const weightedOutput = this.weightedCombine(gatedOutputs, residualWeight);

    return {
      output: weightedOutput,
      confidence: avgConfidence * (1 - residualWeight) + residualWeight * avgConfidence,
    };
  }

  private weightedCombine(
    outputs: { output: string; confidence: number }[],
    residualWeight: number,
  ): string {
    if (outputs.length === 0) return "";
    if (outputs.length === 1) return outputs[0].output;

    const totalWeight = outputs.reduce((sum, o) => sum + o.confidence, 0);

    const combinedParts: string[] = [];

    for (const output of outputs) {
      const weight = output.confidence / totalWeight;

      if (weight > 0.3) {
        combinedParts.push(output.output);
      }
    }

    if (combinedParts.length === 1) {
      return combinedParts[0];
    }

    return combinedParts.join("\n\n");
  }

  private enhanceOutput(
    combined: { output: string; confidence: number },
  ): { output: string; confidence: number } {
    const parts = combined.output.split("\n\n").filter((p) => p.trim().length > 0);

    if (parts.length <= 1) {
      return combined;
    }

    const uniqueParts = new Set(parts.map((p) => p.trim()));

    if (uniqueParts.size === 1) {
      return combined;
    }

    const deduplicatedParts = Array.from(uniqueParts);

    const enhancedOutput = deduplicatedParts.join("\n\n");

    const diversityFactor = deduplicatedParts.length / parts.length;
    const enhancedConfidence =
      combined.confidence * (1 + diversityFactor * 0.1);

    return {
      output: enhancedOutput,
      confidence: Math.min(1.0, enhancedConfidence),
    };
  }

  updateWeights(delta: number[][]): void {
    for (let i = 0; i < this.weights.length; i++) {
      for (let j = 0; j < this.weights[i].length; j++) {
        const deltaValue = delta[i]?.[j] || 0;
        this.weights[i][j] += deltaValue * this.config.learningRate;

        this.weights[i][j] = Math.max(-1.0, Math.min(1.0, this.weights[i][j]));
      }
    }
  }

  updateGateValues(deltas: number[]): void {
    for (let i = 0; i < this.gateValues.length; i++) {
      const deltaValue = deltas[i] || 0;
      this.gateValues[i] += deltaValue * this.config.learningRate;

      this.gateValues[i] = Math.max(0, Math.min(1, this.gateValues[i]));
    }
  }

  getWeights(): number[][] {
    return this.weights.map((row) => [...row]);
  }

  getGateValues(): number[] {
    return [...this.gateValues];
  }

  getConfig(): Required<ResidualConfig> {
    return { ...this.config };
  }

  reset(): void {
    this.weights = [];
    this.gateValues = [];
  }
}
