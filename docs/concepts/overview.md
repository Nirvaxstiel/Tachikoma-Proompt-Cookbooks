# Concepts Overview

High-level understanding of Tachikoma's architecture and design philosophy.

## What is Tachikoma?

Tachikoma is a research-backed AI agent orchestration system that:

- **Classifies intent** — Understands what you want
- **Routes appropriately** — Selects optimal execution strategy
- **Executes with quality** — Uses PAUL methodology and CARL quality gates
- **Reflects on outcomes** — Freedom to question and revise

## Core Philosophy

### Structure at the Start, Freedom at the End

Tachikoma provides structure during execution (phases 1-4) and freedom at the end (phase 5):

```
1. Classify Intent ← Structured
2. Load Context   ← Structured
3. Load Skill     ← Structured
4. Execute        ← Structured
5. Reflect        ← Freedom to question
```

**Why:**

- Structure ensures quality and consistency
- Freedom allows for creativity and improvement
- Balance between automation and agency

### Research-Backed Design

Every major feature is grounded in peer-reviewed research:

| Feature             | Research                   | Source               |
| ------------------- | -------------------------- | -------------------- |
| Intent Routing      | Cost-Aware Routing         | arXiv:2601.02663     |
| Context Management  | Position Bias              | ACL 2024             |
| Verification Loops  | Generator-Verifier-Reviser | arXiv:2602.10177     |
| Model-Aware Editing | Model Harness              | Can Bouluk, Feb 2026 |
| Large Context       | RLM                        | arXiv:2512.24601     |
| Skill Composition   | Modularity                 | arXiv:2602.03279     |

[Learn more about the research →](../research/overview.md)

## System Architecture

### Five-Phase Execution

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                             │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  1. CLASSIFY INTENT                                         │
│  - Extract intent keywords                                  │
│  - Match against routes                                     │
│  - Evaluate confidence                                      │
│  - Select execution strategy                                │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. LOAD CONTEXT                                            │
│  - Load system prompt                                       │
│  - Load skill instructions                                  │
│  - Load AGENTS.md (project rules)                           │
│  - Load context module (if applicable)                      │
│  - Load relevant files                                      │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. LOAD SKILL                                              │
│  - Discover skill from .opencode/skills/                    │
│  - Load SKILL.md instructions                               │
│  - Select model-aware edit format                           │
│  - Prepare tools                                            │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. EXECUTE (PAUL)                                          │
│  - PLAN: Define objectives, acceptance criteria             │
│  - APPLY: Execute with verification loops                   │
│  - UNIFY: Close loop, reconcile outcomes                    │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  5. REFLECT                                                 │
│  - Freedom to question                                      │
│  - Identify potential issues                                │
│  - Suggest improvements                                     │
│  - Update state                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Intent Router                          │
│  - Classifies requests                                      │
│  - Routes to strategy                                       │
│  - Manages confidence thresholds                            │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Context Manager                          │
│  - Loads project-specific rules                             │
│  - Manages context compression                              │
│  - Optimizes for position bias                              │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     Skill System                            │
│  - 20 specialized skills                                    │
│  - Dynamic skill loading                                    │
│  - Skill chain orchestration                                │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   PAUL Framework                            │
│  - Plan-Apply-Unify loops                                   │
│  - Mandatory loop closure                                   │
│  - Acceptance criteria                                      │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  CARL Quality Gates                         │
│  - Context augmentation                                     │
│  - Quality gate enforcement                                 │
│  - Reinforcement layer                                      │
└─────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Intent Routing

The first decision point in every request:

| Complexity | Strategy          | Latency |
| ---------- | ----------------- | ------- |
| Low        | Direct response   | 1-2s    |
| Medium     | Single skill      | 5-15s   |
| High       | Skill chain       | 15-45s  |
| Very High  | RLM orchestration | 45-120s |

[Learn more →](../capabilities/intent-routing.md)

### Context Management

Position-aware loading of project rules:

- Critical info at start/end (100% weight)
- Supporting details (75% weight)
- Less important in middle (50% weight)

[Learn more →](../capabilities/context-management.md)

### PAUL Methodology

**Plan-Apply-Unify Loop** — Structured development:

1. **PLAN** — Define objectives and acceptance criteria (Given/When/Then)
2. **APPLY** — Execute tasks sequentially with verification
3. **UNIFY** — Reconcile plan vs actual, update state, log decisions

::: warning Never skip UNIFY!
:::

**Quality over speed-for-speed's-sake. In-session context over subagent sprawl.**

[Learn more →](../capabilities/paul-methodology.md)

### CARL Quality Gates

**Context Augmentation & Reinforcement Layer** — Dynamic rule loading:

- Context augmentation — Loads rules just-in-time based on domain
- Quality gate checks — Enforces with priority (Critical > High > Medium > Low)
- Reinforcement layer — Blocks critical violations, warns on high

**Three Domains:**

1. **PAUL Domain** — Loop enforcement, boundary protection
2. **Development Domain** — Code quality, error handling, testing
3. **Projects Domain** — Documentation, version handling

[Learn more →](../capabilities/carl-quality-gates.md)

### Model-Aware Editing

Dynamic edit format selection:

| Model           | Format              |
| --------------- | ------------------- |
| Claude, Mistral | `str_replace`       |
| Gemini          | `str_replace_fuzzy` |
| GPT             | `apply_patch`       |
| Grok, GLM       | `hashline`          |

[Learn more →](../capabilities/model-aware-editing.md)

## Installation Paths

Tachikoma supports two installation methods:

| Type       | Path                 | Precedence |
| ---------- | -------------------- | ---------- |
| **Local**  | `cwd/.opencode`      | Higher     |
| **Global** | `~/.config/opencode` | Lower      |

**Discovery:** Tachikoma checks both locations, with local taking precedence.

## Design Principles

### 1. Token Efficiency

Optimize for tokens-per-task, not tokens-per-request:

- Reference context modules instead of duplicating
- Compress context at 70-80% utilization
- Use structured summaries
- Write large outputs to files

### 2. Quality First

Prioritize correctness over speed:

- Verification loops for critical tasks
- PAUL methodology for structure
- CARL quality gates for enforcement
- Model-aware editing for precision

### 3. Research-Backed

Base decisions on peer-reviewed research:

- Position bias awareness
- Cost-aware routing
- Generator-Verifier-Reviser patterns
- Adaptive chunking for large contexts

### 4. User Agency

Maintain human oversight:

- Clarification when confidence < 0.7
- Freedom to question in reflection phase
- Explicit approval for destructive operations
- Clear documentation of changes

## Quick Reference

| Need                | Link                                                        |
| ------------------- | ----------------------------------------------------------- |
| Install Tachikoma   | [Getting Started](../getting-started.md)                    |
| Understand routing  | [Intent Routing](../capabilities/intent-routing.md)         |
| Use skills          | [Skill Execution](../capabilities/skill-execution.md)       |
| Apply PAUL          | [PAUL Methodology](../capabilities/paul-methodology.md)     |
| Enforce quality     | [CARL Quality Gates](../capabilities/carl-quality-gates.md) |
| Understand research | [Research Overview](../research/overview.md)                |
| View internals      | [Internals](../internals/)                                  |

## Next Steps

- [Getting Started](../getting-started.md) — Installation and setup
- [Architecture](./architecture.md) — Detailed architecture
- [Capabilities](../capabilities/index.md) — All features
- [Research](../research/overview.md) — Research backing the design
