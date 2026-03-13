import { describe, it, expect, beforeEach } from "bun:test";
import { DeepVerifier } from "../../../src/plugin/tachikoma/verification/deep-verifier";
import type {
  Rubric,
  VerificationContext,
  VerificationOutcome,
} from "../../../src/plugin/tachikoma/verification/types";

describe("DeepVerifier", () => {
  let verifier: DeepVerifier;
  let mockRubric: Rubric;
  let mockOutcome: VerificationOutcome;
  let mockContext: VerificationContext;

  beforeEach(() => {
    verifier = new DeepVerifier({
      enableTestTimeScaling: true,
      maxHistorySize: 10,
      lazyUpdate: true,
    });

    mockRubric = {
      id: "test-rubric",
      name: "Test Rubric",
      description: "A test rubric",
      evaluate: async (outcome: VerificationOutcome) => ({
        passed: true,
        score: 1.0,
        verdict: "pass",
        rubric: mockRubric,
      }),
      suggestions: ["Fix this issue"],
      severityLevel: "medium",
      weight: 0.5,
    };

    mockOutcome = {
      id: "outcome-1",
      content: "test content",
      timestamp: Date.now(),
      verdict: "pass",
      verdictConfidenceValue: 0.9,
    };

    mockContext = {
      request: "Test request",
    };
  });

  describe("Construction", () => {
    it("should create instance with default config", () => {
      const v = new DeepVerifier();
      expect(v).toBeDefined();
      expect(v.getAllRubrics()).toEqual([]);
    });

    it("should create instance with custom config", () => {
      const v = new DeepVerifier({
        enableTestTimeScaling: false,
        maxHistorySize: 500,
        lazyUpdate: false,
      });
      expect(v).toBeDefined();
    });
  });

  describe("registerRubric", () => {
    it("should register a rubric", () => {
      verifier.registerRubric(mockRubric);

      const rubrics = verifier.getAllRubrics();
      expect(rubrics).toHaveLength(1);
      expect(rubrics).toContain("test-rubric");
    });

    it("should register multiple rubrics", () => {
      const rubric2: Rubric = {
        ...mockRubric,
        id: "test-rubric-2",
      };

      verifier.registerRubric(mockRubric);
      verifier.registerRubric(rubric2);

      const rubrics = verifier.getAllRubrics();
      expect(rubrics).toHaveLength(2);
    });

    it("should replace rubric with same ID", () => {
      verifier.registerRubric(mockRubric);

      const updatedRubric: Rubric = {
        ...mockRubric,
        name: "Updated Rubric",
      };

      verifier.registerRubric(updatedRubric);

      const rubrics = verifier.getAllRubrics();
      expect(rubrics).toHaveLength(1);

      const retrieved = verifier.getRubric("test-rubric");
      expect(retrieved?.name).toBe("Updated Rubric");
    });
  });

  describe("verifyOutcome", () => {
    it("should verify outcome against registered rubrics", async () => {
      verifier.registerRubric(mockRubric);

      const result = await verifier.verifyOutcome(mockOutcome, mockContext);

      expect(result).toBeDefined();
      expect(result.verdict).toBeDefined();
      expect(result.verdictConfidence).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it("should return pass verdict when all rubrics pass", async () => {
      verifier.registerRubric(mockRubric);

      const result = await verifier.verifyOutcome(mockOutcome, mockContext);

      expect(result.verdict).toBe("pass");
    });

    it("should fail verdict when critical rubric fails", async () => {
      const criticalRubric: Rubric = {
        ...mockRubric,
        id: "critical-rubric",
        severityLevel: "critical",
        evaluate: async (outcome: VerificationOutcome) => ({
          passed: false,
          score: 0.0,
          verdict: "fail",
          rubric: criticalRubric,
          feedback: "Critical failure",
        }),
      };

      verifier.registerRubric(criticalRubric);

      const result = await verifier.verifyOutcome(mockOutcome, mockContext);

      expect(result.verdict).not.toBe("pass");
    });

    it("should generate suggestions from failed rubrics", async () => {
      const failingRubric: Rubric = {
        ...mockRubric,
        id: "failing-rubric",
        evaluate: async (outcome: VerificationOutcome) => ({
          passed: false,
          score: 0.3,
          verdict: "needs_revision",
          rubric: failingRubric,
          feedback: "Issues found",
        }),
        suggestions: ["Fix issue 1", "Fix issue 2"],
      };

      verifier.registerRubric(failingRubric);

      const result = await verifier.verifyOutcome(mockOutcome, mockContext);

      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it("should add outcome to history when test-time scaling enabled", async () => {
      verifier.registerRubric(mockRubric);

      const statsBefore = verifier.getStatistics();
      expect(statsBefore.verificationCount).toBe(0);

      await verifier.verifyOutcome(mockOutcome, mockContext);

      const statsAfter = verifier.getStatistics();
      expect(statsAfter.verificationCount).toBe(1);
    });
  });

  describe("verifyAgainstRubric", () => {
    it("should verify against specific rubric", async () => {
      verifier.registerRubric(mockRubric);

      const result = await verifier.verifyAgainstRubric(
        "test-rubric",
        mockOutcome,
        mockContext,
      );

      expect(result).toBeDefined();
      expect(result.passed).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.verdict).toBe("pass");
    });

    it("should throw error for non-existent rubric", async () => {
      await expect(
        verifier.verifyAgainstRubric("non-existent", mockOutcome, mockContext),
      ).rejects.toThrow("Rubric non-existent not found");
    });
  });

  describe("computeVerdict", () => {
    it("should return pass when all rubrics pass", async () => {
      verifier.registerRubric(mockRubric);

      const result = await verifier.verifyOutcome(mockOutcome, mockContext);

      expect(result.verdict).toBe("pass");
      expect(result.verdictConfidence).toBeGreaterThan(0.5);
    });

    it("should return fail when many rubrics fail", async () => {
      const failingRubric: Rubric = {
        ...mockRubric,
        id: "failing",
        evaluate: async () => ({
          passed: false,
          score: 0.1,
          verdict: "fail",
          rubric: failingRubric,
        }),
      };

      verifier.registerRubric(failingRubric);
      verifier.registerRubric(failingRubric);

      const result = await verifier.verifyOutcome(mockOutcome, mockContext);

      expect(result.verdict).toBe("fail");
    });
  });

  describe("computeConfidence", () => {
    it("should return 0.5 when no rubrics registered", async () => {
      const result = await verifier.verifyOutcome(mockOutcome, mockContext);

      expect(result.verdictConfidence).toBe(0.5);
    });

    it("should compute confidence from rubric scores", async () => {
      verifier.registerRubric(mockRubric);

      const result = await verifier.verifyOutcome(mockOutcome, mockContext);

      expect(result.verdictConfidence).toBeGreaterThan(0);
      expect(result.verdictConfidence).toBeLessThanOrEqual(1);
    });
  });

  describe("History Management", () => {
    it("should maintain verification history", async () => {
      verifier.registerRubric(mockRubric);

      await verifier.verifyOutcome(mockOutcome, mockContext);
      await verifier.verifyOutcome(mockOutcome, mockContext);
      await verifier.verifyOutcome(mockOutcome, mockContext);

      const stats = verifier.getStatistics();
      expect(stats.verificationCount).toBe(3);
    });

    it("should trim history to max size", async () => {
      verifier.registerRubric(mockRubric);

      const outcome: VerificationOutcome = {
        ...mockOutcome,
        id: `outcome-`,
      };

      for (let i = 0; i < 15; i++) {
        await verifier.verifyOutcome(
          { ...outcome, id: `outcome-${i}` },
          mockContext,
        );
      }

      const stats = verifier.getStatistics();
      expect(stats.verificationCount).toBeLessThanOrEqual(10);
    });

    it("should clear history", async () => {
      verifier.registerRubric(mockRubric);

      await verifier.verifyOutcome(mockOutcome, mockContext);
      await verifier.verifyOutcome(mockOutcome, mockContext);

      verifier.clearHistory();

      const stats = verifier.getStatistics();
      expect(stats.verificationCount).toBe(0);
    });
  });

  describe("Statistics", () => {
    it("should calculate pass rate correctly", async () => {
      const passingRubric: Rubric = {
        ...mockRubric,
        id: "passing",
      };

      const failingRubric: Rubric = {
        ...mockRubric,
        id: "failing",
        evaluate: async () => ({
          passed: false,
          score: 0.0,
          verdict: "fail",
          rubric: failingRubric,
        }),
      };

      verifier.registerRubric(passingRubric);

      await verifier.verifyOutcome(mockOutcome, mockContext);

      verifier.registerRubric(failingRubric);
      await verifier.verifyOutcome(
        { ...mockOutcome, verdict: "fail" },
        mockContext,
      );

      const stats = verifier.getStatistics();
      expect(stats.passRate).toBe(0.5);
    });

    it("should calculate average confidence correctly", async () => {
      verifier.registerRubric(mockRubric);

      await verifier.verifyOutcome(
        { ...mockOutcome, verdictConfidenceValue: 0.8 },
        mockContext,
      );
      await verifier.verifyOutcome(
        { ...mockOutcome, verdictConfidenceValue: 0.9 },
        mockContext,
      );

      const stats = verifier.getStatistics();
      expect(stats.avgConfidence).toBeCloseTo(0.85, 1);
    });

    it("should return history array", async () => {
      verifier.registerRubric(mockRubric);

      await verifier.verifyOutcome(mockOutcome, mockContext);

      const stats = verifier.getStatistics();
      expect(stats.history).toBeInstanceOf(Array);
      expect(stats.history.length).toBeGreaterThan(0);
    });
  });

  describe("getRubric", () => {
    it("should return rubric by ID", () => {
      verifier.registerRubric(mockRubric);

      const rubric = verifier.getRubric("test-rubric");

      expect(rubric).toBeDefined();
      expect(rubric?.id).toBe("test-rubric");
    });

    it("should return undefined for non-existent rubric", () => {
      const rubric = verifier.getRubric("non-existent");

      expect(rubric).toBeUndefined();
    });
  });

  describe("getFailureTaxonomy", () => {
    it("should return failure taxonomy", () => {
      const taxonomy = verifier.getFailureTaxonomy();

      expect(taxonomy.categories).toBeDefined();
      expect(taxonomy.subcategories).toBeDefined();
      expect(taxonomy.categories.length).toBeGreaterThan(0);
    });
  });
});
