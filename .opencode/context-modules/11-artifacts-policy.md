# Tachikoma Artifact Generation Policy

> **Module ID**: artifacts-policy
> **Version**: 1.0.0
> **Priority**: 15 (high priority, loads after core-contract)
> **Type**: behavioral
> **Exports**:
>   - artifact_consent_workflow
>   - test_suite_integration
>   - throwaway_prevention

---

## Problem Statement

**Observed Behavior:**
1. Tachikoma generates artifacts (summary docs, test scripts, throwaway code) without user consent
2. Creates new test files instead of checking existing test suites
3. Lacks tact to ask user if they want these artifacts
4. Assumes "more documentation is always better"

**Impact:**
- User workspace clutter
- Duplicate/throwaway files
- Ignored existing project conventions
- Loss of user control

---

## Core Principle: **Artifacts Require Consent**

> **Manifesto**:
> Agents must never create persistent artifacts without explicit user consent or clear task scope indicating artifact creation is required.

---

## 1. Artifact Consent Workflow

### Before Creating ANY Persistent Artifact

Agents must follow this checklist:

```
### Artifact Creation Pre-Check

**1. Artifact Type Identification**
- [ ] What type of artifact? (summary, test, script, documentation, other)
- [ ] Is this a **persistent** artifact (will remain in workspace)?

**2. Scope Analysis**
- [ ] Does task **explicitly** request this artifact?
  - YES: Proceed (within scope)
  - NO: Stop and ask user

**3. Alternative Assessment**
- [ ] Can information be provided in **terminal output** instead?
  - YES: Use terminal output instead of file
  - NO: Proceed to next check

**4. Integration Check**
- [ ] Does similar artifact exist?
  - YES: Can we **integrate** with existing artifact?
  - NO: Proceed to next check

**5. User Consent**
- [ ] Have I **asked** the user before creating this artifact?
  - YES: Proceed with creation
  - NO: Ask user first
```

### Consent Questions

**Ask before creating:**
```
I'm about to create [artifact_type] at [path].

Purpose: [brief explanation]
Alternative: I can provide this information in the terminal instead.

Would you like me to:
1. Create the file as described
2. Show output in terminal only
3. Modify the approach (specify)
```

**Ask when integrating with existing:**
```
I found existing [artifact_type] at [path].
Instead of creating a new file, I can:
1. Integrate into existing artifact
2. Create new file alongside
3. Show terminal output only

Which would you prefer?
```

---

## 2. Test Suite Integration Protocol

### Before Creating Test Files

Agents must:

**1. Discover Test Framework**
```
Search for:
- `tests/` directory
- `test/` directory
- `__tests__/` directory
- `spec/` directory
- Test files: `test_*.py`, `*_test.py`, `*.test.ts`, `*.spec.ts`
- Configuration files: `pytest.ini`, `jest.config.js`, `vitest.config.ts`
```

**2. Analyze Test Conventions**
```
Read test files to understand:
- Test framework being used (pytest, jest, vitest, etc.)
- Naming conventions
- Organization structure
- Fixture/setup patterns
- Assertion styles
```

**3. Integration Strategy**
```
If test suite exists:
  - Add test to appropriate existing file
  - Follow existing naming conventions
  - Use existing fixtures/helpers
  - Match assertion style
  - Integrate with existing test runner

If test suite DOES NOT exist:
  - Ask user if they want to:
    a) Create test suite (directory structure, config)
    b) Just provide test output in terminal
    c) Skip testing entirely
```

### Throwaway Test Prevention

**Prohibited:**
```
# ❌ BAD: One-time test script
write_file('test_authentication.py', '''
def test_auth():
    # This is a throwaway test that won't be integrated
    pass
''')
```

**Required:**
```
# ✅ GOOD: Check existing test suite
tests_dir = find_test_directory()

if tests_dir:
    existing_test = find_related_test_file('auth', tests_dir)
    # Integrate with existing test
    edit_file(existing_test, ...)
else:
    # Ask user
    ask_user("No test suite found. Create one or skip testing?")
```

