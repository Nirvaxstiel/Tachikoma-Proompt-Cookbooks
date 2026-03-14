import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { ScaledDotProductAttention } from "../../../src/plugin/tachikoma/opensage/attention/scaled-dot-product-attention";
import type {
  AgentOutput,
  AttentionContext,
} from "../../../src/plugin/tachikoma/opensage/attention/types";

describe("ScaledDotProductAttention", () => {
  let attention: ScaledDotProductAttention;
  let mockAgentOutputs: AgentOutput[];
  let mockContext: AttentionContext;

  beforeEach(() => {
    attention = new ScaledDotProductAttention({
      mechanism: "scaled-dot-product",
      numHeads: 4,
      temperature: 1.0,
      dropout: 0.1,
      enableCaching: true,
      cacheSize: 100,
    });

    mockAgentOutputs = [
      {
        agentId: "agent-1",
        output: "The quick brown fox jumps over the lazy dog",
        confidence: 0.8,
        timestamp: Date.now(),
      },
      {
        agentId: "agent-2",
        output: "The lazy dog was jumped over by the quick brown fox",
        confidence: 0.7,
        timestamp: Date.now(),
      },
      {
        agentId: "agent-3",
        output: "Foxes are quick animals that jump over lazy dogs",
        confidence: 0.9,
        timestamp: Date.now(),
      },
    ];

    mockContext = {
      task: "Analyze the sentence about foxes and dogs",
      agentCapabilities: new Map(),
      historicalPerformance: new Map([
        ["agent-1", 0.75],
        ["agent-2", 0.65],
        ["agent-3", 0.85],
      ]),
      taskComplexity: "medium",
    };
  });

  afterEach(() => {
    attention.reset();
  });

  describe("Construction", () => {
    it("should create instance with default config", () => {
      const a = new ScaledDotProductAttention();
      expect(a).toBeDefined();
    });

    it("should create instance with custom config", () => {
      const a = new ScaledDotProductAttention({
        numHeads: 8,
        temperature: 0.8,
        dropout: 0.2,
      });
      expect(a).toBeDefined();
    });

    it("should initialize performance metrics", () => {
      const a = new ScaledDotProductAttention();
      const metrics = a.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalAttentionComputations).toBe(0);
    });
  });

  describe("computeAttention", () => {
    it("should compute attention weights for agent outputs", async () => {
      const weights = await attention.computeAttention(mockAgentOutputs, mockContext);

      expect(weights).toBeDefined();
      expect(weights.agentWeights).toBeInstanceOf(Map);
      expect(weights.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(weights.confidenceScore).toBeLessThanOrEqual(1);
      expect(weights.attentionMatrix).toBeInstanceOf(Array);
    });

    it("should normalize agent weights to sum to 1", async () => {
      const weights = await attention.computeAttention(mockAgentOutputs, mockContext);

      const sum = Array.from(weights.agentWeights.values()).reduce((sum, w) => sum + w, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it("should handle empty agent outputs", async () => {
      const weights = await attention.computeAttention([], mockContext);

      expect(weights.agentWeights.size).toBe(0);
      expect(weights.confidenceScore).toBe(0);
      expect(weights.attentionMatrix.length).toBe(0);
    });

    it("should use historical performance in weights", async () => {
      const weights = await attention.computeAttention(mockAgentOutputs, mockContext);

      expect(weights.agentWeights.has("agent-1")).toBe(true);
      expect(weights.agentWeights.has("agent-2")).toBe(true);
      expect(weights.agentWeights.has("agent-3")).toBe(true);

      const agent3Weight = weights.agentWeights.get("agent-3") || 0;
      const agent2Weight = weights.agentWeights.get("agent-2") || 0;

      expect(agent3Weight).toBeGreaterThan(agent2Weight);
    });

    it("should cache attention computations when enabled", async () => {
      const start1 = performance.now();
      const weights1 = await attention.computeAttention(mockAgentOutputs, mockContext);
      const time1 = performance.now() - start1;

      const start2 = performance.now();
      const weights2 = await attention.computeAttention(mockAgentOutputs, mockContext);
      const time2 = performance.now() - start2;

      expect(weights2).toEqual(weights1);
      expect(time2).toBeLessThan(time1);
    });
  });

  describe("applyAttention", () => {
    it("should apply attention weights to outputs", async () => {
      const weights = await attention.computeAttention(mockAgentOutputs, mockContext);
      const attended = await attention.applyAttention(weights, mockAgentOutputs);

      expect(attended).toBeDefined();
      expect(attended.output).toBeDefined();
      expect(attended.confidence).toBeDefined();
      expect(attended.attentionWeights).toBeDefined();
    });

    it("should combine outputs based on attention weights", async () => {
      const weights = await attention.computeAttention(mockAgentOutputs, mockContext);
      const attended = await attention.applyAttention(weights, mockAgentOutputs);

      expect(attended.output.length).toBeGreaterThan(0);
      expect(attended.output).toContain("fox");
      expect(attended.output).toContain("dog");
    });

    it("should adjust confidence based on attention weights", async () => {
      const weights = await attention.computeAttention(mockAgentOutputs, mockContext);
      const attended = await attention.applyAttention(weights, mockAgentOutputs);

      expect(attended.confidence).toBeGreaterThan(0);
      expect(attended.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("getAttentionScores", () => {
    it("should return attention scores map", async () => {
      await attention.computeAttention(mockAgentOutputs, mockContext);
      const scores = attention.getAttentionScores();

      expect(scores).toBeInstanceOf(Map);
    });
  });

  describe("getAttentionMatrix", () => {
    it("should return attention weight matrix", async () => {
      await attention.computeAttention(mockAgentOutputs, mockContext);
      const matrix = attention.getAttentionMatrix();

      expect(matrix).toBeInstanceOf(Array);
      if (matrix.length > 0) {
        expect(matrix[0]).toBeInstanceOf(Array);
      }
    });
  });

  describe("getPerformanceMetrics", () => {
    it("should return performance metrics", async () => {
      await attention.computeAttention(mockAgentOutputs, mockContext);
      const metrics = attention.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalAttentionComputations).toBeGreaterThan(0);
      expect(metrics.averageAttentionTime).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it("should track cache hit rate correctly", async () => {
      await attention.computeAttention(mockAgentOutputs, mockContext);
      await attention.computeAttention(mockAgentOutputs, mockContext);

      const metrics = attention.getPerformanceMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe("reset", () => {
    it("should reset attention state", async () => {
      await attention.computeAttention(mockAgentOutputs, mockContext);

      const metricsBefore = attention.getPerformanceMetrics();
      expect(metricsBefore.totalAttentionComputations).toBeGreaterThan(0);

      attention.reset();

      const metricsAfter = attention.getPerformanceMetrics();
      expect(metricsAfter.totalAttentionComputations).toBe(0);
      expect(metricsAfter.cacheHitRate).toBe(0);
      expect(metricsAfter.memoryUsage).toBe(0);
    });
  });
});
