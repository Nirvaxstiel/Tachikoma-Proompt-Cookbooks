/**
 * YAML Parser Utility
 *
 * Provides unified YAML parsing for the codebase.
 * Supports simple YAML structures commonly used in config files.
 */

import type { z } from "zod";

export interface ParseOptions {
  trimValues?: boolean;
  skipComments?: boolean;
  commentChar?: string;
}

export interface YamlNode {
  [key: string]: string | YamlNode | YamlNode[];
}

/**
 * Parse simple YAML content into an object
 */
export function parseSimpleYaml(content: string, options: ParseOptions = {}): YamlNode {
  const { trimValues = true, skipComments = true, commentChar = "#" } = options;

  const lines = content.split("\n");
  const result: YamlNode = {};
  const stack: Array<{ node: YamlNode; indent: number }> = [{ node: result, indent: 0 }];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || (skipComments && trimmed.startsWith(commentChar))) {
      continue;
    }

    const indent = line.search(/\S|$/);
    const current = stack[stack.length - 1];

    // Determine nesting level
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].node;

    // Section (ends with :)
    if (trimmed.endsWith(":")) {
      const sectionName = trimmed.slice(0, -1).trim();
      const newSection: YamlNode = {};
      parent[sectionName] = newSection;
      stack.push({ node: newSection, indent });
    }
    // Key-value pair
    else if (trimmed.includes(":")) {
      const colonIndex = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIndex).trim();
      let value = trimmed.slice(colonIndex + 1).trim();

      if (trimValues) {
        value = value.replace(/^["']|["']$/g, "");
      }

      parent[key] = value;
    }
  }

  return result;
}

/**
 * Parse YAML with Zod schema validation
 */
export function parseYamlWithSchema<T>(
  content: string,
  schema: z.ZodType<T>,
  options: ParseOptions = {},
): T {
  const parsed = parseSimpleYaml(content, options);
  return schema.parse(parsed);
}

/**
 * Load YAML file with optional schema validation
 */
export async function loadYamlFile<T = YamlNode>(
  path: string,
  schema?: z.ZodType<T>,
  options: ParseOptions = {},
): Promise<T | null> {
  try {
    const content = await Bun.file(path).text();

    if (schema) {
      return parseYamlWithSchema(content, schema, options);
    }

    return parseSimpleYaml(content, options) as T;
  } catch (error) {
    console.error(`Failed to load YAML file: ${path}`, error);
    return null;
  }
}

/**
 * Check if YAML file exists
 */
export async function yamlFileExists(path: string): Promise<boolean> {
  try {
    await Bun.file(path).text();
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a simple YAML string from an object
 */
export function toSimpleYaml(obj: YamlNode, indent = 0): string {
  const spaces = "  ".repeat(indent);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      lines.push(`${spaces}${key}:`);
      lines.push(toSimpleYaml(value, indent + 1));
    } else if (Array.isArray(value)) {
      lines.push(`${spaces}${key}:`);
      for (const item of value) {
        lines.push(`${spaces}  - ${item}`);
      }
    } else {
      lines.push(`${spaces}${key}: ${value}`);
    }
  }

  return lines.join("\n");
}
