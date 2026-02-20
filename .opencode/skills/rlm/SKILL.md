---
name: rlm
description: Run a Recursive Language Model-style loop for long-context tasks. Uses a persistent local Python REPL and an rlm-subcall subagent as the sub-LLM (llm_query).
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Todoread
  - Todowrite
compatibility:
  - opencode
  - claude-code
removable: true # Can be removed when opencode adds native RLM
removal_doc: REMOVAL.md
---

# RLM Skill

> **Purpose**: Process 10M+ token contexts through adaptive chunking and recursive analysis.
> **Inspired**: MIT "Recursive Language Models" paper (28.3% improvement over base model)
> **Removal**: See `REMOVAL.md` when opencode adds native RLM support

---

## When to Use This Skill

✅ **Use RLM for**:
- Very large **external** files that won't fit in chat context (logs, datasets, documentation)
- Context files > 2,000 tokens
- Tasks requiring iterative inspection, chunking, and parallel processing

❌ **Do NOT use RLM for**:
- Codebase navigation (use Read/Grep/Glob tools instead)
- Analyzing code within `.opencode/` directory
- Finding specific code patterns or implementations
- Single file operations or quick analysis

**Exception**: Only use RLM when processing a specific large external file (e.g., `logs/app.log`, `data/dataset.json`).

---

## Mental Model

```
┌─────────────────┐
│   LLM (You)    │  ← Root LM
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Python REPL    │  ← External environment with large context
│  (rlm_repl)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  sub_llm()     │  ← Calls subagent (true RLM recursion)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ rlm-subcall    │  ← Subagent (sub-LLM)
│   subagent      │
└─────────────────┘
```

**Key concept**: LLM writes Python code that calls `sub_llm()` in loops (MIT paper pattern).

---

## Workflow

### 1. Initialize REPL

```bash
uv run python .opencode/skills/rlm/scripts/rlm_repl.py init <context_path>
uv run python .opencode/skills/rlm/scripts/rlm_repl.py status
```

### 2. Scout Context

```bash
uv run python .opencode/skills/rlm/scripts/rlm_repl.py exec -c "print(peek(0, 3000))"
uv run python .opencode/skills/rlm/scripts/rlm_repl.py exec -c "print(peek(len(content)-3000, len(content)))"
```

### 3. Choose Chunking Strategy

**Option A: Adaptive (Recommended)** ⭐

```python
from .adaptive_chunker import get_adaptive_chunker

chunker = get_adaptive_chunker()
chunk_tuples = chunker.create_adaptive_chunks(content, max_chunks=10)
chunks = [chunk for chunk, _ in chunk_tuples]
```

**Benefits**: Semantic boundaries (JSON objects, Markdown headings, code functions), 28.3% improvement over base model.

**Option B: Fixed-size (Fallback)**

```python
paths = write_chunks('.opencode/rlm_state/chunks', size=200000, overlap=0)
```

### 4. Process Chunks (True RLM Pattern)

```python
chunks = chunk_indices(size=50000)
results = []
for start, end in chunks[:10]:
    chunk_text = peek(start, end)
    result = sub_llm("Analyze for errors", chunk=chunk_text)
    if result["success"]:
        results.append(result["result"])
        print(f"Chunk {start}-{end}: {len(result['result'].get('relevant', []))} findings")
```

**sub_llm() Parameters**:
- `prompt`: Query for subagent (required)
- `chunk`: Raw text chunk (optional)
- `chunk_file`: Path to chunk file (optional, takes precedence)
- `agent`: Subagent type (default: "rlm-subcall")

**sub_llm() Returns**:
```python
{
    "success": True/False,
    "result": {...},  # Subagent's output
    "error": "...",   # If failed
    "chunk_id": "...",
}
```

**Environment Variables**:
- `OPENCODE_RLM_DISABLED=1` - Disable for testing
- `OPENCODE_RLM_CLI_PATH` - Custom CLI path
- `OPENCODE_RLM_AGENT` - Default subagent
- `OPENCODE_RLM_TIMEOUT` - Timeout in seconds (default: 120)

### 5. Optional: Parallel Processing

For large contexts (>200K tokens):

```python
from .parallel_processor import get_parallel_processor

processor = get_parallel_processor(max_concurrent=5)
results = processor.process_all_chunks(
    all_chunk_paths=chunks,
    query=query,
    subagent_callback=invoke_subagent
)
```

**Impact**: 3-4x speedup for large contexts.

### 6. Synthesize Results

```python
# Synthesize in REPL
synthesized = synthesize_results(results)
```

Or ask subagent to merge collected buffers.

---

## REPL Functions

| Function | Description |
|----------|-------------|
| `peek(start, end)` | View slice of context |
| `grep(pattern)` | Search context with regex |
| `chunk_indices(size, overlap)` | Get chunk boundaries |
| `write_chunks(dir, size, overlap)` | Write chunks to files |
| `add_buffer(text)` | Store intermediate results |
| `sub_llm(prompt, chunk, agent)` | Call subagent |

---

## Guardrails

- Do not paste large raw chunks into main chat context
- Use REPL to locate exact excerpts; quote only what you need
- Subagents cannot spawn other subagents
- Keep state files under `.opencode/rlm_state/`

---

## Integration

**Two approaches available**:

1. **Plugin Tool** (Preferred) - `.opencode/plugins/rlm.ts` provides `rlm_repl` tool to LLM
2. **Subprocess** - `sub_llm()` function calls opencode CLI via subprocess

Both work simultaneously. Plugin is type-safe and faster (10x), subprocess always works.

See `.opencode/plugins/RLM_PLUGIN.md` for plugin technical details.

---

## Quick Reference

| Topic | Location |
|--------|----------|
| **Research** | Original MIT paper | `docs/research/rlm.md` |
| **Capability Overview** | Tachikoma implementation | `docs/capabilities/rlm.md` |
| **Plugin Details** | Plugin dev | `.opencode/plugins/RLM_PLUGIN.md` |
| **Removal Checklist** | DevOps | `.opencode/skills/rlm/REMOVAL.md` |
| **Intent Routing** | `.opencode/config/intent-routes.yaml` |
| **Quick Start** | `.opencode/plugins/README.md` |

---

**Status**: ✅ Production ready (adaptive chunking fixed, imports working)
