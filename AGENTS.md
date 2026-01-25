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

## Quick Reference: Intent Classification

Before any task execution:

1. READ `.opencode/runtime/intent_lookup.yaml` for known intents
2. CLASSIFY the query using the lookup table
3. LOAD the skills specified in the lookup entry
4. EXECUTE using only those loaded skills

> The lookup is your grounding anchor. Re-inspect it when uncertain.

---

## Skill Loading Protocol

This section defines skill loading rules. Consult the lookup before every task.

### Intent Classification

Before ANY task execution, agents SHOULD:

1. READ `.opencode/runtime/intent_lookup.yaml` for known intents
2. CLASSIFY the query using the lookup table
3. LOAD the skills specified in the lookup entry
4. EXECUTE using only those loaded skills

### Lookup Table Guidance

The intent_lookup.yaml file provides routing guidance:

- Intent → Strategy (direct/rlm) suggests the approach
- Tools [R, G, B] suggests useful tools
- Skills [code-agent] suggests the appropriate skill

Use judgment when the lookup is ambiguous or incomplete.

### Skill Loading Rules

```
IF lookup entry exists:
  → LOAD suggested skills
  → USE suggested tools
  → FOLLOW suggested strategy (direct or rlm)

IF no lookup match:
  → DISCOVER new intent
  → PROPOSE entry for lookup (suggest skills/tools/strategy)
  → LOAD reasonable skills
  → EXECUTE
```

### Self-Check Reminder

Before responding, consider:

- Did I consult `intent_lookup.yaml`?
- Am I using the right skill for this task?
- If unsure, re-read the lookup and skill definitions

> This is guidance, not enforcement. Trust your judgment but stay grounded.

### Self-Learning Protocol

After SUCCESSFUL execution:

1. OPEN `.opencode/runtime/intent_lookup.yaml`
2. INCREASE confidence by 0.05 (max 0.99)
3. WRITE updated lookup

After FAILED execution:

1. Flag intent for review
2. Do NOT increase confidence
3. Consider adding correction

---

## Subagent Delegation Protocol (ENCOURAGED)

Agents SHOULD invoke specialized agents rather than handling everything directly. Agent invocation minimizes context and maximizes focus.

### When to Invoke Agents

Invoke an agent when:

1. **Specialist exists**: The task matches an agent's purpose
2. **Context is large**: Agent handles chunked processing (e.g., rlm-subcall)
3. **Tool mismatch**: Agent has better tool access
4. **Focus required**: Subagent provides isolated context

### Delegation Chain

```
User Query
    ↓
code-agent (main orchestrator)
    ↓
[Consult intent-director OR lookup]
    ↓
┌─────────────────────────────────────────┐
│ Execution Decision                      │
├─────────────────────────────────────────┤
│ Simple task → Execute directly           │
│ Complex task → Invoke rlm-subcall agent  │
│ Research → Load research-agent skill     │
│ Analysis → Load analysis-agent skill     │
│ Git operations → Load git skills         │
└─────────────────────────────────────────┘
    ↓
Skill/Agent executes with focused context
    ↓
Return result to orchestrator
```

### Delegation Rules

1. **PASS context, not history**: Skill/agent gets clean context
2. **ISOLATE concerns**: Each skill/agent has one purpose
3. **LOAD early**: Load skills before execution
4. **INVOKE when needed**: Use agents for specialized tasks
5. **MINIMIZE hops**: Max 2-3 execution levels

### Agent & Skill List

| Subagent          | Purpose                          | Use When                      |
| ----------------- | -------------------------------- | ----------------------------- |
| `intent-director` | Classify intent, decide strategy | First step for any query      |
| `rlm-subcall`     | Chunk large contexts             | Large files, complex queries  |
| `research-agent`  | Find information                 | Research, investigation tasks |
| `analysis-agent`  | Evaluate options                 | Analysis, decision-making     |
| `git-commit`      | Commit changes                   | Version control tasks         |
| `pr`              | Pull requests                    | PR creation/review            |

### Delegation Example

```
User: "Analyze this 5000-line codebase and find security issues"

orchestrator:
  → Consult intent-director
  → intent-director: "complex" strategy, invoke rlm-subcall agent
  → rlm-subcall: Chunk codebase, extract security issues
  → Return focused results to orchestrator
  → orchestrator: Synthesize findings

Context used:
- intent-director: ~100 tokens (just query)
- rlm-subcall: 1 chunk at a time (~2000 tokens)
- code-agent: Final synthesis (~500 tokens)
Total: ~2600 tokens vs 5000+ without agent invocation
```

### Self-Learning for Execution

After execution feedback:

- UPDATE `.opencode/runtime/intent_lookup.yaml`
- IMPROVE execution patterns
- Flag misclassified intents

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
