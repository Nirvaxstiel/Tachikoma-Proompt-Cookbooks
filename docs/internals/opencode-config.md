---
title: Configuration System
description: How OpenCode loads and merges configuration from multiple sources.
---

# Configuration System

OpenCode loads configuration from multiple sources with a defined precedence order.

## Config Location

```
~/.config/opencode/opencode.json    # Global config
./opencode.json                      # Project config
./.opencode/opencode.json           # Project .opencode dir
```

## Precedence Order (low → high)

1. **Remote `.well-known/opencode`** - Organization defaults
2. **Global config** - `~/.config/opencode/opencode.json`
3. **Custom config** - `OPENCODE_CONFIG` env var
4. **Project config** - `./opencode.json` (found via find-up)
5. **`.opencode/` directory** - `./.opencode/opencode.json`
6. **Inline config** - `OPENCODE_CONFIG_CONTENT` env var
7. **Managed config** - Enterprise admin-controlled

## Config Schema

```typescript
// packages/opencode/src/config/config.ts
const Info = z.object({
  $schema: z.string().optional(),
  theme: z.string().optional(),
  keybinds: Keybinds.optional(),
  logLevel: Log.Level.optional(),
  tui: TUI.optional(),
  server: Server.optional(),
  command: z.record(Command).optional(),
  skills: Skills.optional(),
  watcher: z.object({ ignore: z.array(z.string()).optional() }).optional(),
  plugin: z.string().array().optional(),
  snapshot: z.boolean().optional(),
  share: z.enum(["manual", "auto", "disabled"]).optional(),
  autoupdate: z.union([z.boolean(), z.literal("notify")]).optional(),
  disabled_providers: z.array(z.string()).optional(),
  enabled_providers: z.array(z.string()).optional(),
  model: ModelId.optional(),
  small_model: ModelId.optional(),
  default_agent: z.string().optional(),
  username: z.string().optional(),
  agent: z.record(Agent).optional(),
  provider: z.record(Provider).optional(),
  mcp: z.record(Mcp).optional(),
  formatter: ...optional(),
  lsp: ...optional(),
  instructions: z.array(z.string()).optional(),
  permission: Permission.optional(),
  tools: z.record(z.boolean()).optional(),  // Deprecated
  enterprise: z.object({ url: z.string().optional() }).optional(),
  compaction: z.object({
    auto: z.boolean().optional(),
    prune: z.boolean().optional(),
    reserved: z.number().optional(),
  }).optional(),
  experimental: z.object({
    disable_paste_summary: z.boolean().optional(),
    batch_tool: z.boolean().optional(),
    openTelemetry: z.boolean().optional(),
    primary_tools: z.array(z.string()).optional(),
    continue_loop_on_deny: z.boolean().optional(),
    mcp_timeout: z.number().optional(),
  }).optional(),
})
```

## Key Configuration Fields

### Model Selection
```json
{
  "model": "anthropic/claude-3-opus",
  "small_model": "anthropic/claude-3-haiku"
}
```

### Agent Configuration
```json
{
  "agent": {
    "build": {
      "model": "anthropic/claude-3-opus",
      "steps": 50,
      "temperature": 0.7
    }
  }
}
```

### Permissions
```json
{
  "permission": {
    "bash": "ask",
    "edit": {
      "*.env": "deny",
      "*": "allow"
    }
  }
}
```

### MCP Servers
```json
{
  "mcp": {
    "my-server": {
      "type": "local",
      "command": ["node", "server.js"],
      "environment": { "API_KEY": "..." }
    },
    "remote-server": {
      "type": "remote",
      "url": "https://api.example.com/mcp",
      "headers": { "Authorization": "Bearer ..." }
    }
  }
}
```

### Skills
```json
{
  "skills": {
    "paths": ["~/my-skills", "./custom-skills"],
    "urls": ["https://example.com/skills/"]
  }
}
```

### LSP
```json
{
  "lsp": {
    "typescript": {
      "command": ["typescript-language-server", "--stdio"],
      "extensions": [".ts", ".tsx"]
    }
  }
}
```

### Formatter
```json
{
  "formatter": {
    "typescript": {
      "command": ["prettier", "--write"],
      "extensions": [".ts", ".tsx"]
    }
  }
}
```

