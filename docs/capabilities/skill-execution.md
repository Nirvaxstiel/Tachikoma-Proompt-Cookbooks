# Skill Execution

How Tachikoma uses skills to get work done.

## What This Is

Skills are modular capabilities. Small, focused, composable. Each skill is a specialist optimized for a specific type of work.

Think of skills as specialist tools rather than one giant "do everything" model.

## How It Works

1. **Intent is classified** — Tachikoma figures out what you want
2. **Route specifies the skill** — Intent routes define which skill handles each intent
3. **Skill's SKILL.md loads** — Instructions, boundaries, and tools for that skill
4. **Skill executes** — Does the work following its instructions
5. **Result returns** — What happened

## Why Skills Matter

Without skills:
- **Generalist limitations** — One model tries to do everything, good at nothing
- **No boundaries** — Model might do things you didn't ask for
- **Inconsistent behavior** — Each session might work differently

With skills:
- **Specialized excellence** — Each skill is optimized for its domain
- **Clear boundaries** — SKILL.md defines what the skill should and shouldn't do
- **Consistent behavior** — Same rules every time
- **Composable** — Skills can be chained for complex tasks

## Available Skills

### Core Skills

Handle the bulk of everyday work.

| Skill | Use When | Description |
|-------|----------|-------------|
| `code-agent` | Write/fix code | General-purpose coding and debugging |
| `analysis-agent` | Review code | Code analysis and quality assessment |
| `research-agent` | Find info | Investigation and information gathering |

### Utility Skills

Helper skills that support core skills.

| Skill | What | Description |
|-------|------|-------------|
| `git-commit` | Commits | Conventional commit message generation |
| `pr` | PR descriptions | Pull request title and description writing |
| `intent-classifier` | Classifies requests | Query classification and routing |
| `context-manager` | CLI context ops | Context discovery, extraction, management |
| `context7` | Live docs | Live documentation via Context7 API |
| `formatter` | Code cleanup | Code quality cleanup and formatting |

### Workflow Skills

Skills that manage processes rather than performing tasks directly.

| Skill | What | Description |
|-------|------|-------------|
| `workflow-management` | 7-phase workflow | Production-grade development workflow |
| `task-tracking` | Task management | Progressive tracking system |
| `self-learning` | Self-improvement | Pattern recognition and system improvement |

### Advanced Skills

For high-stakes or complex work.

#### verifier-code-agent

**Purpose:** High-reliability code generation with verification loop

**Based on:** Aletheia (Google DeepMind, arXiv:2602.10177) — achieved 90% on IMO-ProofBench

**Pattern:**
```
Problem → Generator → Candidate → Verifier → [Pass | Revise | Restart]
```

**Use When:**
- Complex implementations
- Security-critical code
- High-stakes fixes
- When correctness is paramount

**Maximum iterations:** 3 (then escalate)

#### reflection-orchestrator

**Purpose:** Explicit self-verification through adversarial critique

**Based on:** Vibe-Proving (Google, arXiv:2602.03837) — balanced prompting prevents confirmation bias

**Pattern:**
```
1. Initial Output → 2. Self-Critique → 3. Revision → 4. Verification
```

**Key techniques:**
- Balanced prompting (proof OR refutation)
- Adversarial questioning
- Explicit uncertainty labeling

**Use When:**
- Complex reasoning tasks
- High-stakes decisions
- After verifier-code-agent completes

#### model-aware-editor

**Purpose:** Model-specific edit format optimization

**Based on:** The Harness Problem (Can.ac, Feb 2026) — edit format can improve success 10x

**Supported formats:**
- `str_replace` (Claude, Gemini) — exact match
- `apply_patch` (GPT) — OpenAI-style diff
- `hashline` (Universal) — content-hash anchoring

**Performance gains:**
- Grok: 6.7% → 68.3% (10x improvement)
- Gemini: +8% over baseline
- All models: Reduced retry loops

**Use When:**
- Working with multiple model providers
- High edit failure rates
- Critical changes requiring reliability

### Specialized Skills

Domain-specific skills for specialized tasks.

| Skill | What | Description |
|-------|------|-------------|
| `code-review` | Structured review | Priority-based code review workflow |
| `prompt-engineer` | Safety/bias | Prompt engineering best practices |
| `security-audit` | OWASP scanning | Security audit workflow |

### Subagent Skills

Skills that handle subagent coordination.

| Skill | What | Description |
|-------|------|-------------|
| `rlm` | RLM coordination | Recursive Language Model orchestration |

## Skill Structure

```
skills/skill-name/
├── SKILL.md      # Definition
└── router.sh     # CLI (optional)
```

## SKILL.md Format

Each skill has a SKILL.md that defines its behavior:

```yaml
---
name: my-skill
description: What it does
category: implementation
---

# My Skill

You are an expert at...

## When to use

User asks about...

## Instructions

1. Do this
2. Then that

## Boundaries

- Don't do X
```

## Skill Chains

Skills can be chained together for complex workflows:

| Chain | Skills | Use Case |
|-------|--------|----------|
| `implement-verify` | code-agent → verifier → formatter | High-reliability implementation |
| `research-implement` | research → context7 → code-agent → formatter | Research then build |
| `security-implement` | context7 → code-agent → verifier → reflection | Security-critical code |
| `deep-review` | analysis-agent → reflection | Thorough code review |
| `complex-research` | research → context7 → reflection | Verified research |

See [Skill Chains](/capabilities/skill-chains) for details.

## See Also

- [Skill Chains](/capabilities/skill-chains) - Chaining skills for complex workflows
- [Add Skill](/capabilities/customization/add-skill) - How to create your own skills
- [Subagents](/capabilities/subagents) - For complex, large-context tasks
- [Research Overview](/research/overview) - Why this works
