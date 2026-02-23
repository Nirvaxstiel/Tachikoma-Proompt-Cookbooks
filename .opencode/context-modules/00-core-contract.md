---
module_id: core-contract
name: Core Operating Contract (Base)
version: 2.4.0
description: Base operating rules - minimal core that applies to all tasks. See 00a-00d for detailed modules.
priority: 0
type: core
exports:
  - externalized_context_mode
  - universal_execution_loop
  - precedence_rules
---

# Core Operating Contract (Base)

> **Base Module**: This contains the minimal core rules that apply to ALL tasks.
> **Extended by**: 00a-workflow-phases.md, 00b-context-economics.md, 00c-validation-rules.md, 00d-reflection-phase.md

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

**See extended modules:**

- **00a-workflow-phases.md**: Workflow phases, checkpoints, mandatory phases
- **00b-context-economics.md**: Context management strategies, token optimization
- **00c-validation-rules.md**: Pre-action validation, rules before creation
- **00d-reflection-phase.md**: Reflection guidelines, revisit and re-evaluate
