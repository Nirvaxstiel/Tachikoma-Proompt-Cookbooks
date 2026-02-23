---
name: workflow-management
description: Production-grade 8-phase development workflow with mandatory UNIFY phase for plan reconciliation, quality gates, confidence-based adaptation, and automated technical debt tracking.
version: 2.2.0
author: tachikoma
type: skill
category: development
tags:
  - workflow
  - process
  - quality-gates
  - mandatory-unify
---

# Spec-Driven Workflow Management

**Core Philosophy:** Never skip phases. Each phase must complete before proceeding.

---

## 7-Phase Workflow

### Phase 1: ANALYZE

**Objective:** Understand problem, produce testable requirements.

**Checklist:**
- [ ] **Inspect actual data** - Query DB, check schema, examine sample rows before making assumptions
- [ ] **Verify understanding** - Present findings to user: "Here's what I found - does this match?"
- [ ] Read all code, docs, tests, logs
- [ ] Define requirements in **EARS Notation**: `WHEN [trigger], THE SYSTEM SHALL [behavior]`
- [ ] Identify dependencies and constraints
- [ ] Map data flows and interactions
- [ ] Catalog edge cases
- [ ] Generate **Confidence Score (0-100%)**

**Critical:** Do not proceed until requirements are clear and documented.

---

### Phase 2: DESIGN

**Objective:** Create technical design and implementation plan.

**Adaptive Strategy by Confidence:**

| Confidence | Strategy |
|------------|----------|
| **High (>85%)** | Full implementation plan, skip PoC |
| **Medium (66-85%)** | Prioritize PoC/MVP, validate first |
| **Low (<66%)** | Research phase, re-analyze after |

**Deliverables:**
- `design.md`: Architecture, data flow, interfaces, error handling
- `tasks.md`: Implementation plan with dependencies

**Critical:** Do not proceed until design is validated.

---

### Phase 3: IMPLEMENT

**Objective:** Write production-quality code with verifiable acceptance criteria.

**Checklist:**
- [ ] **Reference acceptance criteria** from SPEC.md (AC-1, AC-2, AC-3...)
- [ ] Code in small, testable increments
- [ ] Implement from dependencies upward
- [ ] Follow conventions, document deviations
- [ ] Add meaningful comments (focus on "why")
- [ ] Define verification for each task
- [ ] Link done criteria to AC satisfaction
- [ ] Update task status in real time

**Critical:** Every task must have verification steps and AC references. Do not proceed until defined.

---

## Acceptance Criteria Enforcement

### Core Principles

1. **AC is First-Class** - Acceptance criteria must be defined BEFORE tasks
2. **Tasks Reference AC** - Every task links to AC-1, AC-2, AC-3...
3. **Verification Required** - Every task needs a verify step
4. **BDD Format** - Given/When/Then for testability
5. **Done = AC Satisfied** - Task done only when all referenced AC pass

### Task Template Requirements

Every task in tasks.md MUST include:

**Required Sections:**
- **Objective** - What this task accomplishes
- **Acceptance Criteria** - Which AC this task satisfies (e.g., AC-1, AC-2)
- **Verification** - Test command/steps to verify implementation
- **Done Criteria** - All referenced AC must be satisfied

**Example Task Structure:**
```markdown
### Task 1.1: Create login endpoint

### Objective
Enable users to authenticate with username/password

### Acceptance Criteria
- [ ] AC-1: User can login with valid credentials
- [ ] AC-2: Invalid credentials return error

### Verification
- [ ] Test command: `curl -X POST /api/auth/login -d '{"user":"test","pass":"test"}'`
- [ ] Expected output: 200 OK with token

### Done Criteria
- [ ] Code implemented
- [ ] Verification passes (curl returns 200)
- [ ] AC-1 satisfied (valid credentials work)
- [ ] AC-2 satisfied (invalid credentials return error)
```

### Verification Best Practices

**DO:**
- Define executable verification steps (commands, test cases, manual checks)
- Specify expected output (success condition)
- Link verification to AC satisfaction
- Test edge cases explicitly

**DON'T:**
- Use vague descriptions ("verify it works")
- Skip verification steps
- Define done criteria without AC references
- Assume verification is obvious

