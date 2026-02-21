/**
 * Shared types for Tachikoma CLI tools
 */

// Classification result returned by router
export interface ClassificationResult {
  query: string;
  intent: string;
  confidence: number;
  route: string;
  invoke_via: 'skill' | 'subagent' | 'direct';
  strategy: string | null;
  context_modules: string[];
  tools: string[];
  workflow?: string;
  skills_bulk?: string;
}

// Intent route configuration
export interface IntentRoute {
  intent: string;
  route: string;
  invoke_via: string;
  strategy?: string;
  context_modules: string[];
  tools: string[];
  workflow?: string;
  skills_bulk?: string;
}

// Keywords configuration
export interface KeywordsConfig {
  [intent: string]: string[];
}

// Full routes configuration
export interface RoutesConfig {
  routes: { [intent: string]: IntentRoute };
  keywords: KeywordsConfig;
}

// Confidence route configuration
export interface ConfidenceRoute {
  intent: string;
  keywords: string[];
  weight: number;
}

// Edit format configuration
export interface EditFormatConfig {
  model: string;
  format: 'whole' | 'diff' | 'udiff' | 'hashline';
  reasoning?: string;
}
