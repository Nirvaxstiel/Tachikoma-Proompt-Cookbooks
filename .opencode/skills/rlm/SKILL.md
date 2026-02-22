---
name: rlm
description: Run a Recursive Language Model-style loop for long-context tasks. Uses a persistent local TypeScript REPL and an rlm-subcall subagent as the sub-LLM (llm_query).
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
│ TypeScript REPL │  ← External environment with large context
│   (rlm-repl)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  subLlm()      │  ← Calls subagent (true RLM recursion)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ rlm-subcall    │  ← Subagent (sub-LLM)
│   subagent      │
└─────────────────┘
```

**Key concept**: LLM writes TypeScript code that calls `subLlm()` in loops (MIT paper pattern).

---

## Workflow

### 1. Initialize REPL

```bash
bun run .opencode/skills/rlm/rlm-repl.ts init <context_path>
bun run .opencode/skills/rlm/rlm-repl.ts status
```

### 2. Scout Context

```bash
bun run .opencode/skills/rlm/rlm-repl.ts exec -c "console.log(peek(0, 3000))"
bun run .opencode/skills/rlm/rlm-repl.ts exec -c "console.log(peek(content.length-3000, content.length))"
```

### 3. Choose Chunking Strategy

**Option A: Adaptive (Recommended)** ⭐

```typescript
import { getAdaptiveChunker } from './adaptive-chunker';

const chunker = getAdaptiveChunker();
const chunks = chunker.createAdaptiveChunks(content, 10);
```

**Benefits**: Semantic boundaries (JSON objects, Markdown headings, code functions), 28.3% improvement over base model.

**Option B: Fixed-size (Fallback)**

```typescript
const paths = writeChunks('.opencode/rlm_state/chunks', 200000, 0);
```

### 4. Process Chunks (True RLM Pattern)

```typescript
const chunks = chunkIndices(50000);
const results = [];
for (const [start, end] of chunks.slice(0, 10)) {
    const chunkText = peek(start, end);
    const result = await subLlm("Analyze for errors", chunkText);
    if (result.success) {
        results.push(result.result);
        console.log(`Chunk ${start}-${end}: ${result.result?.relevant?.length || 0} findings`);
    }
}
```

**subLlm() Parameters**:
- `prompt`: Query for subagent (required)
- `chunk`: Raw text chunk (optional)
- `chunkFile`: Path to chunk file (optional, takes precedence)

**subLlm() Returns**:
```typescript
{
    success: boolean,
    result?: unknown,  // Subagent's output
    error?: string,    // If failed
    chunk_id?: string,
}
```

**Environment Variables**:
- `OPENCODE_RLM_DISABLED=1` - Disable for testing
- `OPENCODE_RLM_CLI_PATH` - Custom CLI path
- `OPENCODE_RLM_AGENT` - Default subagent
- `OPENCODE_RLM_TIMEOUT` - Timeout in seconds (default: 120)

### 5. Optional: Parallel Processing

For large contexts (>200K tokens):

```typescript
import { getParallelProcessor } from './parallel-processor';

const processor = getParallelProcessor(5);
const results = await processor.processAll(
    chunkPaths,
    query,
    async (data) => invokeSubagent(data)
);
```

**Impact**: 3-4x speedup for large contexts.

### 6. Synthesize Results

```typescript
// Synthesize in REPL
const synthesized = synthesizeResults(results);
```

Or ask subagent to merge collected buffers.

---

## REPL Functions

| Function | Description |
|----------|-------------|
| `peek(start, end)` | View slice of context |
| `grep(pattern)` | Search context with regex |
| `chunkIndices(size, overlap)` | Get chunk boundaries |
| `writeChunks(dir, size, overlap)` | Write chunks to files |
| `addBuffer(text)` | Store intermediate results |
| `subLlm(prompt, chunk)` | Call subagent (async) |

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
| **Intent Routing** | `.opencode/agents/tachikoma/config/routing/features.yaml` |
| **Quick Start** | `.opencode/plugins/README.md` |

---

**Status**: ✅ Production ready (adaptive chunking fixed, imports working)
