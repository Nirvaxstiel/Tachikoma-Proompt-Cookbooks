---
description: Create handoff for session break
subtask: true
---

<objective>
Create a comprehensive handoff document for session breaks.

Use when:
- Context limits approaching
- Switching to another project
- Ending work session
- Need to preserve state for later

The handoff enables zero-context resumption.
</objective>

<workflow>

## Step 1: Read Current State

Read:
- `.opencode/STATE.md` - Current position
- `.opencode/spec/{slug}/SPEC.md` - Current task requirements (if task active)
- `.opencode/spec/{slug}/tasks.md` - Task progress (if task active)

---

## Step 2: Create Handoff Document

Create `.opencode/handoffs/HANDOFF-{date}.md` with:

```markdown
# Handoff: {timestamp}

## Current State

**Task**: {slug}
**Phase**: {phase}
**Status**: {status}
**Loop Position**: {workflow markers}

---

## This Session

**Started**: {timestamp}
**What was accomplished**:
- {accomplishment 1}
- {accomplishment 2}

---

## In Progress

- {what's currently being worked on}
- {current step in workflow}

---

## Key Decisions

- {decision 1 with rationale}
- {decision 2 with rationale}

---

## Current Blockers

- {blocker 1 with resolution path}

---

## Next Action

{EXACT next action to take when resuming}

Be specific: "Continue with Task 1.2 in tasks.md - implement the auth middleware"

---

## Resume Context

Key information needed to continue:
- {context 1}
- {context 2}

---

## Files Modified This Session

- `{file 1}`: {what changed}
- `{file 2}`: {what changed}

---

*Handoff created: {timestamp}*
*Resume with: /tachikoma:resume*
```

---

## Step 3: Update STATE.md

Update Session Continuity section:
```markdown
## Session Continuity

**Last session**: {timestamp}
**Stopped at**: {what was happening}
**Next action**: {next action}
**Resume context**: {key info}

**Handoff**: .opencode/handoffs/HANDOFF-{date}.md
```

---

## Output Format

```
========================================
Handoff Created
========================================

File: .opencode/handoffs/HANDOFF-{date}.md

Current Position:
  Task: {slug}
  Status: {status}

Next Action When Resuming:
  {exact next action}

To Resume:
  /tachikoma:resume

========================================
```

</workflow>

<important>
- Handoff should be self-contained (readable with no prior context)
- Next action should be EXACT and SPECIFIC
- Update STATE.md session continuity
</important>