## Directory Discovery

```typescript
// Config directories are discovered in order:
const directories = [
  Global.Path.config,              // ~/.config/opencode
  ...Filesystem.up({               // Find .opencode up from cwd
    targets: [".opencode"],
    start: Instance.directory,
    stop: Instance.worktree,
  }),
  ...Filesystem.up({               // ~/.opencode
    targets: [".opencode"],
    start: Global.Path.home,
    stop: Global.Path.home,
  }),
]
```

## Loading from Directories

For each `.opencode/` directory:

```typescript
// Load config files
for (const file of ["opencode.jsonc", "opencode.json"]) {
  result = merge(result, await loadFile(path.join(dir, file)))
}

// Load commands
result.command = mergeDeep(result.command, await loadCommand(dir))

// Load agents
result.agent = mergeDeep(result.agent, await loadAgent(dir))

// Load plugins
result.plugin.push(...await loadPlugin(dir))
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENCODE_CONFIG` | Custom config file path |
| `OPENCODE_CONFIG_CONTENT` | Inline JSON config |
| `OPENCODE_CONFIG_DIR` | Additional config directory |
| `OPENCODE_PERMISSION` | Permission overrides (JSON) |
| `OPENCODE_DISABLE_PROJECT_CONFIG` | Disable project config |
| `OPENCODE_DISABLE_EXTERNAL_SKILLS` | Disable external skill dirs |
| `OPENCODE_ENABLE_QUESTION_TOOL` | Enable question tool |
| `OPENCODE_ENABLE_EXA` | Enable Exa search tools |
| `OPENCODE_EXPERIMENTAL_LSP_TOOL` | Enable LSP tool |
| `OPENCODE_EXPERIMENTAL_PLAN_MODE` | Enable plan mode |
| `OPENCODE_DISABLE_AUTOCOMPACT` | Disable auto-compaction |
| `OPENCODE_DISABLE_PRUNE` | Disable pruning |

## Config Merging

Arrays are concatenated, objects are deep-merged:

```typescript
function merge(target: Info, source: Info): Info {
  const merged = mergeDeep(target, source)
  if (target.plugin && source.plugin) {
    merged.plugin = Array.from(new Set([...target.plugin, ...source.plugin]))
  }
  if (target.instructions && source.instructions) {
    merged.instructions = Array.from(new Set([...target.instructions, ...source.instructions]))
  }
  return merged
}
```

After config changes, reflect:
- Did the config work as expected?
- Are there conflicts to resolve?
- Should I adjust precedence?

## Managed Config (Enterprise)

Admin-controlled config that overrides everything:

```typescript
// Platform-specific locations
switch (process.platform) {
  case "darwin":
    return "/Library/Application Support/opencode"
  case "win32":
    return path.join(process.env.ProgramData, "opencode")
  default:
    return "/etc/opencode"
}
```

## Feature Flags

```typescript
namespace Flag {
  OPENCODE_CLIENT              // "app" | "cli" | "desktop"
  OPENCODE_CONFIG              // Custom config path
  OPENCODE_CONFIG_CONTENT      // Inline config
  OPENCODE_CONFIG_DIR          // Additional config dir
  OPENCODE_PERMISSION          // Permission overrides
  OPENCODE_DISABLE_PROJECT_CONFIG
  OPENCODE_DISABLE_EXTERNAL_SKILLS
  OPENCODE_ENABLE_QUESTION_TOOL
  OPENCODE_ENABLE_EXA
  OPENCODE_EXPERIMENTAL_LSP_TOOL
  OPENCODE_EXPERIMENTAL_PLAN_MODE
  OPENCODE_DISABLE_AUTOCOMPACT
  OPENCODE_DISABLE_PRUNE
}
```

## JSONC Support

Config files support JSON with Comments:

```jsonc
{
  // This is a comment
  "model": "anthropic/claude-3-opus",
  /* Block comment */
  "agent": {
    "build": { ... }
  }
}
```

## Environment Variable Expansion

Config values can reference environment variables:

```json
{
  "provider": {
    "anthropic": {
      "options": {
        "apiKey": "{env:ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

## File References

Config can reference external files:

```json
{
  "agent": {
    "build": {
      "prompt": "{file:./prompts/build.txt}"
    }
  }
}
```
