---
module_id: functional-thinking
name: Functional Thinking & Clear Reasoning
version: 1.0.0
description: Cognitive and design principles for clear reasoning, predictable systems, and maintainable solutions. Applies to code, documentation, and decision-making.
priority: 11
type: context
depends_on:
  - core-contract
exports:
  - immutable_mindset
  - pure_reasoning
  - composition_thinking
  - pipeline_mental_model
  - explicit_dependencies
  - totality_principle
  - declarative_intent
  - honesty_principle
---

# Functional Thinking & Clear Reasoning

> **COUPLED WITH:** `10-coding-standards.md` — This module provides the philosophical foundation; coding-standards provides concrete application.

---

## Core Philosophy

**Clear thinking produces clear systems.**

These principles originated in functional programming but apply universally to reasoning, design, and communication. They're not about being "functional" — they're about building systems that are:

- **Predictable** — Outputs determined by inputs
- **Reasonable** — Can be understood without tracking hidden state
- **Maintainable** — Changes are localized and testable
- **Honest** — Interfaces don't lie about what they do

---

## The 16 Principles

### 1. Prefer Immutable Mindset

**Preserve truth instead of changing it.**

Create new versions rather than modifying existing ones. This eliminates hidden dependencies and makes history traceable.

**Beyond code:**
- Documentation: Add revisions rather than editing in place
- Decisions: Issue new decisions rather than revoking old ones
- Communication: Build on messages rather than changing past statements

**In code:**
- Return new data structures instead of mutating inputs
- Use `const`/`final` for values that shouldn't change
- Avoid shared mutable state between components

**Refer to:** `10-coding-standards.md` → State Management pattern

---

### 2. Pure Reasoning

**Same inputs → Same outputs. No hidden effects.**

A function/process should be testable in isolation. Side effects (I/O, state changes) should be visible and controlled.

**Beyond code:**
- Processes: Define inputs and outputs explicitly
- Contracts: Clear obligations without hidden conditions
- Policies: Rules that apply consistently

**In code:**
- Isolate I/O at system boundaries
- Avoid global state or singletons
- Make dependencies explicit in function signatures

**Refer to:** `10-coding-standards.md` → Testing Standards

---

### 3. Composition Thinking

**Build complexity from simplicity.**

Combine small, focused pieces to create sophisticated behavior. Each piece should be understandable independently.

**Beyond code:**
- Teams: Specialized roles composing to deliver projects
- Documentation: Modular sections that can be combined
- Workflows: Steps that can be reordered or reused

**In code:**
- Write functions that do one thing well
- Build pipelines from small transforms
- Prefer composition over deep inheritance

**Refer to:** `10-coding-standards.md` → Code Organization

---

### 4. Pipeline Mental Model

**Think in transformations, not steps.**

Model work as data flowing through a series of operations. This aligns with how humans naturally understand processes.

**Beyond code:**
- Projects: Requirements → Design → Implementation → Delivery
- Documentation: Research → Draft → Review → Publish
- Decisions: Gather information → Analyze → Decide → Communicate

**In code:**
- Use `.then()` chains or pipeline operators
- Avoid imperative loops with side effects
- Express intent as "data in → data out"

**Refer to:** `10-coding-standards.md` → Async Patterns

---

### 5. Explicit Dependencies

**If you need it, ask for it.**

Make all requirements visible. Hidden assumptions become bugs.

**Beyond code:**
- Meetings: State what you need beforehand
- APIs: Document required authentication
- Services: Declare upstream dependencies

**In code:**
- Pass dependencies as parameters, don't access globals
- Inject services, don't hardcode connections
- Use dependency injection or constructor parameters

**Refer to:** `10-coding-standards.md` → Design Primitives

---

### 6. Totality Principle

**Handle all cases, especially errors.**

Define behavior for every possible input. Don't let expected failures become runtime surprises.

**Beyond code:**
- Processes: Handle exceptions explicitly
- Contracts: Define failure modes
- APIs: Document error responses

**In code:**
- Use Result/Option types instead of throwing for expected failures
- Avoid null/undefined without type indication
- Make error handling part of the function contract

**Refer to:** `10-coding-standards.md` → Result Types vs Exceptions

---

### 7. Declarative Intent

**Describe *what* you want, not *how* to achieve it.**

Let tools, frameworks, or languages handle the "how". Focus on intent.

**Beyond code:**
- Goals: Define outcomes, not implementation details
- Requirements: Describe behavior, not algorithms
- Tasks: Explain what's needed, not how to do it

**In code:**
- Use pattern matching instead of nested conditionals
- Prefer list comprehensions over manual loops
- Let declarative frameworks handle complexity

**Refer to:** `10-coding-standards.md` → Patterns

---

### 8. Honesty Principle

**Interfaces shouldn't lie.**

Types and signatures should truthfully reflect what's possible. If something might fail or be absent, encode that.

**Beyond code:**
- APIs: Document rate limits and errors
- Contracts: State obligations explicitly
- Meetings: Declare capacity and constraints

**In code:**
- Return `Result<T, E>` instead of throwing
- Use `Option<T>` instead of nullable types
- Make error cases part of the type system

**Refer to:** `10-coding-standards.md` → Null/Optional Handling

---

### 9. Expressions Over Statements

**Compute values, don't just perform actions.**

Prefer constructs that return values and can be composed.

**Beyond code:**
- Documentation: Write as facts that can be referenced
- Decisions: State the outcome, not the process
- Communication: Make claims that can be evaluated

**In code:**
- Use ternary expressions or match expressions
- Prefer `if` expressions over `if` statements
- Chain methods instead of sequential mutations

