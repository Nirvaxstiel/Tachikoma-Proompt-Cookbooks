#!/usr/bin/env bun
/**
 * Tachikoma Plugin for OpenCode
 * Auto-discovers scripts and registers them as tools
 *
 * Convention:
 * - Scripts live in the same directory as this plugin ("tachikoma/")
 * - Each script becomes tachikoma.<script-name> tool
 * - Scripts use JSDoc comments for descriptions
 * - Scripts accept arguments via Bun.argv or process.argv
 *
 * Note: Agent modules (core.ts, router.ts, etc.) are NOT registered as tools.
 *       They are internal modules used for agent logic.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { tool } from "@opencode-ai/plugin/tool";

// TYPES
interface ScriptInfo {
  name: string;
  path: string;
  description: string;
  hasPathArg: boolean;
}

// UTILS
function getPluginDir(): string {
  let scriptPath = new URL(import.meta.url).pathname;
  // Fix Windows path issue with file:// URLs
  if (process.platform === "win32" && scriptPath.startsWith("/")) {
    scriptPath = scriptPath.substring(1);
  }
  return path.dirname(scriptPath);
}

function getScriptsDir(): string {
  // Scripts are in tachikoma/ subdirectory relative to plugin
  return path.join(getPluginDir(), "tachikoma");
}

async function listScripts(): Promise<ScriptInfo[]> {
  const scriptsDir = getScriptsDir();
  const scripts: ScriptInfo[] = [];

  try {
    const files = await fs.readdir(scriptsDir);

    for (const file of files) {
      // Only register actual scripts, not agent modules
      if (!file.endsWith(".ts") || file.startsWith("_")) continue;

      const scriptPath = path.join(scriptsDir, file);
      const scriptName = file.replace(".ts", "");

      // Extract description from JSDoc
      const scriptContent = await fs.readFile(scriptPath, "utf-8");
      const descMatch = scriptContent.match(/\/\*\*[\s\S]*?\*\//);
      const description = descMatch
        ? descMatch[0]
            .replace(/\/\*\*|\*\//g, "")
            .trim()
            .replace(/^\s*\* /gm, "")
            .trim()
            .split("\n")[0]
        : `Run ${scriptName} script`;

      // Check if script is a standalone script (not an agent module)
      // Agent modules have classes/exports, scripts have direct execution
      const isScript =
        scriptContent.includes("Bun.argv") ||
        scriptContent.includes("process.argv") ||
        scriptContent.includes("#!/usr/bin/env bun");

      if (!isScript) {
        // Skip agent modules (core.ts, router.ts, etc.)
        continue;
      }

      // Check if script uses path argument
      const hasPathArg =
        scriptContent.includes("Bun.argv[2]") ||
        scriptContent.includes("process.argv[2]") ||
        scriptContent.includes("args.path");

      scripts.push({
        name: scriptName,
        path: scriptPath,
        description,
        hasPathArg,
      });
    }
  } catch (error) {
    console.error(`Error listing scripts: ${error}`);
  }

  return scripts;
}

function getSchema(script: ScriptInfo) {
  return {
    path: script.hasPathArg
      ? tool.schema.string().describe("Path to process")
      : tool.schema.string().optional().describe("Path (if applicable)"),
    args: tool.schema.string().optional().describe("Arguments to pass to script"),
  };
}

// PLUGIN
export const TachikomaPlugin = async (ctx: any) => {
  const scripts = await listScripts();
  const tools: Record<string, any> = {};

  for (const script of scripts) {
    const toolName = `tachikoma.${script.name}`;
    const schema = getSchema(script);

    tools[toolName] = tool({
      description: script.description,
      args: schema,
      async execute(args, context) {
        const scriptArgs = script.hasPathArg ? args.path || "" : args.args || "";

        const proc = Bun.spawn(["bun", "run", script.path, scriptArgs], {
          stdout: "pipe",
          stderr: "pipe",
        });

        const stdout = await new Response(proc.stdout).text();
        const stderr = await new Response(proc.stderr).text();
        const exitCode = await proc.exited;

        if (exitCode !== 0) {
          throw new Error(`Script failed: ${stderr || "Unknown error"}`);
        }

        return stdout;
      },
    });
  }

  return { tool: tools };
};
