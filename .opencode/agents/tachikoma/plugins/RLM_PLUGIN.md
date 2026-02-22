# RLM Plugin Technical Reference

> **Purpose**: Provides `rlm_repl` tool to opencode for native RLM integration.
> **File**: `.opencode/agents/tachikoma/plugins/rlm.ts`
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

---

## Tool Definition

### Tool Name: `rlm_repl`

### Commands

| Command  | Description                       | Example                                |
| -------- | --------------------------------- | -------------------------------------- |
| `init`   | Initialize REPL with context file | `init logs/app.log`                    |
| `exec`   | Execute TypeScript code           | `exec -c "console.log(peek(0, 1000))"` |
| `status` | Show REPL state                   | `status`                               |
| `reset`  | Delete REPL state                 | `reset`                                |

### Parameters

| Parameter      | Type   | Required | Description                             |
| -------------- | ------ | -------- | --------------------------------------- |
| `command`      | string | ✅       | Command to execute                      |
| `context_path` | string | ⚠️       | Path to context file (for `init`)       |
| `code`         | string | ⚠️       | TypeScript code to execute (for `exec`) |
| `state`        | string | ❌       | Path to state file (optional)           |

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

| Hook                 | Purpose                                |
| -------------------- | -------------------------------------- |
| `tool`               | Register `rlm_repl` tool               |
| `tool.execute.after` | Track operations for telemetry         |
| `tool.definition`    | Customize tool descriptions (optional) |

### Tool Registration

```typescript
tool({
  name: "rlm_repl",
  description: "Persistent TypeScript REPL for RLM workflows",
  parameters: z.object({
    command: z.enum(["init", "exec", "status", "reset"]),
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
    "code": "console.log(peek(0, 3000))"
  }
}
```

### RLM Pattern

```json
{
  "tool": "rlm_repl",
  "args": {
    "command": "exec",
    "code": "const chunks = chunkIndices(50000); console.log(`Created ${chunks.length} chunks`)"
  }
}
```

---

## Performance

| Metric       | Value                   |
| ------------ | ----------------------- |
| Startup time | ~50ms                   |
| State format | JSON (human-readable)   |
| Runtime      | Bun (single dependency) |

---

## Installation

The plugin is **automatically loaded** if file exists: `.opencode/agents/tachikoma/plugins/rlm.ts`

Optional config (not required):

```yaml
# .opencode/config/config.yaml
plugin:
  - file://.opencode/agents/tachikoma/plugins/rlm.ts
```

---

## Error Handling

| Error              | Cause                | Fix                      |
| ------------------ | -------------------- | ------------------------ |
| `No state found`   | REPL not initialized | Run `init` command first |
| `Module not found` | Import path issue    | Check relative paths     |
| `Syntax error`     | Invalid TypeScript   | Check code syntax        |

---

## Debugging

1. Check plugin loaded: Look for `rlm_repl` in tool list
2. Check REPL state: Run `rlm_repl status`
3. Check output: Review tool execution results
4. Check errors: Review stderr from tool execution

---

## Future Enhancements

1. **Direct subagent calling** - Use opencode session APIs instead of subprocess
2. **State integration** - Store RLM state in opencode database
3. **Tool composition** - Create composite tools for common RLM patterns

---

**Status**: ✅ Production ready
**Version**: 2.0.0 (TypeScript)
