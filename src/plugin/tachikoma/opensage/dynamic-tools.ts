import { constants, access, mkdir, writeFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Plugin } from "@opencode-ai/plugin";
import type { AsyncJob, ToolSpec } from "../../../types/opensage";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

interface GenerateToolArgs {
  requirement: string;
  language: "typescript" | "python" | "bash" | "javascript";
  name: string;
}

interface ExecuteToolStatefulArgs {
  toolName: string;
  action: "run" | "save-state" | "load-state" | "reset";
  stateId?: string;
  state?: Record<string, any>;
}

interface AsyncToolBackgroundArgs {
  toolName: string;
  parameters: Record<string, any>;
}

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "EEXIST") {
      throw error;
    }
  }
}

export const DynamicToolsPlugin = async ({ client, worktree }: Parameters<Plugin>[0]) => {
  const TOOLS_DIR = join(worktree, ".opencode", "generated-tools");
  const TOOL_STATES = join(worktree, ".opencode", "tool-states");

  await ensureDir(TOOLS_DIR);
  await ensureDir(TOOL_STATES);

  return {
    "session.created": async () => {
      await ensureDir(TOOLS_DIR);
      await ensureDir(TOOL_STATES);
    },

    tool: {
      "generate-tool": {
        description: "Generate a new custom tool from a requirement description",
        args: {
          requirement: { type: "string", description: "What tool should do" },
          language: {
            type: "string",
            enum: ["typescript", "python", "bash", "javascript"],
          },
          name: { type: "string", description: "Tool name (kebab-case)" },
        },
        async execute(args: GenerateToolArgs, context: any) {
          const spec = await generateToolSpec(args, client, context);
          const toolPath = await writeToolFile(spec, TOOLS_DIR);
          await writeToolMetadata(spec, TOOLS_DIR);
          return `Generated tool: @${spec.name}. Available immediately.`;
        },
      },

      "list-generated-tools": {
        description: "List all AI-generated tools",
        args: {},
        async execute() {
          const tools = await listTools(TOOLS_DIR);
          return tools.map((t) => `- @${t.name}: ${t.description}`).join("\n");
        },
      },

      "execute-tool-stateful": {
        description: "Execute a tool with state persistence",
        args: {
          toolName: { type: "string" },
          action: {
            type: "string",
            enum: ["run", "save-state", "load-state", "reset"],
          },
          stateId: { type: "string", description: "State identifier", optional: true },
          state: { type: "object", description: "State data", optional: true },
        },
        async execute(args: ExecuteToolStatefulArgs, context: any) {
          const toolPath = join(TOOLS_DIR, `${args.toolName}.ts`);

          switch (args.action) {
            case "run":
              const state = args.stateId ? await loadToolState(args.stateId, TOOL_STATES) : {};
              return await executeGeneratedTool(toolPath, context, state);

            case "save-state":
              if (!args.stateId) {
                throw new Error("stateId is required for save-state action");
              }
              await saveToolState(args.stateId, args.state || {}, TOOL_STATES);
              return `State saved to ${args.stateId}`;

            case "load-state":
              if (!args.stateId) {
                throw new Error("stateId is required for load-state action");
              }
              return await loadToolState(args.stateId, TOOL_STATES);

            case "reset":
              if (!args.stateId) {
                throw new Error("stateId is required for reset action");
              }
              await deleteToolState(args.stateId, TOOL_STATES);
              return `State ${args.stateId} reset`;

            default:
              throw new Error(`Unknown action: ${args.action}`);
          }
        },
      },

      "async-tool-background": {
        description: "Execute a long-running tool asynchronously",
        args: {
          toolName: { type: "string" },
          parameters: { type: "object" },
        },
        async execute(args: AsyncToolBackgroundArgs, context: any) {
          const jobId = `job_${Date.now()}`;
          const jobPath = join(TOOL_STATES, `${jobId}.json`);

          const job: AsyncJob = {
            jobId,
            toolName: args.toolName,
            parameters: args.parameters,
            status: "running",
            startTime: new Date().toISOString(),
          };

          await writeFile(jobPath, JSON.stringify(job, null, 2));

          return {
            jobId,
            status: "running",
            pollCommand: `@execute-tool-stateful toolName="${args.toolName}" action="run" stateId="${jobId}"`,
          };
        },
      },

      "poll-async-job": {
        description: "Check status of an async job",
        args: {
          jobId: { type: "string" },
        },
        async execute(args: any) {
          const jobPath = join(TOOL_STATES, `${args.jobId}.json`);
          const file = Bun.file(jobPath);

          if (!file.exists()) {
            return {
              status: "not_found",
              error: `Job ${args.jobId} not found`,
            };
          }

          const job: AsyncJob = JSON.parse(await file.text());
          return job;
        },
      },
    },
  };
};

