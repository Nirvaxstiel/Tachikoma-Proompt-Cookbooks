# Subagents

Workers for large-context and parallel tasks.

## What This Is

Subagents handle problems exceeding normal context limits. They operate with their own context window.

Skills = specialists (fast, routine). Subagents = researchers (thorough, complex).

## Available Subagents

### OpenCode Built-in

| Subagent | Purpose | Tools |
|----------|---------|-------|
| `explore` | Fast codebase search | Read, Grep, Glob, Bash (read-only) |
| `general` | Multi-step parallel work | All except todo |

### Tachikoma Custom

| Subagent | Purpose | Use When |
|----------|---------|----------|
| `rlm-optimized` | Large context (>2000 tokens) | Entire codebase analysis |
| `rlm-subcall` | Chunk processor | Internal use only |

## How rlm-optimized Works

1. Adaptive chunking — Breaks into semantic units
2. Boundary detection — Splits at natural divisions
3. Parallel processing — 3-5 chunks concurrently
4. Iterative synthesis — Merges results

## Configuration

```yaml
routes:
  explore:
    subagent: explore
    invoke_via: subagent

  deep-research:
    subagent: general
    invoke_via: subagent

  complex:
    subagent: rlm-optimized
    fallback_subagent: rlm-subcall
```

## Execution Flow

```
User Request → Classify → Determine Strategy
    │
    ├── explore → task(subagent_type='explore', ...)
    ├── deep-research → task(subagent_type='general', ...)
    └── complex → task(subagent_type='rlm-optimized', ...)
```

## When to Use What

| Task | Approach |
|------|----------|
| Find files/search | subagent: explore |
| Multi-step parallel | subagent: general |
| Large context (>2000 tok) | subagent: rlm-optimized |
| Simple/medium | skill (not subagent) |

## Skill vs Subagent

| Aspect | Skill | Subagent |
|--------|-------|----------|
| Context | Shared | Isolated |
| Processing | Single-pass | Multi-step |
| Latency | Seconds | Minutes |

## See Also

- [Intent Routing](/capabilities/intent-routing)
- [Research: RLM](/research/rlm)
