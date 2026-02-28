# Plan Methodology

**Plan-Apply-Unify Loop** — Structured AI-assisted development for quality and consistency.

## Overview

Plan is a structured development framework that ensures systematic execution with mandatory loop closure.

Plan fixes three key problems with AI-assisted development:

1. **Loop integrity** — Every plan closes with Unify. No orphan plans. Unify reconciles what was planned vs what happened, updates state, logs decisions.
2. **In-session context** — Subagents are expensive (~2,000-3,000 token launch cost) and produce lower quality for implementation work. Plan keeps development in-session with properly managed context.
3. **Acceptance-driven development** — Acceptance criteria are first-class citizens. Define done before starting. Every task references its AC. BDD format: `Given [precondition] / When [action] / Then [outcome]`.

## The Three Phases

### 1. PLAN

Define approach before execution.

**Components**:

- **Objective** — What you're building and why
- **Acceptance Criteria** — Given/When/Then definitions of done (AC-1, AC-2, etc.)
- **Tasks** — Specific actions with files, verification, done criteria
- **Boundaries** — What NOT to change (hard constraints)

**Example**:

```markdown
## PLAN

### Objective

Create a REST API endpoint for user authentication

### Acceptance Criteria

## AC-1: Feature Works

- Given a valid username and password
- When POST to `/api/auth/login`
- Then receive JWT token and 200 status

## AC-2: Error Handling

- Given invalid credentials
- When POST to `/api/auth/login`
- Then return 401 status
```

### 2. APPLY

Execute tasks sequentially with verification.

**Components**:

- Execute tasks in order defined in PLAN
- Verify each task against acceptance criteria
- Track deviations from original plan
- Log decisions made during execution

**Process**:

For each task:
1. Read task definition from PLAN
2. Implement the action
3. Verify against AC
4. Mark as done or flag issue
5. Document any deviations

**Never**: Skip ahead without verification, assume tasks are done

### 3. UNIFY ← Never skip!

Reconcile and close loop.

**Components**:

- Create summary of what was actually done vs planned
- Update `.tachikoma/state/STATE.md` with loop position
- Document key decisions
- Flag unresolved issues

**Why Never Skip UNIFY**:

This is the heartbeat that prevents drift. Without UNIFY:
- Plans can be left incomplete
- State becomes inconsistent
- No record of decisions
- Next iteration lacks context

## File System Structure

Plan uses a `.tachikoma/` directory:

```text
.tachikoma/
├── STATE.md               # Current loop position and plan ID
├── phases/
│   ├── PLAN-{id}.md     # Plan documents
│   └── SUMMARY-{id}.md  # Summary documents
└── artifacts/            # Intermediate outputs
```

## Commands Reference

| Command | Description |
| -------- | ----------- |
| `/plan:init` | Initialize Plan in a project |
| `/plan:create` | Create an executable plan |
| `/plan:apply` | Execute an approved plan |
| `/plan:unify` | Reconcile and close loop |
| `/plan:progress` | Smart status + ONE next action |
| `/plan:resume` | Restore context and continue |
| `/plan:pause` | Create handoff for session break |

## Usage Workflow

### Starting a New Feature

1. **Initialize** Plan in project
   ```
   /plan:init
   ```

2. **Create plan** with objectives and acceptance criteria
   ```
   /plan:create "Add user authentication"
   ```

3. **Review plan** - Confirm tasks and AC are correct

4. **Execute plan** - Run tasks with verification
   ```
   /plan:apply
   ```

5. **Unify loop** - Create summary, update state
   ```
   /plan:unify
   ```

### Checking Status

```
/plan:progress
```

**Output**:

```
Current Phase: APPLY
Active Plan: PLAN-20240228-001

Tasks (3/5 complete):
  Task 1: Create authentication handler ✓
  Task 2: JWT generation ✓
  Task 3: Add tests to validate auth →

Next Action: /plan:apply (Task 3)
```

