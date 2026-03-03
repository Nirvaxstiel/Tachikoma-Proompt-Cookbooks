import { dirname, join } from "node:path";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..", "..", "src");

export function resolveToScriptDir(relative: string): string {
  return join(__dirname, relative);
}

export function resolveToConfig(relative: string): string {
  return join(PROJECT_ROOT, "config", relative);
}

export function resolveToProjectRoot(relative: string): string {
  return join(PROJECT_ROOT, relative);
}
