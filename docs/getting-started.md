# Getting Started

## Install

### Option 1: Install Script (Recommended)

One-line installation:

```bash
# Install to current directory
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash -s --

# Install to specific directory
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash -s -- -C /your/project

# Install from specific branch
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash -s -- -b develop
```

### Option 2: Manual Copy

```bash
cp -r .opencode AGENTS.md /your/project/
```

Don't gitignore `AGENTS.md` or `.opencode/`.

## Update

If you installed using the script, update easily:

```bash
# Update to latest
./.opencode/tachikoma-install.sh

# Update to specific branch
./.opencode/tachikoma-install.sh -b develop
```

## What's Copied

```
project/
├── AGENTS.md              # Universal context
└── .opencode/
    ├── agents/            # tachikoma + subagents
    ├── skills/            # 20 skills
    ├── context/           # 6 modules
    └── config/
        └── intent-routes.yaml
```

## Test

1. Open project in AI coding agent
2. Ask: "What can you do?"
3. Tachikoma responds with intent classification

## Next

- [How It Works](/explanation/overview)
- [Add Skill](/how-to/add-skill)
- [Customize](/how-to/customize)
