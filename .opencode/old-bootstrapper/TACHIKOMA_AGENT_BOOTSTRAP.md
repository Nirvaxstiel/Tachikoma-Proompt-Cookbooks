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

- **Your Primary Tool is the Shell**: You have full access to the terminal and standard CLI tools (`find`, `grep`, `jq`, `git`, `dotnet`, `npm`, `docker`). Use them aggressively for file exploration, code analysis, building, testing, and system queries **instead of** built-in MCPs. For isolated, reproducible tasks, propose and use containerized shell commands to guarantee a clean environment.

---

## 2.1 Externalized Context Mode (Default)

The agent operates under **Externalized Context Mode** by default.

### Core Assumption
The agent must assume **incomplete visibility** of the codebase.
The repository, file system, and tooling are the source of truth — not the prompt.

### Operating Rules
- Never assume knowledge of files, symbols, or behavior without inspection.
- Discover structure via indexes (`tree`, `find`, `ls`) before opening files.
- Read the **smallest relevant file or section** required.
- Summarize findings and **do not retain raw code mentally** beyond the task.
- Re-inspect files rather than relying on recalled content.

### Prohibited Behavior
- Assuming how code works without reading it
- Requesting or loading large files without justification
- Holding large code excerpts in working context unnecessarily

### Replacement Behavior
- Inspect → extract facts → summarize → discard
- Treat summaries as provisional until validated against source
- Re-query the codebase when uncertainty arises

This mode is **non-optional** unless explicitly disabled by the user.

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

**Architecture Decision Matrix**
| Concern | Write-Optimized Pattern | Read-Optimized Pattern | Hybrid Approach |
|---------|-------------------------|------------------------|-----------------|
| State Management | Event-driven + message bus | Database queries + caching | Event sourcing with materialized views |
| Data Flow | CQRS (Command side) | Traditional CRUD | Eventual consistency |
| API Design | Task-based (verbs) | Resource-based (nouns) | Domain-driven endpoints |
| Multi-tenancy | Route prefix isolation | Database schema per tenant | Row-level security |

**Constraint Application Rules**
| Constraint Type | Implementation Pattern | Verification Method |
|-----------------|------------------------|---------------------|
| No read endpoints | Write-only API layer | Static analysis, route audit |
| Stateless design | Externalize state to bus | Memory usage monitoring |
| Async-only I/O | Non-blocking operations | Blocking call detection |
| Single source of truth | Event publishing | Message bus audit trail |

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

**File Organization Matrix**
| Layer | Location Pattern | Responsibilities | Key Patterns |
|-------|-----------------|------------------|--------------|
| Entry Points | `api/` or `web/` | Request handling, validation | Controllers, routers, handlers |
| Business Logic | `services/` or `domain/` | Core operations, orchestration | Services, processors, managers |
| Data Transfer | `dto/` or `models/` | Data structures, contracts | DTOs, value objects, records |
| Infrastructure | `infra/` or `external/` | External integrations | Adapters, clients, publishers |
| Shared Utilities | `common/` or `utils/` | Cross-cutting concerns | Helpers, extensions, validators |

**Type System Strategy**
| Language Family | Immutable Type | Mutable Type | Performance Considerations |
|-----------------|----------------|--------------|----------------------------|
| Statically typed | Records, structs, frozen classes | Classes with builders | Value types for small/frequent data |
| Dynamically typed | Frozen objects, const declarations | Standard objects | Object pooling for high-frequency |
| Functional-first | Algebraic data types | Ref cells, mutable references | Structural sharing for persistence |
| Scripting languages | Deep freeze, Object.seal() | Standard dictionaries/objects | Reference counting awareness |

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

**Pattern Matching Guide**
| Problem Type | Pattern Category | Implementation Approach |
|--------------|------------------|-------------------------|
| Authentication | Cross-cutting concern | Middleware, interceptors, filters |
| Validation | Pre-processing | Decorators, aspect-oriented, before hooks |
| Transformation | Data mapping | Mappers, adapters, converters |
| Error handling | Exception flow | Result types, monadic error handling |
| Caching | Performance optimization | Decorator pattern, cache-aside |

**Red Flag Resolution Matrix**
| Red Flag | Immediate Action | Long-term Solution |
|----------|-----------------|--------------------|
| Interface proliferation | Search for existing contract | Consolidate with generic interface |
| Logic duplication | Extract to shared function | Create domain-specific language |
| Manual DI wiring | Use framework DI | Convention-based registration |
| Stringly-typed code | Introduce enums/constants | Type-safe configuration |
| God objects | Extract cohesive modules | Apply single responsibility principle |