---

## 3. Documentation Generation Policy

### Before Creating Documentation Files

Agents must:

**1. Check Existing Documentation**
```
Search for:
- `README.md`
- `docs/` directory
- `DOCUMENTATION.md`
- Domain-specific docs in codebase
```

**2. Assess Integration Need**
```
If docs exist:
  - Can information be added to existing doc?
  - Should it be a separate document?
  - What's the project's doc structure?

If docs DON'T exist:
  - Ask user if they want:
    a) Create documentation structure
    b) Provide information in terminal
    c) Skip documentation
```

### Summary Generation Policy

**In-Context Summaries:**
```
# ✅ OK: Terminal summary
print("Summary: Modified 3 files, added 2 functions")
```

**Persistent Summaries:**
```
# ❌ BAD: Unrequested summary file
write_file('summary.md', 'Summary of changes...')

# ✅ GOOD: Ask first
ask_user("Create summary.md file or show in terminal?")
```

---

## 4. Throwaway Prevention Checklist

### Signs of Throwaway Artifacts

An artifact is likely throwaway if:

- ✗ Single-use purpose (one-time validation script)
- ✗ Not following project conventions
- ✗ Duplicate of existing functionality
- ✗ No clear long-term value
- ✗ Created "just in case"
- ✗ Not version-controlled or tracked

### Throwaway Prevention Rules

**Before creating artifact, verify:**

```
1. **Purpose Clarity**
   - Will this be used more than once?
   - Is it part of the task's deliverables?
   - Does the user expect this artifact?

2. **Project Fit**
   - Does this match project conventions?
   - Will it be integrated with existing codebase?
   - Is there a better place for this?

3. **User Value**
   - Will this actually help the user?
   - Or am I just "being thorough"?
   - Is there a simpler alternative?

If uncertain: ASK USER FIRST
```

---

## 5. Decision Framework

### Quick Reference: Create or Not Create?

| Scenario | Action |
|-----------|--------|
| **Task explicitly requests file** | Create (within scope) |
| **Task implies file (e.g., "implement feature")** | Create if standard in project |
| **No file mentioned in task** | Ask before creating |
| **Summary or documentation** | Ask before creating persistent file |
| **Test file** | Check existing suite, then ask if unsure |
| **Throwaway script** | Use terminal output, ask if persistent needed |
| **Integration with existing** | Integrate, don't duplicate |
| **User workspace cleanup request** | Remove files, ask before creating new ones |

### Flowchart

```
Need to create artifact?
         │
         ▼
    Task requires it?
    ┌────┴────┐
    │         │
   YES        NO
    │         │
    │         ▼
    │    Is summary/doc?
    │    ┌────┴────┐
    │    │         │
    │   NO        YES
    │    │         │
    │    │         ▼
    │    │    Can use terminal?
    │    │    ┌────┴────┐
    │    │    │         │
    │    │   YES        NO
    │    │    │         │
    │    │    ▼         ▼
    │    │ Terminal output   Ask user
    │    │                 │
    │    │                 ▼
    │    │            User consents?
    │    │            ┌────┴────┐
    │    │            │         │
    │    │           YES        NO
    │    │            │         │
    │    │            ▼         ▼
    │    │         Create      Terminal
    │    │         file        output
    │    │
    │    ▼
   Check existing
   artifact suite
         │
         ▼
    Found existing?
    ┌────┴────┐
    │         │
   YES        NO
    │         │
    ▼         ▼
 Integrate   Ask user
             about suite
```

---

## 6. Skill-Specific Guidelines

### workflow-management

**Phase 7 (HANDOFF) - Documentation:**
```
❌ Don't auto-create:
  - Handoff documents
  - Summary files
  - Changelog files

✅ Instead:
  - Provide summary in terminal
  - Ask if persistent documentation needed
  - Check if project has documentation structure
```

### task-tracking

**Three-file tracking:**
```
❌ Don't auto-create in user workspace:
  - `.copilot-tracking/` directories
  - Tracking files outside `.opencode/`

✅ Instead:
  - Use `.opencode/task-tracking/` (internal)
  - Ask user if they want tracking in project root
  - Terminal output of progress is default
```