### Resuming After Break

```
/plan:resume
```

**Output**:

```
Restoring Plan session...

Current Phase: APPLY
Active Plan: PLAN-20240228-001

Tasks Completed (2/5):
  Task 1: Create authentication handler ✓
  Task 2: Implement JWT generation ✓

Next Action: /plan:apply (Task 3)
```

## Integration with Tachikoma Skills

Plan integrates with Tachikoma's core skills:

### plan Skill

- **PLAN phase**: Structured planning with AC
- **APPLY phase**: Execution with verification
- **UNIFY phase**: Loop closure and summaries

### dev Skill

- **Task execution**: Implementation with built-in verification
- **Refactoring**: Code improvements with GVR pattern
- **Testing**: Test execution and validation

### context Skill

- **Research**: Understanding existing codebase
- **Documentation**: External API references
- **State persistence**: Plan and artifact management

## Common Patterns

### When User Says

- "Plan this feature" → Use Plan methodology
- "What's the plan?" → Check STATE.md
- "Are we done?" → Check if UNIFY completed
- "Continue" → Resume from saved state

### Red Flags

- "Just implement it" → Missing PLAN phase
- "Skip verification, it's fine" → Violates Plan methodology
- "We're done" without UNIFY → Incomplete loop
- Moving to next task without verification → Violates APPLY phase

## Research Backing

Plan is based on verification loop research:

- **Verification Loops** (arXiv:2602.10177)
  - Generator-Verifier-Reviser pattern achieves 90% on math proofs vs 67% base
  - Key insight: Separate concerns for generation and verification

[Learn more →](../research/verification-loops.md)

## Best Practices

### For Planning

1. **Start with "why"** — Understand business value before planning
2. **Make AC testable** — Each criterion should be verifiable
3. **Be specific with boundaries** — Explicitly state what NOT to do
4. **Estimate complexity** — Each task should have time estimate
5. **Define "done" clearly** — No ambiguity about completion

### For Execution

1. **Follow the plan** — Execute tasks in defined order
2. **Verify each step** — Don't assume, confirm with tests
3. **Log deviations** — Document changes from original plan
4. **Mark completion** — Only mark done when verified

### For Unification

1. **Never skip UNIFY** — This is the critical heartbeat
2. **Document decisions** — Record why changes were made
3. **Flag blockers** — Identify what prevents next steps
4. **Create clear next actions** — What should happen next loop

## Troubleshooting

### Common Issues

**Issue**: UNIFY phase forgotten

**Fix**: Run `/plan:unify` to close loop before starting next plan

**Issue**: Tasks failing verification

**Fix**: Review acceptance criteria, adjust plan with `/plan:apply`

**Issue**: Lost context after session break

**Fix**: Use `/plan:resume` to restore state

**Issue**: STATE.md inconsistent

**Fix**: Check loop_position matches actual phase, correct if needed

## Examples

### Example 1: API Feature

**PLAN**:

```
Objective: Add user authentication API

AC-1: Given no auth, When POST /auth/login, Then returns JWT
AC-2: Given expired JWT, When access protected route, Then returns 401

Tasks:
1. Create authentication handler
2. Implement JWT generation/validation
3. Add authentication tests
4. Update API documentation

Boundaries:
- DO NOT CHANGE: Database schema, User model
```

**APPLY**:

```
Task 1: Create authentication handler ✓
Task 2: Implement JWT generation ✓
Task 3: Add authentication tests ✓
Task 4: Update API documentation ✓
```

**UNIFY**:

```
Summary: Auth API implemented
AC Status: AC-1 ✓, AC-2 ✓
Deviations: None
Next: Deploy to staging
```

## See Also

- [Skill Execution](./skill-execution.md) — Individual skill usage
- [Skill Chains](./skill-chains.md) — Multi-skill orchestration
- [Verification Loops](../research/verification-loops.md) — Research backing
