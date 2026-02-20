---
module_id: core-contract
name: Core Operating Contract
version: 2.2.0
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

## 8. Skill Selection Philosophy

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

## Python Execution

Use `uv run python` for consistent dependency management. Fall back to bare `python` if UV fails:

```bash
# Primary approach (recommended)
uv run python <script.py> [args]

# Fallback if uv fails (e.g., no pyproject.toml, missing deps)
python <script.py> [args]
```

**When to use each:**
- `uv run python` - Preferred, ensures consistent dependencies from pyproject.toml
- `python` - Fallback when UV environment isn't set up or for quick one-liners

**Note:** The project has a root `pyproject.toml` that declares `pyyaml>=6.0` as a dependency.

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
