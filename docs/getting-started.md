# Getting Started

## Requirements

- AI agent supporting Agent Skills (OpenCodeAI, Claude Code, etc.)
- Your project directory

## Installation

### Choose Your Installation Path

Tachikoma supports two installation methods depending on your use case:

::: info Installation Locations

| Type       | Path                 | Use Case                           | Precedence |
| ---------- | -------------------- | ---------------------------------- | ---------- |
| **Local**  | `cwd/.opencode`      | Project-specific skills and config | Higher     |
| **Global** | `~/.config/opencode` | Shared across all projects         | Lower      |

Tachikoma automatically discovers skills from both locations.
:::

### Quick Install (Local)

Install Tachikoma in your current project directory:

```bash
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash
```

This installs to `./.opencode/` in your current working directory.

### Quick Install (Global)

Install Tachikoma globally for use across all projects:

```bash
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash -s -- --global
```

This installs to `~/.config/opencode/`.

### Advanced Install Options

```bash
# Install to specific directory
curl -sS ... | bash -s -- -C /your/project

# Install with pre-packaged Python (for offline/airgapped)
curl -sS ... | bash -s -- --include-prepackaged-python

# Install from specific branch
curl -sS ... | bash -s -- -b develop

# Global install from specific branch
curl -sS ... | bash -s -- --global -b develop
```

### Manual Install

```bash
# Local installation
cp -r .opencode AGENTS.md /your/project/

# Global installation
mkdir -p ~/.config/opencode
cp -r .opencode/* ~/.config/opencode/
cp AGENTS.md ~/.config/opencode/
```

**Important:** Don't gitignore `AGENTS.md` or `.opencode/` if you want project-specific customization.

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

## Update

```bash
# Local update
./.opencode/tachikoma-install.sh

# Global update
~/.config/opencode/tachikoma-install.sh

# With pre-packaged Python
./.opencode/tachikoma-install.sh --include-prepackaged-python

# From specific branch
./.opencode/tachikoma-install.sh -b develop
```

## What Gets Installed

```
your-project/
├── AGENTS.md              # System constitution
└── .opencode/
    ├── agents/            # Primary agent + subagents
    ├── skills/            # 20 specialized skills
    ├── context-modules/   # 7 context modules
    ├── cli/               # TypeScript CLI tools
    ├── assets/            # Bundled Python + UV (optional)
    └── config/
        └── intent-routes.yaml
```

**Token Optimized:** Skills reference context modules instead of duplicating content, reducing token consumption by ~15%.

## How It Works

Every request goes through a structured execution flow:

1. **Classify Intent** — What do you want?
2. **Load Context** — Project rules for this task
3. **Load Skill** — Appropriate specialist
4. **Execute** — Do the work (follows PAUL when applicable)
5. **Reflect** — Revisit, rethink, re-evaluate

**PAUL Framework** (when structured development needed):

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

The AI agent has Python injected into its environment. It runs scripts directly:

```bash
python .opencode/tools/smoke_test.py
```

### Manual

Use `uv run` for consistent dependency management:

```bash
uv run .opencode/tools/smoke_test.py
```

## Understanding PAUL Methodology

**PAUL (Plan-Apply-Unify Loop)** — Structured development framework for AI-assisted workflows.

- **PLAN** — Define objectives and acceptance criteria (Given/When/Then format)
- **APPLY** — Execute tasks sequentially with verification
- **UNIFY** — Close the loop, reconcile plan vs actual, update state

**Never skip UNIFY** — this is the heartbeat that prevents drift.

**Quality over speed-for-speed's-sake. In-session context over subagent sprawl.**

[Learn more about PAUL →](./capabilities/paul-methodology.md)

## Understanding CARL

**CARL (Context Augmentation & Reinforcement Layer)** — Dynamic rule loading system.

CARL loads quality rules just-in-time based on context:

- **Context Detection** — Detects active domains (PAUL, Development, Projects)
- **Rule Loading** — Loads relevant rules dynamically
- **Priority Enforcement** — Critical blocks, high warns, medium notes

**Three Domains:**

1. **PAUL Domain** — Loop enforcement, boundary protection
2. **Development Domain** — Code quality, error handling, testing
3. **Projects Domain** — Documentation, version handling

[Learn more about CARL →](./capabilities/carl-quality-gates.md)

## Next Steps

- [Concepts Overview](./concepts/overview.md) — Understand the architecture
- [Capabilities Index](./capabilities/index.md) — Explore all features
- [PAUL Methodology](./capabilities/paul-methodology.md) — Learn the framework
- [Intent Routing](./capabilities/intent-routing.md) — How requests are classified
- [Internals](./internals/) — Database schema and internals