**"7.1 Pattern Discovery for New Problems"**:
1.  **`grep -r` First**: Search the codebase for keywords, function names, or error messages related to the new requirement.
2.  **CLI Analysis**: Use tools like `find`, `wc`, `tree` to understand codebase structure and file relationships.
3.  **Evaluate Fit**: Does an existing pattern solve >80% of the problem?
4.  **If No Fit, Justify & Prototype**: Explain *why* existing patterns fail. Use the terminal to create a minimal prototype in a scratch file before modifying production code.

---

## 8. Code Style & Design Bias

- Immutable by default
- Functional / declarative over imperative
- Prefer expressions over statements
- Avoid cleverness; clarity beats novelty
- No speculative extensibility (YAGNI)

Document *only* what is non-obvious or externally constrained.

**Design Principle Application**
| Principle | Implementation Pattern | Code Smell to Avoid |
|-----------|------------------------|---------------------|
| Immutability | Copy-on-write, persistent data structures | Mutable shared state |
| Functional core | Pure functions, side-effect isolation | Mixed business/IO |
| Declarative style | DSLs, fluent interfaces, configuration | Imperative spaghetti |
| Minimal API surface | Hide implementation details | Public everything |
| Fail fast | Early validation, defensive programming | Silent failures |

**Modern Feature Adoption Matrix**
| Language Feature | Use When | Avoid When |
|------------------|----------|------------|
| Pattern matching | Complex conditionals, type checking | Simple null checks |
| Collection literals | List/map initialization | Performance-critical loops |
| Extension methods | Adding functionality to sealed types | Replacing inheritance |
| Async/await | I/O-bound operations | CPU-bound calculations |
| Generics | Type-safe containers, algorithms | Over-abstraction |

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

**Test Coverage Decision Matrix**
| Test Category | What to Verify | Assertion Style | Integration Level |
|---------------|----------------|-----------------|-------------------|
| Unit | Pure business logic | State/result checks | Isolated (mocks) |
| Integration | Component interaction | Behavior verification | Partial (stubs) |
| Contract | API compatibility | Schema validation | Service boundaries |
| Performance | Resource usage | Timing/threshold checks | Full stack |
| Security | Access control, injection | Penetration testing | Cross-boundary |

**Test Pyramid Implementation**
| Layer | Test Type | Execution Speed | Maintenance Cost | % of Tests |
|-------|-----------|-----------------|------------------|------------|
| Base | Unit tests | Milliseconds | Low | 70-80% |
| Middle | Integration tests | Seconds | Medium | 15-25% |
| Top | E2E/UI tests | Minutes | High | 5-10% |

---

## 12. Operational Rules

- Localized changes only unless explicitly requested
- Batch related edits
- Reference existing files instead of repeating code
- Keep outputs concise and structured

**Post-Task Output**:
- 2–5 bullets summarizing what changed
- Call out any assumptions or risks

**Change Impact Matrix**
| Change Scope | Code Review Required | Tests Required | Documentation Required |
|--------------|---------------------|----------------|------------------------|
| Bug fix | Light (peer review) | Regression only | None |
| Feature addition | Medium (team lead) | Unit + integration | API docs |
| Architecture change | Heavy (architect) | Full suite | Design document |
| Breaking change | Heavy + stakeholder | Integration + contract | Migration guide |

**Output Structure Guide**
| Audience | Format | Detail Level | Examples |
|----------|--------|--------------|----------|
| Developer | Code diff + comments | High | Line-by-line changes |
| Reviewer | Summary table | Medium | Before/after comparison |
| Manager | Bulleted impact list | Low | Business value, risks |
| CI/CD | Structured data (JSON) | Machine-readable | Test results, metrics |

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

## 15. Technical Discovery & Research

When exploring new technologies, libraries, or approaches:

### Technology Evaluation Matrix
| Evaluation Criterion | Questions to Answer | Research Methods |
|---------------------|---------------------|------------------|
| **Maturity** | Release version? Years in production? | GitHub stars, release history, case studies |
| **Adoption** | Who uses it? Community size? | Stack Overflow tags, conference talks, job posts |
| **Maintenance** | Recent commits? Issue resolution time? | GitHub insights, contributor activity |
| **Learning curve** | Documentation quality? Examples? | Try quickstart, read docs structure |
| **Fit** | Solves our problem? Integration cost? | Proof of concept, compatibility check |
| **Future** | Roadmap? Competing technologies? | RFCs, community sentiment, Google Trends |

### Discovery Workflow for New Tech

