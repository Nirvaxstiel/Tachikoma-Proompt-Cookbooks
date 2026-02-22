#!/usr/bin/env bun
/**
 * Edit Format Selector
 * Auto-detects model and selects optimal edit format
 *
 * Purpose: +20-61% edit success rate through intelligent format selection
 * Based on: "The Harness Problem" research + telemetry data
 *
 * Converted from: .opencode/agents/tachikoma/core/edit-format-selector.py
 */

import { join, dirname } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { Database } from "bun:sqlite";
import { loadYaml } from "./lib/yaml";
import { colors, printHeader } from "./lib/colors";

// =============================================================================
// TYPES
// =============================================================================

enum EditFormat {
  STR_REPLACE = "str_replace",
  STR_REPLACE_FUZZY = "str_replace_fuzzy",
  APPLY_PATCH = "apply_patch",
  HASHLINE = "hashline",
  WHOLE = "whole",
  UDIFF = "udiff",
  EDITBLOCK = "editblock",
}

interface FormatDescription {
  name: string;
  best_for: string;
  description: string;
}

interface FormatRecommendation {
  format: EditFormat;
  confidence: number;
  reason: string;
}

interface EditOperation {
  oldString: string;
  newString: string;
}

interface EditResult {
  success: boolean;
  format_used?: string;
  attempts?: number;
  confidence?: number;
  reason?: string;
  format_description?: FormatDescription;
  result?: unknown;
  formats_tried?: string[];
  error?: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const SCRIPT_DIR = import.meta.dir;
const CONFIG_DIR = join(SCRIPT_DIR, "..", "agents", "tachikoma", "config");
const MODEL_FORMATS_CONFIG = join(CONFIG_DIR, "edit-format-model-config.yaml");

const OPENCODE_DB_PATHS = [
  `${process.env.HOME}/.local/share/opencode/opencode.db`,
  `${process.env.HOME}/Library/Application Support/opencode/opencode.db`,
  `/root/.local/share/opencode/opencode.db`,
];

const MODEL_ENV_VARS = [
  "LLM_MODEL",
  "MODEL",
  "MODEL_NAME",
  "CLAUDE_MODEL",
  "ANTHROPIC_MODEL",
  "OPENAI_MODEL",
  "GOOGLE_MODEL",
  "XAI_MODEL",
  "GLM_MODEL",
  "OLLAMA_MODEL",
];

const CONFIG_FILE_PATHS = [
  ".env",
  ".llmrc",
  ".openai/config",
  "~/.anthropic/config",
];

// Cache for loaded model formats
let cachedModelFormats: Record<string, EditFormat> | null = null;

function loadModelFormats(): Record<string, EditFormat> {
  if (cachedModelFormats !== null) {
    return cachedModelFormats;
  }

  if (!existsSync(MODEL_FORMATS_CONFIG)) {
    cachedModelFormats = {};
    return cachedModelFormats;
  }

  try {
    const data = loadYaml(MODEL_FORMATS_CONFIG) as Record<
      string,
      unknown
    > | null;
    if (!data) {
      cachedModelFormats = {};
      return cachedModelFormats;
    }

    const result: Record<string, EditFormat> = {};
    for (const key of ["model_formats", "user_models"]) {
      const section = data[key] as Record<string, string> | undefined;
      if (section) {
        for (const [model, fmt] of Object.entries(section)) {
          if (Object.values(EditFormat).includes(fmt as EditFormat)) {
            result[model.toLowerCase()] = fmt as EditFormat;
          }
        }
      }
    }
    cachedModelFormats = result;
    return result;
  } catch {
    cachedModelFormats = {};
    return cachedModelFormats;
  }
}

function saveModelFormat(model: string, formatType: EditFormat): void {
  const modelLower = model.toLowerCase();

  let data: Record<string, unknown> = {};
  if (existsSync(MODEL_FORMATS_CONFIG)) {
    try {
      const loaded = loadYaml(MODEL_FORMATS_CONFIG);
      if (loaded && typeof loaded === "object") {
        data = loaded as Record<string, unknown>;
      }
    } catch {
      // Ignore parse errors
    }
  }

  if (!data.model_formats) {
    data.model_formats = {};
  }
  (data.model_formats as Record<string, string>)[modelLower] = formatType;

  mkdirSync(CONFIG_DIR, { recursive: true });

  // Simple YAML serialization
  const lines = Object.entries(data).map(([key, val]) => {
    if (typeof val === "object" && val !== null) {
      const subLines = Object.entries(val as Record<string, unknown>).map(
        ([k, v]) => `${k}: ${v}`,
      );
      return `${key}:\n${subLines.map((l) => "  " + l).join("\n")}`;
    }
    return `${key}: ${val}`;
  });

  writeFileSync(MODEL_FORMATS_CONFIG, lines.join("\n") + "\n");
  cachedModelFormats = null; // Invalidate cache
}

// =============================================================================
// MODEL DETECTION
// =============================================================================

function getModelFromEnv(): string | null {
  for (const v of MODEL_ENV_VARS) {
    const val = process.env[v];
    if (val) return val;
  }
  return null;
}

function getModelFromDb(): string | null {
  for (const dbPath of OPENCODE_DB_PATHS) {
    const expanded = dbPath.replace("~", process.env.HOME || "");
    if (!existsSync(expanded)) continue;

    try {
      const db = new Database(expanded);
      const row = db
        .query("SELECT data FROM message ORDER BY time_created DESC LIMIT 1")
        .get();
      db.close();

      if (row && typeof row === "object" && "data" in row) {
        const data = JSON.parse(row.data as string);
        return data.modelID || null;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function getModelFromConfigFiles(): string | null {
  const patterns = [
    /MODEL\s*=\s*['"]?([^'"\s]+)['"]?/i,
    /model\s*:\s*['"]?([^'"\s]+)['"]?/i,
    /--model\s+([^\s]+)/i,
  ];

  for (const path of CONFIG_FILE_PATHS) {
    const expanded = path.replace("~", process.env.HOME || "");
    if (!existsSync(expanded)) continue;

    try {
      const content = readFileSync(expanded, "utf-8");
      for (const pat of patterns) {
        const match = content.match(pat);
        if (match) return match[1].toLowerCase();
      }
    } catch {
      continue;
    }
  }
  return null;
}

function detectModel(): string {
  return (
    getModelFromEnv() ||
    getModelFromDb() ||
    getModelFromConfigFiles() ||
    "unknown"
  );
}

// =============================================================================
// FORMAT SELECTION
// =============================================================================

const FALLBACK_CHAINS: Record<EditFormat, EditFormat[]> = {
  [EditFormat.STR_REPLACE]: [EditFormat.HASHLINE, EditFormat.APPLY_PATCH],
  [EditFormat.STR_REPLACE_FUZZY]: [
    EditFormat.STR_REPLACE,
    EditFormat.HASHLINE,
    EditFormat.APPLY_PATCH,
  ],
  [EditFormat.APPLY_PATCH]: [EditFormat.STR_REPLACE, EditFormat.HASHLINE],
  [EditFormat.HASHLINE]: [EditFormat.STR_REPLACE, EditFormat.APPLY_PATCH],
  [EditFormat.WHOLE]: [EditFormat.STR_REPLACE, EditFormat.HASHLINE],
  [EditFormat.UDIFF]: [
    EditFormat.STR_REPLACE,
    EditFormat.STR_REPLACE_FUZZY,
    EditFormat.HASHLINE,
  ],
  [EditFormat.EDITBLOCK]: [
    EditFormat.STR_REPLACE,
    EditFormat.STR_REPLACE_FUZZY,
    EditFormat.HASHLINE,
  ],
};

const FORMAT_DESCRIPTIONS: Record<EditFormat, FormatDescription> = {
  [EditFormat.STR_REPLACE]: {
    name: "str_replace",
    best_for: "Claude, Gemini",
    description: "Exact string matching",
  },
  [EditFormat.STR_REPLACE_FUZZY]: {
    name: "str_replace_fuzzy",
    best_for: "Gemini",
    description: "Fuzzy whitespace matching",
  },
  [EditFormat.APPLY_PATCH]: {
    name: "apply_patch",
    best_for: "GPT, OpenAI",
    description: "OpenAI-style diff format",
  },
  [EditFormat.HASHLINE]: {
    name: "hashline",
    best_for: "Grok, GLM, smaller models",
    description: "Content-hash anchoring",
  },
  [EditFormat.WHOLE]: {
    name: "whole",
    best_for: "Small files (<400 lines)",
    description: "Rewrite entire file",
  },
  [EditFormat.UDIFF]: {
    name: "udiff",
    best_for: "GPT-4 Turbo family",
    description: "Simplified unified diff",
  },
  [EditFormat.EDITBLOCK]: {
    name: "editblock",
    best_for: "Most models",
    description: "Aider-style search/replace blocks",
  },
};

const MODEL_NOTES: Record<string, string[]> = {
  grok: ["Grok shows 10x improvement with hashline (6.7% -> 68.3%)"],
  glm: ["GLM shows +8-14% improvement with hashline (46-50% -> 54-64%)"],
  claude: ["Claude excels with str_replace (92-95% success rate)"],
  gpt: ["GPT works best with apply_patch (91-94% success rate)"],
  gemini: ["Gemini works best with str_replace_fuzzy (93% success rate)"],
  llama: ["CodeLlama benefits from fuzzy matching"],
  codellama: ["CodeLlama benefits from fuzzy matching"],
  qwen: ["Use fuzzy matching, or hashline for larger models"],
  deepseek: ["Strong reasoning, hashline helps"],
  mistral: ["Strong model that handles str_replace well"],
  phi: ["Strong reasoning models, hashline helps"],
  yi: ["Hashline helps with mechanical edit tasks"],
  internlm: ["Large models, benefit from fuzzy matching"],
  "command-r": ["Cohere models, str_replace works well"],
  solar: ["Use fuzzy matching"],
  mixtral: ["Strong models that handle str_replace well"],
};

function selectFormat(model: string): FormatRecommendation {
  // Use config
  const configs = loadModelFormats();

  // Exact match
  if (model in configs) {
    return {
      format: configs[model],
      confidence: 0.95,
      reason: `Config: ${model} -> ${configs[model]}`,
    };
  }

  // Partial match
  for (const [pattern, fmt] of Object.entries(configs)) {
    if (model.includes(pattern)) {
      return {
        format: fmt,
        confidence: 0.9,
        reason: `Config: ${model} contains '${pattern}' -> ${fmt}`,
      };
    }
  }

  // Default to hashline for reliability
  return {
    format: EditFormat.HASHLINE,
    confidence: 0.7,
    reason: `Unknown model '${model}', defaulting to hashline for reliability`,
  };
}

function getFallbackChain(formatType: EditFormat): EditFormat[] {
  return FALLBACK_CHAINS[formatType] || [];
}

function getFormatDescription(formatType: EditFormat): FormatDescription {
  return (
    FORMAT_DESCRIPTIONS[formatType] || {
      name: formatType,
      best_for: "Unknown",
      description: "",
    }
  );
}

function getModelNotes(model: string): string[] {
  const notes: string[] = [];
  for (const [prefix, prefixNotes] of Object.entries(MODEL_NOTES)) {
    if (model.includes(prefix)) {
      notes.push(...prefixNotes);
    }
  }
  return notes;
}

// =============================================================================
// EDIT EXECUTION (stub - actual execution done by opencode native)
// =============================================================================

async function executeWithRetry(
  filepath: string,
  editOp: EditOperation,
  model?: string,
  maxAttempts: number = 3,
): Promise<EditResult> {
  const actualModel = model || detectModel();
  const {
    format: primaryFormat,
    confidence,
    reason,
  } = selectFormat(actualModel);
  const formatsToTry = [primaryFormat, ...getFallbackChain(primaryFormat)];

  // This is a stub - actual execution is handled by opencode's native edit tool
  return {
    success: false,
    formats_tried: formatsToTry.slice(0, maxAttempts).map((f) => f),
    error:
      "Edit execution not implemented in CLI - use opencode native edit tool",
  };
}

// =============================================================================
// CLI
// =============================================================================

function printUsage(): void {
  printHeader("Edit Format Selector");
  console.log();
  console.log(`${colors.yellow}Usage:${colors.reset}`);
  console.log(`  bun run edit-format-selector.ts <command> [args]`);
  console.log();
  console.log(`${colors.yellow}Commands:${colors.reset}`);
  console.log(
    `  ${colors.green}detect${colors.reset}                    Auto-detect current model`,
  );
  console.log(
    `  ${colors.green}recommend${colors.reset} [--model <id>]    Get format recommendation`,
  );
  console.log(
    `  ${colors.green}add${colors.reset} <model> <format>        Add model format mapping`,
  );
  console.log();
  console.log(`${colors.yellow}Formats:${colors.reset}`);
  for (const fmt of Object.values(EditFormat)) {
    const desc = FORMAT_DESCRIPTIONS[fmt as EditFormat];
    if (desc) {
      console.log(
        `  ${colors.cyan}${fmt.padEnd(18)}${colors.reset} ${desc.description} (${desc.best_for})`,
      );
    }
  }
  console.log();
  console.log(`${colors.yellow}Examples:${colors.reset}`);
  console.log(`  bun run edit-format-selector.ts detect`);
  console.log(`  bun run edit-format-selector.ts recommend`);
  console.log(`  bun run edit-format-selector.ts recommend --model claude-3`);
  console.log(`  bun run edit-format-selector.ts add gpt-4-turbo apply_patch`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case "detect":
      console.log(`Detected model: ${detectModel()}`);
      break;

    case "recommend": {
      let model: string | undefined;
      for (let i = 1; i < args.length; i++) {
        if (args[i] === "--model" && args[i + 1]) {
          model = args[i + 1];
          break;
        }
      }
      const actualModel = model || detectModel();
      const { format, confidence, reason } = selectFormat(actualModel);

      console.log();
      console.log(
        `${colors.cyan}=== Format Recommendation for ${actualModel} ===${colors.reset}`,
      );
      console.log(`${colors.yellow}Format:${colors.reset}     ${format}`);
      console.log(
        `${colors.yellow}Confidence:${colors.reset} ${(confidence * 100).toFixed(0)}%`,
      );
      console.log(`${colors.yellow}Reason:${colors.reset}     ${reason}`);
      console.log();
      console.log(getFormatDescription(format).description);

      const notes = getModelNotes(actualModel);
      if (notes.length > 0) {
        console.log();
        console.log(`${colors.yellow}Notes:${colors.reset}`);
        for (const note of notes) {
          console.log(`  - ${note}`);
        }
      }

      const fallbacks = getFallbackChain(format);
      if (fallbacks.length > 0) {
        console.log();
        console.log(
          `${colors.yellow}Fallback:${colors.reset} ${fallbacks.join(" -> ")}`,
        );
      }
      break;
    }

    case "add":
      if (args.length < 3) {
        console.error(
          `${colors.red}Error: add requires <model> <format>${colors.reset}`,
        );
        process.exit(1);
      }
      const addModel = args[1];
      const addFormat = args[2] as EditFormat;

      if (!Object.values(EditFormat).includes(addFormat)) {
        console.error(
          `${colors.red}Error: Invalid format. Valid formats: ${Object.values(EditFormat).join(", ")}${colors.reset}`,
        );
        process.exit(1);
      }

      saveModelFormat(addModel, addFormat);
      console.log(
        `${colors.green}Added:${colors.reset} ${addModel} -> ${addFormat}`,
      );
      break;

    default:
      console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
      printUsage();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${colors.red}Error:${colors.reset}`, err.message);
  process.exit(1);
});
