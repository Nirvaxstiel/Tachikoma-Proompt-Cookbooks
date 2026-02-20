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
uv run python .opencode/skills/rlm/scripts/rlm_repl.py init <context_path>

# Check status
uv run python .opencode/skills/rlm/scripts/rlm_repl.py status

# Scout context
uv run python .opencode/skills/rlm/scripts/rlm_repl.py exec -c "print(peek(0, 3000))"

# Create chunks
uv run python .opencode/skills/rlm/scripts/rlm_repl.py exec <<'PY'
paths = write_chunks('.opencode/rlm_state/chunks', size=200000, overlap=0)
print(len(paths))
PY

# Use sub_llm for true RLM recursion
uv run python .opencode/skills/rlm/scripts/rlm_repl.py exec <<'PY'
chunks = chunk_indices(size=50000)
results = []
for start, end in chunks[:5]:
    chunk_text = peek(start, end)
    result = sub_llm("Analyze this chunk", chunk=chunk_text)
    if result["success"]:
        results.append(result["result"])
print(f"Processed {len(results)} chunks")
PY
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
