# SKILL Guide

A modular approach to agent instructions compatible with Opencode and ClaudeCode.

---

## What Are SKILLS?

SKILLS are self-contained agent instruction files:

```
.claude/skill/code-agent/SKILL.md
.claude/skill/research-agent/SKILL.md

.opencode/skill/code-agent/SKILL.md
.opencode/skill/research-agent/SKILL.md
```

Each `SKILL.md` contains complete instructions for that skill domain.

---

## How It Works

1. **Agent loads** `.claude/skill/<name>/SKILL.md` or `.opencode/skill/<name>/SKILL.md`
2. **Agent applies** the instructions directly

---

## SKILL.md Format

```yaml
---
name: code-agent
description: General-purpose coding assistant for MyProject
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: code-generation
---

# Code Agent - MyProject

## 1. Purpose & Success Criteria

...

## 2. Agent Operating Mindset

...
```

---

## Deployment Locations

| Platform | Per-Project | Global |
|----------|-------------|--------|
| ClaudeCode | `.claude/skill/<name>/SKILL.md` | — |
| Opencode | `.opencode/skill/<name>/SKILL.md` | `~/.config/opencode/skill/<name>/SKILL.md` |

---

## Bootstrapper Workflow

1. Open `bootstrap/TACHIKOMA_AGENT_BOOTSTRAP.md` in your preferred agent
2. Agent scaffolds `.claude/skill/` and `.opencode/skill/` folder structures
3. Agent analyzes repository and fills in project-specific content
4. Agent generates `agent-instructions.md` (single-file version)
5. Use the appropriate platform directory:
   - ClaudeCode: `.claude/skill/<skill-name>/SKILL.md`
   - Opencode: `.opencode/skill/<skill-name>/SKILL.md`

---

## Comparison: SKILL vs Single-File

| Aspect | SKILL Format | Single-File (agent-instructions.md) |
|--------|--------------|-------------------------------------|
| Reusability | High — portable across platforms | Low — one file per project |
| Maintenance | Easy to update and share | Must update each project file |
| Tool Support | Opencode, ClaudeCode | Cursor, VSCode, generic |
| Structure | Clean, self-contained | Single large file |

---

## Quick Start

1. Clone this repository
2. Open `bootstrap/TACHIKOMA_AGENT_BOOTSTRAP.md` in your agent
3. Follow the scaffold instructions
4. Copy generated SKILL files to your platform directory

---

## YAML Frontmatter Required

Each SKILL.md must start with:

```yaml
---
name: <skill-name>
description: One-line description
license: MIT
compatibility: opencode
metadata:
  audience: developers | researchers | etc
  workflow: code-generation | research-analysis | etc
---
```

