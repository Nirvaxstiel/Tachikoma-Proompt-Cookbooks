# Subagents

Specialized workers for complex, large-context, and parallel tasks.

## What This Is

Subagents tackle problems that exceed normal context limits or require sophisticated multi-step reasoning. They operate with their own context window and reasoning pipeline.

Think of skills as specialists (fast, focused, routine) and subagents as researchers (thorough, complex, deep).

## How It Works

1. **Intent is classified** — Task requires delegation
2. **Route specifies subagent** — Intent routes delegate to appropriate subagent
3. **Subagent executes** — Operates with own context and tools
4. **Results returned** — Synthesized output back to main agent

## Available Subagents

### OpenCode Built-in Subagents

#### explore

**Purpose:** Fast codebase exploration (read-only)

**Use When:**
- Finding files by patterns (`src/components/**/*.tsx`)
- Searching code for keywords
- Answering questions about codebase structure

**Tools:** Read, Grep, Glob, Bash (read-only)

**Example:**
```
User: "Find all API endpoints in this codebase"
→ Intent: explore
→ Subagent: explore
→ Action: Fast search, returns structured findings
```

#### general

**Purpose:** Multi-step parallel tasks with full tool access

**Use When:**
- Complex multi-step research
- Parallel investigation of multiple sources
- Tasks requiring write access but isolated context

**Tools:** All except todo

**Example:**
```
User: "Research authentication best practices and create a summary"
→ Intent: deep-research
→ Subagent: general
→ Action: Research, synthesize, return comprehensive report
```

### Tachikoma Custom Subagents

#### rlm-optimized

**Purpose:** Large context processing using MIT-style Recursive Language Model

**Use When:**
- Analyzing entire codebases (>2000 tokens)
- Bulk refactoring operations
- Complex multi-file analysis

**How it works:**
1. **Adaptive chunking** — Breaks context into semantic units
2. **Semantic boundary detection** — Splits at natural divisions
3. **Parallel processing** — 3-5 chunks processed concurrently
4. **Iterative synthesis** — Results merged across chunks

**Performance:** 91% accuracy on 10M token tasks

#### rlm-subcall

**Purpose:** Internal worker for chunk processing (never called directly)

**Role:** Acts as sub-LLM for `rlm-optimized`, processing individual chunks.

## Subagent Comparison

| Subagent | Type | Context | Tools | Use Case |
|----------|------|---------|-------|----------|
| **explore** | Built-in | Fresh | Read-only | Fast codebase search |
| **general** | Built-in | Fresh | All except todo | Multi-step parallel tasks |
| **rlm-optimized** | Custom | Chunked | Read, Grep, Glob, Bash | Large context (>2000 tokens) |
| **rlm-subcall** | Custom | Chunk | Read, Grep, Glob, Bash | Internal chunk processor |

## Subagent vs Skill

| Aspect | Skill | Subagent |
|--------|-------|----------|
| **Context** | Shared with main agent | Isolated context window |
| **Processing** | Single-pass | Multi-step, iterative |
| **Latency** | Low (seconds) | Higher (minutes) |
| **Use case** | Routine tasks | Complex, research-grade tasks |

## Configuration

Subagents are configured in `.opencode/config/intent-routes.yaml`:

```yaml
routes:
  # OpenCode built-in
  explore:
    subagent: explore
    invoke_via: subagent

  deep-research:
    subagent: general
    invoke_via: subagent

  # Tachikoma custom
  complex:
    subagent: rlm-optimized
    fallback_subagent: rlm-subcall
```

## Execution Flow

```
User Request → Classify Intent → Determine Strategy
    │
    ├── explore intent → task(subagent_type='explore', ...)
    ├── deep-research intent → task(subagent_type='general', ...)
    └── complex (large context) → task(subagent_type='rlm-optimized', ...)
```

## When to Use What

```
Task assessment:
├── Find files/search code     → subagent: explore
├── Multi-step parallel work   → subagent: general
├── Large context (>2000 tok)  → subagent: rlm-optimized
└── Simple/medium tasks        → skill (not subagent)
```

## Best Practices

1. **Use sparingly** — Subagents add latency. Use skills for routine tasks.
2. **Clear objectives** — Give subagents specific, measurable goals
3. **Review output** — Always review subagent findings before acting
4. **Right tool for job** — Use `explore` for search, `general` for parallel work, `rlm-optimized` for large context

## See Also

- [Intent Routing](/capabilities/intent-routing) - Route configuration
- [Research: RLM](/research/rlm) - Technical background
