---
name: think
description: Apply functional thinking principles to code design and reasoning
keywords:
  - design
  - principle
  - thinking
  - refactor
  - architecture
  - pattern
  - clean
  - predictable
  - maintainable
triggers:
  - design
  - principle
  - refactor
  - architecture
  - how should
  - why is better
  - make it clean
  - make it simple
---

# Functional Thinking Principles

When designing or reasoning about code, apply these principles.

## Core Philosophy

Clear thinking produces clear systems. Prefer:
- **Predictable** — Same inputs → Same outputs
- **Reasonable** — Understandable without hidden state
- **Maintainable** — Changes are localized
- **Honest** — Interfaces don't lie

## Quick Reference (16 Principles)

| # | Principle | Apply When |
|---|-----------|------------|
| 1 | **Immutable Mindset** — Create new vs mutate | Working with state |
| 2 | **Pure Reasoning** — No hidden effects | Testing or debugging |
| 3 | **Composition** — Build from small pieces | Structuring code |
| 4 | **Pipeline** — Data flow, not steps | Processing transforms |
| 5 | **Explicit Dependencies** — Ask for what you need | Managing coupling |
| 6 | **Totality** — Handle all cases | Error handling |
| 7 | **Declarative** — What, not how | Expressing intent |
| 8 | **Honest Interfaces** — Types reflect reality | API design |
| 9 | **Expressions** — Return values, not actions | Writing functions |
| 10 | **No Shared State** — Keep data local | Managing state |
| 11 | **Higher-Order** — Abstract over behavior | Reducing duplication |
| 12 | **Recursion** — Match recursive structures | Tree/graph problems |
| 13 | **Precise Modeling** — Encode invariants | Domain modeling |
| 14 | **Referential Transparency** — Replace with value | Reasoning about code |
| 15 | **Lazy Evaluation** — Defer computation | Performance |
| 16 | **Minimize Surface** — Expose only necessary | API design |

## Decision Questions

When designing, ask:

> "Is this **predictable** (same input → same output)?"

> "Can this be understood without **tracking hidden state**?"

> "Are **changes localized** or do they cascade?"

> "Does the interface **tell the truth** about what it does?"

## Common Refactors

| From | To | Principle |
|------|-----|-----------|
| Mutable params | Return new value | #1 Immutable |
| Global state | Pass as argument | #5 Explicit |
| Nested ifs | Pattern match | #7 Declarative |
| null checks | Option/Result type | #8 Honest |
| Loop with mutations | Pipeline/map-reduce | #4 Pipeline |
| Big class | Small composed functions | #3 Composition |
| Public by default | Private by default | #16 Surface |

## When to Apply

- Designing new systems
- Refactoring existing code
- Making architectural decisions
- Code reviews

**Don't be dogmatic** — Apply where they bring clarity, adapt to context.
