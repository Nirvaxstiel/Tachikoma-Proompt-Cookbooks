import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { VerificationLoop } from "../../../src/plugin/tachikoma/verifier";
import { VerificationPlugin } from "../../../src/plugin/tachikoma/verification/plugin-integration";

describe("VerificationPlugin Integration", () => {
  let verifier: VerificationLoop;
  let plugin: VerificationPlugin;

  beforeEach(async () => {
    verifier = new VerificationLoop();
    plugin = new VerificationPlugin(verifier);
    await plugin.initialize();
  });

  afterEach(async () => {
    await plugin.destroy();
  });

  describe("Initialization", () => {
    it("should initialize plugin successfully", async () => {
      const p = new VerificationPlugin(verifier);
      await p.initialize();

      expect(p.isInitialized()).toBe(true);

      await p.destroy();
    });

    it("should not initialize twice", async () => {
      await plugin.initialize();

      expect(plugin.isInitialized()).toBe(true);

      await plugin.destroy();
      expect(plugin.isInitialized()).toBe(false);
    });

    it("should destroy plugin successfully", async () => {
      await plugin.initialize();
      await plugin.destroy();

      expect(plugin.isInitialized()).toBe(false);
    });
  });

  describe("rubricVerify tool", () => {
    it("should verify code using rubrics", async () => {
      const result = await plugin.rubricVerify({
        request: "Write a function to add two numbers",
        result: "function add(a, b) { return a + b; }",
        context: {
          request: "Write a function to add two numbers",
          filePath: "src/utils/math.ts",
        },
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.iterations).toBeGreaterThanOrEqual(0);
      expect(result.verified).toBeDefined();
      expect(result.rubricVerdict).toBeDefined();
      expect(result.gvrVerdict).toBeDefined();
      expect(result.combinedVerdict).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it("should verify code without context", async () => {
      const result = await plugin.rubricVerify({
        request: "Write code",
        result: "function test() {}",
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
    });

    it("should return suggestions when verification fails", async () => {
      const result = await plugin.rubricVerify({
        request: "Write a function",
        result: "undefined = undefined",
        context: {
          filePath: "src/test.ts",
        },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe("rubricConfig tool", () => {
    it("should get current configuration", async () => {
      const result = await plugin.rubricConfig({
        action: "get",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.config).toBeDefined();
      expect(result.rubrics).toBeInstanceOf(Array);
    });

    it("should update configuration", async () => {
      const result = await plugin.rubricConfig({
        action: "set",
        config: {
          enableTestTimeScaling: false,
          maxHistorySize: 500,
        },
      });

      expect(result.success).toBe(true);
      expect(result.config?.enableTestTimeScaling).toBe(false);
      expect(result.config?.maxHistorySize).toBe(500);
    });

    it("should load custom rubric", async () => {
      const result = await plugin.rubricConfig({
        action: "set",
        rubric: {
          id: "custom-test-rubric",
          name: "Custom Test Rubric",
          description: "A custom test rubric",
          weight: 0.7,
          suggestions: ["Fix this"],
          severityLevel: "medium",
          evaluate: async (outcome) => ({
            passed: outcome.content.length > 0,
            score: 0.8,
            verdict: outcome.content.length > 0 ? "pass" : "fail",
            rubric: {
              id: "custom-test-rubric",
              name: "Custom Test Rubric",
              description: "A custom test rubric",
              evaluate: async () => ({ passed: true, score: 1, verdict: "pass" }),
              suggestions: ["Fix this"],
            } as any,
          }),
        },
      });

      expect(result.success).toBe(true);
      expect(result.rubrics).toContain("custom-test-rubric");
    });

    it("should reset configuration", async () => {
      await plugin.rubricConfig({
        action: "set",
        config: {
          enableTestTimeScaling: false,
        },
      });

      const resetResult = await plugin.rubricConfig({
        action: "reset",
      });

      expect(resetResult.success).toBe(true);
      expect(resetResult.config?.enableTestTimeScaling).toBe(true);
    });

    it("should handle unknown action", async () => {
      const result = await plugin.rubricConfig({
        action: "unknown" as any,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Unknown action");
    });
  });

  describe("verificationReport tool", () => {
    it("should get verification report", async () => {
      const result = await plugin.verificationReport();

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      expect(result.report.rubrics).toBeInstanceOf(Array);
      expect(result.report.statistics).toBeDefined();
      expect(result.report.taxonomy).toBeDefined();
      expect(result.report.history).toBeUndefined();
    });

    it("should get report with history", async () => {
      await plugin.rubricVerify({
        request: "Test",
        result: "function test() {}",
      });

      const result = await plugin.verificationReport({
        includeHistory: true,
      });

      expect(result.success).toBe(true);
      expect(result.report.history).toBeInstanceOf(Array);
    });

    it("should include correct statistics", async () => {
      await plugin.rubricVerify({
        request: "Test",
        result: "function test() {}",
      });
      await plugin.rubricVerify({
        request: "Test 2",
        result: "const x = 5;",
      });

      const result = await plugin.verificationReport();

      expect(result.report.statistics.verificationCount).toBeGreaterThanOrEqual(
        2,
      );
      expect(result.report.statistics.passRate).toBeGreaterThanOrEqual(0);
      expect(result.report.statistics.avgConfidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe("clear-verification-cache tool", () => {
    it("should clear verification cache", async () => {
      await plugin.rubricVerify({
        request: "Test",
        result: "function test() {}",
      });

      const statsBefore = await plugin.verificationReport();
      expect(
        statsBefore.report.statistics.verificationCount,
      ).toBeGreaterThanOrEqual(1);

      const clearResult = await plugin.clearVerificationCache();

      expect(clearResult.success).toBe(true);
      expect(clearResult.message).toContain("successfully");

      const statsAfter = await plugin.verificationReport();
      expect(statsAfter.report.statistics.verificationCount).toBe(0);
    });
  });

  describe("getTools", () => {
    it("should return all tool functions", () => {
      const tools = plugin.getTools();

      expect(tools).toBeDefined();
      expect(tools["rubric-verify"]).toBeDefined();
      expect(tools["rubric-config"]).toBeDefined();
      expect(tools["verification-report"]).toBeDefined();
      expect(tools["clear-verification-cache"]).toBeDefined();
    });

    it("should have correct tool functions", () => {
      const tools = plugin.getTools();

      expect(typeof tools["rubric-verify"]).toBe("function");
      expect(typeof tools["rubric-config"]).toBe("function");
      expect(typeof tools["verification-report"]).toBe("function");
      expect(typeof tools["clear-verification-cache"]).toBe("function");
    });
  });

  describe("getConfig", () => {
    it("should return current configuration", () => {
      const config = plugin.getConfig();

      expect(config).toBeDefined();
      expect(config.enableRubricVerification).toBeDefined();
      expect(config.combineWithGVR).toBeDefined();
      expect(config.enableTestTimeScaling).toBeDefined();
      expect(config.maxHistorySize).toBeDefined();
      expect(config.confidenceThresholds).toBeDefined();
    });

    it("should return a copy of configuration", () => {
      const config1 = plugin.getConfig();
      const config2 = plugin.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });
  });

  describe("getDeepVerifier", () => {
    it("should return DeepVerifier instance", () => {
      const verifier = plugin.getDeepVerifier();

      expect(verifier).toBeDefined();
      expect(verifier.getAllRubrics).toBeDefined();
      expect(verifier.getStatistics).toBeDefined();
    });
  });

  describe("getIntegration", () => {
    it("should return GVRRubricIntegration instance", () => {
      const integration = plugin.getIntegration();

      expect(integration).toBeDefined();
      expect(integration.getDeepVerifier).toBeDefined();
      expect(integration.getGVRVerifier).toBeDefined();
      expect(integration.getRubricReport).toBeDefined();
    });
  });
});

describe("VerificationPlugin End-to-End Workflow", () => {
  let verifier: VerificationLoop;
  let plugin: VerificationPlugin;

  beforeEach(async () => {
    verifier = new VerificationLoop();
    plugin = new VerificationPlugin(verifier);
    await plugin.initialize();
  });

  afterEach(async () => {
    await plugin.destroy();
  });

  it("should complete full verification workflow", async () => {
    const request = "Write a function to calculate factorial";

    const verification1 = await plugin.rubricVerify({
      request,
      result: "function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }",
      context: { request, filePath: "src/math.ts" },
    });

    expect(verification1.verified).toBeDefined();

    const report = await plugin.verificationReport({ includeHistory: true });

    expect(report.report.statistics.verificationCount).toBeGreaterThanOrEqual(1);
    expect(report.report.history).toBeInstanceOf(Array);

    const config = await plugin.rubricConfig({ action: "get" });

    expect(config.rubrics?.length).toBeGreaterThan(0);

    await plugin.clearVerificationCache();

    const finalStats = await plugin.verificationReport();

    expect(finalStats.report.statistics.verificationCount).toBe(0);
  });
});
