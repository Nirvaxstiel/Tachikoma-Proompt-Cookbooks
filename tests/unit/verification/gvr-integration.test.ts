import { describe, it, expect, beforeEach } from "bun:test";
import {
  VerificationLoop,
} from "../../../src/plugin/tachikoma/verifier";
import type { VerificationContext } from "../../../src/types/common";
import { DeepVerifier } from "../../../src/plugin/tachikoma/verification/deep-verifier";
import {
  GVRRubricIntegration,
  verifyWithRubric,
} from "../../../src/plugin/tachikoma/verification/gvr-integration";
import type {
  VerificationOutcome,
  Rubric,
} from "../../../src/plugin/tachikoma/verification/types";

describe("GVRRubricIntegration", () => {
  let gvrVerifier: VerificationLoop;
  let deepVerifier: DeepVerifier;
  let integration: GVRRubricIntegration;
  let mockContext: VerificationContext;

  beforeEach(() => {
    gvrVerifier = new VerificationLoop();
    deepVerifier = new DeepVerifier({
      enableTestTimeScaling: true,
      maxHistorySize: 100,
      lazyUpdate: true,
    });

    integration = new GVRRubricIntegration(gvrVerifier, deepVerifier);

    mockContext = {
      request: "Write a function to add two numbers",
      filePath: "src/utils/math.ts",
    };
  });

  describe("Construction", () => {
    it("should create integration with default config", () => {
      const i = new GVRRubricIntegration(gvrVerifier);

      expect(i).toBeDefined();
      expect(i.getDeepVerifier()).toBeDefined();
      expect(i.getGVRVerifier()).toBeDefined();
    });

    it("should create integration with custom config", () => {
      const i = new GVRRubricIntegration(gvrVerifier, deepVerifier, {
        enableRubricVerification: false,
        combineWithGVR: false,
        rubricWeight: 0.3,
        gvrWeight: 0.7,
      });

      expect(i).toBeDefined();
    });

    it("should initialize default rubrics", () => {
      const i = new GVRRubricIntegration(gvrVerifier);

      const report = i.getRubricReport();
      expect(report.rubrics.length).toBeGreaterThan(0);
    });
  });

  describe("verifyWithGVRAndRubric", () => {
    it("should verify using both GVR and rubric", async () => {
      const result = await integration.verifyWithGVRAndRubric(
        "Write a function to add two numbers",
        "function add(a, b) { return a + b; }",
        mockContext,
      );

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.iterations).toBeGreaterThanOrEqual(0);
      expect(result.verified).toBeDefined();
      expect(result.rubricVerdict).toBeDefined();
      expect(result.gvrVerdict).toBeDefined();
      expect(result.combinedVerdict).toBeDefined();
    });

    it("should return combined verdict", async () => {
      const result = await integration.verifyWithGVRAndRubric(
        "Write a function",
        "function test() {}",
        mockContext,
      );

      expect(result.combinedVerdict).toBeDefined();
      expect(typeof result.combinedVerdict).toBe("boolean");
    });

    it("should handle empty context", async () => {
      const result = await integration.verifyWithGVRAndRubric(
        "Write code",
        "code here",
        undefined,
      );

      expect(result).toBeDefined();
    });
  });

  describe("verifyWithRubricOnly", () => {
    it("should verify using only rubric", async () => {
      const config = { enableRubricVerification: true, combineWithGVR: false };
      const i = new GVRRubricIntegration(gvrVerifier, deepVerifier, config);

      const result = await i.verifyWithRubricOnly(
        "Write a function",
        "function test() {}",
        mockContext,
      );

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.rubricVerdict).toBeDefined();
      expect(result.combinedVerdict).toBeDefined();
    });
  });

  describe("loadRubric", () => {
    it("should load custom rubric", () => {
      const customRubric = {
        id: "custom-rubric",
        name: "Custom Rubric",
        description: "A custom rubric",
        severity: "high" as const,
        weight: 0.8,
        suggestions: ["Fix this"],
        evaluate: async (outcome: VerificationOutcome) => ({
          passed: true,
          score: 1.0,
          verdict: "pass" as const,
        }),
      };

      integration.loadRubric(customRubric);

      const report = integration.getRubricReport();
      expect(report.rubrics).toContain("custom-rubric");
    });

    it("should accept rubric with medium severity", () => {
      const customRubric = {
        id: "medium-rubric",
        name: "Medium Rubric",
        description: "A medium rubric",
        suggestions: ["Suggestion"],
        evaluate: async (outcome: VerificationOutcome) => ({
          passed: true,
          score: 1.0,
          verdict: "pass" as const,
        }),
      };

      integration.loadRubric(customRubric);

      const report = integration.getRubricReport();
      expect(report.rubrics).toContain("medium-rubric");
    });

    it("should accept rubric with critical severity", () => {
      const customRubric = {
        id: "critical-rubric",
        name: "Critical Rubric",
        description: "A critical rubric",
        severity: "critical" as const,
        weight: 1.0,
        suggestions: ["Critical fix needed"],
        evaluate: async (outcome: VerificationOutcome) => ({
          passed: true,
          score: 1.0,
          verdict: "pass" as const,
        }),
      };

      integration.loadRubric(customRubric);

      const report = integration.getRubricReport();
      expect(report.rubrics).toContain("critical-rubric");
    });
  });

  describe("getRubricReport", () => {
    it("should return rubric report", () => {
      const report = integration.getRubricReport();

      expect(report).toBeDefined();
      expect(report.rubrics).toBeInstanceOf(Array);
      expect(report.statistics).toBeDefined();
      expect(report.taxonomy).toBeDefined();
    });

    it("should include all registered rubrics", () => {
      integration.loadRubric({
        id: "test-rubric-1",
        name: "Test 1",
        description: "Test",
        suggestions: [],
        evaluate: async (outcome: VerificationOutcome) => ({
          passed: true,
          score: 1.0,
          verdict: "pass" as const,
        }),
      });

      integration.loadRubric({
        id: "test-rubric-2",
        name: "Test 2",
        description: "Test",
        suggestions: [],
        evaluate: async (outcome: VerificationOutcome) => ({
          passed: true,
          score: 1.0,
          verdict: "pass" as const,
        }),
      });

      const report = integration.getRubricReport();
      expect(report.rubrics.length).toBeGreaterThan(0);
    });

    it("should include verification statistics", () => {
      const report = integration.getRubricReport();

      expect(report.statistics).toBeDefined();
      expect(report.statistics.verificationCount).toBeGreaterThanOrEqual(0);
      expect(report.statistics.passRate).toBeGreaterThanOrEqual(0);
      expect(report.statistics.avgConfidence).toBeGreaterThanOrEqual(0);
    });

    it("should include taxonomy information", () => {
      const report = integration.getRubricReport();

      expect(report.taxonomy).toBeDefined();
      expect(report.taxonomy.categories).toBeInstanceOf(Array);
      expect(report.taxonomy.subcategories).toBeInstanceOf(Map);
      expect(report.taxonomy.categories.length).toBe(5);
    });
  });

  describe("getDeepVerifier", () => {
    it("should return DeepVerifier instance", () => {
      const verifier = integration.getDeepVerifier();

      expect(verifier).toBeInstanceOf(DeepVerifier);
    });
  });

  describe("getGVRVerifier", () => {
    it("should return VerificationLoop instance", () => {
      const verifier = integration.getGVRVerifier();

      expect(verifier).toBeInstanceOf(VerificationLoop);
    });
  });
});

describe("verifyWithRubric", () => {
  it("should create integration and verify", async () => {
    const gvrVerifier = new VerificationLoop();
    const deepVerifier = new DeepVerifier();

    const result = await verifyWithRubric(
      gvrVerifier,
      deepVerifier,
      "Write a function",
      "function test() {}",
      {
        request: "Write a function",
      },
    );

    expect(result).toBeDefined();
  });
});
