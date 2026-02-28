export interface AgentMetrics {
  name: string;
  taskType: string;
  successCount: number;
  failureCount: number;
  totalCost: number;
  avgLatency: number;
  lastUsed: string;
}

export interface TaskRecord {
  taskId: string;
  agentName: string;
  taskType: string;
  timestamp: number;
  duration: number;
  cost: number;
  success: boolean;
  context?: Record<string, any>;
}

export interface PerformanceStats {
  successRate: number;
  avgCost: number;
  avgLatency: number;
  totalTasks: number;
}
