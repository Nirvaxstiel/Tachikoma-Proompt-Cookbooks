# What is Tachikoma?

Agent orchestration system — traffic controller for AI coding tasks.

## At a Glance

1. **Classify** — What are you asking?
2. **Load** — Load project rules (context)
3. **Route** — Send to right skill/subagent
4. **Return** — Result + confidence score

## Core Concepts

### Intent Classification

**Core Intents:**
- `debug` — Fix issues
- `implement` — Write code
- `review` — Analyze code
- `research` — Find info
- `git` — Version control
- `document` — Docs
- `complex` — Large context

**Extended Intents:**
- `refactor` — Restructure code
- `skill-compose` — Dynamic skill composition
- `optimize` — Context/token optimization
- `verify` — High-reliability generation
- `reflect` — Self-critique and verification
- `edit-optimize` — Model-aware edit format
- `unclear` — Fallback for ambiguous requests

**Composite Intents:**
- `research-and-implement` — Research then build
- `implement-and-test` — Build then verify
- `refactor-and-test` — Refactor then verify

See [Composite Intents](/explanation/composite-intents) for multi-step workflows.

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

| Paper/Source | Finding | Application |
|--------------|---------|-------------|
| Tool-Augmented LLMs | +20% accuracy, 40x latency | Cost-aware routing |
| Agentic Proposing | 91.6% accuracy with modular skills | skill-composer |
| MIT RLM | 2-5x efficiency on large context | rlm-optimized |
| Aletheia (arXiv:2602.10177) | 90% on IMO-ProofBench with verification loop | verifier-code-agent |
| Vibe-Proving (arXiv:2602.03837) | Balanced prompting prevents confirmation bias | reflection-orchestrator |
| Can.ac Harness Problem | Edit format matters as much as model | model-aware-editor |

See [Research](/research/index) for details.

## Why

- Consistency — Same rules for everyone
- Transparency — See confidence scores
- Efficiency — Match complexity to task
- Extensibility — Drop in new skills/intents

## Named After

Tachikoma — curious AI tanks from *Ghost in the Shell*. Always learning.
