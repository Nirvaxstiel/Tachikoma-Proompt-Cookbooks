/**
 * Context manager type definitions
 */

export type Priority = "critical" | "high" | "medium" | "low";

export interface ContextSource {
  type: "agents" | "module" | "file" | "injected";
  path: string;
  content: string;
  priority: Priority;
  tokens: number;
}

export interface ContextModule {
  name: string;
  path: string;
  content: string;
  priority: Priority;
}

export interface PositionConfig {
  startWeight: number;
  middleWeight: number;
  endWeight: number;
  maxMiddleRatio: number;
}

export interface ContextLoadOptions {
  cwd: string;
  modules?: string[];
  injectedContext?: string;
  maxTokens?: number;
  compressionThreshold?: number;
}

export interface LoadedContext {
  sources: ContextSource[];
  totalTokens: number;
  optimized: string;
  compressed: boolean;
}

export interface CompressionResult {
  original: ContextSource[];
  compressed: string;
  tokenReduction: number;
  preservedSections: string[];
}
