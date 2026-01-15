# <PROJECT NAME> — Agent Instructions

> This file defines the operating contract for the AI agent working in this repository.
> It prioritizes correctness, alignment with existing architecture, and minimal surface area.
> The agent is expected to reason carefully, reuse patterns, and avoid speculative design.

---

## 1. Purpose & Success Criteria

**Primary Goal**  
<What this agent is here to do in this project — concrete, not aspirational>

**Definition of “Done”**  
The task is complete when:
- <observable condition 1>
- <observable condition 2>
- No further changes materially improve correctness or alignment

**Optimization Order**  
Accuracy → Consistency → Maintainability → Performance → Speed

---

## 2. Agent Operating Mindset

- Think before acting; plan edits explicitly, then execute.
- Validate assumptions against the actual codebase.
- Prefer existing patterns over new abstractions.
- Make the smallest change that fully satisfies the requirement.
- Treat the codebase as the source of truth, not the prompt.

---

## 3. Precedence Rules (Hard)

When conflicts arise, follow this order:

1. Existing codebase patterns and conventions  
2. Explicit owner or reviewer instructions  
3. This document  
4. Language / framework defaults  

Never override higher precedence without calling it out.

---

## 4. Project Snapshot (Fill This In)

**Domain / Product**  
<What the system actually does>

**Tech Stack**  
<Language, runtime, frameworks, infra>

**Architecture**  
<e.g. layered, event-driven, CQRS, monolith, modular>

**State Model**  
<Stateless, DB-backed, event-sourced, write-only, etc>

**Key Constraints**  
- <e.g. no GETs, no DB, async only, etc>

---

## 5. Repository & File Patterns

Describe *where things live* and *what goes where*.

**Controllers / Entry Points**  
- Location:
- Responsibilities:
- Conventions:

**Core Logic / Services**  
- Location:
- Responsibilities:
- Patterns to follow:

**DTOs / Models**  
- Types to prefer:
- Mutability rules:
- Naming conventions:

**Extensions / Helpers**  
- When allowed:
- Naming rules:

**Tests**  
- Frameworks:
- Naming patterns:
- What is worth testing vs not:

---

## 6. Integration & Invariants (Non-Negotiable)

These rules must always hold:

- <integration invariant 1>
- <naming / ID format invariant>
- <logging / tracing invariant>
- <protocol or contract invariant>

If a change would violate one of these, stop and surface it.

---

## 7. Pattern Discovery & Reuse

**Before implementing anything new**:

1. Search the repo for similar behavior or structure.
2. Identify the closest existing pattern.
3. Reuse it if it fits.
4. If not, explain *why* and get confirmation before diverging.

**Red Flags (Search First)**:
- Creating new interfaces similar to existing ones
- Manual implementations of cross-cutting concerns
- Factories, Func<>, or DI gymnastics
- Duplicated validation or mapping logic

---

## 8. Code Style & Design Bias

- Immutable by default
- Functional / declarative over imperative
- Prefer expressions over statements
- Avoid cleverness; clarity beats novelty
- No speculative extensibility (YAGNI)

Document *only* what is non-obvious or externally constrained.

---

## 9. Validation & Error Handling

- Validate once, early, and consistently.
- Do not duplicate framework or compiler guarantees.
- Separate structural vs business validation.
- Prefer explicit failure over silent correction.

---

## 10. Commenting Policy

**Default: no comments**

Allowed only for:
- Non-obvious algorithms
- External system quirks
- TODOs with a clear reason or ticket

Never narrate intent already obvious from code.

---

## 11. Testing Strategy

**Test What Matters**:
- Business rules
- Orchestration paths
- Validation behavior
- Edge cases with real impact

**Do NOT Test**:
- Framework internals
- Auto-generated code
- Language features
- Trivial getters/setters

Consolidate similar cases aggressively.

---

## 12. Operational Rules

- Localized changes only unless explicitly requested
- Batch related edits
- Reference existing files instead of repeating code
- Keep outputs concise and structured

**Post-Task Output**:
- 2–5 bullets summarizing what changed
- Call out any assumptions or risks

---

## 13. Safety Gate (Mandatory Before Changes)

Before generating code:

1. Inventory existing symbols and types
2. Confirm they exist (search if unsure)
3. Reuse before creating
4. Plan edits explicitly
5. Verify invariants still hold

Never invent types or patterns silently.

---

## 14. Agent Contract

At each step, the agent must:
- Choose a single next action
- Operate within the defined rules
- Stop when “done” criteria are met

If unsure, stop and ask.

---
