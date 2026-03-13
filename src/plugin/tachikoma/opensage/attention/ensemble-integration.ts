import type {
  AgentOutput,
  AttentionContext,
  AttentionWeights,
  AttendedOutput,
  InterAgentAttention,
  AttentionConfig,
  SynthesisConfig,
} from "./types";
import { ScaledDotProductAttention } from "./scaled-dot-product-attention";
import { DEFAULT_ATTENTION_CONFIG } from "./attention-config";

export interface EnsembleResult {
  results: AgentOutput[];
  synthesis: string;
  confidence: number;
  attentionEnabled: boolean;
  attentionWeights?: AttentionWeights;
}

export interface EnsembleContext {
  task: string;
  strategies: string[];
  mergeStrategy?: "consensus" | "majority_vote" | "best_score";
  enableAttention?: boolean;
  attentionConfig?: Partial<AttentionConfig>;
  synthesisConfig?: Partial<SynthesisConfig>;
}

export class AttentionEnsembleIntegration {
  private attentionModule: InterAgentAttention | null;
  private enableAttention: boolean;

  constructor(enableAttention: boolean = true) {
    this.enableAttention = enableAttention;
    this.attentionModule = enableAttention
      ? new ScaledDotProductAttention()
      : null;
  }

  setAttentionModule(module: InterAgentAttention): void {
    this.attentionModule = module;
  }

  getAttentionModule(): InterAgentAttention | null {
    return this.attentionModule;
  }

  enableAttentionFeature(enabled: boolean): void {
    this.enableAttention = enabled;

    if (enabled && !this.attentionModule) {
      this.attentionModule = new ScaledDotProductAttention();
    }
  }

  isAttentionEnabled(): boolean {
    return this.enableAttention && this.attentionModule !== null;
  }

  async executeEnsemble(
    context: EnsembleContext,
    agentExecutor: (strategy: string) => Promise<{ output: string; confidence: number }>,
  ): Promise<EnsembleResult> {
    const agentResults: AgentOutput[] = [];

    for (const strategy of context.strategies) {
      try {
        const result = await agentExecutor(strategy);
        agentResults.push({
          agentId: strategy,
          output: result.output,
          confidence: result.confidence,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error(`Agent ${strategy} failed:`, error);
      }
    }

    if (this.enableAttention && this.attentionModule && agentResults.length > 0) {
      return await this.executeWithAttention(context, agentResults);
    }

    return await this.executeWithoutAttention(context, agentResults);
  }

  private async executeWithAttention(
    context: EnsembleContext,
    agentOutputs: AgentOutput[],
  ): Promise<EnsembleResult> {
    if (!this.attentionModule) {
      return await this.executeWithoutAttention(context, agentOutputs);
    }

    const attentionContext: AttentionContext = {
      task: context.task,
      agentCapabilities: new Map(),
      historicalPerformance: new Map(),
      taskComplexity: "unknown",
    };

    for (const output of agentOutputs) {
      attentionContext.historicalPerformance.set(
        output.agentId,
        output.confidence,
      );
    }

    try {
      const attentionWeights = await this.attentionModule.computeAttention(
        agentOutputs,
        attentionContext,
      );

      const attendedOutput = await this.attentionModule.applyAttention(
        attentionWeights,
        agentOutputs,
      );

      return {
        results: agentOutputs,
        synthesis: attendedOutput.output,
        confidence: attendedOutput.confidence || attentionWeights.confidenceScore,
        attentionEnabled: true,
        attentionWeights: attentionWeights,
      };
    } catch (error) {
      console.error("Attention computation failed, falling back:", error);
      return await this.executeWithoutAttention(context, agentOutputs);
    }
  }

  private async executeWithoutAttention(
    context: EnsembleContext,
    agentOutputs: AgentOutput[],
  ): Promise<EnsembleResult> {
    if (agentOutputs.length === 0) {
      return {
        results: agentOutputs,
        synthesis: "",
        confidence: 0,
        attentionEnabled: false,
      };
    }

    const mergeStrategy = context.mergeStrategy || "consensus";
    const synthesis = this.synthesizeResults(agentOutputs, mergeStrategy);
    const confidence = this.computeOverallConfidence(agentOutputs);

    const result: EnsembleResult = {
      results: agentOutputs,
      synthesis,
      confidence,
      attentionEnabled: false,
    };
    return result;
  }

  private synthesizeResults(
    results: AgentOutput[],
    strategy: "consensus" | "majority_vote" | "best_score",
  ): string {
    if (results.length === 0) return "";
    if (results.length === 1) return results[0].output;

    switch (strategy) {
      case "best_score":
        const bestResult = results.reduce(
          (best, current) =>
            current.confidence > best.confidence ? current : best,
          results[0],
        );
        return bestResult.output;

      case "consensus":
        return this.buildConsensus(results);

      case "majority_vote":
      default:
        return this.majorityVote(results);
    }
  }

  private buildConsensus(results: AgentOutput[]): string {
    const parts: string[] = [];

    for (const result of results) {
      const trimmed = result.output.trim();
      if (trimmed.length > 0) {
        parts.push(trimmed);
      }
    }

    if (parts.length === 0) return "";

    if (parts.length === 1) return parts[0];

    const uniqueParts = Array.from(new Set(parts));

    if (uniqueParts.length === 1) {
      return uniqueParts[0];
    }

    return uniqueParts.join("\n\n");
  }

  private majorityVote(results: AgentOutput[]): string {
    const outputCounts = new Map<string, number>();

    for (const result of results) {
      const normalized = result.output.trim();
      const count = outputCounts.get(normalized) || 0;
      outputCounts.set(normalized, count + 1);
    }

    let maxCount = 0;
    let selectedOutput = "";

    for (const [output, count] of outputCounts.entries()) {
      if (count > maxCount || (count === maxCount && output.length > selectedOutput.length)) {
        maxCount = count;
        selectedOutput = output;
      }
    }

    return selectedOutput || results[0].output;
  }

  private computeOverallConfidence(results: AgentOutput[]): number {
    if (results.length === 0) return 0;

    const confidences = results.map((r) => r.confidence);
    const avgConfidence =
      confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

    const minConfidence = Math.min(...confidences);
    const maxConfidence = Math.max(...confidences);

    const consistencyScore = 1 - (maxConfidence - minConfidence);

    return (avgConfidence * 0.7 + consistencyScore * 0.3);
  }

  getAttentionMetrics() {
    if (!this.attentionModule) {
      return {
        enabled: false,
        metrics: null,
      };
    }

    return {
      enabled: true,
      metrics: {
        totalComputations: 0,
        averageTime: 0,
        cacheHitRate: 0,
      },
    };
  }

  reset(): void {
    this.attentionModule?.reset();
  }
}

let ensembleIntegration: AttentionEnsembleIntegration | null = null;

export function getEnsembleIntegration(): AttentionEnsembleIntegration {
  if (ensembleIntegration === null) {
    ensembleIntegration = new AttentionEnsembleIntegration();
  }
  return ensembleIntegration;
}

export function setEnsembleIntegration(
  integration: AttentionEnsembleIntegration,
): void {
  ensembleIntegration = integration;
}

export function createEnsembleIntegration(
  enableAttention: boolean = true,
): AttentionEnsembleIntegration {
  return new AttentionEnsembleIntegration(enableAttention);
}
