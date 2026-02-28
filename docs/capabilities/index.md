# Capabilities

Complete guide to Tachikoma's features and capabilities.

## Core Capabilities

### 🎯 Intent Classification & Routing

Automatic intent classification routes requests to optimal execution strategies based on task complexity.

- **Low Complexity** — Direct response (1-2s)
- **Medium Complexity** — Single skill (5-15s)
- **High Complexity** — Skill chain (15-45s)
- **Very High Complexity** — RLM orchestration (45-120s)

[Learn more →](./intent-routing.md)

### 🧠 Context Management

Position-aware context loading optimizes token placement for maximum effectiveness.

- U-shaped attention bias awareness
- Critical info at start/end
- Context compression at 70-80% utilization
- Structured summaries

[Learn more →](./context-management.md)

### ⚡ Skill Execution

Specialized skills handle specific task types with optimal tool usage.

- 10 built-in specialized skills
- Dynamic skill loading
- Model-aware operations
- Verification loops for critical tasks

[Learn more →](./skill-execution.md)

### 🔗 Skill Chains

Orchestrate multiple skills for complex workflows.

- Sequential execution
- State passing between skills
- Error handling
- Verification integration

[Learn more →](./skill-chains.md)

### 📋 PAUL Methodology

PAUL (Plan-Apply-Unify Loop) — Structured development framework.

- **PLAN** — Define objectives and acceptance criteria
- **APPLY** — Execute with verification
- **UNIFY** — Close the loop

::: warning
Never skip UNIFY — this is the heartbeat that prevents drift.
:::

[Learn more →](./paul-methodology.md)

### 🔒 CARL Quality Gates

CARL (Context Augmentation & Reinforcement Layer) — Dynamic rule loading system.

- Rule-based quality checks
- Validation enforcement
- Compliance verification

[Learn more →](./carl-quality-gates.md)

## Advanced Capabilities

### 🧩 Model-Aware Editing

Dynamic edit format selection optimized for specific LLM models.

- `str_replace` — Claude, Mistral (exact string matching)
- `str_replace_fuzzy` — Gemini (fuzzy whitespace)
- `apply_patch` — GPT (diff format)
- `hashline` — Grok, GLM (content-hash anchoring)

[Learn more →](./model-aware-editing.md)

### 🤖 Subagents

Workers for large-context discovery and parallel tasks.

- Codebase exploration
- Parallel search execution
- Long-running sessions

[Learn more →](./subagents.md)

### 🔍 Verification Loops

Generator-Verifier-Reviser pattern for high-stakes implementations.

- GENERATE — Initial solution
- VERIFY — Explicit criteria checking
- REVISE — Fix based on feedback
- Up to 3 iterations

Use for: complex implementations, high-stakes fixes, correctness-critical tasks.

Skip for: simple tasks (<50 lines), prototypes, well-understood patterns.

[Learn more →](../research/verification-loops.md)

## Research-Backed Features

### 🚀 OpenSage Self-Programming

Self-programming agent generation engine for AI-centered agent development.

- **Self-generating agent topology** — Create specialized subagents on-demand
- **Dynamic tool synthesis** — Write custom tools at runtime
- **Hierarchical memory management** — Graph-based knowledge persistence

[Learn more →](./opensage-self-programming.md)

### 📊 Cost-Aware Routing

Match task complexity to execution strategy for optimal speed vs accuracy.

Research: "When Do Tools and Planning Help LLMs Think?" (arXiv:2601.02663)

[Learn more →](../research/cost-aware-routing.md)

### 📍 Position-Aware Context

Optimize for tokens-per-task using U-shaped attention patterns.

Research: "Found in the Middle" (ACL 2024)

[Learn more →](../research/position-bias.md)

### 🔬 Model Harness

Edit format selection matters as much as model choice.

Source: Can.ac blog (Feb 2026)

[Learn more →](../research/model-harness.md)

## Capability Matrix

| Capability        | Best For                                | Complexity | Latency |
| ----------------- | --------------------------------------- | ---------- | ------- |
| Direct Response   | Simple queries, <50 lines               | Low        | 1-2s    |
| Single Skill      | Focused tasks, one domain               | Medium     | 5-15s   |
| Skill Chain       | Multi-step workflows                    | High       | 15-45s  |
| Verification Loop | High-stakes, correctness-critical       | High       | +10-30s |
| Subagent          | Large-context discovery, parallel tasks | Very High  | 45-120s |
| RLM               | Massive contexts, 10M+ tokens           | Very High  | 2-5min  |

## Decision Flow

```text
User Request
    ↓
Classify Intent
    ↓
Confidence > 0.7?
    ├── NO → Ask for clarification
    ↓ YES
Context > 2000 tokens?
    ├── YES → Use RLM subagent
    ↓ NO
Task Complexity?
    ├── Simple → Direct response
    ├── Medium → Single skill
    ├── High → Skill chain
    └── Critical → Verification loop
    ↓
Reflect on approach (freedom to question, flag issues)
```

## Quick Reference

| Need                 | Use                   | Link                                   |
| -------------------- | --------------------- | -------------------------------------- |
| Understand routing   | Intent Classification | [→](./intent-routing.md)               |
| Manage context       | Context Management    | [→](./context-management.md)           |
| Execute tasks        | Skill Execution       | [→](./skill-execution.md)              |
| Chain skills         | Skill Chains          | [→](./skill-chains.md)                 |
| Structure work       | PAUL Methodology      | [→](./paul-methodology.md)             |
| Enforce quality      | CARL Quality Gates    | [→](./carl-quality-gates.md)           |
| Model-specific edits | Model-Aware Editing   | [→](./model-aware-editing.md)          |
| Large contexts       | Subagents             | [→](./subagents.md)                    |
| Verify correctness   | Verification Loops    | [→](../research/verification-loops.md) |

## Next Steps

- [Getting Started](../getting-started.md) — Installation and setup
- [Concepts](../concepts/overview.md) — Architecture overview
- [Research](../research/overview.md) — Research backing the design
- [Internals](../internals/) — Database schema and internals
