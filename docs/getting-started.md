# Getting Started

## Install

```bash
cp -r .opencode AGENTS.md /your/project/
```

Don't gitignore `AGENTS.md` or `.opencode/`.

## What's Copied

```
project/
├── AGENTS.md              # Universal context
└── .opencode/
    ├── agents/            # tachikoma + subagents
    ├── skills/            # 13 skills
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
