#!/usr/bin/env bun
/**
 * Edit Format Selector
 * Functional, declarative approach to model-aware editing
 *
 * Usage:
 *   bun run edit-format-selector.ts <command> [args]
 *
 * Commands:
 *   detect              Auto-detect current model
 *   recommend           Get format recommendation
 *   add <model> <fmt> Add model->format mapping
 *   list                List all formats
 *
 * Formats: str_replace, str_replace_fuzzy, apply_patch, hashline
 */

import { existsSync } from "node:fs";

import type { EditFormat } from "../../constants/edit-formats";
import { MODEL_ENV_VARS } from "../../constants/model-env";
import { cliLogger } from "../../utils/cli-logger";
import { resolveToConfig } from "../../utils/path";
import { parseSimpleYaml } from "../../utils/yaml-parser";

// TYPES
interface FormatConfig {
  formats: Record<string, EditFormat>;
}

interface FormatRecommendation {
  format: EditFormat;
  model: string;
  confidence: number;
  reason: string;
}

// CONSTANTS
const CONFIG_PATH = resolveToConfig("config/edit-format-model-config.yaml");

// FORMAT DESCRIPTIONS
const FORMAT_INFO: Record<EditFormat, string> = {
  str_replace: "Exact string matching (Claude, Mistral)",
  str_replace_fuzzy: "Fuzzy whitespace matching (Gemini)",
  apply_patch: "OpenAI-style diff format (GPT)",
  hashline: "Content-hash anchoring (Grok, GLM, others)",
  editblock: "Aider-style search/replace (Most models)",
};

// CONFIGURATION
async function loadConfig(): Promise<FormatConfig> {
  if (!existsSync(CONFIG_PATH)) {
    return { formats: {} };
  }

  try {
    const content = await Bun.file(CONFIG_PATH).text();
    const parsed = parseSimpleYaml(content);
    return {
      formats: (parsed.formats || {}) as Record<string, EditFormat>,
    };
  } catch {
    return { formats: {} };
  }
}

function isValidFormat(value: string): value is EditFormat {
  return ["str_replace", "str_replace_fuzzy", "apply_patch", "hashline"].includes(value);
}

async function saveConfig(config: FormatConfig): Promise<void> {
  const lines: string[] = [];

  lines.push("# Edit Format Model Configuration");
  lines.push("");
  lines.push("# Model -> edit format mappings");
  lines.push("");

  const coreFormats = Object.entries(config.formats).filter(([k]) => !isUserAdded(k));

  if (coreFormats.length > 0) {
    lines.push("# Core models (well-tested)");
    lines.push("model_formats:");
    for (const [model, format] of coreFormats) {
      lines.push(`  ${model}: ${format}`);
    }
    lines.push("");
  }

  const userModels = Object.entries(config.formats).filter(([k]) => isUserAdded(k));

  if (userModels.length > 0) {
    lines.push("# User-added models (learned/overrides)");
    lines.push("# Add here: bun run edit-format-selector.ts add <model> <format>");
    lines.push("user_models:");
    for (const [model, format] of userModels) {
      lines.push(`  ${model}: ${format}`);
    }
  }

  await Bun.write(CONFIG_PATH, lines.join("\n"));
}

function isUserAdded(key: string): boolean {
  const userModels = [
    "big-pickle",
    "llama",
    "codellama",
    "qwen",
    "deepseek",
    "phi",
    "yi",
    "internlm",
    "solar",
    "mixtral",
  ];
  return userModels.some((m) => key.toLowerCase().includes(m));
}

// MODEL DETECTION
function getModelFromEnv(): string | null {
  for (const varName of MODEL_ENV_VARS) {
    const value = process.env[varName];
    if (value) return value.toLowerCase();
  }
  return null;
}

function detectModel(): string {
  return getModelFromEnv() || "unknown";
}

// FORMAT SELECTION
function findFormatMatch(model: string, config: FormatConfig): EditFormat | null {
  const modelLower = model.toLowerCase();

  if (modelLower in config.formats) {
    return config.formats[modelLower];
  }

  for (const [pattern, format] of Object.entries(config.formats)) {
    if (modelLower.includes(pattern.toLowerCase())) {
      return format;
    }
  }

  return null;
}

