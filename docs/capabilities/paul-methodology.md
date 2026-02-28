# PAUL Methodology

**Plan-Apply-Unify Loop** — Structured AI-assisted development for quality and consistency.

## Overview

PAUL is a structured development framework that ensures systematic execution with mandatory loop closure.

::: warning Never skip UNIFY — this is heartbeat that prevents drift.
:::

PAUL fixes three key problems with AI-assisted development:

1. **Loop integrity** — Every plan closes with UNIFY. No orphan plans. UNIFY reconciles what was planned vs what happened, updates state, logs decisions.
2. **In-session context** — Subagents are expensive (~2,000-3,000 token launch cost) and produce lower quality for implementation work. PAUL keeps development in-session with properly managed context.
3. **Acceptance-driven development** — Acceptance criteria are first-class citizens. Define done before starting. Every task references its AC. BDD format: `Given [precondition] / When [action] / Then [outcome]`.

## The Three Phases

### 1. PLAN

Define the approach before execution.

**Components:**

- **Objective** — What you're building and why
- **Acceptance Criteria** — Given/When/Then definitions of done (AC-1, AC-2, etc.)
- **Tasks** — Specific actions with files, verification, done criteria
- **Boundaries** — What NOT to change (hard constraints)

**Example:**

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
- Then receive 401 status and error message

### Tasks

- **Task 1:** Create authentication handler (src/api/auth/login.ts)
  - Verify: curl to endpoint returns 200
  - Done: AC-1 satisfied

- **Task 2:** Implement JWT token generation
  - Verify: Token contains user ID and expiration
  - Done: AC-1 satisfied

- **Task 3:** Add error handling
  - Verify: Invalid credentials return 401
  - Done: AC-2 satisfied

- **Task 4:** Write unit tests
  - Verify: All tests pass
  - Done: All AC satisfied

### Boundaries

## DO NOT CHANGE

- database/migrations/\*
- src/lib/auth.ts
```

### 2. APPLY

Execute tasks sequentially with verification.

**Process:**

- Tasks run sequentially
- Each task has verification steps
- Checkpoints pause for human input when needed
- Deviations are logged for reconciliation in UNIFY

**Example:**

```markdown
## APPLY

### Task 1: Create authentication handler

- Created `src/handlers/auth.ts`
- Implemented `login()` function
- Added credential validation

**Verification:**

- [x] Endpoint accepts POST requests
- [x] Returns JWT token on valid credentials
- [x] Returns 401 on invalid credentials

### Task 2: Implement JWT token generation

- Added `jsonwebtoken` dependency
- Created `generateToken()` utility
- Set 1-hour expiration

**Verification:**

- [x] Token contains user ID
- [x] Token expires in 1 hour
- [x] Token signature valid

### Task 3: Add error handling

- Added try-catch blocks
- Return 500 on server errors
- Log errors for debugging

**Verification:**

- [x] Errors caught and logged
- [x] Proper status codes returned

### Task 4: Write unit tests

- Created `tests/auth.test.ts`
- 12 test cases covering:
  - Valid login
  - Invalid credentials
  - Missing fields
  - Server errors

**Verification:**

- [x] All 12 tests pass
- [x] Coverage > 80%
```

### 3. UNIFY

Close the loop and reconcile plan vs actual.

**Components:**

- **SUMMARY.md** — Document what was built
- **Comparison** — Compare plan vs actual
- **Decisions** — Record decisions and deferred issues
- **State Update** — Update STATE.md with loop position

**Never skip UNIFY.** Every plan needs closure. This is what separates structured development from chaos.

**Example:**

```markdown
## UNIFY

### Summary

✓ Authentication endpoint created
✓ JWT token generation implemented
✓ Error handling added
✓ Unit tests passing (12/12)

### Comparison: Plan vs Actual

- **Planned:** 4 tasks
- **Completed:** 4 tasks
- **Deviations:**
  - Added rate limiting (not in original plan)
  - Used `bcryptjs` instead of `bcrypt` (faster for this use case)
  - Split handler into separate functions (better testability)

### Decisions Made

- Rate limiting: Added for security (DDoS protection)
- bcryptjs: Chosen for performance (2x faster than bcrypt)
- Handler split: Improves testability (unit tests easier)

