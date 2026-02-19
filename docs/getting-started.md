# Getting Started

## Requirements

- AI agent supporting Agent Skills (OpenCodeAI, Claude Code, etc.)
- Your project directory

## Installation

### Install Script

```bash
# Install to current directory
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash

# Install to specific directory
curl -sS ... | bash -s -- -C /your/project

# Install with pre-packaged Python
curl -sS ... | bash -s -- --include-prepackaged-python
```

### Manual

```bash
cp -r .opencode AGENTS.md /your/project/
```

Don't gitignore `AGENTS.md` or `.opencode/`.

## Update

```bash
./.opencode/tachikoma-install.sh
# or
curl -sS ... | bash -s -- --include-prepackaged-python
```

## What Gets Installed

```
your-project/
├── AGENTS.md              # System constitution
└── .opencode/
    ├── agents/            # Primary agent + subagents
    ├── skills/            # 20 specialized skills
    ├── context-modules/   # 7 context modules
    └── config/
        └── intent-routes.yaml
```

## How It Works

Every request goes through 5 phases:

1. **Classify Intent** — What do you want?
2. **Load Context** — Project rules for this task
3. **Load Skill** — Appropriate specialist
4. **Execute** — Do the work
5. **Reflect** — Revisit, rethink, re-evaluate

Phases 1-4 are mandatory. Skipping them is a contract violation.

Phase 5 is free — the agent can question its approach, flag concerns, or suggest improvements.

**Structure at the start, freedom at the end.**

## Next Steps

- [How It Works](concepts/overview.md)
- [Skills](capabilities/skill-execution.md)
- [Customization](capabilities/customization/overview.md)
- [Troubleshooting](troubleshooting.md)
