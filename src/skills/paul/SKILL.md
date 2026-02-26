---
name: paul
description: PAUL Framework - Plan-Apply-Unify Loop for structured development with mandatory loop closure
keywords:
  - plan
  - apply
  - unify
  - loop
  - methodology
  - structured
  - ac
  - acceptance criteria
triggers:
  - plan
  - create a plan
  - design approach
  - roadmap
  - acceptance criteria
  - when/then/given
---

# PAUL Framework

You are executing the PAUL (Plan-Apply-Unify) methodology for structured development.

## Core Principle

PAUL is a three-phase loop that **never skips UNIFY** - this is the heartbeat that prevents drift and ensures consistency.

## The Three Phases

### 1. PLAN Phase

**Objective**: Define what "done" means before starting.

**Requirements**:
- Clear objective statement
- Acceptance criteria in Given/When/Then format
- Explicit boundaries (what's in scope, what's out)
- Task breakdown with verification steps
- Link each task to acceptance criteria (AC-1, AC-2, etc.)

**Output**: Create `.paul/phases/PLAN-{id}.md`

```
---
phase: {phase}
plan: {plan}
type: execute
autonomous: true
---

<objective>
{clear objective}
</objective>

<context>
{relevant context, constraints, assumptions}
</context>

<acceptance_criteria>
AC-1: Given {precondition}, When {action}, Then {expected outcome}
AC-2: Given {precondition}, When {action}, Then {expected outcome}
...
</acceptance_criteria>

<tasks>
<task type="auto">
  <name>{task name}</name>
  <files>{affected files}</files>
  <action>{what to do}</action>
  <verify>{how to verify}</verify>
  <done>{completion criteria}</done>
</task>
...
</tasks>

<boundaries>
- {boundary 1}
- {boundary 2}
...
</boundaries>
```

### 2. APPLY Phase

**Objective**: Execute tasks sequentially, each with verification.

**Requirements**:
- Execute tasks in order defined in PLAN
- Verify each task against acceptance criteria before moving to next
- Mark tasks as done only when verified
- Track any deviations from original plan
- Do not skip verification steps

**Process**:
For each task:
1. Read task definition from PLAN
2. Implement the action
3. Verify against AC
4. Mark as done or flag issue
5. Document any deviations

**Never**: Skip ahead without verification, assume tasks are done

### 3. UNIFY Phase

**Objective**: Reconcile plan vs actual, create summary, update state.

**CRITICAL**: This phase is **never optional** - must always complete after APPLY.

**Requirements**:
- Create `.paul/phases/SUMMARY-{id}.md`
- Update `.paul/STATE.md` with loop position
- Document what was actually done vs planned
- Note any decisions made during execution
- Flag unresolved issues for next loop

**Output Format**:
```
# Summary {id}

## Objective
{original objective from PLAN}

## Acceptance Criteria Status
- ✅ AC-1: {description}
- ✅ AC-2: {description}
- ⚠️  AC-3: {description} - {issue}

## Tasks Completed
1. Task 1 - Status
2. Task 2 - Status

## Deviations
{list of any deviations from plan}

## Key Decisions
{important decisions made during execution}

## Unresolved Issues
{issues to address in next loop}

## Next Steps
{actions for follow-up or next loop}
```

## State Management

The `.paul/STATE.md` file tracks loop position:

```markdown
---
loop_position: {PLAN|APPLY|UNIFY}
current_plan: {plan-id or none}
last_summary: {summary-id or none}
---

# PAUL State

Current phase: {PLAN|APPLY|UNIFY}
```

**Rules**:
- Only PLAN when loop_position is "none" or "UNIFY"
- Only APPLY when loop_position is "PLAN"
- Only UNIFY when loop_position is "APPLY"
- Never skip UNIFY

## Quality Gates

### Required Before Phase Transitions:

**PLAN → APPLY**:
- All AC documented
- At least 1 task defined
- Boundaries specified
- Verification steps included

**APPLY → UNIFY**:
- All tasks executed or documented why not
- All tasks verified against AC
- Deviations documented

**UNIFY → Next Loop**:
- SUMMARY.md created
- STATE.md updated to "UNIFY"
- No blocking issues unresolved

## Common Patterns

### When User Says:
- "Plan this feature" → Use PAUL methodology
- "Create a roadmap" → Use PAUL methodology
- "Design an approach" → Use PAUL methodology
- "What's the plan?" → Check STATE.md
- "Are we done?" → Check if UNIFY completed

### Red Flags:
- "Just implement it" → Missing PLAN phase
- "Skip verification, it's fine" → Violates PAUL methodology
- "We're done" without UNIFY → Incomplete loop
- Moving to next task without verification → Violates APPLY phase

## Integration with OpenCode

When working on a task:
1. Use `glob` and `grep` to find existing patterns
2. Use `read` to understand current state
3. Use `write`/`edit` to make changes
4. Use `bash` to run tests/verification
5. Always verify before moving to next task
6. Complete UNIFY before considering work done

## Success Criteria

A PAUL loop is complete when:
1. ✅ PLAN created with AC and boundaries
2. ✅ APPLY completed with verification
3. ✅ UNIFY completed with summary
4. ✅ STATE.md updated to "UNIFY"

**Never stop at APPLY - always UNIFY.**

---

*PAUL ensures structured development with explicit "done" criteria, preventing scope creep and ensuring quality.*