async function generateToolSpec(
  args: GenerateToolArgs,
  client: any,
  context: any,
): Promise<ToolSpec> {
  const prompt = `Generate a custom tool for this requirement:
Requirement: ${args.requirement}
Language: ${args.language}
Name: ${args.name}

Return JSON with:
- name (kebab-case)
- description (concise)
- args (Zod schema object with string type)
- execute (TypeScript/Python/Bash code as string)
- dependencies (optional array of npm packages if needed)`;

  const result = await client.session.prompt({
    path: { id: context.sessionID },
    body: {
      parts: [{ type: "text", text: prompt }],
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            name: { type: "string", pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" },
            description: { type: "string" },
            args: { type: "object" },
            execute: { type: "string" },
            dependencies: { type: "array", items: { type: "string" } },
          },
          required: ["name", "description", "args", "execute"],
        },
      },
    },
  });

  const structured = result.data.info.structured_output;
  return {
    ...structured,
    language: args.language,
  };
}

async function writeToolFile(spec: ToolSpec, dir: string): Promise<string> {
  const filePath = join(dir, `${spec.name}.ts`);

  const imports = `import { tool } from "@opencode-ai/plugin";\n`;
  let deps = "";

  if (spec.dependencies && spec.dependencies.length > 0) {
    deps = `// Dependencies: ${spec.dependencies.join(", ")}\n`;
  }

  let argsSchema = "args: {\n";
  for (const [key, value] of Object.entries(spec.args)) {
    const type = typeof value === "string" ? "string" : "unknown";
    argsSchema += `    ${key}: tool.schema.${type}().describe("${key}"),\n`;
  }
  argsSchema += "  },";

  const content = `${imports}${deps}

export default tool({
  description: "${spec.description}",
  ${argsSchema}
  async execute(args: any, context: any) {
    ${spec.execute}
  }
});
`;

  await writeFile(filePath, content);

  if (spec.dependencies && spec.dependencies.length > 0) {
    try {
      await Bun.$`bun install ${spec.dependencies.join(" ")}`.cwd(dir);
    } catch (error) {
      console.error("Failed to install dependencies:", error);
    }
  }

  return filePath;
}

async function writeToolMetadata(spec: ToolSpec, dir: string): Promise<void> {
  const metaPath = join(dir, `${spec.name}.json`);
  const metadata = {
    name: spec.name,
    description: spec.description,
    language: spec.language,
    dependencies: spec.dependencies || [],
    createdAt: new Date().toISOString(),
  };
  await writeFile(metaPath, JSON.stringify(metadata, null, 2));
}

async function listTools(dir: string): Promise<ToolSpec[]> {
  const tools: ToolSpec[] = [];

  try {
    const files = await readdir(dir);
    const metaFiles = files.filter((f) => f.endsWith(".json"));

    for (const file of metaFiles) {
      const metaPath = join(dir, file);
      if (await fileExists(metaPath)) {
        const meta = JSON.parse(await Bun.file(metaPath).text());
        tools.push(meta);
      }
    }
  } catch (error) {
    console.error("Failed to list tools:", error);
  }

  return tools;
}

async function executeGeneratedTool(
  toolPath: string,
  context: any,
  state: Record<string, any>,
): Promise<any> {
  const toolModule = await import(toolPath);
  const executeFn = toolModule.default?.execute;

  if (typeof executeFn !== "function") {
    throw new Error("Tool does not export a valid execute function");
  }

  return await executeFn(context.args || {}, { ...context, state });
}

async function loadToolState(stateId: string, dir: string): Promise<Record<string, any>> {
  const statePath = join(dir, `${stateId}.json`);

  const exists = await fileExists(statePath);
  if (!exists) {
    throw new Error(`State ${stateId} not found`);
  }

  return JSON.parse(await Bun.file(statePath).text());
}

async function saveToolState(
  stateId: string,
  state: Record<string, any>,
  dir: string,
): Promise<void> {
  const statePath = join(dir, `${stateId}.json`);
  const stateData = {
    id: stateId,
    state,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(statePath, JSON.stringify(stateData, null, 2));
}

async function deleteToolState(stateId: string, dir: string): Promise<void> {
  const statePath = join(dir, `${stateId}.json`);

  const exists = await fileExists(statePath);
  if (!exists) {
    throw new Error(`State ${stateId} not found`);
  }

  await Bun.$`rm ${statePath}`;
}
