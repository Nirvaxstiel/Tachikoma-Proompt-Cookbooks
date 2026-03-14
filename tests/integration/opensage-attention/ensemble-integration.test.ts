import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  AttentionEnsembleIntegration,
  type EnsembleContext,
  type EnsembleResult,
} from "../../../src/plugin/tachikoma/opensage/attention/ensemble-integration";

describe("AttentionEnsembleIntegration", () => {
  let integration: AttentionEnsembleIntegration;

  beforeEach(() => {
    integration = new AttentionEnsembleIntegration(true);
  });

  afterEach(() => {
    integration.reset();
  });

  describe("Construction", () => {
    it("should create integration with attention enabled", () => {
      const i = new AttentionEnsembleIntegration(true);
      expect(i).toBeDefined();
      expect(i.isAttentionEnabled()).toBe(true);
    });

    it("should create integration with attention disabled", () => {
      const i = new AttentionEnsembleIntegration(false);
      expect(i).toBeDefined();
      expect(i.isAttentionEnabled()).toBe(false);
    });

    it("should initialize attention module", () => {
      const i = new AttentionEnsembleIntegration(true);
      expect(i.getAttentionModule()).toBeDefined();
    });
  });

  describe("executeEnsemble", () => {
    it("should execute ensemble with attention enabled", async () => {
      const context: EnsembleContext = {
        task: "Write a function",
        strategies: ["approach-1", "approach-2", "approach-3"],
        mergeStrategy: "consensus",
        enableAttention: true,
      };

      const agentExecutor = async (strategy: string) => ({
        output: `Output from ${strategy}`,
        confidence: 0.8,
      });

      const result = await integration.executeEnsemble(context, agentExecutor);

      expect(result).toBeDefined();
      expect(result.results).toBeInstanceOf(Array);
      expect(result.synthesis).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.attentionEnabled).toBe(true);
      expect(result.attentionWeights).toBeDefined();
    });

    it("should execute ensemble with attention disabled", async () => {
      const i = new AttentionEnsembleIntegration(false);
      const context: EnsembleContext = {
        task: "Write a function",
        strategies: ["approach-1", "approach-2"],
        mergeStrategy: "consensus",
        enableAttention: false,
      };

      const agentExecutor = async (strategy: string) => ({
        output: `Output from ${strategy}`,
        confidence: 0.8,
      });

      const result = await i.executeEnsemble(context, agentExecutor);

      expect(result).toBeDefined();
      expect(result.attentionEnabled).toBe(false);
      expect(result.attentionWeights).toBeUndefined();
    });

    it("should handle empty strategies", async () => {
      const context: EnsembleContext = {
        task: "Test",
        strategies: [],
        mergeStrategy: "consensus",
        enableAttention: true,
      };

      const agentExecutor = async () => ({
        output: "Output",
        confidence: 0.8,
      });

      const result = await integration.executeEnsemble(context, agentExecutor);

      expect(result).toBeDefined();
      expect(result.results.length).toBe(0);
    });

    it("should handle agent failures gracefully", async () => {
      const context: EnsembleContext = {
        task: "Test",
        strategies: ["approach-1", "approach-2", "approach-3"],
        mergeStrategy: "consensus",
        enableAttention: true,
      };

      let callCount = 0;
      const agentExecutor = async (strategy: string) => {
        callCount++;
        if (strategy === "approach-2") {
          throw new Error("Agent failed");
        }
        return {
          output: `Output from ${strategy}`,
          confidence: 0.8,
        };
      };

      const result = await integration.executeEnsemble(context, agentExecutor);

      expect(result).toBeDefined();
      expect(result.results.length).toBeLessThan(3);
    });

    it("should apply attention weights to outputs", async () => {
      const context: EnsembleContext = {
        task: "Test",
        strategies: ["agent-1", "agent-2"],
        mergeStrategy: "consensus",
        enableAttention: true,
      };

      const agentExecutor = async (strategy: string) => ({
        output: `Output from ${strategy}`,
        confidence: strategy === "agent-1" ? 0.9 : 0.7,
      });

      const result = await integration.executeEnsemble(context, agentExecutor);

      expect(result).toBeDefined();
      expect(result.attentionWeights).toBeDefined();
      expect(result.attentionWeights?.agentWeights.size).toBeGreaterThan(0);
    });
  });

  describe("Synthesis Strategies", () => {
    it("should use consensus merge strategy", async () => {
      const context: EnsembleContext = {
        task: "Test",
        strategies: ["a", "b", "c"],
        mergeStrategy: "consensus",
        enableAttention: false,
      };

      const agentExecutor = async (strategy: string) => ({
        output: "Same output",
        confidence: 0.8,
      });

      const result = await integration.executeEnsemble(context, agentExecutor);

      expect(result.synthesis).toBe("Same output");
    });

    it("should use best_score merge strategy", async () => {
      const context: EnsembleContext = {
        task: "Test",
        strategies: ["a", "b"],
        mergeStrategy: "best_score",
        enableAttention: false,
      };

      const agentExecutor = async (strategy: string) => ({
        output: `Output ${strategy}`,
        confidence: strategy === "a" ? 0.9 : 0.7,
      });

      const result = await integration.executeEnsemble(context, agentExecutor);

      expect(result.synthesis).toBe("Output a");
    });

    it("should use majority_vote merge strategy", async () => {
      const context: EnsembleContext = {
        task: "Test",
        strategies: ["a", "b", "c"],
        mergeStrategy: "majority_vote",
        enableAttention: false,
      };

      const agentExecutor = async (strategy: string) => ({
        output: strategy === "a" || strategy === "b" ? "Output A" : "Output B",
        confidence: 0.8,
      });

      const result = await integration.executeEnsemble(context, agentExecutor);

      expect(result.synthesis).toBe("Output A");
    });
  });

  describe("Attention Management", () => {
    it("should enable attention feature", () => {
      const i = new AttentionEnsembleIntegration(false);
      i.enableAttentionFeature(true);

      expect(i.isAttentionEnabled()).toBe(true);
    });

    it("should disable attention feature", () => {
      integration.enableAttentionFeature(false);

      expect(integration.isAttentionEnabled()).toBe(false);
    });

    it("should set custom attention module", () => {
      const mockModule = {
        computeAttention: async () => ({
          agentWeights: new Map(),
          confidenceScore: 0.8,
          attentionMatrix: [],
        }),
        applyAttention: async () => ({
          output: "Test output",
          confidence: 0.8,
          attentionWeights: {
            agentWeights: new Map(),
            confidenceScore: 0.8,
            attentionMatrix: [],
          },
        }),
        getAttentionScores: () => new Map(),
        getAttentionMatrix: () => [],
        reset: () => {},
      };

      integration.setAttentionModule(mockModule as any);

      expect(integration.getAttentionModule()).toBeDefined();
    });

    it("should provide attention metrics", () => {
      const metrics = integration.getAttentionMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.enabled).toBeDefined();
    });
  });

  describe("Confidence Calculation", () => {
    it("should compute overall confidence correctly", async () => {
      const context: EnsembleContext = {
        task: "Test",
        strategies: ["a", "b", "c"],
        mergeStrategy: "consensus",
        enableAttention: false,
      };

      const agentExecutor = async (strategy: string) => ({
        output: `Output ${strategy}`,
        confidence: strategy === "a" ? 0.9 : strategy === "b" ? 0.8 : 0.7,
      });

      const result = await integration.executeEnsemble(context, agentExecutor);

      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.confidence).toBeLessThanOrEqual(0.9);
    });

    it("should handle consistent confidences", async () => {
      const context: EnsembleContext = {
        task: "Test",
        strategies: ["a", "b"],
        mergeStrategy: "consensus",
        enableAttention: false,
      };

      const agentExecutor = async () => ({
        output: "Same output",
        confidence: 0.8,
      });

      const result = await integration.executeEnsemble(context, agentExecutor);

      expect(result.confidence).toBeCloseTo(0.8, 1);
    });
  });

  describe("reset", () => {
    it("should reset integration state", async () => {
      const context: EnsembleContext = {
        task: "Test",
        strategies: ["a", "b"],
        mergeStrategy: "consensus",
        enableAttention: true,
      };

      const agentExecutor = async (strategy: string) => ({
        output: `Output ${strategy}`,
        confidence: 0.8,
      });

      await integration.executeEnsemble(context, agentExecutor);

      integration.reset();

      const metrics = integration.getAttentionMetrics();
      expect(metrics.enabled).toBeDefined();
    });
  });
});