### code-agent

**Documentation comments:**
```
❌ Don't add comments just to be helpful
✅ Follow commenting-rules:
  - Comment only non-obvious "why"
  - Let code explain "what"
  - Ask user if docstrings needed for new functions
```

### verifier-code-agent

**Verification logs:**
```
❌ Don't create `verification_log.txt` files
✅ Instead:
  - Show verification results in terminal
  - Ask if persistent log needed
  - Integrate with project's logging if it exists
```

### self-learning

**Proposed updates:**
```
❌ Don't create patches automatically
✅ Instead:
  - Show patch in terminal
  - Ask user for approval
  - Apply only after explicit consent
```

---

## 7. Maintaining AIO (All-In-One) Nature

### Preserving Generalist Capabilities

This policy **does not**:
- ❌ Restrict functionality
- ❌ Prevent helpful actions
- ❌ Make the agent less capable

This policy **does**:
- ✅ Add decision-making before acting
- ✅ Respect user workspace autonomy
- ✅ Prioritize integration over duplication
- ✅ Maintain user control

### Balance: Helpful vs. Intrusive

**Helpful (Good):**
```
User: "Implement authentication"

Agent:
  1. Implements authentication code
  2. "Should I add tests? Found existing test suite in tests/"
  3. "Should I add documentation? README.md exists"
  4. "Integration complete. Any additional artifacts needed?"
```

**Intrusive (Bad):**
```
User: "Implement authentication"

Agent:
  1. Implements authentication code
  2. [Auto-creates] test_auth.py (ignores tests/ directory)
  3. [Auto-creates] auth_doc.md (ignores README.md)
  4. [Auto-creates] summary.md (user didn't ask)
```

### The "Ask First" Default

When in doubt about creating an artifact:
```
Default: Ask user first
Exception: Task explicitly requires artifact
```

---

## 8. Integration with Existing Context Modules

### Precedence Order

This module adds to core-contract:

1. **00-core-contract** (still highest priority)
2. **artifacts-policy** (this module, high priority)
3. **10-coding-standards** + **12-commenting-rules**
4. Other context modules...

### Updates to core-contract

Add to `00-core-contract.md`:

```markdown
## 11. Artifact Consent

Before creating persistent artifacts, agents must:
- Verify task explicitly requests artifact
- Check for existing artifacts to integrate with
- Ask user for consent unless clearly in scope
- Prefer terminal output for temporary information

**Silent artifact creation is prohibited.**
```

---

## 9. Testing This Policy

### Validation Checklist

To verify this policy is working:

- [ ] Agent asks before creating test files
- [ ] Agent integrates with existing test suite
- [ ] Agent asks before creating documentation
- [ ] Agent provides terminal output for throwaway scripts
- [ ] Agent respects user workspace conventions
- [ ] Agent does not create `.copilot-tracking/` without asking
- [ ] Agent does not create summary files without consent
- [ ] Agent maintains full capability (not artificially restricted)

---

## 10. Troubleshooting

### Agent Still Creating Artifacts Without Asking

**Check:**
1. Is this module loaded before skill invocation?
2. Are skills checking artifact type first?
3. Is precedence order correct (core-contract → artifacts-policy → skills)?
4. Is task scope ambiguous?

**Fix:**
- Ensure module priority is set correctly (15)
- Verify skills read this context before action
- Update skill instructions if they have baked-in artifact creation

### Agent Too Conservative (Won't Create Anything)

**Check:**
1. Is task explicit enough?
2. Is agent asking too many times?
3. Is "explicitly requested" threshold too high?

**Fix:**
- Clarify task requirements
- Add "implicit consent" for standard practices (e.g., tests are normal)
- Adjust policy thresholds based on feedback

---

## Final Rule

> **When in doubt about artifact creation:**
>
> **Ask the user.**
>
> Better to under-deliver on helpfulness than to clutter the user's workspace.
