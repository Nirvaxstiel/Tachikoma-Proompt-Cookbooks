import type { z } from "zod";

export interface ParseOptions {
  trimValues?: boolean;
  skipComments?: boolean;
  commentChar?: string;
}

export interface YamlNode {
  [key: string]: string | YamlNode | YamlNode[];
}

export function parseSimpleYaml(
  content: string,
  options: ParseOptions = {},
): YamlNode {
  const { trimValues = true, skipComments = true, commentChar = "#" } = options;

  const lines = content.split("\n");
  const result: YamlNode = {};
  const stack: Array<{ node: YamlNode; indent: number }> = [
    { node: result, indent: 0 },
  ];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || (skipComments && trimmed.startsWith(commentChar))) {
      continue;
    }

    const indent = line.search(/\S|$/);
    const current = stack[stack.length - 1];

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].node;

    if (trimmed.endsWith(":")) {
      const sectionName = trimmed.slice(0, -1).trim();
      const newSection: YamlNode = {};
      parent[sectionName] = newSection;
      stack.push({ node: newSection, indent });
    } else if (trimmed.includes(":")) {
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

export function parseYamlWithSchema<T>(
  content: string,
  schema: z.ZodType<T>,
  options: ParseOptions = {},
): T {
  const parsed = parseSimpleYaml(content, options);
  return schema.parse(parsed);
}

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

export async function yamlFileExists(path: string): Promise<boolean> {
  try {
    await Bun.file(path).text();
    return true;
  } catch {
    return false;
  }
}

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
