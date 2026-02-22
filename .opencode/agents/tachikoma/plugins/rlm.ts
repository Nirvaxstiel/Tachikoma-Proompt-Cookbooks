// RLM Plugin for OpenCode
// Provides native rlm_repl tool for Recursive Language Model workflows
// Converted from Python to TypeScript (Bun runtime)

function createLogger(service: string) {
  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      const timestamp = new Date().toISOString();
      const msg = meta ? `${message} ${JSON.stringify(meta)}` : message;
      console.log(`[${timestamp}] [INFO] [${service}] ${msg}`);
    },
    error: (message: string, error?: Error | Record<string, unknown>) => {
      const timestamp = new Date().toISOString();
      const extra = error instanceof Error ? ` ${error.message}` : "";
      const metaStr = typeof error === "object" && error !== null ? ` ${JSON.stringify(error)}` : "";
      console.error(`[${timestamp}] [ERROR] [${service}] ${message}${extra}${metaStr}`);
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      if (process.env.RLM_DEBUG !== "1") return;
      const timestamp = new Date().toISOString();
      const msg = meta ? `${message} ${JSON.stringify(meta)}` : message;
      console.log(`[${timestamp}] [DEBUG] [${service}] ${msg}`);
    },
  };
}

const log = createLogger("plugin:rlm");

// TypeScript RLM script path
const RLM_SCRIPT = ".opencode/skills/rlm/rlm-repl.ts";
const DEFAULT_STATE_PATH = ".opencode/rlm_state/state.json";

// Helper to run TypeScript RLM REPL
async function runRlmRepl(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const cmdArgs = ["run", RLM_SCRIPT, ...args];

  try {
    const process = Bun.spawn({
      cmd: ["bun", ...cmdArgs],
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = await new Response(process.stdout).text();
    const stderr = await new Response(process.stderr).text();
    const exitCode = await process.exited;

    return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: exitCode ?? -1 };
  } catch (error) {
    log.error("Failed to run RLM TypeScript script", { error });
    return {
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      exitCode: -1,
    };
  }
}

// Plugin input type (simplified for external plugin)
interface PluginInput {
  cwd?: string;
  [key: string]: unknown;
}

// Hooks type (simplified)
interface Hooks {
  tool?: Record<string, unknown>;
  "tool.execute.after"?: (input: { tool: string; args?: Record<string, unknown> }) => Promise<void>;
  [key: string]: unknown;
}

// ============================================================================
// RLM PLUGIN
// ============================================================================

export async function RLMPlugin(input: PluginInput): Promise<Hooks> {
  log.info("Initializing RLM plugin (TypeScript)");

  // Define RLM REPL tool
  const rlmTool = {
    type: "function" as const,
    description: `Persistent TypeScript REPL for Recursive Language Model workflows.

This tool provides a stateful TypeScript environment for processing large contexts
using MIT-style Recursive Language Model techniques. The REPL maintains state across
invocations and provides helper functions for chunking, searching, and
subagent delegation.

## Available Commands

### init <context_path>
Initialize REPL state with a context file.
\`\`\`bash
rlm_repl init path/to/context.txt
\`\`\`

### status
Show current REPL state.
\`\`\`bash
rlm_repl status
\`\`\`

### exec -c "code"
Execute TypeScript code in REPL. State persists across calls.
\`\`\`bash
rlm_repl exec -c "console.log(peek(0, 1000))"
\`\`\`

### reset
Delete REPL state.
\`\`\`bash
rlm_repl reset
\`\`\`

## Available Functions (in REPL)

- \`peek(start, end)\` - View slice of context
- \`grep(pattern)\` - Search context with regex
- \`chunkIndices(size, overlap)\` - Get chunk boundaries
- \`writeChunks(dir, size, overlap)\` - Write chunks to files
- \`addBuffer(text)\` - Store intermediate results
- \`subLlm(prompt, chunk)\` - Call subagent (async, RLM recursion)

## RLM Pattern

\`\`\`typescript
// MIT paper's approach: LLM writes code that calls subLlm in loops
const chunks = chunkIndices(50000);
const results = [];
for (const [start, end] of chunks.slice(0, 10)) {
    const chunk = peek(start, end);
    const result = await subLlm("Analyze for errors", chunk);
    if (result.success) {
        results.push(result.result);
    }
}
console.log(\`Processed \${results.length} chunks\`);
\`\`\`

## Environment Variables

- OPENCODE_RLM_DISABLED=1 - Disable subLlm (for testing)
- OPENCODE_RLM_CLI_PATH - Path to opencode CLI
- OPENCODE_RLM_AGENT - Default subagent (default: rlm-subcall)
- OPENCODE_RLM_TIMEOUT - Timeout for subLlm calls (default: 120s)

State is persisted in: ${DEFAULT_STATE_PATH}`,
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "RLM REPL command to execute",
          enum: ["init", "status", "reset", "exec"],
        },
        context_path: {
          type: "string",
          description: "Path to context file (required for 'init' command)",
        },
        code: {
          type: "string",
          description: "TypeScript code to execute (for 'exec' command)",
        },
        state: {
          type: "string",
          description: "Path to state file (optional)",
        },
        args: {
          type: "array",
          items: { type: "string" },
          description: "Additional arguments (advanced usage)",
        },
      },
      required: ["command"],
    },
  };

  return {
    // Add rlm_repl tool to tool registry
    tool: {
      rlm_repl: rlmTool,
    },

    // Hook into tool execution to track RLM operations
    "tool.execute.after": async (input) => {
      if (input.tool !== "rlm_repl") return;

      const command = input.args?.command || "unknown";
      log.info("RLM tool after-hook", { command });
    },

    // Custom tool definition hook
    "tool.definition": async (input) => {
      if ((input as { toolID?: string }).toolID !== "rlm_repl") return;

      log.debug("RLM tool definition requested", { toolID: (input as { toolID?: string }).toolID });
    },
  };
}

// Export the run function for external use
export { runRlmRepl };
