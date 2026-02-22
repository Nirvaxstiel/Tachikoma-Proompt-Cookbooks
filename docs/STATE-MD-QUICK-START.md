# STATE.md Quick Reference

## What is STATE.md?

`.opencode/STATE.md` is **single source of truth** for project state. It provides:
1. **Instant session resumption** - Know where you are, what's next
2. **Project-level decision tracking** - See what was decided and why
3. **Accumulated context** - Deferred issues, blockers, boundaries
4. **Performance metrics** - Velocity, trends, execution time

**Size target**: Under 100 lines (digest, not archive)

**See also**: [AC-ENFORCEMENT-GUIDE.md](./AC-ENFORCEMENT-GUIDE.md) - How to use verifiable acceptance criteria with BDD format and verification steps

---

## When to Update STATE.md

### Before Starting Any Task

```bash
# 1. Check current state
bun run .opencode/cli/state-update.ts show

# 2. Update with new task (spec-setup.ts does this automatically)
bun run .opencode/cli/spec-setup.ts "task name"

# 3. Or manually update status
bun run .opencode/cli/state-update.ts update-status "Planning"
```

### During Task Execution

```bash
# Log a decision
bun run .opencode/cli/state-update.ts add-decision "task-slug" "Use JWT for auth" "Affects all auth endpoints"

# Add a blocker
bun run .opencode/cli/state-update.ts add-blocker "Missing API documentation" "Auth endpoint implementation" "Contact API team"

# Update status
bun run .opencode/cli/state-update.ts update-status "Executing"
```

### After Completing Task

```bash
# Mark as complete
bun run .opencode/cli/state-update.ts complete-task "task-slug" "45"

# If issues found
bun run .opencode/cli/state-update.ts add-deferred "Add rate limiting" "task-slug" "M" "After load testing"
```

---

## State Update Commands

### start-task
Initialize a new task in STATE.md.

```bash
bun run .opencode/cli/state-update.ts start-task "Add OAuth" "add-oauth"
```

Updates:
- Current Position with task info
- Last Activity timestamp
- Status to "Planning"

---

### complete-task
Mark task as complete.

```bash
bun run .opencode/cli/state-update.ts complete-task "add-oauth" "45"
```

Updates:
- Status to "Complete"
- Last Activity with duration
- Performance metrics

---

### add-decision
Log a decision made during execution.

```bash
bun run .opencode/cli/state-update.ts add-decision "task-slug" "Use Zustand for state" "Simpler than Redux"
```

Updates:
- Decisions table with decision, task, impact

---

### add-blocker
Add a blocker affecting progress.

```bash
bun run .opencode/cli/state-update.ts add-blocker "Missing API key" "Payment integration" "Request from ops team"
```

Updates:
- Blockers table with description, impact, resolution path

---

### add-deferred
Log an issue to address later.

```bash
bun run .opencode/cli/state-update.ts add-deferred "Add unit tests" "task-slug" "L" "After feature stable"
```

Updates:
- Deferred Issues table with issue, origin, effort, revisit trigger

---

### update-status
Update current phase status.

```bash
bun run .opencode/cli/state-update.ts update-status "Validating"
```

Valid statuses:
- Planning
- Executing
- Validating
- Cleanup
- Complete
- Blocked

---

### set-boundary
Add a protected boundary.

```bash
bun run .opencode/cli/state-update.ts set-boundary "src/lib/auth.ts"
```

Updates:
- Boundaries section with protected file/pattern

---

### show
Display current STATE.md.

```bash
bun run .opencode/cli/state-update.ts show
```

---

## Example Workflow

### Starting a New Task

```bash
# 1. Check current state
bun run .opencode/cli/state-update.ts show

# 2. Create spec (automatically updates STATE.md)
bash .opencode/tools/spec-setup.sh "Add user authentication"

# 3. Fill in SPEC.md with BDD acceptance criteria
# 4. Fill in boundaries.md with protected files

# 5. Update status when ready to implement
bun run .opencode/cli/state-update.ts update-status "Executing"
```

