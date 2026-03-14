import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { ScaledDotProductAttention } from "../../src/plugin/tachikoma/opensage/attention/scaled-dot-product-attention";
import type {
  AgentOutput,
  AttentionContext,
} from "../../src/plugin/tachikoma/opensage/attention/types";

describe("Attention Performance Benchmark", () => {
  let attention: ScaledDotProductAttention;
  let benchmarkAgentOutputs: AgentOutput[];
  let benchmarkContext: AttentionContext;

  beforeEach(() => {
    attention = new ScaledDotProductAttention({
      mechanism: "scaled-dot-product",
      numHeads: 8,
      temperature: 1.0,
      dropout: 0.1,
      enableCaching: true,
      cacheSize: 1000,
    });

    benchmarkAgentOutputs = Array.from({ length: 10 }, (_, i) => ({
      agentId: `agent-${i}`,
      output: `Agent ${i} output with detailed analysis and comprehensive solution for the given task at hand`,
      confidence: 0.7 + (i % 3) * 0.1,
      timestamp: Date.now(),
    }));

    benchmarkContext = {
      task: "Analyze and solve the complex problem with multiple approaches",
      agentCapabilities: new Map(),
      historicalPerformance: new Map(
        benchmarkAgentOutputs.map((o, i) => [o.agentId, 0.6 + (i % 4) * 0.1]),
      ),
      taskComplexity: "high",
    };
  });

  afterEach(() => {
    attention.reset();
  });

  describe("Attention Computation Time", () => {
    it("should complete attention computation within 100ms for 10 agents", async () => {
      const startTime = performance.now();
      const weights = await attention.computeAttention(benchmarkAgentOutputs, benchmarkContext);
      const endTime = performance.now();

      const computationTime = endTime - startTime;

      expect(weights).toBeDefined();
      expect(computationTime).toBeLessThan(100);
    });

    it("should complete attention computation within 50ms for 5 agents", async () => {
      const fiveAgents = benchmarkAgentOutputs.slice(0, 5);

      const startTime = performance.now();
      const weights = await attention.computeAttention(fiveAgents, benchmarkContext);
      const endTime = performance.now();

      const computationTime = endTime - startTime;

      expect(weights).toBeDefined();
      expect(computationTime).toBeLessThan(50);
    });

    it("should complete attention computation within 25ms for 3 agents", async () => {
      const threeAgents = benchmarkAgentOutputs.slice(0, 3);

      const startTime = performance.now();
      const weights = await attention.computeAttention(threeAgents, benchmarkContext);
      const endTime = performance.now();

      const computationTime = endTime - startTime;

      expect(weights).toBeDefined();
      expect(computationTime).toBeLessThan(25);
    });
  });

  describe("Cache Performance", () => {
    it("should improve performance with caching enabled", async () => {
      const timesWithoutCache: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        await attention.computeAttention(benchmarkAgentOutputs, benchmarkContext);
        timesWithoutCache.push(performance.now() - startTime);
      }

      attention.reset();

      const attentionWithCache = new ScaledDotProductAttention({
        enableCaching: true,
        cacheSize: 1000,
      });

      const timesWithCache: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        await attentionWithCache.computeAttention(benchmarkAgentOutputs, benchmarkContext);
        timesWithCache.push(performance.now() - startTime);
      }

      const avgWithoutCache =
        timesWithoutCache.reduce((sum, t) => sum + t, 0) /
        timesWithoutCache.length;
      const avgWithCache =
        timesWithCache.reduce((sum, t) => sum + t, 0) /
        timesWithCache.length;

      expect(avgWithCache).toBeLessThan(avgWithoutCache);
    });

    it("should achieve cache hit rate > 50% for repeated queries", async () => {
      for (let i = 0; i < 20; i++) {
        await attention.computeAttention(benchmarkAgentOutputs, benchmarkContext);
      }

      const metrics = attention.getPerformanceMetrics();

      expect(metrics.cacheHitRate).toBeGreaterThan(0.5);
    });
  });

  describe("Memory Usage", () => {
    it("should limit cache size to configured maximum", async () => {
      const smallCacheAttention = new ScaledDotProductAttention({
        enableCaching: true,
        cacheSize: 10,
      });

      const uniqueQueries = Array.from({ length: 20 }, (_, i) => ({
        outputs: benchmarkAgentOutputs.map((o) => ({
          ...o,
          agentId: `${o.agentId}-${i}`,
        })),
        context: {
          ...benchmarkContext,
          task: `${benchmarkContext.task} ${i}`,
        },
      }));

      for (const query of uniqueQueries) {
        await smallCacheAttention.computeAttention(query.outputs, query.context);
      }

      const metrics = smallCacheAttention.getPerformanceMetrics();

      expect(metrics.memoryUsage).toBeLessThan(10 * 1024);
    });
  });

  describe("Scalability", () => {
    it("should scale linearly with number of agents", async () => {
      const sizes = [2, 4, 6, 8, 10];
      const times: number[] = [];

      for (const size of sizes) {
        const agents = benchmarkAgentOutputs.slice(0, size);

        const startTime = performance.now();
        await attention.computeAttention(agents, benchmarkContext);
        const time = performance.now() - startTime;

        times.push(time);
      }

      for (let i = 1; i < times.length; i++) {
        const ratio = times[i] / times[i - 1];
        expect(ratio).toBeLessThan(2);
      }
    });

    it("should handle large output lengths efficiently", async () => {
      const largeOutputs = benchmarkAgentOutputs.map((o) => ({
        ...o,
        output: o.output.repeat(10),
      }));

      const startTime = performance.now();
      const weights = await attention.computeAttention(largeOutputs, benchmarkContext);
      const endTime = performance.now();

      const computationTime = endTime - startTime;

      expect(weights).toBeDefined();
      expect(computationTime).toBeLessThan(500);
    });
  });

  describe("Quality Metrics", () => {
    it("should compute meaningful confidence scores", async () => {
      const weights = await attention.computeAttention(benchmarkAgentOutputs, benchmarkContext);

      expect(weights.confidenceScore).toBeGreaterThan(0);
      expect(weights.confidenceScore).toBeLessThanOrEqual(1);
    });

    it("should produce attention weights that sum to 1", async () => {
      const weights = await attention.computeAttention(benchmarkAgentOutputs, benchmarkContext);

      const sum = Array.from(weights.agentWeights.values()).reduce((sum, w) => sum + w, 0);

      expect(sum).toBeCloseTo(1.0, 5);
    });

    it("should provide consistent results for identical inputs", async () => {
      const weights1 = await attention.computeAttention(benchmarkAgentOutputs, benchmarkContext);
      const weights2 = await attention.computeAttention(benchmarkAgentOutputs, benchmarkContext);

      expect(weights1.agentWeights).toEqual(weights2.agentWeights);
      expect(weights1.confidenceScore).toBe(weights2.confidenceScore);
    });
  });

  describe("Performance Targets", () => {
    it("should meet performance targets for ensemble operations", async () => {
      const iterations = 50;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await attention.computeAttention(benchmarkAgentOutputs, benchmarkContext);
        times.push(performance.now() - startTime);
      }

      const avgTime = times.reduce((sum: number, t: number) => sum + t, 0) / times.length;
      const maxTime = Math.max(...times);
      const p95Time = times.sort((a: number, b: number) => a - b)[Math.floor(times.length * 0.95)];

      expect(avgTime).toBeLessThan(50);
      expect(maxTime).toBeLessThan(200);
      expect(p95Time).toBeLessThan(100);
    });

    it("should maintain cache hit rate > 60% under typical workload", async () => {
      const variations = Array.from({ length: 5 }, (_, i) => ({
        outputs: benchmarkAgentOutputs.map((o) => ({
          ...o,
          agentId: `${o.agentId}-${i % 3}`,
        })),
        context: { ...benchmarkContext, task: `${benchmarkContext.task} ${i % 3}` },
      }));

      for (let i = 0; i < 30; i++) {
        const query = variations[i % variations.length];
        await attention.computeAttention(query.outputs, query.context);
      }

      const metrics = attention.getPerformanceMetrics();

      expect(metrics.cacheHitRate).toBeGreaterThan(0.6);
    });
  });
});