### UNIFY Verification

During UNIFY phase (Phase 8):
1. **Read tasks.md** - Get verification steps for each task
2. **Run verification** - Execute test commands/manual checks
3. **Document results** - Pass/Fail for each AC in SUMMARY.md
4. **Block completion** - If any AC fails, task cannot be complete

---

## Checkpoint Types

When human interaction is needed during implementation, use these checkpoint types:

| Type | Frequency | Use Case |
|------|-----------|----------|
| `checkpoint:human-verify` | 90% | Agent completed work, human confirms |
| `checkpoint:decision` | 9% | Human makes architectural/tech choice |
| `checkpoint:human-action` | 1% | Truly unavoidable manual step (no CLI/API exists) |

### Golden Rule

> **If the agent CAN automate it, the agent MUST automate it.**

Before using `checkpoint:human-action`, verify:
1. No CLI command exists for the action
2. No API endpoint exists for the action
3. No script can be written to perform the action

### Checkpoint Format in tasks.md

```markdown
### Task 1.1: [Task Name]

**checkpoint:human-verify**

**What was built:**
- Responsive dashboard with sidebar navigation

**How to verify:**
1. Run: `npm run dev`
2. Visit: http://localhost:3000/dashboard
3. Check: Sidebar visible on desktop, hamburger menu on mobile

**Resume signal:**
Type "approved" or describe issues found
```

### Checkpoint Type Selection

```
┌─────────────────────────────────────────────────────────────┐
│ Does a CLI/API exist for this action?                       │
│     ↓ YES → Automate it (no checkpoint needed)              │
│     ↓ NO                                                    │
│ Is this a verification of completed work?                   │
│     ↓ YES → checkpoint:human-verify                         │
│     ↓ NO                                                    │
│ Is this a technical/architectural decision?                 │
│     ↓ YES → checkpoint:decision                             │
│     ↓ NO                                                    │
│ → checkpoint:human-action (truly unavoidable)               │
└─────────────────────────────────────────────────────────────┘
```

---

### Phase 4: VALIDATE

**Objective:** Verify implementation meets requirements.

**Checklist:**
- [ ] Execute automated tests, document results
- [ ] Manual verification if needed
- [ ] Test edge cases and error handling
- [ ] Verify performance metrics
- [ ] Log execution traces

**Critical:** Do not proceed until all issues resolved.

---

### Phase 5: CLEANUP

**Objective:** Automated code quality cleanup.

**Checklist:**
- [ ] Run formatter skill: `bun run .opencode/skills/formatter/router.ts cleanup`
- [ ] Verify: debug code removed, formatted, imports optimized, linting fixed
- [ ] Document manual fixes needed

**Critical:** Do not proceed until production-ready.

---

### Phase 6: REFLECT

**Objective:** Improve codebase and documentation.

**Checklist:**
- [ ] Refactor for maintainability
- [ ] Update all project documentation
- [ ] Identify improvements for backlog
- [ ] Auto-create technical debt issues

**Critical:** Do not close until documentation logged.

---

### Phase 7: HANDOFF

**Objective:** Package work for review and deployment.

**Checklist:**
- [ ] Generate executive summary (Compressed Decision Record)
- [ ] Prepare PR: summary, changelog, validation links
- [ ] Archive intermediate files to `.agent_work/`
- [ ] Document transition or completion

**Critical:** Do not consider complete until all steps finished.

---

### Phase 8: UNIFY (MANDATORY)

**Objective:** Reconcile plan vs. actual, document outcomes, close loop.

**Purpose (from PAUL framework):**
- Every plan must close with reconciliation (no orphan plans)
- Capture what was built vs. what was planned
- Log decisions made during execution
- Record deviations from plan
- Update project state (STATE.md)

**Mapping to PAUL Loop:**
- PLAN = Phase 1 (ANALYZE) + Phase 2 (DESIGN)
- APPLY = Phase 3 (IMPLEMENT) + Phase 4 (VALIDATE) + Phase 5 (CLEANUP)
- UNIFY = This Phase 8 (MANDATORY closure)

