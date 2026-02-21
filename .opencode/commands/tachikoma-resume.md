---
description: Continue from handoff document
subtask: true
---

<objective>
Resume work from a handoff document or STATE.md.

Restores context and suggests exactly ONE next action.
</objective>

<workflow>

## Step 1: Find Handoff

Check for handoff documents:
```bash
ls -t .opencode/agents/tachikoma/handoffs/HANDOFF-*.md 2>/dev/null | head -1
```

If no handoff, read STATE.md directly.

---

## Step 2: Display Handoff Context

Show the handoff document contents:
- Current state
- What was accomplished
- In progress items
- Key decisions
- Current blockers
- Next action

---

## Step 3: Cross-Reference with STATE.md

Read `.opencode/STATE.md` to check:
- Is the state still accurate?
- Any new blockers?
- Any completed items?

---

## Step 4: Determine Next Action

From handoff's "Next Action" section, or from STATE.md Session Continuity.

Verify the action is still valid:
- Has the task been completed by someone else?
- Are there new blockers?
- Is the file/location still relevant?

---

## Step 5: Output Format

```
========================================
Session Resumed
========================================

From Handoff: .opencode/agents/tachikoma/handoffs/HANDOFF-{date}.md
(or STATE.md if no handoff)

Last Session:
  Task: {slug}
  Status: {status}
  
What Was Accomplished:
  - {item 1}
  - {item 2}

In Progress:
  {what was being worked on}

Key Decisions:
  - {decision 1}

Current Blockers: (if any)
  - {blocker 1}

========================================
Recommended Next Action
========================================

{ONE specific action to take}

This is from your handoff's "Next Action" section.
If this is no longer accurate, check STATE.md.

========================================

Ready to continue. Your context is restored.
```

---

## Step 6: Archive Handoff (Optional)

If handoff was used and work is continuing, move it to archive:
```bash
mkdir -p .opencode/agents/tachikoma/handoffs/archive
mv .opencode/agents/tachikoma/handoffs/HANDOFF-{date}.md .opencode/agents/tachikoma/handoffs/archive/
```

</workflow>

<important>
- Always show the ONE next action clearly
- Handoff should be self-contained for reading
- Check if state is still current
</important>
