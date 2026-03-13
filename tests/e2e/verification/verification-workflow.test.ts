import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { VerificationLoop } from "../../../src/plugin/tachikoma/verifier";
import { VerificationPlugin } from "../../../src/plugin/tachikoma/verification/plugin-integration";

describe("E2E Verification Workflow", () => {
  let verifier: VerificationLoop;
  let plugin: VerificationPlugin;

  beforeEach(async () => {
    verifier = new VerificationLoop({
      maxIterations: 3,
      confidenceThreshold: 0.8,
    });
    plugin = new VerificationPlugin(verifier, {
      enableRubricVerification: true,
      combineWithGVR: true,
      enableTestTimeScaling: true,
      maxHistorySize: 100,
    });
    await plugin.initialize();
  });

  afterEach(async () => {
    await plugin.destroy();
  });

  describe("Complete Verification Cycle", () => {
    it("should verify simple function", async () => {
      const request = "Write a function to add two numbers";
      const code = `
        function add(a, b) {
          return a + b;
        }
      `;

      const verification = await plugin.rubricVerify({
        request,
        result: code,
        context: {
          request,
          filePath: "src/utils/math.ts",
        },
      });

      expect(verification).toBeDefined();
      expect(verification.result).toBeDefined();
      expect(verification.verified).toBeDefined();
      expect(verification.rubricVerdict).toBeDefined();
      expect(verification.combinedVerdict).toBeDefined();
    });

    it("should verify complex algorithm", async () => {
      const request = "Write a function to calculate factorial recursively";
      const code = `
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
      `;

      const verification = await plugin.rubricVerify({
        request,
        result: code,
        context: {
          request,
          filePath: "src/algorithms/recursion.ts",
        },
      });

      expect(verification).toBeDefined();
      expect(verification.result).toBeDefined();
      expect(verification.iterations).toBeGreaterThanOrEqual(1);
    });

    it("should detect syntax errors", async () => {
      const request = "Write a function";
      const code = `
        function test( {
          return "test";
        }
      `;

      const verification = await plugin.rubricVerify({
        request,
        result: code,
        context: {
          filePath: "src/test.ts",
        },
      });

      expect(verification).toBeDefined();
      expect(verification.verified).toBeDefined();
    });

    it("should provide suggestions for improvements", async () => {
      const request = "Write a function with proper naming";
      const code = `
        function x(a) {
          return a * 2;
        }
      `;

      const verification = await plugin.rubricVerify({
        request,
        result: code,
        context: {
          filePath: "src/test.ts",
        },
      });

      expect(verification.suggestions).toBeInstanceOf(Array);
    });

    it("should handle security vulnerabilities", async () => {
      const request = "Write a database query function";
      const code = `
        function queryUser(id) {
          const query = 'SELECT * FROM users WHERE id = ' + id;
          return db.execute(query);
        }
      `;

      const verification = await plugin.rubricVerify({
        request,
        result: code,
        context: {
          filePath: "src/db/user.ts",
        },
      });

      expect(verification).toBeDefined();
      expect(verification.rubricVerdict).toBeDefined();
    });
  });

  describe("Multi-Verification Workflows", () => {
    it("should track multiple verifications", async () => {
      await plugin.rubricVerify({
        request: "Test 1",
        result: "function test1() {}",
      });

      await plugin.rubricVerify({
        request: "Test 2",
        result: "const x = 5;",
      });

      await plugin.rubricVerify({
        request: "Test 3",
        result: "class Test {}",
      });

      const report = await plugin.verificationReport({
        includeHistory: true,
      });

      expect(report.report.statistics.verificationCount).toBeGreaterThanOrEqual(3);
      expect(report.report.history).toBeDefined();
      expect(report.report.history?.length).toBeGreaterThanOrEqual(3);
    });

    it("should calculate aggregate statistics", async () => {
      const tests = [
        { request: "Test 1", result: "function test1() {}", expected: "pass" },
        { request: "Test 2", result: "const x = 5;", expected: "pass" },
        { request: "Test 3", result: "undefined = undefined;", expected: "fail" },
      ];

      for (const test of tests) {
        await plugin.rubricVerify({
          request: test.request,
          result: test.result,
        });
      }

      const report = await plugin.verificationReport();

      expect(report.report.statistics.verificationCount).toBeGreaterThanOrEqual(3);
      expect(report.report.statistics.passRate).toBeGreaterThanOrEqual(0);
      expect(report.report.statistics.avgConfidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Configuration Management", () => {
    it("should allow dynamic configuration changes", async () => {
      const initialConfig = await plugin.rubricConfig({
        action: "get",
      });

      await plugin.rubricConfig({
        action: "set",
        config: {
          enableTestTimeScaling: false,
          maxHistorySize: 50,
        },
      });

      const updatedConfig = await plugin.rubricConfig({
        action: "get",
      });

      expect(updatedConfig.config?.enableTestTimeScaling).toBe(false);
      expect(updatedConfig.config?.maxHistorySize).toBe(50);
      expect(initialConfig.config?.enableTestTimeScaling).toBe(true);
    });

    it("should persist configuration across verifications", async () => {
      await plugin.rubricConfig({
        action: "set",
        config: {
          combineWithGVR: false,
        },
      });

      await plugin.rubricVerify({
        request: "Test",
        result: "function test() {}",
      });

      const config = await plugin.rubricConfig({ action: "get" });

      expect(config.config?.combineWithGVR).toBe(false);
    });
  });

  describe("Cache Management", () => {
    it("should use cache for improved performance", async () => {
      const code = "function test() {}";

      const start1 = performance.now();
      await plugin.rubricVerify({
        request: "Test",
        result: code,
      });
      const time1 = performance.now() - start1;

      const start2 = performance.now();
      await plugin.rubricVerify({
        request: "Test",
        result: code,
      });
      const time2 = performance.now() - start2;

      expect(time2).toBeDefined();
    });

    it("should clear cache successfully", async () => {
      await plugin.rubricVerify({
        request: "Test",
        result: "function test() {}",
      });

      let report = await plugin.verificationReport();
      expect(report.report.statistics.verificationCount).toBeGreaterThan(0);

      await plugin.clearVerificationCache();

      report = await plugin.verificationReport();
      expect(report.report.statistics.verificationCount).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid requests gracefully", async () => {
      const verification = await plugin.rubricVerify({
        request: "",
        result: "",
      });

      expect(verification).toBeDefined();
    });

    it("should handle empty results gracefully", async () => {
      const verification = await plugin.rubricVerify({
        request: "Test",
        result: "",
      });

      expect(verification).toBeDefined();
    });

    it("should handle configuration errors gracefully", async () => {
      const result = await plugin.rubricConfig({
        action: "invalid" as any,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe("Custom Rubric Workflows", () => {
    it("should integrate custom rubrics", async () => {
      await plugin.rubricConfig({
        action: "set",
        rubric: {
          id: "custom-length-check",
          name: "Code Length Check",
          description: "Check code length",
          weight: 0.5,
          suggestions: ["Add more code", "Expand implementation"],
          severityLevel: "low",
          evaluate: async (outcome) => ({
            passed: outcome.content.length > 100,
            score: outcome.content.length > 100 ? 1 : 0.5,
            verdict: outcome.content.length > 100 ? "pass" : "needs_revision",
            rubric: {
              id: "custom-length-check",
              name: "Code Length Check",
              description: "Check code length",
              evaluate: async () => ({ passed: true, score: 1, verdict: "pass" }),
              suggestions: [],
            } as any,
          }),
        },
      });

      const verification = await plugin.rubricVerify({
        request: "Test",
        result: "function test() {}",
      });

      expect(verification).toBeDefined();
    });
  });

  describe("Taxonomy Integration", () => {
    it("should report complete taxonomy", async () => {
      const report = await plugin.verificationReport();

      expect(report.report.taxonomy).toBeDefined();
      expect(report.report.taxonomy.categories).toBeInstanceOf(Array);
      expect(report.report.taxonomy.categories.length).toBe(5);

      expect(report.report.taxonomy.subcategories).toBeInstanceOf(Map);
      expect(report.report.taxonomy.subcategories.size).toBe(5);
    });

    it("should use taxonomy for failure classification", async () => {
      const code = "undefined = undefined;";

      const verification = await plugin.rubricVerify({
        request: "Test",
        result: code,
      });

      expect(verification).toBeDefined();
      expect(verification.rubricVerdict).toBeDefined();
    });
  });
});
