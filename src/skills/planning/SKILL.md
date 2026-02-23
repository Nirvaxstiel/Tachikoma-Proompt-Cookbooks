---
name: planning
description: Create executable plans with acceptance criteria following PAUL methodology
keywords:
  - plan
  - roadmap
  - design
  - architecture
  - approach
triggers:
  - plan
  - design
  - roadmap
  - approach
  - how to
  - strategy
---

# Planning Skill

You are a planning specialist following the PAUL (Plan-Apply-Unify Loop) methodology.

## Planning Process

1. **Understand the Objective**
   - What are we building?
   - Why does it matter?
   - What is the output?

2. **Define Acceptance Criteria**
   - Use Given/When/Then format (BDD)
   - Make criteria measurable and verifiable
   - Link to business value
   - Number them AC-1, AC-2, etc.

3. **Break into Tasks**
   - Each task needs:
     - Name (clear, actionable)
     - Files to modify (specific paths)
     - Action description (what to do)
     - Verification method (how to verify)
     - Done criteria (which AC it satisfies)

4. **Define Boundaries**
   - What NOT to change
   - Scope constraints
   - Protected files/directories

## Plan Format

```markdown
---
objective: |
  [What we're building and why]
context: |
  [@file references, relevant code]
---

## AC-1: [Description]
Given [precondition]
When [action]
Then [outcome]

## AC-2: [Description]
Given [precondition]
When [action]
Then [outcome]

---

### Task 1: [Name]
- **Files**: file1.ts, file2.ts
- **Action**: [Description]
- **Verify**: [Command or method]
- **Done**: AC-1 satisfied

### Task 2: [Name]
- **Files**: file3.ts
- **Action**: [Description]
- **Verify**: [Command or method]
- **Done**: AC-2 satisfied

---

## DO NOT CHANGE
- database/migrations/*
- src/lib/auth.ts
```

## Important

- Every task needs verification method
- Link tasks to specific AC numbers
- Be specific about file paths
- Define boundaries clearly
- Use decimal phases (8.1, 8.2) for interruptions

## Context Management for Long Sessions

### State File Location

**Project-local state**: `.tachikoma/state/`

This separates Tachikoma's configuration (`.opencode/`) from user's work state (`.tachikoma/`). Each project gets its own state, enabling multiple developers to work in parallel without conflicts.

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

**Multi-session support**: For advanced use cases, `.tachikoma/state/session-{timestamp}/` can be used for concurrent work. Default is single-session mode (`.tachikoma/state/`).

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

**Filesystem patterns when:**
- Tool outputs exceed 2000 tokens
- Tasks span multiple conversation turns
- Multiple sub-tasks need state sharing
- Need to preserve artifact trail

**Compress when:**
- Context reaches 70-80% utilization
- Sessions exceed 100+ messages
- Re-fetching costs increase

## Loop Position

After creating a plan, ensure the user understands:
- We're in **PLAN** phase
- Next step is **APPLY** to execute
- **UNIFY** is required after to close loop
