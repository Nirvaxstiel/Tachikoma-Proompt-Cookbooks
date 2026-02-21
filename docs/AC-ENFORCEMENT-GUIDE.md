# Acceptance Criteria Enforcement Guide

**Version**: 1.0.0
**Date**: 2026-02-21
**Priority**: 3

---

## Purpose

Ensure every task has verifiable acceptance criteria and clear verification steps, following PAUL's principle that "acceptance criteria are first-class citizens."

---

## Core Principles

### 1. AC is First-Class
- Acceptance criteria must be defined BEFORE tasks
- AC drives task definition, not the other way around
- Every task references specific AC (AC-1, AC-2, AC-3...)

### 2. Tasks Reference AC
- Tasks explicitly link to AC they satisfy
- No "verify it works" - must verify specific AC
- Done criteria tied to AC satisfaction

### 3. Verification Required
- Every task MUST have verification steps
- Verification must be executable or clear manual process
- Expected output must be specified

### 4. BDD Format
- Use Gherkin syntax: Given / When / Then
- Testable and unambiguous
- Defines precondition, action, and outcome

### 5. Done = AC Satisfied
- Task is only "done" when all referenced AC pass
- Cannot skip verification
- Cannot mark complete if AC fails

---

## File Structure

### SPEC.md

Acceptance criteria are defined in BDD format:

```markdown
## Acceptance Criteria (BDD Format)

## AC-1: User can login
```gherkin
Given user is on login page
When they enter valid credentials
Then they are redirected to dashboard
```

## AC-2: Invalid credentials show error
```gherkin
Given user is on login page
When they enter invalid credentials
Then error message is displayed
```
```

### tasks.md

Every task MUST include:

1. **Objective** - What this task accomplishes
2. **Acceptance Criteria** - Which AC this task satisfies
3. **Implementation Details**
   - Files to modify
   - New files to create
   - Dependencies
   - Complexity estimate
4. **Verification** - Test steps to verify implementation
5. **Done Criteria** - All referenced AC must be satisfied

**Example Task**:
```markdown
### Task 1.1: Create login endpoint

### Objective
Enable users to authenticate with username/password

### Acceptance Criteria
- [ ] AC-1: User can login with valid credentials
- [ ] AC-2: Invalid credentials return error

### Implementation Details
- [Files to modify]: src/api/auth/index.ts
- [New files to create]: src/api/auth/login.ts
- [Dependencies]: User model (Task 1.0)
- [Complexity estimate]: Medium

### Verification
- [ ] Test command: `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"test","password":"test"}'`
- [ ] Expected output: 200 OK with token
- [ ] Test command: `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"test","password":"wrong"}'`
- [ ] Expected output: 401 Unauthorized with error message

### Done Criteria
- [ ] Code implemented
- [ ] Verification passes (valid credentials return 200)
- [ ] Verification passes (invalid credentials return 401)
- [ ] AC-1 satisfied
- [ ] AC-2 satisfied
```

---

## Verification Best Practices

### DO ✅

1. **Define Executable Steps**
   ```bash
   # Good: Executable command
   Test command: `npm test -- tests/auth.test.js`

   # Bad: Vague description
   Test: Verify authentication works
   ```

2. **Specify Expected Output**
   ```bash
   # Good: Clear expectation
   Expected output: 200 OK with token

   # Bad: No clear expectation
   Expected: Should work
   ```

3. **Link to AC**
   ```markdown
   # Good: References specific AC
   Done Criteria:
   - [ ] AC-1 satisfied (user can login)

   # Bad: Generic done
   Done Criteria:
   - [ ] Implementation complete
   ```

4. **Test Edge Cases**
   ```markdown
   Verification:
   - [ ] Test command: Valid credentials
   - [ ] Test command: Invalid credentials
   - [ ] Test command: Missing credentials
   - [ ] Test command: Empty credentials
   ```

### DON'T ❌

1. **Vague Descriptions**
   ```markdown
   ❌ Verification: Check if it works
   ```

2. **Skipping Verification**
   ```markdown
   ❌ Done Criteria:
      - [ ] Code implemented
      # Missing: Verification steps
      # Missing: AC satisfaction check
   ```

3. **Generic Done Criteria**
   ```markdown
   ❌ Done Criteria:
      - [ ] Implementation complete
      - [ ] Ready for review

   ✅ Done Criteria:
      - [ ] AC-1 satisfied
      - [ ] AC-2 satisfied
      - [ ] All verification steps pass
   ```

4. **Assuming Verification is Obvious**
   ```markdown
   ❌ Implementation: Add login button
   # Missing: How to verify?

   ✅ Implementation: Add login button
   ✅ Verification: Click button, check if login modal appears
   ```

---

## UNIFY Verification Process

### During UNIFY Phase

1. **Read tasks.md**
   - Extract verification steps for each task
   - Extract expected output

2. **Run Verification**
   - Execute test commands (if executable)
   - Perform manual checks
   - Compare actual output to expected output

3. **Document Results**
   - For each AC: Pass/Fail
   - Notes on any issues
   - Update SUMMARY.md

4. **Block on Failures**
   - If any AC fails: Task is Partial, not Complete
   - Must fix failures before marking complete

### Example UNIFY Process

```bash
# UNIFY reads tasks.md
Step 2: Verifying acceptance criteria...

