# What is Tachikoma?

Agent orchestration system — traffic controller for AI coding tasks.

## At a Glance

1. **Classify** — What are you asking?
2. **Load** — Load project rules (context)
3. **Route** — Send to right skill/subagent
4. **Return** — Result + confidence score

## Core Concepts

### Intent Classification
- `debug` — Fix issues
- `implement` — Write code
- `review` — Analyze code
- `research` — Find info
- `git` — Version control
- `document` — Docs
- `complex` — Large context

### Context Modules
Priority-loaded rules:
- `core-contract` — Always first
- `coding-standards` — Code patterns
- `commenting-rules` — Comments
- `git-workflow` — Git conventions
- `research-methods` — Investigation
- `prompt-safety` — Safety

### Skills vs Subagents

| Type | Use When |
|------|----------|
| Skill | Simple, fast |
| Subagent | Complex, large context |

## Research Basis

| Paper | Finding | Application |
|-------|---------|-------------|
| Tool-Augmented LLMs | +20% accuracy, 40x latency | Cost-aware routing |
| Agentic Proposing | 91.6% accuracy with modular skills | skill-composer |
| MIT RLM | 2-5x efficiency on large context | rlm-optimized |

See [Research](/research/index) for details.

## Why

- Consistency — Same rules for everyone
- Transparency — See confidence scores
- Efficiency — Match complexity to task
- Extensibility — Drop in new skills/intents

## Named After

Tachikoma — curious AI tanks from *Ghost in the Shell*. Always learning.
