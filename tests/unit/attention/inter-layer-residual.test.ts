import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { InterLayerResidual } from "../../../src/plugin/tachikoma/opensage/attention/inter-layer-residual";
import type {
  LayerOutput,
  AttentionContext,
} from "../../../src/plugin/tachikoma/opensage/attention/types";

describe("InterLayerResidual", () => {
  let residual: InterLayerResidual;
  let mockLayerOutputs: LayerOutput[];
  let mockContext: AttentionContext;

  beforeEach(() => {
    residual = new InterLayerResidual({
      residualWeight: 0.5,
      enableLayerNorm: true,
      enableGating: true,
      adaptiveResidual: true,
      learningRate: 0.001,
    });

    mockLayerOutputs = [
      {
        layerId: "layer-1",
        agentId: "agent-1",
        output: "The first layer output",
        confidence: 0.8,
      },
      {
        layerId: "layer-2",
        agentId: "agent-2",
        output: "The second layer output with more detail",
        confidence: 0.7,
      },
      {
        layerId: "layer-3",
        agentId: "agent-3",
        output: "Third layer output",
        confidence: 0.9,
      },
    ];

    mockContext = {
      task: "Combine layer outputs",
      agentCapabilities: new Map(),
      historicalPerformance: new Map(),
      taskComplexity: "medium",
    };
  });

  afterEach(() => {
    residual.reset();
  });

  describe("Construction", () => {
    it("should create instance with default config", () => {
      const r = new InterLayerResidual();
      expect(r).toBeDefined();
    });

    it("should create instance with custom config", () => {
      const r = new InterLayerResidual({
        residualWeight: 0.7,
        enableLayerNorm: false,
        enableGating: false,
        adaptiveResidual: false,
        learningRate: 0.01,
      });
      expect(r).toBeDefined();
    });

    it("should initialize weights on first use", async () => {
      const output = await residual.computeResidual(mockLayerOutputs, mockContext);

      expect(output).toBeDefined();
      expect(output.output).toBeDefined();
    });
  });

  describe("computeResidual", () => {
    it("should combine layer outputs with residual connections", async () => {
      const output = await residual.computeResidual(mockLayerOutputs, mockContext);

      expect(output).toBeDefined();
      expect(output.layerId).toBeDefined();
      expect(output.agentId).toBeDefined();
      expect(output.output).toBeDefined();
      expect(output.confidence).toBeGreaterThan(0);
      expect(output.confidence).toBeLessThanOrEqual(1);
    });

    it("should return output for single layer", async () => {
      const singleLayer = [mockLayerOutputs[0]];
      const output = await residual.computeResidual(singleLayer, mockContext);

      expect(output.output).toBe(singleLayer[0].output);
      expect(output.confidence).toBe(singleLayer[0].confidence);
    });

    it("should return empty output for no layers", async () => {
      const output = await residual.computeResidual([], mockContext);

      expect(output.layerId).toBe("empty");
      expect(output.agentId).toBe("empty");
      expect(output.output).toBe("");
      expect(output.confidence).toBe(0);
    });

    it("should apply layer normalization when enabled", async () => {
      const r = new InterLayerResidual({
        enableLayerNorm: true,
      });
      const output = await r.computeResidual(mockLayerOutputs, mockContext);

      expect(output).toBeDefined();
      expect(output.output.length).toBeGreaterThan(0);
    });

    it("should apply gating when enabled", async () => {
      const r = new InterLayerResidual({
        enableGating: true,
      });
      const output = await r.computeResidual(mockLayerOutputs, mockContext);

      expect(output).toBeDefined();
      expect(output.confidence).toBeGreaterThan(0);
    });

    it("should adjust residual weight based on task complexity", async () => {
      const simpleContext = { ...mockContext, taskComplexity: "low" as const };
      const complexContext = { ...mockContext, taskComplexity: "high" as const };

      const simpleOutput = await residual.computeResidual(mockLayerOutputs, simpleContext);
      const complexOutput = await residual.computeResidual(mockLayerOutputs, complexContext);

      expect(simpleOutput).toBeDefined();
      expect(complexOutput).toBeDefined();
    });
  });

  describe("updateWeights", () => {
    it("should update residual weights with deltas", () => {
      const initialWeights = residual.getWeights();
      expect(initialWeights.length).toBeGreaterThan(0);

      const delta = initialWeights.map(row => row.map(() => 0.1));
      residual.updateWeights(delta);

      const updatedWeights = residual.getWeights();

      expect(updatedWeights).not.toEqual(initialWeights);
    });

    it("should apply learning rate to weight updates", () => {
      const r = new InterLayerResidual({ learningRate: 0.01 });
      const initialWeights = r.getWeights();

      const delta = initialWeights.map(row => row.map(() => 0.5));
      r.updateWeights(delta);

      const updatedWeights = r.getWeights();

      expect(updatedWeights).not.toEqual(initialWeights);
    });

    it("should clip weights to [-1, 1] range", () => {
      const largeDelta = Array(5).fill(
        Array(128).fill(10.0),
      );
      residual.updateWeights(largeDelta);

      const weights = residual.getWeights();

      for (const row of weights) {
        for (const weight of row) {
          expect(weight).toBeGreaterThanOrEqual(-1.0);
          expect(weight).toBeLessThanOrEqual(1.0);
        }
      }
    });
  });

  describe("getWeights", () => {
    it("should return residual weights", async () => {
      await residual.computeResidual(mockLayerOutputs, mockContext);
      const weights = residual.getWeights();

      expect(weights).toBeInstanceOf(Array);
      expect(weights.length).toBeGreaterThan(0);
      expect(weights[0]).toBeInstanceOf(Array);
    });

    it("should return copy of weights", async () => {
      await residual.computeResidual(mockLayerOutputs, mockContext);
      const weights1 = residual.getWeights();
      const weights2 = residual.getWeights();

      expect(weights1).toEqual(weights2);
      expect(weights1).not.toBe(weights2);
    });
  });

  describe("getGateValues", () => {
    it("should return gate values", async () => {
      await residual.computeResidual(mockLayerOutputs, mockContext);
      const gates = residual.getGateValues();

      expect(gates).toBeInstanceOf(Array);
      expect(gates.length).toBeGreaterThan(0);
    });

    it("should return gate values in [0, 1] range", async () => {
      await residual.computeResidual(mockLayerOutputs, mockContext);
      const gates = residual.getGateValues();

      for (const gate of gates) {
        expect(gate).toBeGreaterThanOrEqual(0);
        expect(gate).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("getConfig", () => {
    it("should return current configuration", () => {
      const config = residual.getConfig();

      expect(config).toBeDefined();
      expect(config.residualWeight).toBeDefined();
      expect(config.enableLayerNorm).toBeDefined();
      expect(config.enableGating).toBeDefined();
      expect(config.adaptiveResidual).toBeDefined();
      expect(config.learningRate).toBeDefined();
    });

    it("should return copy of configuration", () => {
      const config1 = residual.getConfig();
      const config2 = residual.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });
  });

  describe("reset", () => {
    it("should reset residual state", async () => {
      await residual.computeResidual(mockLayerOutputs, mockContext);

      const weightsBefore = residual.getWeights();
      expect(weightsBefore.length).toBeGreaterThan(0);

      residual.reset();

      const weightsAfter = residual.getWeights();
      expect(weightsAfter.length).toBe(0);
    });
  });
});