**Refer to:** `10-coding-standards.md` → Code Style & Design Bias

---

### 10. Avoid Shared State

**Keep data local. Pass it explicitly.**

Shared mutable state makes reasoning impossible. Keep state where it's used.

**Beyond code:**
- Projects: Don't create shared responsibility without owners
- Documentation: Avoid sections that change based on context
- Decisions: Document the decision, not the reasoning

**In code:**
- Pass state as function arguments
- Return new state instead of modifying global state
- Use immutable data structures

**Refer to:** `10-coding-standards.md` → State Management pattern

---

### 11. Higher-Order Thinking

**Abstract over behavior, not just data.**

Write functions that take functions as arguments. This reduces duplication and raises the level of abstraction.

**Beyond code:**
- Processes: Define workflows that accept sub-processes
- Documentation: Use templates with fillable sections
- Policies: Create frameworks that accept specific rules

**In code:**
- Use `map`, `filter`, `reduce` instead of writing loops
- Accept callbacks or strategy objects
- Build utility libraries for common patterns

**Refer to:** `10-coding-standards.md` → Code Style & Design Bias

---

### 12. Recursion When It Fits

**Process recursive structures with recursion.**

Recursion aligns with immutable data and recursive problems.

**Beyond code:**
- Organizations: Handle sub-teams recursively
- Documentation: Reference nested structures recursively
- Processes: Break down tasks into sub-tasks

**In code:**
- Use recursion for tree/graph traversal
- Prefer tail-recursive functions when performance matters
- Match recursive data structures with recursive code

**Refer to:** `10-coding-standards.md` → Patterns (implicit)

---

### 13. Precise Modeling

**Make illegal states unrepresentable.**

Use types to capture domain constraints precisely.

**Beyond code:**
- Processes: Design workflows that can't enter invalid states
- APIs: Define state transitions explicitly
- Documentation: Structure information to prevent contradictions

**In code:**
- Use union/sum types for alternatives
- Create domain types instead of primitives
- Encode invariants in the type system

**Refer to:** `10-coding-standards.md` → Testing Standards

---

### 14. Referential Transparency

**Any expression can be replaced by its value.**

This follows from purity and immutability. Enables equational reasoning.

**Beyond code:**
- Decisions: Can be replaced by their outcome
- Documentation: Sections can be referenced as values
- Communication: Messages can be quoted without changing meaning

**In code:**
- Write pure functions
- Use immutable data
- Avoid side effects in core logic

**Refer to:** `10-coding-standards.md` → Code Style & Design Bias

---

### 15. Lazy Evaluation

**Defer computation until needed.**

Postpone expensive operations. Can improve performance and enable infinite structures.

**Beyond code:**
- Documentation: Generate sections on demand
- Projects: Execute work when resources are available
- Decisions: Defer until information is complete

**In code:**
- Use generators/iterators
- Implement thunks for expensive operations
- Build lazy data structures

**Refer to:** `10-coding-standards.md` → Code Style & Design Bias (implicit)

---

### 16. Minimize Surface Area

**Only expose what's necessary.**

Reduce connections between components. Unused connections add complexity without value.

**Beyond code:**
- APIs: Document only what consumers need
- Teams: Share only what's necessary for collaboration
- Documentation: Include only what readers need

**In code:**
- Make methods/functions private by default
- Minimize public interfaces
- Avoid god objects with too many responsibilities

**Refer to:** `10-coding-standards.md` → Design Primitives

---

## Application Hierarchy

```
Functional Thinking (This Module)
    ↓
Philosophical Principles (Cognitive Tools)
    ↓
Coding Standards (10-coding-standards.md)
    ↓
Concrete Patterns (Examples & Practices)
```

**Start here:** When designing systems or reasoning about problems
**Then:** Apply concrete patterns from `10-coding-standards.md`
**Finally:** Implement using language-specific syntax

---

## Quick Reference

| Principle | Core Idea | In One Word |
|-----------|-----------|-------------|
| Immutable | Don't change, create new | Preserve |
| Pure | Same input, same output | Predictable |
| Compose | Small pieces → big systems | Modular |
| Pipeline | Data flow, not steps | Transform |
| Explicit | Show what you need | Transparent |
| Total | Handle all cases | Complete |
| Declarative | What, not how | Intent |
| Honest | Don't lie in interfaces | Truthful |
| Expressions | Compute values | Evaluate |
| No Shared State | Keep data local | Local |
| Higher-Order | Abstract over behavior | General |
| Recursion | Match recursive data | Recursive |
| Precise Models | Encode invariants | Accurate |
| Referential | Replace with value | Substitutable |
| Lazy | Defer until needed | Efficient |
| Minimize Surface | Expose only necessary | Minimal |

---

## When to Apply

**Use these principles when:**
- Designing new systems
- Refactoring existing code
- Writing documentation
- Making architectural decisions
- Reviewing others' work

**Don't be dogmatic:**
- Apply where they bring clarity
- Adapt to your context
- Balance with other concerns (performance, team experience)

---

## Module Contract

This module provides the philosophical foundation for clear reasoning and design.

**Violations include:**
- Hidden dependencies or side effects
- Inconsistent behavior for same inputs
- Unhandled error cases
- Interfaces that don't reflect reality

**When designing:**
> Ask: "Is this predictable, reasonable, maintainable, and honest?"

---

**Version:** 1.0.0
**Updated:** 2026-02-21
**Priority:** 11 (Loaded with coding-standards)
**Status:** Active
<!-- TODO: Review and adjust functional-thinking integration after testing -->