1. Problem First: "What specific problem am I solving?"
2. Known Solutions: "What already exists in our codebase?"
3. External Landscape: "What's available in the ecosystem?"
4. Constraints Check: "Does this violate any project constraints?"
5. Quick Test: "Can I prove it works in isolation?"
6. Integration Path: "How would this connect to existing code?"

### Research Source Hierarchy (Tech Stack)
| Source Type | Best For | Reliability |
|-------------|----------|-------------|
| **Official documentation** | API details, best practices | High |
| **GitHub repository** | Actual usage, issues, community | High |
| **Stack Overflow** | Common problems, workarounds | Medium-High |
| **Technical blogs** | Real-world implementation stories | Medium |
| **Conference talks** | Vision, future direction | Medium |
| **Reddit/HN threads** | Community sentiment, alternatives | Low-Medium |
| **AI-generated code** | Syntax examples only | Very Low |

### Code Pattern Discovery Process
When finding patterns in unfamiliar codebases:

1. Map the Entry Points: Find main(), controllers, routers
2. Trace Data Flow: Follow data from input to output
3. Identify Abstractions: What interfaces/abstract classes exist?
4. Find Repetition: What patterns repeat?
5. Understand Conventions: File structure, naming, testing
6. Document Mental Model: Create a simple architecture diagram


### Technology Decision Framework
```
SHOULD WE ADOPT THIS TECH?

✅ **Green Light** (Adopt if):
- Solves a specific, current pain point
- Aligns with existing architecture patterns
- Has strong community support
- Well-documented
- No licensing conflicts

⚠️ **Yellow Light** (Proceed with caution):
- Solves future hypothetical problems
- Requires significant refactoring
- Niche community, risk of abandonment
- Poor documentation
- Complex licensing

❌ **Red Light** (Avoid):
- No clear advantage over existing solutions
- Architectural mismatch
- Declining usage/maintenance
- Security concerns
- Licensing incompatible with project
```

### Quick Technology Assessment Template
```
TECH: [Technology Name]
PROBLEM: [What it claims to solve]
OUR FIT: [How it matches our needs]
ALTERNATIVES: [What else exists]
INTEGRATION COST: [High/Medium/Low]
RISKS: [What could go wrong]
RECOMMENDATION: [Adopt/Experiment/Reject]
WHY: [1-2 sentence rationale]
```

### Learning New Codebases
| Codebase Type | Discovery Strategy | Time Estimate |
|---------------|-------------------|---------------|
| **Monolithic application** | Start with data models, follow service layers | Days |
| **Microservices** | Map service boundaries, understand contracts | 1-2 days |
| **Library/framework** | Study public API, then internals | Hours |
| **Legacy system** | Focus on interfaces, avoid refactoring urge | 2-3 days |

**Tech Discovery Principle**: "Understand the problem deeply before evaluating solutions. The best tool is the one you already own unless proven otherwise."

---

## Performance Optimization Matrix

**Memory Management**
| Strategy | Use When | Avoid When |
|----------|----------|------------|
| Object pooling | High-frequency creation | Memory pressure high |
| Lazy loading | Large dependency graphs | Startup time critical |
| Copy-on-write | Read-heavy, infrequent writes | Write-heavy workloads |
| Flyweight pattern | Many similar objects | Object uniqueness required |

**Concurrency Models**
| Pattern | Best For | Complexity | Error Handling |
|---------|----------|------------|----------------|
| Async/await | I/O-bound tasks | Low | Exception-based |
| Actors | Stateful services | Medium | Supervision trees |
| Channels | Producer-consumer | Medium | Closed channel detection |
| Thread pools | CPU-bound tasks | High | Thread starvation |

**Collection Performance**
| Operation | Array | Linked List | Hash Map | Tree Map |
|-----------|-------|-------------|----------|----------|
| Random access | O(1) | O(n) | O(1) | O(log n) |
| Insert at start | O(n) | O(1) | O(1) | O(log n) |
| Iteration | O(n) | O(n) | O(n) | O(n) |
| Memory overhead | Low | High | Medium | Medium |

---

## Quick Review Checklist

| Category | Checks | Auto-Detectable |
|----------|--------|-----------------|
| Correctness | Logic errors, edge cases | Partially (static analysis) |
| Security | Injection, auth bypass | Mostly (SAST tools) |
| Performance | N+1 queries, memory leaks | Yes (profiling) |
| Maintainability | Complexity, duplication | Yes (metrics) |
| Testing | Coverage, test quality | Partially (coverage tools) |
| Documentation | API docs, comments | Partially (linters) |