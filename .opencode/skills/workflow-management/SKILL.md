---
name: workflow-management
description: Production-grade 7-phase development workflow with quality gates, confidence-based adaptation, and automated technical debt tracking.
version: 2.1.0
author: tachikoma
type: skill
category: development
tags:
  - workflow
  - process
  - quality-gates
---

# Spec-Driven Workflow Management

**Core Philosophy:** Never skip phases. Each phase must complete before proceeding.

---

## 7-Phase Workflow

### Phase 1: ANALYZE

**Objective:** Understand problem, produce testable requirements.

**Checklist:**
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

**Objective:** Write production-quality code.

**Checklist:**
- [ ] Code in small, testable increments
- [ ] Implement from dependencies upward
- [ ] Follow conventions, document deviations
- [ ] Add meaningful comments (focus on "why")
- [ ] Update task status in real time

**Critical:** Do not merge until all steps documented and tested.

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
- [ ] Run formatter skill: `bash .opencode/skills/formatter/router.sh cleanup`
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
