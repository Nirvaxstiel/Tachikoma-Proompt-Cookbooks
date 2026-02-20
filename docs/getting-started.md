# Getting Started

## Requirements

- AI agent supporting Agent Skills (OpenCodeAI, Claude Code, etc.)
- Your project directory

---

## Installation

### Quick Install

```bash
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash
```

UV and Python 3.10 are bundled. No system Python required.

### Install Options

```bash
# Install to current directory
curl -sS ... | bash

# Install to specific directory
curl -sS ... | bash -s -- -C /your/project

# Install with pre-packaged Python (for offline/airgapped)
curl -sS ... | bash -s -- --include-prepackaged-python

# Install from specific branch
curl -sS ... | bash -s -- -b develop
```

### Manual Install

```bash
cp -r .opencode AGENTS.md /your/project/
```

Don't gitignore `AGENTS.md` or `.opencode/`.

---

## Windows Setup

```powershell
# Option 1: Scoop (clean uninstall: scoop uninstall uv python)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
scoop install uv python

# Option 2: Standalone UV (uninstall: delete uv.exe + uv cache clean)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Option 3: Bundled (use --include-prepackaged-python flag)
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash
```

Scoop installs to `~/scoop/apps/` — no registry, no admin.

---

## Update

```bash
./.opencode/tachikoma-install.sh

# With pre-packaged Python
./.opencode/tachikoma-install.sh --include-prepackaged-python

# From specific branch
./.opencode/tachikoma-install.sh -b develop
```

---

## What Gets Installed

```
your-project/
├── AGENTS.md              # System constitution
└── .opencode/
    ├── agents/            # Primary agent + subagents
    ├── skills/            # 20 specialized skills
    ├── context-modules/   # 7 context modules
    ├── assets/            # Bundled Python + UV (optional)
    └── config/
        └── intent-routes.yaml
```

---

## How It Works

Every request goes through 5 phases:

1. **Classify Intent** — What do you want?
2. **Load Context** — Project rules for this task
3. **Load Skill** — Appropriate specialist
4. **Execute** — Do the work
5. **Reflect** — Revisit, rethink, re-evaluate

Phases 1-4 are mandatory. Phase 5 is free.

**Structure at the start, freedom at the end.**

---

## Running Scripts

### AI Agent

The AI agent has Python injected into its environment. It runs scripts directly:

```bash
python .opencode/tools/smoke_test.py
```

### Manual

Use `uv run` for consistent dependency management:

```bash
uv run .opencode/tools/smoke_test.py
```

---

## Next Steps

- [How It Works](concepts/overview.md)
- [Skills](capabilities/skill-execution.md)
- [Customization](capabilities/customization/overview.md)
- [Troubleshooting](troubleshooting.md)
