export interface SkillExecutionTrace {
  skillId: string;
  taskId: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  errorMessage?: string;
  metrics: ExecutionMetrics;
  context?: SkillExecutionContext;
}

export interface ExecutionMetrics {
  toolCalls: number;
  llmCalls: number;
  cost: number;
  quality: number;
  latency: number;
  tokensUsed?: number;
  outputLength?: number;
  resourceUsage?: ResourceUsage;
}

export interface ResourceUsage {
  cpuTime: number;
  memoryPeak: number;
  diskIO?: number;
}

export interface SkillExecutionContext {
  taskType: string;
  complexity: "low" | "medium" | "high" | "unknown";
  domain?: string;
  inputTokens?: number;
  parameters?: Record<string, unknown>;
}

export interface SkillCompetence {
  skillId: string;
  competence: number;
  confidence: number;
  taskTypes: string[];
  lastUpdated: number;
  totalExecutions: number;
  successCount: number;
  successRate: number;
  avgDuration: number;
  avgCost: number;
  avgQuality: number;
  avgToolCalls: number;
  avgLLMCalls: number;
  trend: "improving" | "stable" | "declining";
  lastTrendUpdate: number;
}

export interface CompetenceModel {
  skills: Map<string, SkillCompetence>;
  updateCompetence(skillId: string, trace: SkillExecutionTrace): void;
  batchUpdate(traces: SkillExecutionTrace[]): void;
  getCompetence(skillId: string): SkillCompetence | undefined;
  getAllCompetences(): Map<string, SkillCompetence>;
  predictPerformance(skillId: string, task: SkillExecutionContext): number;
  getTopCompetentSkills(task: SkillExecutionContext, limit: number): string[];
  reset(): void;
  export(): string;
  import(data: string): void;
}

export interface TrackingConfig {
  enableTracking: boolean;
  maxHistorySize: number;
  learningRate: number;
  confidenceThreshold: number;
  updateFrequency: number;
  minExecutionsForConfidence: number;
  decayFactor: number;
  enableExploration: boolean;
  explorationRate: number;
  anomalyDetection: boolean;
  anomalyThreshold: number;
}

export interface RoutingConfig {
  strategy: "competence-based" | "exploration" | "hybrid" | "static";
  useCompetenceModel: boolean;
  fallbackToStatic: boolean;
  competenceWeight: number;
  costWeight: number;
  speedWeight: number;
  diversityFactor: number;
}

export interface SkillRoutingDecision {
  skillId: string;
  confidence: number;
  reason: string;
  alternativeSkills: Array<{ skillId: string; confidence: number }>;
  timestamp: number;
}

export interface AnomalyDetection {
  detectAnomalies(skillId: string): boolean;
  getAnomalyScore(skillId: string): number;
  getLastAnomaly(skillId: string): { timestamp: number; reason: string } | undefined;
}

export interface LearningMetrics {
  totalTraces: number;
  totalSkills: number;
  avgCompetence: number;
  avgConfidence: number;
  learningRate: number;
  convergenceRate: number;
  routingAccuracy: number;
  lastUpdateTime: number;
}
