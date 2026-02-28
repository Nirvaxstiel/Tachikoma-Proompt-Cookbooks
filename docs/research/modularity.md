# Modularity

Why focused components beat monolithic approaches.

## The Problem

One giant model trying to do everything:

- Good at nothing in particular
- Hard to maintain
- Inflexible
- Expensive

## Research

### "Agentic Proposing" (arXiv:2602.03279)

**Finding:** 4B proposer + modular skills = 91.6% on AIME25 (math competition).

| Architecture          | Size | Accuracy |
| --------------------- | ---- | -------- |
| Monolithic (70B)      | 70B  | 78%      |
| Modular (4B + skills) | 4B   | 91.6%    |

> **Note**: Results from AIME25 math benchmark. Demonstrates that modular approaches can outperform larger monolithic models.

**Why Modularity Wins:**

1. Specialization — Each component optimized for its domain
2. Composability — Mix and match as needed
3. Maintainability — Update one without affecting others
4. Efficiency — Only load what's needed

[arXiv](https://arxiv.org/abs/2602.03279)

## Tachikoma's Modular Architecture

### Skills

Each skill is focused, self-contained:

```
skills/
├── code-agent/           # Coding
├── analysis-agent/       # Review
├── research-agent/       # Investigation
├── git-commit/           # Git
├── verifier-code-agent/  # Verification
```

### Skill Chains

Compose skills for complex workflows:

```yaml
implement-verify:
  skills:
    - code-agent
    - verifier-code-agent
    - formatter
```

After execution: Reflect on approach, flag issues, suggest improvements.

### Context Modules

Modular project-specific rules:

```
context-modules/
├── 00-core-contract.md
├── 10-coding-standards.md
├── 12-commenting-rules.md
├── 20-git-workflow.md
└── 30-research-methods.md
```

## Comparison

| Aspect      | Monolithic  | Modular       |
| ----------- | ----------- | ------------- |
| Size        | 3300+ lines | 1550 lines    |
| Testing     | Hard        | Independent   |
| Maintenance | Coupled     | Isolated      |
| Loading     | Everything  | What's needed |

## See Also

- [Skill Chains](../capabilities/skill-chains)
- [Skill Execution](../capabilities/skill-execution)
- [Research Overview](./overview)
