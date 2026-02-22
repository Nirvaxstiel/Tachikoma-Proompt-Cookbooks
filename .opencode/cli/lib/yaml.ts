/**
 * YAML loading utility
 */

import yaml from 'js-yaml';
import type { RoutesConfig } from './types';

/**
 * Load and parse a YAML file
 */
export async function loadYaml<T = unknown>(path: string): Promise<T> {
  const file = Bun.file(path);
  
  if (!(await file.exists())) {
    throw new Error(`YAML file not found: ${path}`);
  }
  
  const content = await file.text();
  return yaml.load(content) as T;
}

/**
 * Load routes configuration
 */
export async function loadRoutesConfig(path: string): Promise<RoutesConfig> {
  const config = await loadYaml<RoutesConfig>(path);
  
  // Validate structure
  if (!config.routes || typeof config.routes !== 'object') {
    throw new Error('Invalid routes config: missing "routes" section');
  }
  if (!config.keywords || typeof config.keywords !== 'object') {
    throw new Error('Invalid routes config: missing "keywords" section');
  }
  
  return config;
}

/**
 * Get default config paths (modular)
 */
export function getConfigPaths(): {
  intents: string;
  skills: string;
  contexts: string;
} {
  const baseDir = import.meta.dir.replace('/cli/lib', '/agents/tachikoma/config/routing');
  return {
    intents: `${baseDir}/intents.yaml`,
    skills: `${baseDir}/skills.yaml`,
    contexts: `${baseDir}/contexts.yaml`,
  };
}

/**
 * Get default config path (legacy - points to intents.yaml)
 */
export function getDefaultConfigPath(): string {
  return getConfigPaths().intents;
}
