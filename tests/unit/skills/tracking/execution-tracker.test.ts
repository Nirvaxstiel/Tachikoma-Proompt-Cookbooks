import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { SkillExecutionTracker } from "../../../src/plugin/tachikoma/skills/tracking/execution-tracker";
import { DEFAULT_TRACKING_CONFIG } from "../../../src/plugin/tachikoma/skills/tracking/tracking-config";
import type {
  SkillExecutionTrace,
  ExecutionMetrics,
  SkillExecutionContext,
} from "../../../src/plugin/tachikoma/skills/tracking/types";

describe("SkillExecutionTracker", () => {
  let tracker: SkillExecutionTracker;
  let mockTrace: SkillExecutionTrace;

  beforeEach(() => {
    tracker = new SkillExecutionTracker(DEFAULT_TRACKING_CONFIG);

    mockTrace = {
      skillId: "test-skill",
      taskId: "task-1",
      startTime: Date.now() - 1000,
      endTime: Date.now(),
      duration: 1000,
      success: true,
      metrics: {
        toolCalls: 5,
        llmCalls: 2,
        cost: 0.05,
        quality: 0.85,
        latency: 1000,
        tokensUsed: 500,
        outputLength: 1000,
        resourceUsage: {
          cpuTime: 500,
          memoryPeak: 1024 * 1024 * 10,
        },
      },
      context: {
        taskType: "code_review",
        complexity: "medium",
        domain: "development",
      },
    };
  });

  afterEach(() => {
    tracker.reset();
  });

  describe("Construction", () => {
    it("should create instance with default config", () => {
      const t = new SkillExecutionTracker();
      expect(t).toBeDefined();
    });

    it("should create instance with custom config", () => {
      const t = new SkillExecutionTracker({
        maxHistorySize: 500,
        learningRate: 0.02,
      });
      expect(t).toBeDefined();
    });

    it("should initialize with empty traces", () => {
      const traces = tracker.getAllTraces();

      expect(traces).toBeInstanceOf(Array);
      expect(traces.length).toBe(0);
    });
  });

  describe("startExecution", () => {
    it("should start tracking execution", () => {
      const activeBefore = tracker.getActiveExecutions();

      tracker.startExecution("skill-1", "task-1", {
        taskType: "code_generation",
        complexity: "medium",
      });

      const activeAfter = tracker.getActiveExecutions();

      expect(activeBefore.size).toBe(0);
      expect(activeAfter.size).toBe(1);
      expect(activeAfter.has("task-1")).toBe(true);
    });

    it("should record start time", () => {
      const startTime = Date.now();

      tracker.startExecution("skill-1", "task-1", {
        taskType: "code_generation",
      });

      const active = tracker.getActiveExecutions().get("task-1");

      expect(active?.startTime).toBeGreaterThanOrEqual(startTime);
    });

    it("should initialize metrics", () => {
      tracker.startExecution("skill-1", "task-1", {
        taskType: "code_generation",
      });

      const active = tracker.getActiveExecutions().get("task-1");

      expect(active?.metrics).toBeDefined();
      expect(active?.metrics.toolCalls).toBe(0);
      expect(active?.metrics.llmCalls).toBe(0);
    });
  });

  describe("endExecution", () => {
    it("should end execution and record trace", () => {
      tracker.startExecution("skill-1", "task-1", {
        taskType: "code_generation",
      });

      const trace = tracker.endExecution("task-1", {
        success: true,
      });

      expect(trace).toBeDefined();
      expect(trace.success).toBe(true);
      expect(trace.skillId).toBe("skill-1");
      expect(trace.taskId).toBe("task-1");
      expect(trace.duration).toBeGreaterThan(0);
    });

    it("should remove from active executions", () => {
      tracker.startExecution("skill-1", "task-1", {
        taskType: "code_generation",
      });

      expect(tracker.getActiveExecutions().has("task-1")).toBe(true);

      tracker.endExecution("task-1", { success: true });

      expect(tracker.getActiveExecutions().has("task-1")).toBe(false);
    });

    it("should record failure trace", () => {
      tracker.startExecution("skill-1", "task-1", {
        taskType: code_generation",
      });

      const trace = tracker.endExecution("task-1", {
        success: false,
        errorMessage: "Execution failed",
      });

      expect(trace).toBeDefined();
      expect(trace.success).toBe(false);
      expect(trace.errorMessage).toBe("Execution failed");
    });
  });

  describe("recordMetrics", () => {
    it("should record metrics during execution", () => {
      tracker.startExecution("skill-1", "task-1", {
        taskType: "code_generation",
      });

      tracker.recordMetrics("task-1", {
        toolCalls: 3,
        llmCalls: 1,
      });

      const active = tracker.getActiveExecutions().get("task-1");

      expect(active?.metrics.toolCalls).toBe(3);
      expect(active?.metrics.llmCalls).toBe(1);
    });

    it("should fail for non-existent execution", () => {
      const result = tracker.recordMetrics("task-999", {
        toolCalls: 5,
      });

      expect(result).toBeUndefined();
    });
  });

  describe("getExecutionTrace", () => {
    it("should return trace by task ID", () => {
      tracker.endExecution("task-1", { success: true });

      const trace = tracker.getExecutionTrace("task-1");

      expect(trace).toBeDefined();
      expect(trace.taskId).toBe("task-1");
    });

    it("should return undefined for non-existent trace", () => {
      const trace = tracker.getExecutionTrace("task-999");

      expect(trace).toBeUndefined();
    });
  });

  describe("getAllTraces", () => {
    it("should return all traces", () => {
      tracker.endExecution("task-1", { success: true });
      tracker.endExecution("task-2", { success: true });
      tracker.endExecution("task-3", { success: false });

      const traces = tracker.getAllTraces();

      expect(traces.length).toBe(3);
    });

    it("should return empty array initially", () => {
      const traces = tracker.getAllTraces();

      expect(traces).toEqual([]);
    });
  });

  describe("getTracesForSkill", () => {
    it("should return traces for specific skill", () => {
      tracker.endExecution("task-1", { success: true });
      tracker.endExecution("task-2", { success: true });
      tracker.endExecution("task-3", { success: true });

      tracker.startExecution("skill-1", "task-4", {
        taskType: "code_generation",
      });
      tracker.endExecution("task-4", { success: true });

      const skill1Traces = tracker.getTracesForSkill("skill-1");

      expect(skill1Traces.length).toBe(3);
    });

    it("should return empty array for skill with no traces", () => {
      const traces = tracker.getTracesForSkill("skill-999");

      expect(traces).toEqual([]);
    });
  });

  describe("getTraceStatistics", () => {
    it("should calculate trace statistics", () => {
      tracker.endExecution("task-1", { success: true });
      tracker.endExecution("task-2", { success: true });
      tracker.endExecution("task-3", { success: false });

      const stats = tracker.getTraceStatistics();

      expect(stats.totalTraces).toBe(3);
      expect(stats.avgDuration).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThan(0);
      expect(stats.avgCost).toBeGreaterThanOrEqual(0);
    });

    it("should calculate statistics by skill", () => {
      tracker.endExecution("task-1", { success: true });
      tracker.endExecution("task-2", { success: true });

      const stats = tracker.getTraceStatistics();

      expect(stats.bySkill.size).toBeGreaterThan(0);
      expect(stats.bySkill.has("task-1")).toBe(true);
    });

    it("should handle empty traces", () => {
      const stats = tracker.getTraceStatistics();

      expect(stats.totalTraces).toBe(0);
      expect(stats.avgDuration).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe("reset", () => {
    it("should clear all traces", () => {
      tracker.endExecution("task-1", { success: true });
      tracker.endExecution("task-2", { success: true });

      const tracesBefore = tracker.getAllTraces();
      expect(tracesBefore.length).toBeGreaterThan(0);

      tracker.reset();

      const tracesAfter = tracker.getAllTraces();
      const activeAfter = tracker.getActiveExecutions();

      expect(tracesAfter.length).toBe(0);
      expect(activeAfter.size).toBe(0);
    });

    it("should clear active executions", () => {
      tracker.startExecution("skill-1", "task-1", {});

      tracker.reset();

      const active = tracker.getActiveExecutions();

      expect(active.size).toBe(0);
    });
  });

  describe("Persistence", () => {
    it("should save traces to file", async () => {
      tracker.endExecution("task-1", { success: true });

      const tempFile = "./temp-traces.json";
      await tracker.saveTraces(tempFile);

      const file = Bun.file(tempFile);
      const exists = await file.exists();

      expect(exists).toBe(true);

      await file.delete();
    }, 5000);

    it("should load traces from file", async () => {
      const tempFile = "./temp-traces.json";
      const trace: SkillExecutionTrace = {
        skillId: "skill-1",
        taskId: "task-1",
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        duration: 1000,
        success: true,
        metrics: {
          toolCalls: 5,
          llmCalls: 2,
          cost: 0.05,
          quality: 0.85,
          latency: 1000,
        },
      };

      await tracker.saveTraces(tempFile);

      tracker.reset();

      await tracker.loadTraces(tempFile);

      const traces = tracker.getAllTraces();
      expect(traces.length).toBe(1);
      expect(traces[0]).toEqual(trace);

      await Bun.file(tempFile).delete();
    }, 5000);
  });
});
