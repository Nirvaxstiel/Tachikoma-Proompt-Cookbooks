---
description: Show current progress with ONE next action
subtask: true
---

<objective>
Show current project state and suggest exactly ONE next action.

Read STATE.md and provide:
1. Current position (task, phase, status)
2. Active blockers or boundaries (if any)
3. Performance metrics summary
4. ONE recommended next action

Following PAUL's philosophy: Reduce decision fatigue by suggesting ONE next action.
</objective>

<workflow>

## Step 1: Read STATE.md

Read `.opencode/STATE.md` to understand:
- Current Position (task, phase, status)
- Loop Position (where in workflow)
- Active Boundaries
- Blockers/Concerns
- Session Continuity (next action)

## Step 2: Check for Active Task

If a task slug is set, check `.opencode/agents/tachikoma/spec/{slug}/` for:
- todo.md progress
- Any blockers noted

## Step 3: Determine ONE Next Action

Based on status:

| Status | Suggested Action |
|--------|------------------|
| Planning | Continue with SPEC.md or design.md |
| Executing | Continue tasks in tasks.md |
| Validating | Run verification steps |
| Blocked | Address blocker from Blockers section |
| Complete | Start new task or review SUMMARY.md |

## Step 4: Output Format

```
========================================
Tachikoma Progress
========================================

Current Position
Task: {task-slug}
Phase: {phase}
Status: {status}

Last Activity:
{last activity line}

Active Boundaries: (if any)
- {boundary 1}
- {boundary 2}

========================================
Recommended Next Action
========================================

{ONE specific action to take}

Related Commands:
  /tachikoma:help    Show all commands
  /tachikoma:status  Quick state view
  /tachikoma:unify   Close current task
```

</workflow>

<important>
- Always suggest exactly ONE action
- If blocked, explain the blocker clearly
- If complete, suggest what to do next
- Keep output concise (under 50 lines)
</important>
