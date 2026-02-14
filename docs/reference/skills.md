# Skills

Modular capabilities. Small, focused, composable.

## Core

| Skill | Use When |
|-------|----------|
| code-agent | Write/fix code |
| analysis-agent | Review code |
| research-agent | Find info |

## Utility

| Skill | What |
|-------|------|
| git-commit | Commits |
| pr | PR descriptions |
| intent-classifier | Classifies requests |

## Workflow

| Skill | What |
|-------|------|
| workflow-management | 7-phase workflow |
| task-tracking | Task management |

## Advanced

| Skill | What |
|-------|------|
| skill-composer | Combine skills |
| context-manager | CLI context ops |
| context7 | Live docs |
| formatter | Code cleanup |

## Specialized

| Skill | What |
|-------|------|
| code-review | Priority-based review |
| prompt-engineer | Safety/bias |
| security-audit | OWASP scanning |

## Structure

```
skills/skill-name/
├── SKILL.md      # Definition
└── router.sh     # CLI (optional)
```

## SKILL.md

```yaml
---
name: my-skill
description: What it does
---

# My Skill

You are an expert at...

[instructions]
```

## See Also

- [Intent Routing](/explanation/intent-routing)
- [Add Skill](/how-to/add-skill)