function getDefaultFormat(model: string): EditFormat {
  const opensourcePatterns = [
    "llama",
    "qwen",
    "deepseek",
    "phi",
    "yi",
    "internlm",
    "solar",
    "mixtral",
  ];

  if (opensourcePatterns.some((p) => model.toLowerCase().includes(p))) {
    return "hashline";
  }

  return "str_replace_fuzzy";
}

function selectFormat(model: string, config: FormatConfig): FormatRecommendation {
  const matched = findFormatMatch(model, config);

  if (matched) {
    return {
      format: matched,
      model,
      confidence: 0.95,
      reason: `Exact match in config: ${model} -> ${matched}`,
    };
  }

  const fallback = getDefaultFormat(model);
  return {
    format: fallback,
    model,
    confidence: 0.6,
    reason: `No config match, defaulting to ${fallback} for model family`,
  };
}

// OUTPUT
function formatRecommendation(rec: FormatRecommendation): string {
  return [
    `Model: ${rec.model}`,
    `Format: ${rec.format}`,
    `Confidence: ${(rec.confidence * 100).toFixed(0)}%`,
    `Reason: ${rec.reason}`,
    `Description: ${FORMAT_INFO[rec.format]}`,
  ].join("\n");
}

function printFormats(): void {
  cliLogger.info("Available formats:");
  for (const [fmt, desc] of Object.entries(FORMAT_INFO)) {
    cliLogger.info(`  ${fmt.padEnd(20)} ${desc}`);
  }
}

function printUsage(): void {
  cliLogger.info("Edit Format Selector - Functional Model-Aware Editing");
  cliLogger.info("");
  cliLogger.info("Usage:");
  cliLogger.info("  bun run edit-format-selector.ts <command> [args]");
  cliLogger.info("");
  cliLogger.info("Commands:");
  cliLogger.info("  detect              Auto-detect current model");
  cliLogger.info("  recommend           Get format recommendation");
  cliLogger.info("  add <model> <fmt> Add model->format mapping");
  cliLogger.info("  list                List all formats");
  cliLogger.info("");
  cliLogger.info("Formats: str_replace, str_replace_fuzzy, apply_patch, hashline");
}

// MAIN
async function handleDetect(): Promise<void> {
  const model = detectModel();
  cliLogger.info(`Detected model: ${model}`);
}

async function handleRecommend(): Promise<void> {
  const config = await loadConfig();
  const model = detectModel();
  const recommendation = selectFormat(model, config);
  cliLogger.info("");
  cliLogger.info(formatRecommendation(recommendation));
}

async function handleAdd(args: string[]): Promise<void> {
  if (args.length < 2) {
    cliLogger.error("Usage: add <model> <format>");
    process.exit(1);
  }

  const [model, format] = args;

  if (!isValidFormat(format)) {
    cliLogger.error(`Invalid format: ${format}`);
    cliLogger.error("Valid formats: str_replace, str_replace_fuzzy, apply_patch, hashline");
    process.exit(1);
  }

  const config = await loadConfig();
  config.formats[model.toLowerCase()] = format as EditFormat;
  await saveConfig(config);
  cliLogger.info(`Added: ${model} -> ${format}`);
}

async function handleList(): Promise<void> {
  cliLogger.info("Current format mappings:");
  cliLogger.info("");
  const config = await loadConfig();
  for (const [model, format] of Object.entries(config.formats)) {
    cliLogger.info(`  ${model.padEnd(25)} ${format}`);
  }
  cliLogger.info("");
  printFormats();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    return;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  const handlers: Record<string, () => Promise<void>> = {
    detect: handleDetect,
    recommend: handleRecommend,
    add: () => handleAdd(commandArgs),
    list: handleList,
  };

  if (handlers[command]) {
    await handlers[command]();
  } else {
    cliLogger.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }
}

main().catch((err) => {
  cliLogger.error("Error:", err);
  process.exit(1);
});
