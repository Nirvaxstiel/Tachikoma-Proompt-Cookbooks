---
title: OpenCode Internals
description: Technical reference for OpenCode's internal architecture - how it works, what it tracks, and where.
---

# OpenCode Internals

Quick reference for understanding OpenCode's internal architecture. Designed for building frameworks on top of OpenCode.

## Core Concepts

| Concept | What It Is | Location |
|---------|-----------|----------|
| **Session** | A conversation with message history | SQLite DB |
| **Project** | A workspace with worktree | SQLite DB |
| **Agent** | Execution mode with permissions | Config + Code |
| **Skill** | Reusable capability module | `.opencode/skill/*/SKILL.md` |
| **Tool** | Atomic operation (read, write, bash) | `packages/opencode/src/tool/` |
| **Part** | Message component (text, tool call, file) | SQLite DB |

## Directory Structure

```
~/.local/share/opencode/          # Data directory
├── opencode.db                   # SQLite database (sessions, messages, parts)
├── projects/                     # Project-specific data
└── cache/                        # Cached skills, models

.opencode/                        # Project config directory
├── opencode.json{,c}             # Main config file
├── agent/                        # Custom agents
│   └── *.md                      # Agent definitions
├── skill/                        # Custom skills
│   └── */SKILL.md                # Skill definitions
├── command/                      # Slash commands
│   └── *.md                      # Command templates
├── tool/                         # Custom tools
│   └── *.{ts,js}                 # Tool implementations
└── plugin/                       # Plugins
    └── *.{ts,js}                 # Plugin code
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/opencode/src/storage/schema.ts` | Database schema exports |
| `packages/opencode/src/session/session.sql.ts` | Session/Message/Part tables |
| `packages/opencode/src/project/project.sql.ts` | Project table |
| `packages/opencode/src/tool/registry.ts` | Tool registration |
| `packages/opencode/src/skill/skill.ts` | Skill discovery/loading |
| `packages/opencode/src/agent/agent.ts` | Agent definitions |
| `packages/opencode/src/config/config.ts` | Config loading |

## Data Flow

```
User Input → Intent Classification → Agent Selection → Tool Execution → Response
                    ↓                        ↓
              Load Context            Check Permissions
                    ↓                        ↓
              Load Skill              Execute Tool
```

## Quick Reference

### Database Location
```
~/.local/share/opencode/opencode.db
```

### Config Precedence (low → high)
1. Remote `.well-known/opencode`
2. Global `~/.config/opencode/opencode.json`
3. Custom config (`OPENCODE_CONFIG`)
4. Project `opencode.json`
5. `.opencode/` directory configs
6. Inline config (`OPENCODE_CONFIG_CONTENT`)
7. Managed config (enterprise)

### Skill Discovery Paths
1. `.claude/skills/**/SKILL.md`
2. `.agents/skills/**/SKILL.md`
3. `.opencode/skill/**/SKILL.md`
4. Config `skills.paths`
5. Config `skills.urls` (remote)

## Documentation Sections

- [Architecture Overview](/internals/opencode-architecture) - Core system design
- [Database Schema](/internals/opencode-database) - What gets tracked and where
- [Tools System](/internals/opencode-tools) - How tools work
- [Skills System](/internals/opencode-skills) - Skill discovery and loading
- [Agents System](/internals/opencode-agents) - Agent definitions and permissions
- [Configuration](/internals/opencode-config) - Config loading and precedence
- [Agent Skills Format](/internals/agent-skills-format) - Open standard specification
