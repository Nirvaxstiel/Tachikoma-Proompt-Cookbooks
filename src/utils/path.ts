/**
 * Path utilities
 * Helper functions for resolving paths relative to script location
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function resolveToScriptDir(relative: string): string {
  return join(__dirname, relative);
}

export function resolveToConfig(relative: string): string {
  return resolveToScriptDir(join("..", "..", relative));
}

export function resolveToProjectRoot(relative: string): string {
  return resolveToScriptDir(join("..", "..", "..", relative));
}