### Deferred Issues

- [ ] Add refresh token support (deferred to future phase)
- [ ] Consider adding OAuth (deferred - out of scope)

### Acceptance Criteria Results

- AC-1 (Feature Works): PASS
- AC-2 (Error Handling): PASS

### State Update

- Loop position: UNIFY → Complete
- Current phase: 02-authentication
- Next action: /paul:plan (next feature)
```

## PAUL Flow

```
User Request
    ↓
/paul:plan
    ├─ Define objective
    ├─ Set acceptance criteria (AC-1, AC-2, etc.)
    ├─ List tasks with verification
    └─ Set boundaries
    ↓
/paul:apply
    ├─ Execute task 1 → Verify
    ├─ Execute task 2 → Verify
    ├─ Execute task 3 → Verify
    └─ ...
    ↓
/paul:unify ← Never skip!
    ├─ Reconcile plan vs actual
    ├─ Document differences
    ├─ Record decisions
    └─ Update STATE.md
    ↓
Complete (ready for next plan)
```

## When to Use PAUL

**Use PAUL when:**

- Complex, multi-step implementations
- Work spans multiple sessions
- You need verifiable acceptance criteria
- Quality and traceability matter
- Scope creep is a concern

**Examples:**

- "Implement a complete authentication system"
- "Refactor the entire payment module"
- "Set up CI/CD pipeline from scratch"
- "Migrate database to new schema"

**Skip PAUL when:**

- Simple, single-step tasks
- Well-understood patterns
- Prototypes and experiments
- Quick fixes and tweaks

**Examples:**

- "Fix this typo"
- "Add a console.log statement"
- "Rename this variable"
- "Update error message"

## Project Structure

PAUL uses a `.paul/` directory:

```
.paul/
├── PROJECT.md           # Project context and requirements
├── ROADMAP.md           # Phase breakdown and milestones
├── STATE.md             # Loop position and session state
├── config.md            # Optional integrations
├── SPECIAL-FLOWS.md     # Optional skill requirements
└── phases/
    ├── 01-foundation/
    │   ├── 01-01-PLAN.md
    │   └── 01-01-SUMMARY.md
    └── 02-authentication/
        ├── 02-01-PLAN.md
        └── 02-01-SUMMARY.md
```

**STATE.md** tracks:

- Current phase and plan
- Loop position (PLAN/APPLY/UNIFY markers)
- Session continuity (where you stopped, what's next)
- Accumulated decisions
- Blockers and deferred issues

## Key Commands

| Command          | What it does                     |
| ---------------- | -------------------------------- |
| `/paul:init`     | Initialize PAUL in a project     |
| `/paul:plan`     | Create an executable plan        |
| `/paul:apply`    | Execute an approved plan         |
| `/paul:unify`    | Reconcile and close loop         |
| `/paul:progress` | Smart status + ONE next action   |
| `/paul:resume`   | Restore context and continue     |
| `/paul:pause`    | Create handoff for session break |

## Philosophy: Token Efficiency vs Speed

PAUL optimizes for **token-to-value efficiency**, not raw speed:

| Issue             | Impact of Subagents                   | PAUL Approach                 |
| ----------------- | ------------------------------------- | ----------------------------- |
| Launch cost       | 2,000-3,000 tokens to spawn           | Keep work in-session          |
| Context gathering | Starts fresh, researches from scratch | Context lives in main session |
| Resynthesis       | Results must be integrated back       | Direct integration            |
| Quality gap       | ~70% vs in-session work               | ~100% quality                 |

**When PAUL does use subagents:**

- **Discovery/exploration** — Codebase mapping, parallel exploration
- **Research** — Web searches, documentation gathering

For implementation, PAUL keeps everything in-session with proper context management.

**"Quality over speed-for-speed's-sake. In-session context over subagent sprawl."**

## See Also

- [Skill Execution](./skill-execution.md) — Using PAUL in skills
- [Skill Chains](./skill-chains.md) — PAUL in workflows
- [CARL Quality Gates](./carl-quality-gates.md) — Quality enforcement
- [Verification Loops](../research/verification-loops.md) — Quality verification
