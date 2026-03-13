import type {
  AgentOutput,
  AttentionWeights,
  AttendedOutput,
  SynthesisStrategy,
  SynthesisConfig,
} from "./types";
import { DEFAULT_SYNTHESIS_CONFIG } from "./attention-config";

export class AttentionBasedSynthesis {
  private config: Required<SynthesisConfig>;

  constructor(config?: Partial<SynthesisConfig>) {
    this.config = {
      ...DEFAULT_SYNTHESIS_CONFIG,
      ...config,
    } as Required<SynthesisConfig>;
  }

  setStrategy(strategy: SynthesisStrategy): void {
    this.config.strategy = strategy;
  }

  setTemperature(temperature: number): void {
    this.config.temperature = temperature;
  }

  async synthesize(
    attendedOutputs: Map<string, AgentOutput>,
    attentionWeights: AttentionWeights,
  ): Promise<AttendedOutput> {
    const outputs = Array.from(attendedOutputs.values());

    switch (this.config.strategy) {
      case "weighted-average":
        return this.weightedAverageSynthesis(outputs, attentionWeights);

      case "concatenation":
        return this.concatenationSynthesis(outputs, attentionWeights);

      case "consensus":
        return this.consensusSynthesis(outputs, attentionWeights);

      case "selection":
        return this.selectionSynthesis(outputs, attentionWeights);

      default:
        return this.weightedAverageSynthesis(outputs, attentionWeights);
    }
  }

  private async weightedAverageSynthesis(
    outputs: AgentOutput[],
    weights: AttentionWeights,
  ): Promise<AttendedOutput> {
    if (outputs.length === 0) {
      return {
        output: "",
        confidence: 0,
        attentionWeights: weights,
        synthesisStrategy: "weighted-average",
      };
    }

    if (outputs.length === 1) {
      return {
        output: outputs[0].output,
        confidence: outputs[0].confidence,
        attentionWeights: weights,
        synthesisStrategy: "weighted-average",
      };
    }

    const totalWeight = Array.from(weights.agentWeights.values()).reduce((sum, w) => sum + w, 0);

    const combinedParts: string[] = [];
    let weightedConfidence = 0;

    for (const output of outputs) {
      const weight = weights.agentWeights.get(output.agentId) || 1.0 / outputs.length;
      const normalizedWeight = weight / totalWeight;

      weightedConfidence += output.confidence * normalizedWeight;

      if (normalizedWeight > 0.25) {
        combinedParts.push(output.output);
      }
    }

    combinedParts.sort((a, b) => {
      const weightA = this.getOutputWeight(a, weights);
      const weightB = this.getOutputWeight(b, weights);
      return weightB - weightA;
    });

    const synthesis = combinedParts.join("\n\n");

    return {
      output: synthesis,
      confidence: weightedConfidence,
      attentionWeights: weights,
      synthesisStrategy: "weighted-average",
    };
  }

  private async concatenationSynthesis(
    outputs: AgentOutput[],
    weights: AttentionWeights,
  ): Promise<AttendedOutput> {
    if (outputs.length === 0) {
      return {
        output: "",
        confidence: 0,
        attentionWeights: weights,
        synthesisStrategy: "concatenation",
      };
    }

    const sortedOutputs = [...outputs].sort((a, b) => {
      const weightA = weights.agentWeights.get(a.agentId) || 0;
      const weightB = weights.agentWeights.get(b.agentId) || 0;
      return weightB - weightA;
    });

    const parts: string[] = [];
    for (const output of sortedOutputs) {
      parts.push(`[Approach: ${output.agentId}, Confidence: ${output.confidence.toFixed(2)}]\n${output.output}`);
    }

    const synthesis = parts.join("\n\n---\n\n");

    const avgConfidence =
      outputs.reduce((sum, o) => sum + o.confidence, 0) / outputs.length;

    return {
      output: synthesis,
      confidence: avgConfidence,
      attentionWeights: weights,
      synthesisStrategy: "concatenation",
    };
  }

