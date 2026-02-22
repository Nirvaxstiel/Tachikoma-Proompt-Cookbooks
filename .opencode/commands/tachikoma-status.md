---
description: Quick view of STATE.md without suggestions
subtask: true
---

<objective>
Display the current STATE.md contents in a quick, readable format.

Unlike /tachikoma:progress, this shows raw state without analysis or suggestions.
</objective>

<workflow>

## Step 1: Read STATE.md

Read `.opencode/STATE.md` completely.

## Step 2: Output Key Sections

Display:

1. Current Position (task, phase, status, last activity)
2. Loop Position (visual workflow state)
3. Any Active Boundaries
4. Any Active Blockers
5. Session Continuity (next action)

## Step 3: Format

```
========================================
Project State
========================================

Position: {task} | {phase} | {status}
Last Activity: {timestamp} - {what}

Loop:
ANALYZE ──▶ DESIGN ──▶ IMPLEMENT ──▶ VALIDATE ──▶ CLEANUP
  {markers showing position}

Boundaries: {none or list}
Blockers: {none or list}

Next Action: {from session continuity}

========================================
```

</workflow>
