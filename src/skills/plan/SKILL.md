---
name: plan
description: Create executable plans with PAUL methodology - Plan-Apply-Unify Loop with mandatory closure
keywords:
  - plan
  - roadmap
  - design
  - architecture
  - approach
  - paul
  - methodology
  - acceptance criteria
triggers:
  - plan
  - design
  - roadmap
  - approach
  - how to
  - strategy
  - acceptance criteria
  - when/then/given
---

# Planning with Plan Methodology

You are executing the Plan (Plan-Apply-Unify) methodology for structured development.

## Core Principle

Plan is a three-phase loop that **never skips Unify** — this is heartbeat that prevents drift and ensures consistency.

## The Three Phases

### 1. PLAN Phase

**Objective**: Define what "done" means before starting.

**Requirements**:
- Clear objective statement
- Acceptance criteria in Given/When/Then format
- Explicit boundaries (what's in scope, what's out)
- Task breakdown with verification steps
- Link each task to acceptance criteria (AC-1, AC-2, etc.)

**Output**: Create `.tachikoma/state/phases/PLAN-{id}.md`

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

**CRITICAL**: This phase is **never optional** — must always complete after APPLY.

**Requirements**:
- Create `.tachikoma/state/phases/SUMMARY-{id}.md`
- Update `.tachikoma/state/STATE.md` with loop position
- Document what was actually done vs planned
- Note any decisions made during execution
- Flag unresolved issues for next loop

**Output Format**:
```
# Summary {id}

## Objective
{original objective from PLAN}

## Acceptance Criteria Status
- AC-1: {description}
- AC-2: {description}
- AC-3: {description} - {issue}

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

The `.tachikoma/state/STATE.md` file tracks loop position:

```markdown
---
loop_position: {PLAN|APPLY|UNIFY}
current_plan: {plan-id or none}
last_summary: {summary-id or none}
---

# Plan State

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

## Context Management for Long Sessions

### State File Location

**Project-local state**: `.tachikoma/state/`

Separates Tachikoma's configuration (`.opencode/`) from user's work state (`.tachikoma/`). Each project gets its own state, enabling multiple developers to work in parallel.

### State Structure
```
.tachikoma/
  ├── state/
  │   ├── STATE.md           # Current task state, AC status, files modified
  │   ├── plan.md            # Original plan from planning phase
  │   ├── summary.md         # Summary from UNIFY phase
  │   └── artifacts/         # Intermediate files, test results, research findings
  └── .active-session      # Single session mode (default)
```

### Context Compression

When sessions grow long, compress at 70-80% context utilization:

- **Metric**: Optimize for tokens-per-task, not tokens-per-request
- **Structure**: Include sections for files modified, decisions, next steps
- **Method**: Summarize new content, merge with existing (don't regenerate)
- **Trigger**: Compress when approaching context limits

### Filesystem Patterns

For long-running tasks, use filesystem for context:

- **Large tool outputs** (>2000 tokens): Write to `.tachikoma/state/artifacts/`, return summary + reference
- **Plan persistence**: Store plans in `.tachikoma/state/plan.md`
- **State tracking**: Update `.tachikoma/state/STATE.md` after each task

### When to Use

**Filesystem patterns when**:
- Tool outputs exceed 2000 tokens
- Tasks span multiple conversation turns
- Multiple sub-tasks need state sharing
- Need to preserve artifact trail

**Compress when**:
- Context reaches 70-80% utilization
- Sessions exceed 100+ messages
- Re-fetching costs increase

## Loop Position

After creating a plan, ensure to user understands:
- We're in **PLAN** phase
- Next step is **APPLY** to execute
- **UNIFY** is required after to close loop

## Common Patterns

### When User Says

- "Plan this feature" → Use Plan methodology
- "Create a roadmap" → Use Plan methodology
- "Design an approach" → Use Plan methodology
- "What's the plan?" → Check STATE.md
- "Are we done?" → Check if UNIFY completed

### Red Flags:

- "Just implement it" → Missing PLAN phase
- "Skip verification, it's fine" → Violates Plan methodology
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

A Plan loop is complete when:
1. PLAN created with AC and boundaries
2. APPLY completed with verification
3. UNIFY completed with summary
4. STATE.md updated to "UNIFY"

**Never stop at APPLY - always UNIFY.**

---

*Plan ensures structured development with explicit "done" criteria, preventing scope creep and ensuring quality.*
