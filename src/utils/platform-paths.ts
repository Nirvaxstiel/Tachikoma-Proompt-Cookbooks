/**
 * Platform-aware path resolution
 *
 * Centralizes all file path operations for consistency across platforms
 * (Windows, Linux, macOS)
 */

import { join } from "node:path";

export function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || "";
}

export function getConfigPath(...segments: string[]): string {
  const home = getHomeDir();
  return join(home, ".config", "opencode", ...segments);
}

export function resolveContextModulePath(name: string, cwd: string): string[] {
  return [
    join(cwd, ".opencode", "context-modules", `${name}.md`),
    getConfigPath("context-modules", `${name}.md`),
  ];
}

export function resolveToConfig(...segments: string[]): string {
  return join(process.cwd(), ".opencode", ...segments);
}

export function resolveToScriptDir(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

export function getPluginDir(): string {
  return join(process.cwd(), ".opencode", "tachikoma");
}

export function getPluginScriptsDir(): string {
  return join(getPluginDir(), "tachikoma");
}
