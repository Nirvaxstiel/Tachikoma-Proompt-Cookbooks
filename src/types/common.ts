/**
 * Common type definitions
 */

import type { EditFormat, ModelFamily } from "../constants/edit-formats";

export interface AgentContext {
  cwd: string;
  modules?: string[];
  injectedContext?: string;
  metadata?: Record<string, unknown>;
}

export interface VerificationContext {
  request?: string;
  issue?: string;
  filePath?: string;
  lineNumbers?: number[];
}

export interface ConfigData {
  [key: string]: unknown;
}

export interface EditChange {
  oldString: string;
  newString: string;
  lineNumber?: number;
}

export interface EditResult {
  success: boolean;
  content: string;
  format: EditFormat;
  attempts: number;
  error?: string;
}

export interface ModelSelection {
  model: string;
  family: ModelFamily;
  format: EditFormat;
  confidence: number;
}
