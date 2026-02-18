---
title: Agents System
description: How OpenCode defines and manages agents - execution modes with permissions.
---

# Agents System

Agents are execution modes with specific permissions, prompts, and configurations.

## Agent Definition

```typescript
// packages/opencode/src/agent/agent.ts
namespace Agent {
  const Info = z.object({
    name: z.string(),
    description: z.string().optional(),
    mode: z.enum(["subagent", "primary", "all"]),
    native: z.boolean().optional(),
    hidden: z.boolean().optional(),
    topP: z.number().optional(),
    temperature: z.number().optional(),
    color: z.string().optional(),
    permission: PermissionNext.Ruleset,
    model: z.object({
      modelID: z.string(),
      providerID: z.string(),
    }).optional(),
    variant: z.string().optional(),
    prompt: z.string().optional(),
    options: z.record(z.string(), z.any()),
    steps: z.number().int().positive().optional(),
  })
}
```

## Built-in Agents

| Agent | Mode | Purpose |
|-------|------|---------|
| `build` | primary | Default - full tool access |
| `plan` | primary | Read-only planning mode |
| `general` | subagent | Parallel task execution |
| `explore` | subagent | Fast codebase exploration |
| `compaction` | primary | Context compaction (hidden) |
| `title` | primary | Generate session titles (hidden) |
| `summary` | primary | Generate summaries (hidden) |

## Agent Modes

```typescript
type Mode = "primary" | "subagent" | "all"

// primary: Main conversation agent
// subagent: Spawned for specific tasks
// all: Can be used as either
```

## Default Permissions

```typescript
const defaults = PermissionNext.fromConfig({
  "*": "allow",                    // Allow all by default
  doom_loop: "ask",                // Ask on potential loops
  external_directory: {
    "*": "ask",                    // Ask for external dirs
    [Truncate.GLOB]: "allow",      // Allow truncation temp
  },
  question: "deny",                // No questions by default
  plan_enter: "deny",
  plan_exit: "deny",
  read: {
    "*": "allow",
    "*.env": "ask",                // Ask before reading .env
    "*.env.*": "ask",
    "*.env.example": "allow",
  },
})
```

## Agent-Specific Permissions

### Build Agent
```typescript
build: {
  permission: merge(defaults, {
    question: "allow",
    plan_enter: "allow",
  })
}
```

### Plan Agent
```typescript
plan: {
  permission: merge(defaults, {
    question: "allow",
    plan_exit: "allow",
    edit: {
      "*": "deny",                 // No edits except plans
      ".opencode/plans/*.md": "allow",
    },
  })
}
```

### Explore Agent
```typescript
explore: {
  permission: merge(defaults, {
    "*": "deny",                   // Deny all by default
    grep: "allow",
    glob: "allow",
    list: "allow",
    bash: "allow",
    webfetch: "allow",
    websearch: "allow",
    codesearch: "allow",
    read: "allow",
  })
}
```

## Creating Custom Agents

### 1. Create agent file

`.opencode/agent/my-agent.md`:

```yaml
---
mode: subagent
description: Specialized agent for X tasks
model: anthropic/claude-3-sonnet
color: "#FF5733"
tools:
  read: true
  grep: true
  glob: true
---

You are a specialized agent for X tasks.

## Instructions

1. First, analyze the input
2. Then, process accordingly
3. Finally, return results
```

### 2. Agent is auto-discovered

Agents in `.opencode/agent/` or `.opencode/agents/` are automatically loaded.

## Agent Configuration

```json
// opencode.json
{
  "agent": {
    "build": {
      "model": "anthropic/claude-3-opus",
      "steps": 50,
      "temperature": 0.7
    },
    "my-custom": {
      "mode": "subagent",
      "description": "Custom agent",
      "prompt": "You are a custom agent...",
      "permission": {
        "bash": "deny"
      }
    }
  }
}
```

## Agent Fields

| Field | Type | Description |
|-------|------|-------------|
| `model` | string | Model ID (provider/model) |
| `variant` | string | Model variant |
| `temperature` | number | Sampling temperature |
| `top_p` | number | Top-p sampling |
| `prompt` | string | System prompt |
| `mode` | enum | primary/subagent/all |
| `hidden` | boolean | Hide from UI |
| `color` | string | Hex color or theme color |
| `steps` | number | Max agentic iterations |
| `permission` | object | Tool permissions |
| `disable` | boolean | Disable agent |

## Agent Selection

```typescript
// Default agent selection
async function defaultAgent() {
  const cfg = await Config.get()
  
  // Check for configured default
  if (cfg.default_agent) {
    const agent = agents[cfg.default_agent]
    if (agent.mode === "subagent") throw Error("subagent cannot be default")
    if (agent.hidden) throw Error("hidden agent cannot be default")
    return agent.name
  }
  
  // Fall back to first visible primary
  const primaryVisible = Object.values(agents)
    .find(a => a.mode !== "subagent" && a.hidden !== true)
  return primaryVisible.name
}
```

## Subagent Spawning

```typescript
// Task tool spawns subagents
TaskTool.execute({
  subagent_type: "general",
  description: "Analyze codebase",
  prompt: "Find all API endpoints"
})
```

## Agent Generation

OpenCode can generate agents from descriptions:

```typescript
const result = await Agent.generate({
  description: "Create an agent for code review",
  model: { providerID: "anthropic", modelID: "claude-3-opus" }
})

// Returns:
// {
//   identifier: "code-reviewer",
//   whenToUse: "Use for reviewing pull requests...",
//   systemPrompt: "You are a code reviewer..."
// }
```

## Permission Merging

Permissions are merged in order:

```typescript
// 1. Start with defaults
// 2. Merge agent-specific permissions
// 3. Merge user config permissions
item.permission = PermissionNext.merge(
  defaults,
  agentSpecific,
  userConfig
)
```

## Integration with Tachikoma

Tachikoma extends the agent system with:

- Intent-based agent routing
- Context module loading per agent
- Skill-based agent definitions

```
.opencode/skills/
├── code-agent/SKILL.md      # Maps to code-agent
├── research-agent/SKILL.md  # Maps to research-agent
└── analysis-agent/SKILL.md  # Maps to analysis-agent
```
