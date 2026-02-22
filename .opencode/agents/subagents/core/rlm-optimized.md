---
name: rlm-optimized
description: MIT-style Recursive Language Model with adaptive chunking, semantic boundary detection, and parallel processing. Handles 10M+ token contexts efficiently. Enhanced version of base RLM with 2-5x efficiency gains.
mode: subagent
temperature: 0
permission:
  read:
    "*": "allow"
  grep:
    "*": "allow"
  glob:
    "*": "allow"
  bash:
    "*": "allow"
  edit:
    "*": "deny"
  write:
    "*": "deny"
  task:
    "*": "deny"
tools:
  Read: true
  Grep: true
  Glob: true
  Bash: true
---

# RLM-Optimized Subagent

> **NOTE**: This subagent is a thin wrapper around the RLM skill.
> All logic lives in `.opencode/skills/rlm/SKILL.md`.
> See `.opencode/skills/rlm/REMOVAL.md` for removal instructions.

## Purpose

Handle large contexts efficiently using semantic chunking, parallel processing, and intelligent synthesis.

## Quick Start

```bash
# Initialize the REPL state
bun run .opencode/skills/rlm/rlm-repl.ts init <context_path>

# Check status
bun run .opencode/skills/rlm/rlm-repl.ts status

# Scout context
bun run .opencode/skills/rlm/rlm-repl.ts exec -c "console.log(peek(0, 3000))"

# Create chunks
bun run .opencode/skills/rlm/rlm-repl.ts exec -c "const paths = writeChunks('.opencode/rlm_state/chunks', 200000, 0); console.log(paths.length)"

# Use subLlm for true RLM recursion
bun run .opencode/skills/rlm/rlm-repl.ts exec -c "
const chunks = chunkIndices(50000);
const results = [];
for (const [start, end] of chunks.slice(0, 5)) {
    const chunkText = peek(start, end);
    const result = await subLlm('Analyze this chunk', chunkText);
    if (result.success) results.push(result.result);
}
console.log('Processed', results.length, 'chunks');
"
```

## Key Features

| Feature                 | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| **Adaptive Chunking**   | Semantic boundary detection (JSON, Markdown, Code, Logs) |
| **Parallel Processing** | 3-5 chunks concurrently with early termination           |
| **sub_llm()**           | True RLM recursion - call subagents from REPL            |
| **Performance**         | 2-5x efficiency gain, 3-4x speedup vs sequential         |

## Environment Variables

| Variable                | Description                         | Default       |
| ----------------------- | ----------------------------------- | ------------- |
| `OPENCODE_RLM_DISABLED` | Disable sub_llm integration         | `0`           |
| `OPENCODE_RLM_CLI_PATH` | Path to opencode CLI                | `opencode`    |
| `OPENCODE_RLM_AGENT`    | Default subagent for sub_llm        | `rlm-subcall` |
| `OPENCODE_RLM_TIMEOUT`  | Timeout for sub_llm calls (seconds) | `120`         |

## Full Documentation

See `.opencode/skills/rlm/SKILL.md` for complete workflow and examples.

---

**RLM-Optimized** — Handle millions of tokens efficiently 🚀
