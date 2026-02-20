// Simple inline logger for RLM plugin (external plugin compatibility)
// External plugins can't use @/util/log imports, so we create our own

function createLogger(service: string) {
  return {
    info: (message: string, meta?: Record<string, any>) => {
      const timestamp = new Date().toISOString()
      const msg = meta ? `${message} ${JSON.stringify(meta)}` : message
      console.log(`[${timestamp}] [INFO] [${service}] ${msg}`)
    },
    error: (message: string, error?: Error | Record<string, any>) => {
      const timestamp = new Date().toISOString()
      const extra = error instanceof Error ? ` ${error.message}` : ""
      const metaStr = typeof error === "object" && error !== null ? ` ${JSON.stringify(error)}` : ""
      console.error(`[${timestamp}] [ERROR] [${service}] ${message}${extra}${metaStr}`)
    },
    debug: (message: string, meta?: Record<string, any>) => {
      if (process.env.RLM_DEBUG !== "1") return
      const timestamp = new Date().toISOString()
      const msg = meta ? `${message} ${JSON.stringify(meta)}` : message
      console.log(`[${timestamp}] [DEBUG] [${service}] ${msg}`)
    },
  }
}

const log = createLogger("plugin:rlm")

// Python execution helper
const RLM_SCRIPT = ".opencode/skills/rlm/scripts/rlm_repl.py"
const DEFAULT_STATE_PATH = ".opencode/rlm_state/state.pkl"

// Helper to run UV Python
async function runPython(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const command = "uv"
  const cmdArgs = ["run", "python", RLM_SCRIPT, ...args]

  try {
    const process = Bun.spawn({
      cmd: command,
      args: cmdArgs,
      stdout: "pipe",
      stderr: "pipe",
    })

    const stdout = await new Response(process.stdout).text()
    const stderr = await new Response(process.stderr).text()
    const exitCode = await process.exited

    return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: exitCode ?? -1 }
  } catch (error) {
    log.error("Failed to run RLM Python script", { error })
    return {
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      exitCode: -1,
    }
  }
}

// ============================================================================
// RLM PLUGIN
// ============================================================================

export async function RLMPlugin(input: PluginInput): Promise<Hooks> {
  log.info("Initializing RLM plugin")

  // Define RLM REPL tool using the tool() helper function
  // Note: Using raw object structure since tool() helper may not be available to external plugins
  const rlmTool = {
    type: "function" as const,
    description: `Persistent Python REPL for Recursive Language Model workflows.

This tool provides a stateful Python environment for processing large contexts
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
Execute Python code in REPL. State persists across calls.
\`\`\`bash
rlm_repl exec -c "print(peek(0, 1000))"
\`\`\`

### exec
Execute multi-line Python code from stdin.
\`\`\`bash
rlm_repl exec <<'PY'
chunks = chunk_indices(size=50000)
print(f"Created {len(chunks)} chunks")
PY
\`\`\`

### reset
Delete REPL state.
\`\`\`bash
rlm_repl reset
\`\`\`

## Available Functions (in REPL)

- \`peek(start, end)\` - View slice of context
- \`grep(pattern)\` - Search context with regex
- \`chunk_indices(size, overlap)\` - Get chunk boundaries
- \`write_chunks(dir, size, overlap)\` - Write chunks to files
- \`add_buffer(text)\` - Store intermediate results
- \`sub_llm(prompt, chunk, agent)\` - Call subagent (RLM recursion)

## RLM Pattern

\`\`\`python
# MIT paper's approach: LLM writes code that calls sub_llm in loops
chunks = chunk_indices(size=50000)
results = []
for start, end in chunks[:10]:
    chunk = peek(start, end)
    result = sub_llm("Analyze for errors", chunk=chunk)
    if result["success"]:
        results.append(result["result"])
# Synthesize results
print(f"Processed {len(results)} chunks")
\`\`\`

## Environment Variables

- OPENCODE_RLM_DISABLED=1 - Disable sub_llm (for testing)
- OPENCODE_RLM_CLI_PATH - Path to opencode CLI
- OPENCODE_RLM_AGENT - Default subagent (default: rlm-subcall)
- OPENCODE_RLM_TIMEOUT - Timeout for sub_llm calls (default: 120s)

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
          description:
            "Python code to execute (for 'exec' command, use -c or provide via stdin)",
        },
        args: {
          type: "array",
          items: { type: "string" },
          description: "Additional arguments for RLM script (advanced usage)",
        },
      },
      required: ["command"],
    },
  }

  return {
    // Add rlm_repl tool to tool registry
    tool: {
      rlm_repl: rlmTool,
    },

    // Hook into tool execution to track RLM operations
    "tool.execute.after": async (input) => {
      if (input.tool !== "rlm_repl") return

      // Log RLM operations for telemetry
      const command = input.args?.command || "unknown"
      log.info("RLM tool after-hook", { command })
      return
    },

    // Transform messages to inject RLM context when needed
    "chat.message": async (input, output) => {
      // Could inject RLM state or hints when relevant
      return
    },

    // Custom tool definition hook (modify descriptions based on context)
    "tool.definition": async (input) => {
      if (input.toolID !== "rlm_repl") return

      // Potentially modify description based on current context
      log.debug("RLM tool definition requested", { toolID: input.toolID })
      return
    },
  }
}
