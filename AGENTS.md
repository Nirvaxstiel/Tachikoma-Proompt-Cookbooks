# Agents Contract

This document defines the **global operating rules** for all agents in this repository. These rules apply **before** any skill-specific behavior and override skill defaults where conflicts arise.

The goal is to ensure correctness, grounding, and disciplined execution under incomplete information.

---

## Core Assumption: Externalized Context Mode

Agents operate under **incomplete and unreliable internal context**.

Therefore:

- The filesystem, CLI output, retrieved documents, and explicit inputs are the source of truth
- Model memory and prior assumptions are provisional
- Re-inspection is always preferred over recall

Agents must never assume repository structure, available symbols, or system state without inspection.

---

## Universal Execution Loop

All agents follow this loop unless explicitly overridden:

1. Frame the task and scope
2. Inspect the smallest relevant external context
3. Extract concrete facts
4. Summarize findings
5. Discard raw context
6. Act or reason based on validated facts

If uncertainty remains, return to inspection.

---

## Precedence Rules

When instructions conflict, agents must obey the following order:

1. Existing codebase, documents, and observable system behavior
2. Explicit owner or reviewer instructions
3. This AGENTS contract
4. Invoked skill defaults
5. General language or framework conventions

Higher-precedence rules may not be overridden silently.

---

## Reuse Before Creation

Before creating anything new, agents must:

- Search for existing implementations, patterns, or abstractions
- Reuse them if fit is sufficient
- Explicitly justify divergence when reuse fails

Unsearched creation is a contract violation.

---

## Minimal Change Principle

Agents are constrained to make the **smallest sufficient change** to satisfy the task.

They must not:

- Refactor for cleanliness alone
- Add speculative extensibility
- Improve unrelated areas

If improvement is not required for correctness, it is out of scope.

---

## Validation Before Action

Before generating outputs or making changes, agents must:

- Confirm the existence of referenced entities
- Validate relevant invariants
- Ensure assumptions are stated and defensible

Invented structure or silent assumptions are prohibited.

---

## Stop Conditions

Agents must stop when:

- The task’s definition of done is met
- Further effort yields diminishing returns

If blocked by missing information or conflicting constraints, agents must ask explicitly rather than guess.

---

## Skill Selection Philosophy

Skills are **execution modes**, not personalities.

- `research-agent` → establish facts and sources
- `analysis-agent` → reason, evaluate, decide
- `code-agent` → implement minimal, correct changes

Agents must not perform work outside the scope of the active skill.

---

## Contract Enforcement

Violations include:

- Assuming context without inspection
- Creating before searching
- Overriding precedence rules silently
- Continuing work after stop conditions are met

When violations risk correctness, agents must halt and surface the issue.

---

## Design Reasoning Primitives

When organizing code or configuration, apply these reasoning patterns:

### 1. Locality of concern

**Principle:** Place things near the direct operator, not the indirect beneficiary.
Ask: What code directly reads/writes/calls this?
→ That's where it belongs.

### 2. Surface area as signal

**Principle:** Unused connections increase apparent complexity without adding capability.
Ask: If I remove this, would anything break?
→ No? It's noise. Remove it.

### 3. Minimize transitive knowledge

**Principle:** Components shouldn't know about things they don't directly use.
Ask: Why does this component receive this dependency?
→ If it's just passing it through, reconsider the design.

**Application:**
These aren't rules to follow blindly, they're **reasoning tools**.
When something feels wrong, check against these parameters to understand why.

---

## Final Rule

When in doubt:

**Inspect again, downgrade confidence, or stop.**
