---
layout: home

hero:
  name: Tachikoma
  text: Agent Orchestration
  tagline: Research-backed AI agent system with PAUL methodology
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started.md
    - theme: alt
      text: How It Works
      link: /concepts/overview.md

features:
  - title: Intent Classification
    details: Automatically classifies user requests and routes to optimal strategy based on task complexity.
  - title: PAUL Methodology
    details: Structured development with Plan-Apply-Unify loops. Quality over speed-for-speed's-sake.
  - title: CARL Quality Gates
    details: Context Augmentation & Reinforcement Layer with dynamic rule loading and priority-based enforcement.
  - title: Research-Backed
    details: Built on peer-reviewed research from AI conferences and arXiv papers.
  - title: Model-Aware Editing
    details: Dynamic edit format selection optimized for specific LLM models.
  - title: Verification Loops
    details: Generator-Verifier-Reviser pattern for high-stakes implementations.
  - title: Subagents
    details: Workers for large-context discovery and parallel task execution.
  - title: Cost-Aware Routing
    details: Match task complexity to execution strategy for optimal speed vs accuracy.
---

# Installation Paths

Tachikoma can be installed in two locations:

| Location   | Path                 | Use Case                                        |
| ---------- | -------------------- | ----------------------------------------------- |
| **Local**  | `cwd/.opencode`      | Project-specific configuration and skills       |
| **Global** | `~/.config/opencode` | Shared skills and configuration across projects |

::: tip
Tachikoma automatically discovers skills from both locations, with local installation taking precedence.
:::

## Documentation

- [Getting Started](./getting-started.md) — Installation and setup
- [Concepts](./concepts/overview.md) — Architecture and design philosophy
- [Capabilities](./capabilities/index.md) — Detailed feature documentation
- [Internals](./internals/) — Database schema, tools, and systems
- [Research](./research/overview.md) — Research backing the design
- [Dashboard](./dashboard/) — Telemetry and monitoring
