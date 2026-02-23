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

export interface KeywordsConfig {
  [intent: string]: string[];
}

export interface RoutesConfig {
  routes: { [intent: string]: IntentRoute };
  keywords: KeywordsConfig;
}

export interface ConfidenceRoute {
  intent: string;
  keywords: string[];
  weight: number;
}

export interface EditFormatConfig {
  model: string;
  format: 'whole' | 'diff' | 'udiff' | 'hashline';
  reasoning?: string;
}
