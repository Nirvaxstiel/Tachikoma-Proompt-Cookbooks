---
module_id: context-economics
name: Context Economics
version: 2.4.0
description: Context management strategies, token optimization, and context economics. Extended from 00-core-contract-base.md
priority: 0
type: core
depends_on:
  - core-contract
exports:
  - context_economics
  - context_brackets
  - plan_sizing
  - lean_injection_principles
---

# Context Economics

> **Extended from**: 00-core-contract-base.md
> **Purpose**: Guidelines for efficient context management and token optimization

---

## 9. Context Economics

**Context is a finite resource - use it deliberately to maximize productive work per session.**

### Context Brackets

Adapt behavior based on remaining context capacity:

| Bracket      | Remaining | Mode             | Behavior                                    |
| ------------ | --------- | ---------------- | ------------------------------------------- |
| **FRESH**    | >70%      | **LEAN**         | Minimal injection, trust recent context     |
| **MODERATE** | 40-70%    | **STANDARD**     | Reinforce key context, consider plan splits |
| **DEEP**     | 20-40%    | **CONSERVATIVE** | Summarize before new reads, plan handoffs   |
| **CRITICAL** | <20%      | **PRESERVATION** | Finish current task, prepare handoff        |

### Plan Sizing

**Target: ~50% context per plan**

A plan should use roughly half the available context:

- Leaves room for execution output
- Allows error recovery
- Supports verification steps

**Single Concern Per Plan:**

```
GOOD: "Create User model and API endpoints"
BAD: "Create User model, Product model, Order model, and all API endpoints"
```

**2-3 Tasks Maximum:**
More tasks = more context per plan. Split large phases into multiple plans.

### Lean Injection Principles

**Load What You Need:**

```markdown
<!-- GOOD: Targeted loading -->
<context>
@.opencode/STATE.md
@src/models/user.ts  (the specific file being modified)
</context>

<!-- BAD: Kitchen sink -->
<context>
@.paul/PROJECT.md
@.paul/ROADMAP.md
@.paul/STATE.md
@.paul/phases/01-foundation/01-01-SUMMARY.md
@.paul/phases/01-foundation/01-02-SUMMARY.md
@src/models/user.ts
@.paul/src/models/product.ts
@.paul/src/api/routes.ts
</context>
```

**Summary Before Full:**
When referencing prior work:

```markdown
<!-- GOOD: Reference summary -->

@.opencode/agents/tachikoma/spec/phase-name/plan-name/SUMMARY.md

<!-- AVOID: Full plan + summary -->

@.opencode/agents/tachikoma/spec/phase-name/plan-name/PLAN.md
@.opencode/agents/tachikoma/spec/phase-name/plan-name/SUMMARY.md
```

Summaries capture what was built. Plans capture what was intended. After completion, the summary is more useful.

**Progressive Detail:**
Start with high-level, drill down only when needed:

1. Read STATE.md (current position)
2. Read relevant SUMMARY.md (what was built)
3. Read specific source files (implementation details)

Don't load implementation details until you need them.

### Avoiding Reflexive Chaining

**Anti-pattern: Reflexive chain**

```yaml
# Plan 01-01
depends_on: []

# Plan 01-02
depends_on: ["01-01"]  # Does 02 actually need 01's output?

# Plan 01-03
depends_on: ["01-02"]  # Does 03 actually need 02's output?
```

This creates false sequential execution and unnecessary context loading.

**Pattern: Genuine dependencies only**

```yaml
# Plan 01-01: Create User model
depends_on: []

# Plan 01-02: Create Product model
depends_on: []  # Independent! Can parallelize.

# Plan 01-03: Create Order model (references User and Product)
depends_on: ["01-01", "01-02"]  # Genuine: imports types from both
```

### Context Budget Heuristics

| Activity            | Typical Cost  |
| ------------------- | ------------- |
| PLAN.md template    | ~3-5k tokens  |
| Read source file    | ~1-3k tokens  |
| Task execution      | ~5-15k tokens |
| Verification output | ~2-5k tokens  |
| SUMMARY.md write    | ~2-3k tokens  |

Plan your work with these estimates in mind.

### Anti-Patterns

**Loading Everything "Just in Case":**

```markdown
<context>
@everything/that/might/be/relevant.md
</context>
```

❌ Why bad: Wastes context on unused content.

**Ignoring Bracket Transitions:**

```
At 35% context: "Let me start this new complex task"
```

❌ Why bad: May not have room to complete. Start fresh.

**No Handoff Preparation:**

```
At 15% context: Continue working without noting state
```

❌ Why bad: Next session loses context. Always prepare resume.
