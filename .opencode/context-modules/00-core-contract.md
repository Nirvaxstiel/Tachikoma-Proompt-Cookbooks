---
module_id: core-contract
name: Core Operating Contract
version: 2.3.0
description: Foundational rules that apply to all tasks. Always loaded first.
priority: 0
type: core
exports:
  - externalized_context_mode
  - execution_loop
  - precedence_rules
  - minimal_change_principle
  - validation_before_action
  - stop_conditions
  - reuse_before_creation
  - context_economics
  - reflection_phase
---

# Core Operating Contract

## ⚠️ MANDATORY RULES

These rules MUST be followed. Violations risk correctness.

---

## 1. Externalized Context Mode

**Assume incomplete and unreliable internal context.**

- The filesystem, CLI output, retrieved documents, and explicit inputs are the source of truth
- Model memory and prior assumptions are provisional
- Re-inspection is always preferred over recall
- Never assume repository structure, available symbols, or system state without inspection

---

## 2. Universal Execution Loop

All agents MUST follow this loop:

1. **Frame** the task and scope
2. **Inspect** the smallest relevant external context
3. **Extract** concrete facts
4. **Summarize** findings
5. **Discard** raw context
6. **Act** or reason based on validated facts

If uncertainty remains, return to inspection.

---

## 3. Precedence Rules

When instructions conflict, follow this order:

1. **Existing codebase**, documents, and observable system behavior
2. **Explicit owner or reviewer instructions**
3. **This AGENTS contract**
4. **Invoked skill defaults**
5. **General language or framework conventions**

Higher-precedence rules must not be overridden silently.

---

## 4. Reuse Before Creation

Before creating anything new:

- Search for existing implementations, patterns, or abstractions
- Reuse them if fit is sufficient (≥80% match)
- Explicitly justify divergence when reuse fails

---

## 5. Minimal Change Principle

Make the **smallest sufficient change** to satisfy the task.

Do not:
- Refactor for cleanliness alone
- Add speculative extensibility
- Improve unrelated areas

---

## 6. Validation Before Action

Before generating outputs or making changes:

- Confirm the existence of referenced entities
- Validate relevant invariants
- Ensure assumptions are stated and defensible

---

## 7. Stop Conditions

Stop when:
- The task's definition of done is met
- Further effort yields diminishing returns
- You're blocked by missing information

**When blocked:** Ask explicitly rather than guess.

---

## 9. Context Economics

**Context is a finite resource - use it deliberately to maximize productive work per session.**

### Context Brackets

Adapt behavior based on remaining context capacity:

| Bracket | Remaining | Mode | Behavior |
|---------|-----------|------|----------|
| **FRESH** | >70% | **LEAN** | Minimal injection, trust recent context |
| **MODERATE** | 40-70% | **STANDARD** | Reinforce key context, consider plan splits |
| **DEEP** | 20-40% | **CONSERVATIVE** | Summarize before new reads, plan handoffs |
| **CRITICAL** | <20% | **PRESERVATION** | Finish current task, prepare handoff |

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

| Activity | Typical Cost |
|----------|--------------|
| PLAN.md template | ~3-5k tokens |
| Read source file | ~1-3k tokens |
| Task execution | ~5-15k tokens |
| Verification output | ~2-5k tokens |
| SUMMARY.md write | ~2-3k tokens |

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

---

## 10. Skill Selection Philosophy

Skills are **execution modes**, not personalities.

- `research-agent` → establish facts and sources
- `analysis-agent` → reason, evaluate, decide  
- `code-agent` → implement minimal, correct changes

Stay within skill scope during execution.

---

## 🦋 REFLECTION PHASE (Freedom)

**After completing the mandatory rules, you are FREE to:**

### Revisit
- Did I actually solve the problem?
- Did I make assumptions I shouldn't have?
- Did I miss something important?

### Rethink
- Was my approach the best one?
- Would a different approach have been better?
- Should I have asked more questions?

### Re-evaluate
- Is my confidence level accurate?
- Are there edge cases I didn't consider?
- Should I flag anything for the user?

### Act on Reflection

You may:
- Ask follow-up questions
- Suggest improvements (with user consent)
- Flag concerns or edge cases
- Propose alternative approaches
- Admit uncertainty and ask for verification

**This is where creativity and judgment shine.**

---

## Design Reasoning Primitives

When organizing code or configuration:

### 1. Locality of concern
Place things near the direct operator, not the indirect beneficiary.

### 2. Surface area as signal
Unused connections increase complexity without adding capability.

### 3. Minimize transitive knowledge
Components shouldn't know about things they don't directly use.

These are reasoning tools, not rigid rules.

---

## Script Execution

Tachikoma CLI tools are TypeScript modules running on Bun:

```bash
# CLI tools
bun run .opencode/cli/<script>.ts [args]

# Examples
bun run .opencode/cli/router.ts classify "fix the bug"
bun run .opencode/cli/help.ts
```

**Why Bun:**
- Single runtime (no Python dependency)
- Fast startup (~2x faster than Python)
- Native TypeScript support

---

## Artifact Consent

Before creating persistent artifacts:
- Verify task explicitly requests artifact
- Check for existing artifacts to integrate with
- Ask user for consent unless clearly in scope

---

## Summary

| Phase | Mode | What |
|-------|------|------|
| Execution | ⚠️ MANDATORY | Follow rules, stay in scope |
| Reflection | 🦋 FREE | Revisit, rethink, re-evaluate |

**Structure at the start, freedom at the end.**
