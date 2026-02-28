export type AgentMode = "primary" | "subagent" | "all";

export interface AgentSpec {
  name: string;
  description: string;
  mode: AgentMode;
  prompt?: string;
  tools?: Record<string, boolean>;
  permissions?: Record<string, any>;
  model?: { providerID: string; modelID: string };
  temperature?: number;
  hidden?: boolean;
  color?: string;
}

export interface VerticalDecomposition {
  task: string;
  subtasks: string[];
  agents: AgentSpec[];
  executionOrder: "sequential" | "conditional";
  strategy: "vertical_decomposition";
}

export interface HorizontalEnsemble {
  task: string;
  strategies: string[];
  ensembleMembers: AgentSpec[];
  coordinator: AgentSpec;
  executionMode: "parallel";
  mergeStrategy: "consensus" | "majority_vote" | "best_score";
}

export type AgentTopology = VerticalDecomposition | HorizontalEnsemble;
