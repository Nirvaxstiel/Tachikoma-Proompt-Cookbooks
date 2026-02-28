# Getting Started

## Requirements

- Bun runtime (>=1.0.0)
- OpenCode CLI
- AI agent supporting Agent Skills (OpenCodeAI, Claude Code, etc.)

## Installation

Detailed installation instructions are available in the [Installation guide](./installation.md).

Quick start:

```bash
bun run install
```

This runs an interactive installer that lets you choose between:

- **Local** - `.opencode/` (current project only)
- **Global** - `~/.config/opencode/` (all projects)
- **Custom** - Specify any installation path

## What Gets Installed

Every request goes through a structured execution flow:

1. **Classify Intent** — What do you want?
2. **Load Context** — Project rules for this task
3. **Load Skill** — Appropriate specialist
4. **Execute** — Do the work (follows Plan when applicable)
5. **Reflect** — Revisit, rethink, re-evaluate

**Plan Framework** (when structured development needed):

- **PLAN** — Define objectives and acceptance criteria (Given/When/Then)
- **APPLY** — Execute with verification steps
- **UNIFY** — Close loop, reconcile plan vs actual, update state

**CARL Quality Gates** (active throughout):

- Dynamic rule loading based on domain
- Priority-based enforcement (Critical > High > Medium)
- Blocks on critical violations

::: tip Structure at the start, freedom at the end.
:::

## Running Scripts

### AI Agent

The AI agent can run Tachikoma scripts directly as tools:

```bash
tachikoma.where
tachikoma.edit-format-selector recommend
```

### Manual

Use `bun run` for direct script execution:

```bash
bun run .opencode/plugins/tachikoma/where.ts
bun run .opencode/plugins/tachikoma/edit-format-selector.ts recommend
```

## Understanding Plan Methodology

**Plan (Plan-Apply-Unify Loop)** — Structured development framework for AI-assisted workflows.

- **PLAN** — Define objectives and acceptance criteria (Given/When/Then format)
- **APPLY** — Execute tasks sequentially with verification
- **UNIFY** — Close loop, reconcile plan vs actual, update state

**Never skip UNIFY** — this is the heartbeat that prevents drift.

**Quality over speed-for-speed's-sake. In-session context over subagent sprawl.**

[Learn more about Plan →](./capabilities/paul-methodology.md)

## Understanding CARL

**CARL (Context Augmentation & Reinforcement Layer)** — Dynamic rule loading system.

CARL loads quality rules just-in-time based on context:

- **Context Detection** — Detects active domains (Plan, Development, Projects)
- **Rule Loading** — Loads relevant rules dynamically
- **Priority Enforcement** — Critical blocks, high warns, medium notes

**Three Domains:**

1. **Plan Domain** — Loop enforcement, boundary protection
2. **Development Domain** — Code quality, error handling, testing
3. **Projects Domain** — Documentation, version handling

[Learn more about CARL →](./capabilities/carl-quality-gates.md)

## Next Steps

- [Concepts Overview](./concepts/overview.md) — Understand the architecture
- [Capabilities Index](./capabilities/index.md) — Explore all features
- [PAUL Methodology](./capabilities/paul-methodology.md) — Learn the framework
- [Intent Routing](./capabilities/intent-routing.md) — How requests are classified
- [Internals](./internals/) — Database schema and internals
