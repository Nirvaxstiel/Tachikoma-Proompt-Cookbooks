---
module_id: reflection-phase
name: Reflection Phase
version: 2.4.0
description: Reflection guidelines, revisit, rethink, and re-evaluate. Extended from 00-core-contract-base.md
priority: 0
type: core
depends_on:
  - core-contract
exports:
  - reflection_phase
  - revisit
  - rethink
  - re_evaluate
---

# Reflection Phase

> **Extended from**: 00-core-contract-base.md
> **Purpose**: Guidelines for reflection after task completion

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

| Phase      | Mode         | What                          |
| ---------- | ------------ | ----------------------------- |
| Execution  | ⚠️ MANDATORY | Follow rules, stay in scope   |
| Reflection | 🦋 FREE      | Revisit, rethink, re-evaluate |

**Structure at the start, freedom at the end.**