Found verification steps in tasks.md

# Displays verification
### Verification
- [ ] Test command: `curl -X POST ...`
- [ ] Expected output: 200 OK

# Runs verification
Running: curl -X POST ...
{"token":"abc123"}

# Asks for manual verification
AC VERIFICATION (from tasks.md):
Running verification steps defined in tasks.md...

Manual verification required for:
- Expected output checks
- Manual UI/functionality tests

# User confirms
AC PASS/FAIL:
AC-1: Pass or Fail? (p/f): p
AC-1 Notes: Token returned successfully

AC-2: Pass or Fail? (p/f): p
AC-2 Notes: Invalid credentials return 401

✓ All acceptance criteria PASSED
Task marked as Complete
```

---

## Examples

### Example 1: API Endpoint

**SPEC.md**:
```markdown
## AC-1: Create user endpoint
```gherkin
Given valid user data
When POST /api/users is called
Then user is created and 201 returned
```
```

**tasks.md**:
```markdown
### Task 1.1: Implement user creation endpoint

### Acceptance Criteria
- [ ] AC-1: Create user endpoint

### Verification
- [ ] Test command: `curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com"}'`
- [ ] Expected output: 201 Created with user ID

### Done Criteria
- [ ] Code implemented
- [ ] Verification passes (curl returns 201)
- [ ] AC-1 satisfied
```

### Example 2: UI Component

**SPEC.md**:
```markdown
## AC-1: Login form visible
```gherkin
Given user is on home page
When they click login button
Then login form is displayed
```
```

**tasks.md**:
```markdown
### Task 1.1: Create login form component

### Acceptance Criteria
- [ ] AC-1: Login form visible

### Verification
- [ ] Manual step: Open http://localhost:3000
- [ ] Manual step: Click "Login" button
- [ ] Expected output: Login modal appears with username/password fields

### Done Criteria
- [ ] Code implemented
- [ ] Verification passes (login modal appears)
- [ ] AC-1 satisfied
```

### Example 3: Database Migration

**SPEC.md**:
```markdown
## AC-1: Users table exists
```gherkin
Given migration is run
When database schema is checked
Then users table exists with correct columns
```
```

**tasks.md**:
```markdown
### Task 1.1: Create users migration

### Acceptance Criteria
- [ ] AC-1: Users table exists

### Verification
- [ ] Test command: `psql -d app -c "\d users"`
- [ ] Test command: `psql -d app -c "\d users" | grep -q "id\|name\|email\|created_at"`
- [ ] Expected output: Table exists with columns: id, name, email, created_at

### Done Criteria
- [ ] Migration implemented
- [ ] Verification passes (table and columns exist)
- [ ] AC-1 satisfied
```

---

## Integration Points

### spec-setup.sh
- Creates SPEC.md with BDD format AC
- Creates tasks.md with verification sections

### workflow-management skill
- Phase 3 (IMPLEMENT) includes AC verification requirements
- Phase 8 (UNIFY) includes verification execution

### unify-phase.sh
- Reads verification steps from tasks.md
- Runs automated verifications
- Prompts for manual verification
- Blocks completion on AC failures

---

## Troubleshooting

### Issue: No AC in SPEC.md
**Symptom**: unify-phase.sh says "No acceptance criteria found"
**Fix**: Add BDD format AC to SPEC.md
```markdown
## Acceptance Criteria (BDD Format)
## AC-1: [Criterion Name]
```gherkin
Given [precondition]
When [action]
Then [outcome]
```
```

### Issue: No Verification in tasks.md
**Symptom**: unify-phase.sh doesn't find verification steps
**Fix**: Add verification section to each task
```markdown
### Verification
- [ ] Test command: [command]
- [ ] Expected output: [expected result]
```

### Issue: Verification Fails
**Symptom**: AC fails during UNIFY
**Fix**:
1. Debug why verification failed
2. Fix implementation
3. Re-run verification
4. Re-run UNIFY

### Issue: Manual Verification Unclear
**Symptom**: Don't know how to manually verify
**Fix**: Add clear manual steps to verification section
```markdown
### Verification
- [ ] Manual step: Open URL
- [ ] Manual step: Click button
- [ ] Expected output: Modal appears
```

---

## Summary

**Key Benefits**:
1. ✅ First-class acceptance criteria
2. ✅ Every task has verification steps
3. ✅ Clear done criteria (AC satisfaction)
4. ✅ Automated verification where possible
5. ✅ Manual verification guidance
6. ✅ Block completion on AC failures

**Implementation Files**:
- `.opencode/tools/spec-setup.sh` - Creates AC and verification templates
- `.opencode/skills/workflow-management/SKILL.md` - AC enforcement guidance
- `.opencode/tools/unify-phase.sh` - Reads and runs verification steps

**Next**: Priority 4 - Context Economics Guidance

---

**Document by**: Tachikoma Agent System
**Date**: 2026-02-21
