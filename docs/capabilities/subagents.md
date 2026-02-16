# Subagents

Specialized workers for complex, large-context tasks.

## Overview

Skills handle routine work. Subagents tackle problems that exceed normal context limits or require sophisticated multi-step reasoning.

Think of skills as specialists (fast, focused, routine) and subagents as researchers (thorough, complex, deep).

## Available Subagents

### rlm-optimized

**Purpose:** Large context processing using MIT-style Recursive Language Model approach

**Use When:**
- Analyzing entire codebases (>2000 tokens)
- Bulk refactoring operations
- Complex multi-file analysis
- Research across many documents

**How It Works:**
The RLM (Recursive Language Model) approach treats context as an environment:
1. **Adaptive Chunking** — Breaks large context into semantic units
2. **Context as Environment** — Each chunk becomes part of the "world state"
3. **Selective Loading** — Only relevant chunks loaded into active context
4. **Iterative Refinement** — Results synthesized across chunks

**Performance:**
- 2-5x efficiency improvement over naive full-context loading
- 91% accuracy on 10M token tasks (arXiv:2512.24601)
- Handles 10M+ token contexts effectively

**Example:**
```
User: "Analyze my entire codebase for security issues"
→ Intent: complex
→ Subagent: rlm-optimized
→ Action: Chunks codebase, analyzes each chunk, synthesizes findings
```

### rlm-subcall

**Purpose:** Fallback subagent for extremely large or complex tasks

**Use When:**
- rlm-optimized reaches capacity limits
- Task requires specialized reasoning beyond standard RLM
- Parallel processing of multiple large contexts

**Key Difference:**
While `rlm-optimized` uses adaptive chunking, `rlm-subcall` can spawn additional sub-instances for true parallel processing of massive datasets.

## Subagent vs Skill

| Aspect | Skill | Subagent |
|--------|-------|----------|
| Context Size | Normal (<2000 tokens) | Large (unlimited) |
| Processing | Single-pass | Multi-step, iterative |
| Memory | Within single context | Maintains state across chunks |
| Use Case | Routine tasks | Complex, research-grade tasks |
| Latency | Seconds to minutes | Minutes to hours |

## Configuration

Subagents are configured in `intent-routes.yaml`:

```yaml
routes:
  complex:
    subagent: rlm-optimized
    fallback_subagent: rlm-subcall
    confidence_threshold: 0.5
```

## Execution Flow

```
User Request → Classify Intent → Context > 2000 tokens?
    ↓
YES → Load Subagent → Chunk Context → Process Chunks
    ↓
Synthesize Results → Return Summary
```

## Best Practices

1. **Don't Overuse** — Subagents add latency. Use skills for routine tasks.
2. **Clear Objectives** — Give subagents specific, measurable goals
3. **Review Output** — Always review subagent findings before acting
4. **Fallback Awareness** — Know that rlm-subcall kicks in if rlm-optimized fails

## When to Use What

```
Task Complexity Assessment:
├── Simple (1 file, <100 lines)     → skill: code-agent
├── Medium (1-5 files)              → skill: code-agent
├── Complex (5+ files, >2000 tokens) → subagent: rlm-optimized
└── Very Complex (entire codebase)    → subagent: rlm-subcall
```

## See Also

- [Skill Execution](/capabilities/skill-execution) - How skills work
- [Skill Chains](/capabilities/skill-chains) - Chain skills sequentially
- [Intent Routing](/capabilities/intent-routing) - Route configuration
- [Research Overview](/research/overview) - RLM technical background
