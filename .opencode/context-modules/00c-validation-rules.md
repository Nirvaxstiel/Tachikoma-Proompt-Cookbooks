---
module_id: validation-rules
name: Validation Rules
version: 2.4.0
description: Pre-action validation, reuse before creation, and stop conditions. Extended from 00-core-contract-base.md
priority: 0
type: core
depends_on:
  - core-contract
exports:
  - minimal_change_principle
  - reuse_before_creation
  - validation_before_action
  - stop_conditions
---

# Validation Rules

> **Extended from**: 00-core-contract-base.md
> **Purpose**: Rules for validation, creation, and when to stop

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

## 2.1. Pre-Action Validation

**Before ANY action that creates/modifies persistent files:**

1. **Artifact Consent Check**:
   - Load `.opencode/context-modules/11-artifacts-policy.md`
   - Run full consent workflow (SCOPE → ALTERNATIVE → INTEGRATION → USER CONSENT)
   - Only proceed if all checks pass or user explicitly consents

2. **Language Policy Check** (for context_modules):
   - If editing context_modules: MUST use pseudocode, never specific languages
   - Exception: Only for syntax-specific bug demonstrations
   - Violation: Immediately convert to pseudocode

3. **Existing Structure Check**:
   - Search docs/ for similar artifacts before creating new ones
   - Integrate with existing instead of creating duplicates
   - Check project documentation conventions

**Critical Rule**: Assumption ≠ Explicit Request

- If task does NOT explicitly request an artifact: Ask for consent first
- NEVER assume "documentation is helpful" or "summary is useful"
- Default to terminal output unless user explicitly requests persistent file

---

## 7. Stop Conditions

Stop when:

- The task's definition of done is met
- Further effort yields diminishing returns
- You're blocked by missing information

**When blocked:** Ask explicitly rather than guess.