  private async consensusSynthesis(
    outputs: AgentOutput[],
    weights: AttentionWeights,
  ): Promise<AttendedOutput> {
    if (outputs.length === 0) {
      return {
        output: "",
        confidence: 0,
        attentionWeights: weights,
        synthesisStrategy: "consensus",
      };
    }

    const uniqueOutputs = new Map<string, AgentOutput>();

    for (const output of outputs) {
      const normalized = output.output.trim();
      const existing = uniqueOutputs.get(normalized);

      if (existing) {
        uniqueOutputs.set(normalized, {
          ...existing,
          confidence: Math.max(existing.confidence, output.confidence),
        });
      } else {
        uniqueOutputs.set(normalized, output);
      }
    }

    const consensusOutputs = Array.from(uniqueOutputs.values());

    if (consensusOutputs.length === 1) {
      const output = consensusOutputs[0];
      return {
        output: output.output,
        confidence: output.confidence,
        attentionWeights: weights,
        synthesisStrategy: "consensus",
      };
    }

    const consensusOutputsAboveThreshold = consensusOutputs.filter(
      (o) => o.confidence >= this.config.consensusThreshold,
    );

    if (consensusOutputsAboveThreshold.length === 0) {
      return await this.weightedAverageSynthesis(outputs, weights);
    }

    const parts: string[] = [];
    for (const output of consensusOutputsAboveThreshold) {
      parts.push(output.output);
    }

    const synthesis = parts.join("\n\n");

    const avgConfidence =
      consensusOutputsAboveThreshold.reduce((sum, o) => sum + o.confidence, 0) /
      consensusOutputsAboveThreshold.length;

    return {
      output: synthesis,
      confidence: avgConfidence,
      attentionWeights: weights,
      synthesisStrategy: "consensus",
    };
  }

  private async selectionSynthesis(
    outputs: AgentOutput[],
    weights: AttentionWeights,
  ): Promise<AttendedOutput> {
    if (outputs.length === 0) {
      return {
        output: "",
        confidence: 0,
        attentionWeights: weights,
        synthesisStrategy: "selection",
      };
    }

    let selectedOutput = outputs[0];
    let maxWeight = weights.agentWeights.get(selectedOutput.agentId) || 0;

    for (const output of outputs) {
      const weight = weights.agentWeights.get(output.agentId) || 0;
      if (weight > maxWeight) {
        maxWeight = weight;
        selectedOutput = output;
      }
    }

    return {
      output: selectedOutput.output,
      confidence: selectedOutput.confidence,
      attentionWeights: weights,
      synthesisStrategy: "selection",
    };
  }

  private getOutputWeight(output: string, weights: AttentionWeights): number {
    for (const [agentId, weight] of weights.agentWeights.entries()) {
      if (output.includes(agentId)) {
        return weight;
      }
    }
    return 0;
  }

  applyTemperature(weights: Map<string, number>): Map<string, number> {
    const adjustedWeights = new Map<string, number>();

    for (const [key, weight] of weights.entries()) {
      const tempAdjustedWeight = Math.pow(weight, 1.0 / this.config.temperature);
      adjustedWeights.set(key, tempAdjustedWeight);
    }

    const sum = Array.from(adjustedWeights.values()).reduce((s, w) => s + w, 0);
    const normalizedWeights = new Map<string, number>();

    for (const [key, weight] of adjustedWeights.entries()) {
      normalizedWeights.set(key, weight / sum);
    }

    return normalizedWeights;
  }

  getQualityMetrics(outputs: AgentOutput[]): {
    confidenceScore: number;
    consistencyScore: number;
    diversityScore: number;
  } {
    if (outputs.length === 0) {
      return {
        confidenceScore: 0,
        consistencyScore: 0,
        diversityScore: 0,
      };
    }

    const confidences = outputs.map((o) => o.confidence);
    const avgConfidence =
      confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

    const variance =
      confidences.reduce(
        (sum, c) => sum + Math.pow(c - avgConfidence, 2),
        0,
      ) / confidences.length;

    const consistencyScore = 1 - Math.min(1, variance);

    const uniqueOutputs = new Set(outputs.map((o) => o.output.trim()));
    const diversityScore = uniqueOutputs.size / outputs.length;

    return {
      confidenceScore: avgConfidence,
      consistencyScore,
      diversityScore,
    };
  }

  getConfig(): Required<SynthesisConfig> {
    return { ...this.config };
  }
}
