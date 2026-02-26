# Project Context

This file provides project-specific context for Tachikoma agent.

## About This Project

[Project-specific description goes here]

## Architecture

[Project architecture notes go here]

## Tech Stack

[Technology stack details go here]

## Coding Standards

- [Project-specific coding standards]
- [Team conventions]
- [Any deviations from general best practices]

## Development Workflow

[Development workflow specific to this project]

## Deployment

[Deployment instructions and environment-specific notes]

## Important Notes

[Any important project-specific notes that agents should be aware of]

## Tachikoma Installation

This project uses Tachikoma as an OpenCode agent plugin. Tachikoma is installed via:

```bash
bun run install
# Installs to OPENCODE_DIR
# OPENCODE_DIR = {CWD}/{OPENCODE_DIR}/
# If installed globally, ~/.config/opencode/
```

This creates:

- `{OPENCODE_DIR}/plugins/tachikoma.ts` - Plugin that auto-discovers scripts and modules
- `{OPENCODE_DIR}/plugins/tachikoma/*.ts` - Agent modules (core, router, verifier, etc.)
- `{OPENCODE_DIR}/plugins/tachikoma/edit-format-selector.ts` - Edit format selector script
- `{OPENCODE_DIR}/plugins/tachikoma/where.ts` - Installation locator script
- `{OPENCODE_DIR}/skills/*/SKILL.md` - Agent Skills (paul, carl, code, planning, research, verification, context7, refactor, git-commit, reasoning)
- `{OPENCODE_DIR}/agents/tachikoma.md` - Agent configuration

## Available Tachikoma Tools

The plugin automatically registers scripts as tools with the prefix `tachikoma.`:

- `tachikoma.edit-format-selector` - Model-aware edit format selection
- `tachikoma.where` - Show Tachikoma installation location

OpenCode automatically discovers skills from `{OPENCODE_DIR}/skills/`:

- `skill` tool lists all available skills
- Skills can be loaded by name via the `skill` tool
- Available skills: paul, carl, code, planning, research, verification, context7, refactor, git-commit, reasoning

Add new scripts to `src/plugin/tachikoma/` and they're automatically available!
Add new skills to `{OPENCODE_DIR}/skills/` and they're automatically discovered!

## Project Structure

```pseudocode
project-root/
  ├── .opencode/              # Tachikoma plugin installation. Local Install = .opencode/ | Global Install = ~/.config/opencode/
  │   ├── plugins/
  │   │   ├── tachikoma.ts               # Main plugin file
  │   │   └── tachikoma/                # Agent modules & scripts
  │   │       ├── edit-format-selector.ts
  │   │       ├── where.ts
  │   │       ├── core.ts
  │   │       ├── router.ts
  │   │       ├── verifier.ts
  │   │       ├── context-manager.ts
  │   │       ├── model-harness.ts
  │   │       └── rlm-handler.ts
  │   ├── skills/                           # Agent Skills (OpenCode standard)
  │   │   ├── paul/SKILL.md
  │   │   ├── carl/SKILL.md
  │   │   ├── code/SKILL.md
  │   │   ├── planning/SKILL.md
  │   │   ├── research/SKILL.md
  │   │   ├── verification/SKILL.md
  │   │   ├── context7/SKILL.md
  │   │   ├── refactor/SKILL.md
  │   │   ├── git-commit/SKILL.md
  │   │   └── reasoning/SKILL.md
  │   └── agents/
  │       └── tachikoma.md              # Agent configuration
  ├── .tachikoma/            # STATE files (project-local)
  │   ├── state/
  │   │   ├── STATE.md       # Current task state, AC status
  │   │   ├── plan.md        # Original plan
  │   │   ├── summary.md     # UNIFY summary
  │   │   └── artifacts/     # Intermediate files
  │   └── .active-session  # Session tracking
  ├── .gitignore              # Includes .tachikoma/ to avoid committing state
  └── AGENTS.md              # This file (project-specific context)
```

**Note**: `.tachikoma/` is gitignored to prevent committing work state. Each project gets its own state, enabling parallel development without conflicts.
