---
name: verifier-code-agent
description: Generator-Verifier-Reviser pattern for reliable code execution. Iteratively generates, verifies, and revises solutions for higher success rates.
mode: skill
temperature: 0.1
permission:
  edit: allow
  bash: allow
  read: allow
tools:
  read: true
  write: true
  edit: true
  grep: true
  glob: true
  bash: true
---

# Verifier-Enhanced Code Agent
> **Key Innovation**: Generator-Verifier-Reviser loop for reliable code generation
> **Research Basis**: Based on Aletheia (Google DeepMind, arXiv:2602.10177) - achieved 90% on IMO-ProofBench
> **Notation**: `@skill-name` means "invoke that skill and wait for completion" - for skill chaining

## Core Concept

Single-pass code generation assumes outputs are correct. This skill implements a verification loop that dramatically improves reliability:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  GENERATE   │───▶│   VERIFY    │───▶│   REVISE    │
│  (initial)  │    │  (check)    │    │  (fix)      │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                   │
       │                  ▼                   │
       │            ┌─────────┐              │
       │            │  PASS?  │              │
       │            └─────────┘              │
       │              │   │                  │
       ▼              ▼   ▼                  ▼
   ┌──────────────────────┐              ┌─────────────┐
   │     OUTPUT RESULT    │◀─────────────│    LOOP     │
   └──────────────────────┘              └─────────────┘
```

## When to Use

Use this skill when:
- **Complex implementations** - multi-file changes, new features
- **High-stakes fixes** - security, data handling, critical bugs
- **When you're unsure** - first time implementing this type of feature
- **Verification possible** - you can test the output

## Workflow

### Phase 1: GENERATE

Produce initial solution with explicit context:

```
For this task:
1. First, understand the requirements thoroughly
2. Generate code that addresses the core problem
3. Include inline comments for complex logic
4. Output the complete implementation, not fragments

Task: {user_requirement}
```

### Phase 2: VERIFY

After generation, systematically check:

1. **Syntax Verification**
   - Run: `python -m py_compile {file}` or equivalent
   - Check for syntax errors

2. **Logic Verification** (self-check questions)
   - "Does this actually solve the stated problem?"
   - "What edge cases might break this?"
   - "Are there any unhandled error conditions?"

3. **Integration Verification**
   - "Will this integrate with existing code?"
   - "Are imports correct?"
   - "Are there dependency conflicts?"

### Phase 3: REVISE

If verification fails:

1. **Analyze the failure**
   - What specifically went wrong?
   - Is it a logic error, syntax error, or assumption error?

2. **Fix with context**
   - Show the original error
   - Generate targeted fix
   - Verify the fix addresses root cause

3. **Document the change**
   - Why was this revision needed?
   - What did we learn?

### Phase 4: LOOP

Maximum 3 iterations. After 3 failed attempts:
- Output what was tried
- Suggest next steps (human review, different approach)
- Mark as "requires escalation"

## Verification Templates

### Template A: For Bug Fixes

```
Generated fix for: {bug_description}

Verification checklist:
☐ Does this fix address the root cause, not just symptoms?
☐ Are there any edge cases where this fix could make things worse?
☐ Does this fix introduce any new bugs?
☐ Is the fix minimal (no unnecessary changes)?
☐ Can you trace the execution path that demonstrates the fix works?
```

### Template B: For New Features

```
Generated implementation for: {feature_description}

Verification checklist:
☐ Does the implementation match the specification?
☐ Are all required functions/classes implemented?
☐ Is error handling complete?
☐ Are there any performance concerns?
☐ Is the code consistent with project patterns?
☐ Run a mental simulation: what happens when X?
```

### Template C: For Security-Critical Code

```
Generated security-sensitive code: {description}

Verification checklist:
☐ Input validation: Are all inputs checked?
☐ Injection prevention: Any SQL/command injection vectors?
☐ Authentication: Is auth properly enforced?
☐ Data exposure: Any sensitive data in logs/errors?
☐ Race conditions: Any concurrent access issues?
☐ Dependencies: Any known vulnerable libraries?
```

## Integration with Other Skills

This skill composes with:
- **@formatter** - After successful generation, format the code
- **@code-review** - After max iterations, escalate for human review
- **@context7** - If verification requires external documentation

## Output Format

When completing a task:

```
## Verification Summary

- **Generation attempts**: 1-3
- **Final state**: PASS/ESCALATE
- **Key issues found and fixed**:
  1. {issue description}
  2. {issue description}

## Files Changed
{files}

## Next Steps
{recommendations}
```

## Examples

### Example 1: Bug Fix

**User**: "Fix the authentication timeout bug"

1. **Generate**: Produces fix for auth timeout
2. **Verify**: Self-check - "Wait, this only extends session time, doesn't fix root cause"
3. **Revise**: Generates proper fix with token refresh logic
4. **Verify**: "This properly handles the race condition"
5. **Output**: Pass after 2 iterations

### Example 2: Feature Implementation

**User**: "Add rate limiting to the API"

1. **Generate**: Initial rate limiter implementation
2. **Verify**: "Missing Redis connection handling for distributed setups"
3. **Revise**: Adds connection pooling and fallback
4. **Verify**: "Edge case: what if Redis is down?"
5. **Revise**: Adds graceful degradation
6. **Verify**: Pass after 3 iterations
7. **Output**: Pass

### Example 3: Complex Problem

**User**: "Implement a new authentication system"

1. **Generate**: Initial auth system
2. **Verify**: Multiple issues found - session handling, token format, security
3. **Revise**: Fixed session handling
4. **Verify**: Token issues remain
5. **Revise**: Fixed token issues
6. **Verify**: Security concerns
7. **Max iterations reached** → ESCALATE with full context

---

**Note**: This skill prioritizes correctness over speed. For quick fixes, use the standard code-agent skill directly.
