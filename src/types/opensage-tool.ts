export interface ToolSpec {
  name: string;
  description: string;
  language: "typescript" | "python" | "bash" | "javascript";
  args: Record<string, any>;
  execute: string;
  dependencies?: string[];
  sandbox?: boolean;
}

export interface ToolState {
  toolId: string;
  state: Record<string, any>;
  timestamp: number;
}

export interface AsyncJob {
  jobId: string;
  toolName: string;
  parameters: Record<string, any>;
  status: "running" | "completed" | "failed";
  startTime: string;
  endTime?: string;
  result?: any;
  error?: string;
}
