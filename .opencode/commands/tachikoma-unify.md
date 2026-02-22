---
description: Mandatory loop closure - reconcile plan vs actual
subtask: true
---

<objective>
Execute the UNIFY phase to close a task loop.

UNIFY is MANDATORY for every task. It:

1. Compares planned vs actual
2. Verifies acceptance criteria
3. Creates SUMMARY.md
4. Updates STATE.md
5. Closes the loop
   </objective>

<workflow>

## Input Required

The user must provide:

- `task-slug`: The task identifier (from spec-setup)
- `duration`: How long the task took (in minutes)

Usage: `/tachikoma:unify add-auth 45`

---

## Step 1: Compare Planned vs. Actual

Read:

- `.opencode/agents/tachikoma/spec/{slug}/design.md` - What was planned
- `.opencode/agents/tachikoma/spec/{slug}/tasks.md` - Task breakdown
- Check git status for actual changes

Document:

- What was planned
- What was actually built
- Any deviations and reasons

---

## Step 2: Verify Acceptance Criteria

Read `.opencode/agents/tachikoma/spec/{slug}/SPEC.md` for BDD acceptance criteria.

For each AC (AC-1, AC-2, AC-3...):

1. Run verification steps if available
2. Document Pass/Fail
3. If any AC fails: Do NOT mark task complete

---

## Step 3: Create SUMMARY.md

Use template: `.opencode/agents/tachikoma/templates/SUMMARY.md`

Create `.opencode/agents/tachikoma/spec/{slug}/SUMMARY.md` with:

- Performance metrics (duration, timestamps)
- Acceptance criteria results (Pass/Fail)
- Accomplishments (what was built)
- Decisions made (with rationale)
- Deviations from plan (with reasons)
- Issues deferred (with revisit triggers)
- Files created/modified

---

## Step 4: Update STATE.md

Run the state update:

```bash
bun run .opencode/cli/state-update.ts complete-task "{slug}" "{duration}"
```

Also manually add:

- Decisions to Accumulated Context
- Deferred issues if any
- Update Session Continuity

---

## Step 5: Update todo.md

Mark all tasks complete in `.opencode/agents/tachikoma/spec/{slug}/todo.md`
Add completion timestamp

---

## Output Format

```
========================================
UNIFY Phase Complete
========================================

Task: {slug}
Status: Complete / Partial
Duration: {duration} minutes

Acceptance Criteria:
  AC-1: Pass - {notes}
  AC-2: Pass - {notes}
  AC-3: Pass - {notes}

Files created:
  ├── SUMMARY.md
  ├── STATE.md (updated)
  └── todo.md (updated)

Review SUMMARY.md: .opencode/agents/tachikoma/spec/{slug}/SUMMARY.md
Review STATE.md: .opencode/STATE.md
```

</workflow>

<critical>
- UNIFY is MANDATORY - never skip
- If any AC fails, status is Partial, not Complete
- Always update STATE.md
- Always create SUMMARY.md
</critical>