### During Implementation

```bash
# Make a decision
bun run .opencode/cli/state-update.ts add-decision "add-auth" "Use bcrypt for password hashing" "Industry standard"

# Hit a blocker
bun run .opencode/cli/state-update.ts add-blocker "Database schema needs migration" "User model creation" "Create migration script"

# Unblocked
# (Remove blocker manually from STATE.md or document resolution)
```

### Completing Task

```bash
# Mark complete
bun run .opencode/cli/state-update.ts complete-task "add-auth" "90"

# Deferred issues found
bun run .opencode/cli/state-update.ts add-deferred "Add password reset flow" "add-auth" "M" "After core auth stable"
```

---

## Session Continuity

STATE.md's **Session Continuity** section enables instant resumption:

```markdown
## Session Continuity
**Last session**: 2026-02-21 14:30
**Stopped at**: Phase 3, Plan 01, Task 2 complete
**Next action**: Create context-management.md reference
**Resume context**:
- Task 1 complete (checkpoints.md, plan-format.md created)
- Task 2 in progress
- 55% context remaining
```

When resuming:

```bash
# Read current state
bun run .opencode/cli/state-update.ts show

# Jump to next action
# (Based on Session Continuity section)
```

---

## Best Practices

### 1. Keep It Small (<100 lines)

STATE.md is a digest, not an archive. If sections grow:

- **Decisions**: Keep only 3-5 recent. Full logs in spec/{slug}/SUMMARY.md
- **Deferred Issues**: Remove resolved issues
- **Blockers**: Clear resolved blockers
- **Boundaries**: Keep only active task's boundaries

### 2. Update Frequently

- Before: Read STATE.md to understand context
- During: Log decisions and blockers as they happen
- After: Always mark task complete

### 3. Use BDD Format for Requirements

When updating STATE.md context:

```markdown
## AC-1: Feature Works
```gherkin
Given user is logged in
When they click "Logout"
Then session is cleared
```
```

### 4. Be Specific with Impact

When logging decisions:

```markdown
| Decision | Task | Impact |
|----------|------|--------|
| Use JWT | add-auth | Affects all endpoints requiring authentication |
| PostgreSQL | setup | Requires migration scripts in future phases |
```

---

## Troubleshooting

### STATE.md not found

```bash
# Initialize with spec-setup.sh
bash .opencode/tools/spec-setup.sh "init"
```

### STATE.md too large

Edit manually to:
- Move old decisions to spec/{task}/SUMMARY.md
- Remove resolved blockers
- Remove completed deferred issues

### State not updating

Check script permissions:

```bash
chmod +x .opencode/tools/state-update.sh
chmod +x .opencode/tools/spec-setup.sh
```

---

## Integration with OpenCode

### Phase 0.5: STATE.md Update

Tachikoma workflow now includes STATE.md update:

1. **Before task**: Read STATE.md, check blockers/boundaries
2. **After task**: Update STATE.md with completion status

### Workflow Integration

```
Phase 0: Spec Setup → Creates spec + updates STATE.md
Phase 0.5: STATE Update → Read/write STATE.md
Phase 1: Intent Classification → Route to skill
Phase 2: Context Loading → Load modules
Phase 3: Skill Loading → Load skill
Phase 4: Execute → Follow skill instructions
Phase 5: Session Summary → Update STATE.md
```

---

## Next Steps

After implementing STATE.md:

1. ✅ Test with a sample task
2. ⏳ Implement Priority 2: UNIFY Phase
3. ⏳ Implement Priority 3: Acceptance Criteria Enforcement
4. ⏳ Implement Priority 4: Context Economics Guidance
5. ⏳ Implement Priority 5: Boundary Enforcement

See: `temp-docs/PAUL-OPENCODE-ANALYSIS.md` for full roadmap.

---

**Last Updated**: 2026-02-21
**Version**: 1.0.0
