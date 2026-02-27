import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Plugin } from "@opencode-ai/plugin";
import type { AgentSpec, HorizontalEnsemble, VerticalDecomposition } from "../../../types/opensage";

interface GenerateAgentArgs {
  task: string;
  mode?: "primary" | "subagent" | "all";
  specialization?: string;
}

interface VerticalDecomposeArgs {
  task: string;
  subtasks: string[];
}

interface HorizontalEnsembleArgs {
  task: string;
  strategies: string[];
  mergeStrategy?: "consensus" | "majority_vote" | "best_score";
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "EEXIST") {
      throw error;
    }
  }
}

export const OpensageAgentsPlugin = async ({
  client,
  directory,
  worktree,
}: Parameters<Plugin>[0]) => {
  const AGENTS_DIR = join(worktree, ".opencode", "generated-agents");

  await ensureDir(AGENTS_DIR);

  return {
    "session.created": async () => {
      await ensureDir(AGENTS_DIR);
    },

    tool: {
      "generate-agent": {
        description: "Generate a new specialized agent from a task description",
        args: {
          task: { type: "string", description: "Task description for agent" },
          mode: { type: "string", description: "primary, subagent, or all" },
          specialization: { type: "string", description: "Domain or specialization" },
        },
        async execute(args: GenerateAgentArgs, context: any) {
          const spec = await generateAgentSpec(args, client, context);
          const agentPath = await writeAgentFile(spec, AGENTS_DIR);
          return `Generated agent at ${agentPath}. Invoke with @${spec.name}`;
        },
      },

      "list-generated-agents": {
        description: "List all AI-generated agents",
        args: {},
        async execute() {
          const agents = await listAgents(AGENTS_DIR);
          return agents.map((a) => `- @${a.name}: ${a.description}`).join("\n");
        },
      },

      "vertical-decompose": {
        description: "Create vertical agent topology for task decomposition",
        args: {
          task: { type: "string", description: "Main task to decompose" },
          subtasks: {
            type: "array",
            items: { type: "string" },
            description: "List of subtasks",
          },
        },
        async execute(args: VerticalDecomposeArgs, context: any) {
          const agents = await Promise.all(
            args.subtasks.map((subtask) =>
              generateAgentSpec(
                {
                  task: subtask,
                  mode: "subagent",
                  specialization: `Specialized for: ${subtask}`,
                },
                client,
                context,
              ),
            ),
          );

          const paths = await Promise.all(agents.map((agent) => writeAgentFile(agent, AGENTS_DIR)));

          const result: VerticalDecomposition = {
            task: args.task,
            subtasks: args.subtasks,
            agents,
            executionOrder: "sequential",
            strategy: "vertical_decomposition",
          };

          return {
            agents: agents.map((a) => a.name),
            paths,
            execution_order: "sequential",
            strategy: "vertical_decomposition",
          };
        },
      },

      "horizontal-ensemble": {
        description: "Create horizontal agent ensemble for parallel exploration",
        args: {
          task: { type: "string", description: "Task to explore in parallel" },
          strategies: {
            type: "array",
            items: { type: "string" },
            description: "Different approaches",
          },
          mergeStrategy: {
            type: "string",
            description: "consensus, majority_vote, or best_score",
            optional: true,
          },
        },
        async execute(args: HorizontalEnsembleArgs, context: any) {
          const agents = await Promise.all(
            args.strategies.map((strategy) =>
              generateAgentSpec(
                {
                  task: `${args.task} using ${strategy} approach`,
                  mode: "subagent",
                  specialization: `${strategy} approach`,
                },
                client,
                context,
              ),
            ),
          );

          const paths = await Promise.all(agents.map((agent) => writeAgentFile(agent, AGENTS_DIR)));

          const coordinator = await generateAgentSpec(
            {
              task: "Coordinate ensemble results",
              mode: "primary",
              specialization: "ensemble-coordinator",
            },
            client,
            context,
          );
          const coordinatorPath = await writeAgentFile(coordinator, AGENTS_DIR);

          const result: HorizontalEnsemble = {
            task: args.task,
            strategies: args.strategies,
            ensembleMembers: agents,
            coordinator,
            executionMode: "parallel",
            mergeStrategy: args.mergeStrategy || "consensus",
          };

          return {
            ensemble_members: agents.map((a) => a.name),
            coordinator: coordinator.name,
            paths: [...paths, coordinatorPath],
            execution_mode: "parallel",
            merge_strategy: args.mergeStrategy || "consensus",
          };
        },
      },
    },
  };
};

async function generateAgentSpec(
  args: GenerateAgentArgs,
  client: any,
  context: any,
): Promise<AgentSpec> {
  const prompt = `Generate an agent configuration for this task:
Task: ${args.task}
Mode: ${args.mode || "subagent"}
Specialization: ${args.specialization || "general"}

Return JSON with:
- name (kebab-case, 1-64 chars)
- description (1-1024 chars, 1-2 sentences)
- prompt (system instructions)
- tools (optional object mapping tool names to boolean)
- model (optional object with providerID and modelID)
- temperature (optional number 0.0-1.0)`;

  const result = await client.session.prompt({
    path: { id: context.sessionID },
    body: {
      parts: [{ type: "text", text: prompt }],
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              pattern: "^[a-z0-9]+(-[a-z0-9]+)*$",
              minLength: 1,
              maxLength: 64,
            },
            description: { type: "string", minLength: 1, maxLength: 1024 },
            prompt: { type: "string" },
            tools: { type: "object" },
            model: {
              type: "object",
              properties: {
                providerID: { type: "string" },
                modelID: { type: "string" },
              },
            },
            temperature: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["name", "description", "prompt"],
        },
      },
    },
  });

  return result.data.info.structured_output;
}

async function writeAgentFile(spec: AgentSpec, dir: string): Promise<string> {
  const filePath = join(dir, `${spec.name}.md`);

  let content = `---
description: ${spec.description}
mode: ${spec.mode}
`;

  if (spec.tools && Object.keys(spec.tools).length > 0) {
    content += `tools:\n${Object.entries(spec.tools)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join("\n")}\n`;
  }

  if (spec.model) {
    content += `model: ${spec.model.providerID}/${spec.model.modelID}\n`;
  }

  if (spec.temperature !== undefined) {
    content += `temperature: ${spec.temperature}\n`;
  }

  content += `---\n${spec.prompt}\n`;

  await Bun.write(filePath, content);
  return filePath;
}

async function listAgents(dir: string): Promise<AgentSpec[]> {
  const agents: AgentSpec[] = [];

  try {
    const files = await readdir(dir);

    for (const file of files) {
      if (file.endsWith(".md")) {
        const content = await Bun.file(join(dir, file)).text();
        const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
        if (frontmatterMatch) {
          const lines = frontmatterMatch[1].split("\n");
          const description = lines.find((l) => l.startsWith("description:"))?.substring(13) || "";

          const modeLine = lines.find((l) => l.startsWith("mode:"));
          const mode = modeLine?.substring(6) || "subagent";

          agents.push({
            name: file.slice(0, -3),
            description,
            mode: mode as "primary" | "subagent" | "all",
          });
        }
      }
    }
  } catch (error) {
    console.error("Failed to list agents:", error);
  }

  return agents;
}
