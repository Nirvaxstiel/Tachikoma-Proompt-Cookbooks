export type NodeType = "entity" | "concept" | "code" | "query" | "answer" | "event";

export interface MemoryNode {
  id: string;
  type: NodeType;
  label: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryEdge {
  from: string;
  to: string;
  type: string;
  weight: number;
  metadata?: Record<string, any>;
}

export interface MemoryGraph {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
}

export interface MemoryQuery {
  query: string;
  nodeType?: NodeType;
  mode: "similarity" | "pattern" | "traverse";
  maxResults?: number;
}

export interface MemoryQueryResult {
  node: MemoryNode;
  similarity?: number;
  relations: string[];
}

export interface SessionCompression {
  sessionId: string;
  nodes: MemoryNode[];
  edges: MemoryEdge[];
  retainedEvents: string[];
}
