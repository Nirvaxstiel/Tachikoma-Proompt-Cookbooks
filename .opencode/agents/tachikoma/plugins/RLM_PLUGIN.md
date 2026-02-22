# RLM Plugin Technical Reference

> **Purpose**: Provides `rlm_repl` tool to opencode for native RLM integration.
> **File**: `.opencode/plugins/rlm.ts`
> **Status**: ✅ Working - Auto-loaded by opencode

---

## What This Plugin Does

Provides a native opencode tool that the LLM can call directly:

```typescript
{
  "tool": "rlm_repl",
  "args": {
    "command": "init",
    "context_path": "logs/app.log"
  }
}
```

**Alternative**: Subprocess fallback via `sub_llm()` in Python REPL.

---

## Tool Definition

### Tool Name: `rlm_repl`

### Commands

| Command | Description | Example |
|---------|-------------|----------|
| `init` | Initialize REPL with context file | `init logs/app.log` |
| `exec` | Execute Python code | `exec -c "print(peek(0, 1000))"` |
| `status` | Show REPL state | `status` |

### Parameters

| Parameter | Type | Required | Description |
|-----------|--------|-----------|-------------|
| `command` | string | ✅ | Command to execute |
| `context_path` | string | ⚠️ | Path to context file (for `init`) |
| `code` | string | ⚠️ | Python code to execute (for `exec`) |

---

## Implementation

### Architecture

```
opencode LLM
    │
    ▼
Plugin Hook (rlm_repl tool)
    │
    ▼
Bun Runtime (executes rlm-repl.ts)
    │
    ▼
TypeScript REPL (stateful, JSON)
```

### Hooks Used

| Hook | Purpose |
|-------|---------|
| `tool` | Register `rlm_repl` tool |
| `tool.execute.after` | Track operations for telemetry |
| `tool.definition` | Customize tool descriptions (optional) |

### Tool Registration

```typescript
tool({
  name: "rlm_repl",
  description: "Persistent TypeScript REPL for RLM workflows",
  parameters: z.object({
    command: z.enum(["init", "exec", "status"]),
    context_path: z.string().optional(),
    code: z.string().optional(),
  }),
});
```

---

## Usage Examples

### Initialize

```json
{
  "tool": "rlm_repl",
  "args": {
    "command": "init",
    "context_path": "logs/app.log"
  }
}
```

### Execute

```json
{
  "tool": "rlm_repl",
  "args": {
    "command": "exec",
    "code": "print(peek(0, 3000))"
  }
}
```

### RLM Pattern

```json
{
  "tool": "rlm_repl",
  "args": {
    "command": "exec",
    "code": "chunks = chunk_indices(size=50000); print(f'Created {len(chunks)} chunks')"
  }
}
```

---

## Comparison: Plugin vs Subprocess

| Aspect | Plugin | Subprocess |
|---------|---------|------------|
| **Type Safety** | ✅ TypeScript | ❌ String-based |
| **Overhead** | ✅ ~50ms | ❌ ~500ms |
| **Error Handling** | ✅ Structured | ❌ Parse stdout/stderr |
| **Integration** | ✅ Native APIs | ❌ Requires CLI path |
| **Tool Discovery** | ✅ Auto-discovered | ❌ Manual docs |

---

## Installation

The plugin is **automatically loaded** if file exists: `.opencode/plugins/rlm.ts`

Optional config (not required):
```yaml
# .opencode/config/config.yaml
plugin:
  - file://.opencode/plugins/rlm.ts
```

---

## Error Handling

| Error | Cause | Fix |
|--------|--------|-----|
| `Module not found: .adaptive_chunker` | File naming issue | Files renamed to use underscores (fixed) |
| `No state found` | REPL not initialized | Run `init` command first |
| `Python execution error` | Invalid code in `exec` | Check syntax, use valid Python |

---

## Debugging

1. Check plugin loaded: Look for `rlm_repl` in tool list
2. Check REPL state: Run `rlm_repl status`
3. Check Python output: Review tool execution results
4. Check errors: Review stderr from tool execution

---

## Future Enhancements

1. **Direct subagent calling** - Use opencode session APIs instead of subprocess
2. **State integration** - Store RLM state in opencode database instead of pickle
3. **Tool composition** - Create composite tools for common RLM patterns

---

**Status**: ✅ Production ready
**Version**: 1.0.0
