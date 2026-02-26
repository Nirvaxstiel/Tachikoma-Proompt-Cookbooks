/**
 * Model Harness - Edit Format Selection & Execution
 *
 * Based on research: "The Harness Problem" (Can Bouluk, Feb 2026)
 *
 * Key insight: Edit format selection matters as much as model choice.
 * - Claude → str_replace (exact)
 * - GPT → apply_patch (diff)
 * - Gemini → str_replace_fuzzy (whitespace-tolerant)
 * - Grok/GLM → hashline (content-hash anchoring)
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

import { type EditFormat, FORMAT_MAPPINGS, type ModelFamily } from "../../constants/edit-formats";
import { MODEL_CONFIDENCE } from "../../constants/model-confidence";
import { MODEL_ENV_VARS } from "../../constants/model-env";
import { MATCH_THRESHOLD } from "../../constants/tokenization";
import type { EditChange, EditResult, ModelSelection } from "../../types/common";
import { logger } from "../../utils/logger";
import { resolveToConfig } from "../../utils/platform-paths";
import { parseSimpleYaml } from "../../utils/yaml-parser";

// ============================================================================
// RE-EXPORTS for backward compatibility
// ============================================================================
export type { EditFormat, ModelFamily };

// ============================================================================
// MODEL HARNESS CLASS
// ============================================================================

export class ModelHarness {
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || resolveToConfig("config/edit-format-model-config.yaml");
  }

  async selectModelAndFormat(request?: string): Promise<ModelSelection> {
    const model = this.detectModel();
    const family = this.classifyModel(model);
    const format = await this.selectFormat(family);

    return {
      model,
      family,
      format,
      confidence: this.getConfidence(family),
    };
  }

  detectModel(): string {
    // Check environment variables
    for (const varName of MODEL_ENV_VARS) {
      const value = process.env[varName];
      if (value) {
        return value;
      }
    }

    // Check common CLI args (for OpenCode)
    const cliArgs = process.argv;
    for (let i = 0; i < cliArgs.length; i++) {
      if (cliArgs[i] === "--model" && i + 1 < cliArgs.length) {
        return cliArgs[i + 1];
      }
      if (cliArgs[i].startsWith("--model=")) {
        return cliArgs[i].split("=")[1];
      }
    }

    return "unknown";
  }

  classifyModel(model: string): ModelFamily {
    const lower = model.toLowerCase();

    // Claude family
    if (lower.includes("claude") || lower.includes("anthropic")) {
      return "claude";
    }

    // GPT/OpenAI family
    if (lower.includes("gpt") || lower.includes("openai") || lower.includes("chatgpt")) {
      return "gpt";
    }

    // Gemini/Google family
    if (lower.includes("gemini") || lower.includes("google")) {
      return "gemini";
    }

    // Grok/xAI family
    if (lower.includes("grok") || lower.includes("xai")) {
      return "grok";
    }

    // GLM/Zhipu AI family
    if (lower.includes("glm") || lower.includes("zhipu")) {
      return "glm";
    }

    // Mistral family
    if (lower.includes("mistral") || lower.includes("mixtral")) {
      return "mistral";
    }

    // CodeLlama/LLaMA family
    if (lower.includes("codellama") || lower.includes("llama") || lower.includes("羊驼")) {
      return "codellama";
    }

    // Check for open source patterns (Qwen, DeepSeek, Phi, Yi, etc.)
    if (
      lower.includes("qwen") ||
      lower.includes("deepseek") ||
      lower.includes("phi") ||
      lower.includes("yi") ||
      lower.includes("internlm") ||
      lower.includes("solar") ||
      lower.includes("command-r")
    ) {
      return "codellama"; // Weak models benefit from hashline
    }

    return "generic";
  }

  async selectFormat(family: ModelFamily): Promise<EditFormat> {
    // Try loading from config
    if (existsSync(this.configPath)) {
      try {
        const configFormat = await this.loadConfigFormat(family);
        if (configFormat) return configFormat;
      } catch {
        // Fall back to defaults
      }
    }

    return FORMAT_MAPPINGS[family] || "str_replace_fuzzy";
  }

  private async loadConfigFormat(family: ModelFamily): Promise<EditFormat | null> {
    try {
      const content = await Bun.file(this.configPath).text();
      const parsed = parseSimpleYaml(content);

      const formats = parsed.formats as Record<string, string> | undefined;
      if (!formats) {
        return null;
      }

      const format = formats[family.toLowerCase()];
      if (format && isValidFormat(format)) {
        return format as EditFormat;
      }
    } catch (error) {
      logger.warn(`Failed to load config for model family: ${family}`, error);
    }

    return null;
  }

  private getConfidence(family: ModelFamily): number {
    return (
      MODEL_CONFIDENCE[family.toUpperCase() as keyof typeof MODEL_CONFIDENCE] ??
      MODEL_CONFIDENCE.GENERIC
    );
  }

  executeEdit(content: string, change: EditChange, format: EditFormat): EditResult {
    try {
      let result: string;

      switch (format) {
        case "str_replace":
          result = this.str_replace(content, change.oldString, change.newString);
          break;
        case "str_replace_fuzzy":
          result = this.str_replace_fuzzy(content, change.oldString, change.newString);
          break;
        case "apply_patch":
          result = this.apply_patch(content, change.oldString, change.newString);
          break;
        case "hashline":
          result = this.hashline_edit(
            content,
            change.oldString,
            change.newString,
            change.lineNumber,
          );
          break;
        case "editblock":
          result = this.editblock(content, change.oldString, change.newString);
          break;
        default:
          throw new Error(`Unknown format: ${format}`);
      }

      return {
        success: true,
        content: result,
        format,
        attempts: 1,
      };
    } catch (error) {
      logger.error("Edit execution failed", error);
      return {
        success: false,
        content,
        format,
        attempts: 1,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  layeredMatch(content: string, change: EditChange): EditResult {
    let result = this.executeEdit(content, change, "str_replace");
    if (result.success) return { ...result, attempts: 1 };

    result = this.executeEdit(content, change, "str_replace_fuzzy");
    if (result.success) return { ...result, attempts: 2 };

    if (change.lineNumber) {
      result = this.executeEdit(content, change, "hashline");
      if (result.success) return { ...result, attempts: 3 };
    }

    return {
      success: false,
      content,
      format: "str_replace",
      attempts: 3,
      error: "All matching strategies failed",
    };
  }

  // ============================================================================
  // EDIT FORMAT IMPLEMENTATIONS
  // ============================================================================

  /**
   * str_replace: Exact string matching
   * Best for: Claude, Mistral
   */
  str_replace(content: string, oldString: string, newString: string): string {
    if (!oldString) return content;

    const index = content.indexOf(oldString);
    if (index === -1) {
      throw new Error(`Could not find: "${oldString.substring(0, 50)}..."`);
    }

    return content.slice(0, index) + newString + content.slice(index + oldString.length);
  }

  /**
   * str_replace_fuzzy: Whitespace-tolerant matching
   * Best for: Gemini
   */
  str_replace_fuzzy(content: string, oldString: string, newString: string): string {
    if (!oldString) return content;

    const normalizedOld = this.normalizeForFuzzy(oldString);
    const normalizedContent = this.normalizeForFuzzy(content);
    const matchIndex = normalizedContent.indexOf(normalizedOld);

    if (matchIndex !== -1) {
      const result = this.doFuzzyReplace(content, oldString, newString);
      if (result) return result;
    }

    const lines = content.split("\n");
    const oldLines = oldString.split("\n");

    for (let i = 0; i <= lines.length - oldLines.length; i++) {
      let match = true;
      for (let j = 0; j < oldLines.length; j++) {
        if (!this.linesFuzzyMatch(lines[i + j], oldLines[j])) {
          match = false;
          break;
        }
      }
      if (match) {
        const newLines = newString.split("\n");
        lines.splice(i, oldLines.length, ...newLines);
        return lines.join("\n");
      }
    }

    throw new Error(`Could not find (fuzzy): "${oldString.substring(0, 50)}..."`);
  }

  private normalizeForFuzzy(str: string): string {
    return str
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim()
      .toLowerCase();
  }

  private linesFuzzyMatch(line1: string, line2: string): boolean {
    const norm1 = line1.trim();
    const norm2 = line2.trim();

    // Exact match
    if (norm1 === norm2) return true;

    // Check if key parts match (content words)
    const words1 = norm1.split(/\s+/).filter(Boolean);
    const words2 = norm2.split(/\s+/).filter(Boolean);

    if (words1.length === 0 || words2.length === 0) return false;

    // At least 50% of words should match
    let matches = 0;
    for (const w2 of words2) {
      if (words1.some((w1) => w1.includes(w2) || w2.includes(w1))) {
        matches++;
      }
    }

    return matches >= words2.length * MATCH_THRESHOLD.FUZZY_MATCH_MIN;
  }

  private doFuzzyReplace(content: string, oldString: string, newString: string): string | null {
    const normalizedOld = this.normalizeForFuzzy(oldString);
    const normalizedContent = this.normalizeForFuzzy(content);

    const matchIndex = normalizedContent.indexOf(normalizedOld);
    if (matchIndex === -1) return null;

    // Find the actual substring in original content
    let charCount = 0;
    let startIndex = -1;
    let endIndex = -1;
    const inMatch = false;

    const contentNorm = this.normalizeForFuzzy(content);
    const targetNorm = this.normalizeForFuzzy(oldString);

    for (let i = 0; i < content.length; i++) {
      if (charCount === matchIndex) {
        startIndex = i;
      }
      if (charCount === matchIndex + targetNorm.length) {
        endIndex = i;
        break;
      }
      if (contentNorm[charCount] !== " ") {
        // Skip whitespace in normalized for position tracking
      } else if (content[i] !== " ") {
        charCount++;
        continue;
      }
      if (content[i] !== " ") charCount++;
    }

    if (startIndex === -1 || endIndex === -1) return null;

    return content.slice(0, startIndex) + newString + content.slice(endIndex);
  }

  /**
   * apply_patch: Unified diff format
   * Best for: GPT
   */
  apply_patch(content: string, oldString: string, newString: string): string {
    // Simplified unified diff format
    // Format: @@ -start,length +start,length @@
    const lines = content.split("\n");
    const oldLines = oldString.split("\n");
    const newLines = newString.split("\n");

    // Find the block to replace
    let startIndex = -1;
    for (let i = 0; i <= lines.length - oldLines.length; i++) {
      let match = true;
      for (let j = 0; j < oldLines.length; j++) {
        if (lines[i + j]?.trim() !== oldLines[j]?.trim()) {
          match = false;
          break;
        }
      }
      if (match) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      throw new Error("Could not find patch location");
    }

    // Replace the block
    const before = lines.slice(0, startIndex);
    const after = lines.slice(startIndex + oldLines.length);

    return [...before, ...newLines, ...after].join("\n");
  }

  /**
   * hashline: Content-hash anchoring
   * Best for: Grok, GLM, weak models
   *
   * This is the KEY innovation - 10x improvement for weak models!
   */
  hashline_edit(
    content: string,
    oldString: string,
    newString: string,
    lineNumber?: number,
  ): string {
    const lines = content.split("\n");

    if (lineNumber !== undefined && lineNumber > 0 && lineNumber <= lines.length) {
      // Line-based hashline
      const targetLine = lineNumber - 1; // Convert to 0-indexed
      const hash = this.computeHash(lines[targetLine]);

      // Replace line if hash matches (integrity check)
      if (hash === this.computeHash(oldString) || lines[targetLine].trim() === oldString.trim()) {
        lines[targetLine] = newString;
        return lines.join("\n");
      }

      throw new Error(`Hash mismatch at line ${lineNumber} - file may have changed`);
    }

    // Content-based hashline (find by content hash)
    for (let i = 0; i < lines.length; i++) {
      const hash = this.computeHash(lines[i]);
      const oldHash = this.computeHash(oldString);

      // Check if hashes match or content matches after normalization
      if (hash === oldHash || lines[i].trim() === oldString.trim()) {
        lines[i] = newString;
        return lines.join("\n");
      }
    }

    throw new Error("Could not find content for hashline edit");
  }

  /**
   * editblock: Aider-style search/replace
   * Best for: Most models
   */
  editblock(content: string, oldString: string, newString: string): string {
    // Similar to str_replace but with more lenient matching
    const trimmedOld = oldString.trim();
    const index = content.indexOf(trimmedOld);

    if (index === -1) {
      // Try finding by lines
      const lines = content.split("\n");
      const oldLines = trimmedOld.split("\n");

      for (let i = 0; i <= lines.length - oldLines.length; i++) {
        let match = true;
        for (let j = 0; j < oldLines.length; j++) {
          if (lines[i + j]?.trim() !== oldLines[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          lines.splice(i, oldLines.length, ...newString.split("\n"));
          return lines.join("\n");
        }
      }

      throw new Error("Could not find editblock location");
    }

    return content.slice(0, index) + newString + content.slice(index + trimmedOld.length);
  }

  /**
   * Compute content hash for hashline
   */
  computeHash(content: string): string {
    // Simple hash function - in production use crypto
    let hash = 0;
    const normalized = content.trim();

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const modelHarness = new ModelHarness();

export async function detectAndSelect(): Promise<ModelSelection> {
  return modelHarness.selectModelAndFormat();
}

export function executeEdit(content: string, change: EditChange, format?: EditFormat): EditResult {
  const effectiveFormat = format ?? "str_replace_fuzzy";
  return modelHarness.executeEdit(content, change, effectiveFormat);
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const modelHarnessConfig = {
  formatPriorities: ["hashline", "str_replace_fuzzy", "str_replace", "apply_patch", "editblock"],
  modelFamilyMappings: FORMAT_MAPPINGS,
  layeredMatching: true,
  hashlineEnabled: true,
  fuzzyMatchingThreshold: MATCH_THRESHOLD.FUZZY_MATCH_DEFAULT,
};

// ============================================================================
// VALIDATION
// ============================================================================

function isValidFormat(value: string): boolean {
  return ["str_replace", "str_replace_fuzzy", "apply_patch", "hashline", "editblock"].includes(
    value,
  );
}
