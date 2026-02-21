---
description: Show Tachikoma commands and workflow guide
subtask: true
---

<objective>
Display the complete Tachikoma command reference.

Output ONLY the reference content below. Do NOT add project-specific analysis, git status, or next-step suggestions.
</objective>

<reference>
# Tachikoma Command Reference

**Tachikoma** is an opinionated AI development orchestrator built on structured workflows, state management, and skill-based execution.

## The Loop

Every unit of work follows this cycle:

```
┌──────────────────────────────────────────────────────┐
│  ANALYZE ──▶ DESIGN ──▶ IMPLEMENT ──▶ VALIDATE ──▶   │
│                    UNIFY                              │
│                                                      │
│  Classify    Plan       Execute      Verify      Close│
└──────────────────────────────────────────────────────┘
```

**Never skip UNIFY.** Every task needs closure.

## Quick Start

1. `/tachikoma-progress` - Check where you are
2. `/tachikoma-help` - Show this reference
3. `/tachikoma-unify <task-slug> <duration>` - Close a task
4. `/tachikoma-pause` - Create handoff for break
5. `/tachikoma-resume` - Continue from handoff

## Commands Overview

| Command | Purpose |
|---------|---------|
| `/tachikoma-help` | Show command reference |
| `/tachikoma-progress` | Current state + ONE next action |
| `/tachikoma-status` | Quick STATE.md view |
| `/tachikoma-unify` | Mandatory loop closure |
| `/tachikoma-pause` | Create handoff for break |
| `/tachikoma-resume` | Continue from handoff |

---

## Core Commands

### `/tachikoma-help`
Show this command reference.

Usage: `/tachikoma-help`

---

### `/tachikoma-progress`
Smart status with routing - suggests ONE next action.

- Reads STATE.md for current position
- Shows milestone and task progress
- Suggests exactly ONE next action (prevents decision fatigue)
- Accepts optional context to tailor suggestion

Usage: `/tachikoma-progress`
Usage: `/tachikoma-progress "I only have 30 minutes"`

---

### `/tachikoma-status`
Quick view of STATE.md - shows current position without suggestions.

Usage: `/tachikoma-status`

---

### `/tachikoma-unify <task-slug> <duration>`
Reconcile plan vs actual and close the loop.

- Compares planned (design.md) vs actual (changes)
- Verifies acceptance criteria (Pass/Fail)
- Creates SUMMARY.md documenting what was built
- Updates STATE.md with loop closure
- **Required** - never skip this step

Usage: `/tachikoma-unify add-auth 45`

---

### `/tachikoma-pause [reason]`
Create handoff file and prepare for session break.

- Creates HANDOFF-{date}.md with complete context
- Updates STATE.md session continuity section
- Designed for context limits or multi-session work

Usage: `/tachikoma-pause`
Usage: `/tachikoma-pause "switching to other project"`

---

### `/tachikoma-resume [handoff-path]`
Restore context from handoff and continue work.

- Reads STATE.md and any HANDOFF files
- Determines current loop position
- Suggests exactly ONE next action

Usage: `/tachikoma-resume`

---

## Shell Tools

These are shell scripts for programmatic use:

| Script | Purpose |
|--------|---------|
| `spec-setup.sh <task-name>` | Create task spec folder |
| `state-update.sh <command>` | Manage STATE.md |
| `unify-phase.sh <slug> <duration>` | Run UNIFY phase |
| `pause-handoff.sh` | Create handoff |
| `resume-handoff.sh` | Resume from handoff |
| `tachi-progress.sh` | Progress (shell version) |
| `tachi-help.sh` | Help (shell version) |

---

## Files & Structure

```
.opencode/
├── STATE.md           # Project state (single source of truth)
├── spec/
│   └── {task-slug}/
│       ├── todo.md       # Progress tracking
│       ├── SPEC.md       # Requirements + BDD AC
│       ├── design.md     # Architecture/plan
│       ├── tasks.md      # Task breakdown
│       ├── boundaries.md # Protected files
│       ├── SUMMARY.md    # Created by UNIFY
│       └── reports/      # Generated artifacts
├── command/           # Slash commands (this)
├── skills/            # Capability modules
├── agents/            # Agent definitions
├── context-modules/   # Foundational knowledge
├── templates/         # Templates (SUMMARY.md, etc.)
└── handoffs/          # Handoff documents
```

---

## Common Workflows

**Starting a task:**
```
bash .opencode/agents/tachikoma/tools/spec-setup.sh "add feature"
# Fill in SPEC.md with requirements
# Work on task...
/tachikoma-unify add-feature 60
```

**Checking where you are:**
```
/tachikoma-progress
```

**Resuming work (new session):**
```
/tachikoma-resume
```

**Pausing work (before break):**
```
/tachikoma-pause "need to context switch"
```

---

## Key Principles

1. **Loop must complete** - Every task needs UNIFY
2. **State is tracked** - STATE.md knows where you are
3. **Boundaries are real** - Respect DO NOT CHANGE sections
4. **Acceptance criteria first** - Define done before starting
5. **Structure at start, freedom at end** - Follow phases, then reflect

---

## Philosophy

Tachikoma is an **opinionated agent** built on paradigms from:
- **PAUL** (Plan-Apply-Unify Loop) - State management, loop enforcement
- **OpenCode** - Intent routing, skill modularity
- **RLM** (Recursive Language Model) - Large context processing

It integrates and reshapes these concepts into a cohesive workflow that prioritizes:
- Single source of truth (STATE.md)
- Mandatory closure (UNIFY)
- Verifiable quality (BDD acceptance criteria)
- Zero-context resumption (handoffs)

---

*Tachikoma Framework v3.5+ | 6 commands | Built on PAUL + OpenCode*
</reference>
