---
title: Architecture Overview
description: Core system design of OpenCode - packages, modules, and data flow.
---

## Architecture Overview

## Package Structure

```text
packages/
├── opencode/          # Core server (TUI, session management, tools)
├── app/               # Desktop app (Electron)
├── ui/                # Shared UI components
├── sdk/               # JavaScript SDK
├── util/              # Shared utilities
├── plugin/            # Plugin system types
├── console/           # Web console
├── desktop/           # Desktop-specific code
├── enterprise/        # Enterprise features
├── extensions/        # VS Code extensions
├── identity/          # Authentication
├── slack/             # Slack integration
└── web/               # Web app
```

## Core Package Structure

```text
packages/opencode/src/
├── agent/             # Agent definitions and management
├── session/           # Session/message handling
├── project/           # Project/workspace management
├── tool/              # Tool implementations
├── skill/             # Skill discovery and loading
├── config/            # Configuration system
├── storage/           # Database schema
├── provider/          # LLM provider integrations
├── permission/        # Permission system
├── mcp/               # Model Context Protocol
├── lsp/               # Language Server Protocol
├── bus/               # Event bus
├── cli/               # CLI commands
├── server/            # HTTP server
├── auth/              # Authentication
├── plugin/            # Plugin system
├── snapshot/          # File snapshots
├── worktree/          # Git worktree handling
├── format/            # Output formatting
├── shell/             # Shell integration
├── pty/               # PTY handling
├── ide/               # IDE integration
├── flag/              # Feature flags
├── global/            # Global state
├── id/                # ID generation
├── installation/      # Installation detection
├── patch/             # Patch handling
├── question/          # Question tool
├── scheduler/         # Task scheduling
├── control/           # Control plane
├── share/             # Session sharing
├── bun/               # Bun-specific utilities
└── util/              # General utilities
```

## Core Modules

### Session (`session/`)

Manages conversations - the central abstraction.

```typescript
// Key exports
SessionTable; // SQLite table for sessions
MessageTable; // SQLite table for messages
PartTable; // SQLite table for message parts
TodoTable; // SQLite table for todos
```

### Agent (`agent/`)

Defines execution modes with specific permissions and prompts.

```typescript
// Built-in agents
build; // Default - full tool access
plan; // Read-only, no edits
general; // Subagent for parallel work
explore; // Fast codebase exploration
compaction; // Context compaction
title; // Generate session titles
summary; // Generate summaries
```

### Tool (`tool/`)

Atomic operations the agent can perform.

```typescript
// Core tools
BashTool; // Execute shell commands
ReadTool; // Read files
WriteTool; // Write files
EditTool; // Edit files
GlobTool; // Find files by pattern
GrepTool; // Search file contents
TaskTool; // Spawn subagents
WebFetchTool; // Fetch URLs
WebSearchTool; // Search the web
CodeSearchTool; // Search code APIs
SkillTool; // Load skills
TodoWriteTool; // Manage todos
```

### Skill (`skill/`)

Reusable capability modules loaded on demand.

```typescript
// Discovery paths (in order)
.claude/skills/**/SKILL.md
.agents/skills/**/SKILL.md
.opencode/skill/**/SKILL.md
config.skills.paths
config.skills.urls
```

### Config (`config/`)

Configuration loading with precedence.

```typescript
// Precedence (low → high)
1. Remote .well-known/opencode
2. Global ~/.config/opencode/opencode.json
3. OPENCODE_CONFIG env
4. Project opencode.json
5. .opencode/ directory
6. OPENCODE_CONFIG_CONTENT env
7. Managed config (enterprise)
```

## Data Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│                         User Input                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Session Layer                              │
│  • Create/retrieve session                                      │
│  • Build message with context                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Agent Selection                            │
│  • Select agent based on mode                                   │
│  • Load agent permissions                                       │
│  • Load agent prompt                                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Context Building                           │
│  • Load skills (by name/description match)                      │
│  • Load context modules                                         │
│  • Build system prompt                                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LLM Provider                               │
│  • Stream response                                              │
│  • Parse tool calls                                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Tool Execution                             │
│  • Check permissions                                            │
│  • Execute tool                                                 │
│  • Store result in PartTable                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Response                                   │
│  • Stream to UI                                                 │
│  • Store in MessageTable                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Key Patterns

### Instance State

Per-project state management using `Instance.state()`:

```typescript
export const state = Instance.state(async () => {
  // Initialization runs once per project
  return {
    /* cached data */
  };
});
```

### Event Bus

Pub/sub for cross-module communication:

```typescript
Bus.publish(Session.Event.Error, { error });
Bus.subscribe(Session.Event.Message, handler);
```

### Plugin Hooks

Extension points for customization:

```typescript
Plugin.trigger("tool.definition", { toolID }, output);
Plugin.trigger("experimental.chat.system.transform", { model }, { system });
```

## Technology Stack

| Component  | Technology                       |
| ---------- | -------------------------------- |
| Runtime    | Bun                              |
| Database   | SQLite (Drizzle ORM)             |
| LLM        | Vercel AI SDK                    |
| UI         | OpenTUI (terminal), React (web)  |
| Config     | JSON/JSONC with YAML frontmatter |
| Validation | Zod                              |