**Checklist:**
- [ ] **Compare planned vs. actual** (design.md vs. changes.md)
  - What was planned vs. what was built?
  - Any deviations? Document reasons.
- [ ] **Verify acceptance criteria** (from SPEC.md)
  - For each AC (AC-1, AC-2, AC-3...):
    - Read verification steps from tasks.md
    - Run verification (commands, tests, manual checks)
    - Document Pass/Fail in SUMMARY.md
  - If any AC fails: Do not mark task complete
- [ ] **Log decisions made during execution**
  - What decisions were made?
  - What was the rationale?
  - What impact do they have?
- [ ] **Log deviations from plan**
  - Planned: What was in design.md?
  - Actual: What was implemented?
  - Reason: Why did it differ?
- [ ] **Log deferred issues** (if any)
  - What issues were found but not addressed?
  - Effort estimate (S/M/L)?
  - When should it be revisited?
- [ ] **Create spec/{task-slug}/SUMMARY.md**
  - Use template: `.opencode/agents/tachikoma/templates/SUMMARY.md`
  - Include performance metrics, AC results, accomplishments, decisions, deviations
- [ ] **Update .opencode/STATE.md**
  - Status: Complete/Partial/Blocked
  - Last Activity: What was completed
  - Decisions: Add to Accumulated Context
  - Deferred Issues: Add if any
  - Performance Metrics: Update velocity
  - Session Continuity: Set next action
- [ ] **Update spec/{task-slug}/todo.md**
  - Mark all tasks as complete
  - Add completion timestamp

**Deliverables:**
- `spec/{task-slug}/SUMMARY.md` (from template)
- Updated `spec/{task-slug}/todo.md`
- Updated `.opencode/STATE.md`

**Critical:** UNIFY is MANDATORY. Every task must complete this phase.

---

## Documentation Templates

### Action Documentation
```
### [TYPE] - [ACTION] - [TIMESTAMP]
**Objective**: [Goal]
**Context**: [Current state, references]
**Decision**: [Approach and rationale]
**Execution**: [Steps, parameters, commands]
**Output**: [Results, logs, metrics]
**Validation**: [Success verification]
**Next**: [Continuation plan]
```

### Decision Record
```
### Decision - [TIMESTAMP]
**Decision**: [What was decided]
**Context**: [Situation and data]
**Options**: [Alternatives with pros/cons]
**Rationale**: [Why selected]
**Impact**: [Consequences]
**Review**: [Reassessment conditions]
```

### Summary Formats

**Streamlined Action Log:**
`[TYPE][TIMESTAMP] Goal: [X] → Action: [Y] → Result: [Z] → Next: [W]`

**Compressed Decision Record:**
`Decision: [X] | Rationale: [Y] | Impact: [Z] | Review: [Date]`

---

## Technical Debt Auto-Tracking

### Auto-Issue Template
```
**Title**: [Technical Debt] - [Description]
**Priority**: High/Medium/Low
**Location**: [File paths, line numbers]
**Reason**: [Why debt incurred]
**Impact**: [Consequences]
**Remediation**: [Resolution steps]
**Effort**: S/M/L
```

---

## EARS Notation Reference

| Type | Format |
|------|--------|
| **Ubiquitous** | `THE SYSTEM SHALL [behavior]` |
| **Event-driven** | `WHEN [trigger] THE SYSTEM SHALL [behavior]` |
| **State-driven** | `WHILE [state] THE SYSTEM SHALL [behavior]` |
| **Unwanted** | `IF [condition] THEN THE SYSTEM SHALL [response]` |
| **Optional** | `WHERE [feature] THE SYSTEM SHALL [behavior]` |

---

## Troubleshooting Protocol

1. **Re-analyze** → Confirm requirements
2. **Re-design** → Update technical design
3. **Re-plan** → Adjust implementation plan
4. **Retry** → Re-execute with corrections
5. **Escalate** → If persists after retries

**Critical:** Never proceed with unresolved errors.

---

## When to Use

**Use when:**
- Multi-phase development projects
- Features requiring systematic validation
- Production-grade software with quality gates

**Skip when:**
- Quick prototypes or spike research
- Simple bug fixes
- Single-file edits
