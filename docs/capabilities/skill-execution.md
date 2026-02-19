# Skill Execution

Specialized capabilities for specific tasks.

## How It Works

1. Intent classified
2. Route specifies skill
3. SKILL.md loads
4. Skill executes
5. Result returns

## Available Skills

### Core

| Skill | Use When | Description |
|-------|----------|-------------|
| `code-agent` | Write/fix code | General-purpose coding |
| `analysis-agent` | Review code | Code analysis |
| `research-agent` | Find info | Investigation |

### Utility

| Skill | What | Description |
|-------|------|-------------|
| `git-commit` | Commits | Conventional commit messages |
| `pr` | PR descriptions | Pull request writing |
| `context-manager` | CLI ops | Context management |
| `context7` | Live docs | Documentation via API |
| `formatter` | Cleanup | Code quality |

### Workflow

| Skill | What | Description |
|-------|------|-------------|
| `workflow-management` | 7-phase | Development workflow |
| `task-tracking` | Tasks | Progressive tracking |
| `self-learning` | Improvement | Pattern recognition |

### Advanced

| Skill | What | Use When |
|-------|------|----------|
| `verifier-code-agent` | GVR pattern | High-reliability code |
| `reflection-orchestrator` | Self-critique | Complex reasoning |
| `model-aware-editor` | Edit format | Multi-model support |

### Specialized

| Skill | What | Description |
|-------|------|-------------|
| `code-review` | Review | Priority-based workflow |
| `prompt-engineer` | Prompts | Safety and bias |
| `security-audit` | OWASP | Security audit |

## Skill Structure

```
skills/skill-name/
├── SKILL.md      # Definition
└── router.sh     # CLI (optional)
```

## SKILL.md Format

```yaml
---
name: my-skill
description: What it does
---

# My Skill

## When to use
User asks about...

## Instructions
1. Do this
2. Then that

## Boundaries
- Don't do X
```

## Skill Chains

| Chain | Skills | Use Case |
|-------|--------|----------|
| `implement-verify` | code-agent → verifier → formatter | High-reliability |
| `research-implement` | research → context7 → code-agent → formatter | Research then build |
| `security-implement` | context7 → code-agent → verifier → reflection | Security-critical |

See [Skill Chains](/capabilities/skill-chains).

## See Also

- [Skill Chains](/capabilities/skill-chains)
- [Add Skill](/capabilities/customization/add-skill)
- [Subagents](/capabilities/subagents)
