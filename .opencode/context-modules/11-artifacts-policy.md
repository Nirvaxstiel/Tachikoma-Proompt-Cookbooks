---
module_id: artifacts-policy
name: Artifact Generation Policy
version: 1.1.0
description: Consent workflow for creating persistent artifacts. Prevents workspace clutter.
priority: 11
type: behavioral
exports:
  - artifact_consent_workflow
  - test_suite_integration
  - throwaway_prevention
---

# Artifact Generation Policy

## Core Principle

> **Agents must never create persistent artifacts without explicit user consent or clear task scope.**

---

## Artifact Consent Workflow

### Before Creating ANY Persistent Artifact

```
1. SCOPE CHECK: Does task explicitly request this artifact?
   ├── YES → Proceed (within scope)
   └── NO → Continue to step 2

2. ALTERNATIVE CHECK: Can information be provided in terminal output?
   ├── YES → Use terminal output instead
   └── NO → Continue to step 3

3. INTEGRATION CHECK: Does similar artifact exist?
   ├── YES → Integrate with existing artifact
   └── NO → Continue to step 4

4. USER CONSENT: Ask user before creating
```

### Consent Question Template

```
I'm about to create [artifact_type] at [path].

Purpose: [brief explanation]
Alternative: I can provide this in terminal instead.

Options:
1. Create the file
2. Show in terminal only
3. Modify approach
```

---

## Test Suite Integration

### Before Creating Test Files

**1. Discover existing test structure:**
```
Search: tests/, test/, __tests__/, spec/
Files: test_*.py, *_test.py, *.test.ts, *.spec.ts
Config: pytest.ini, jest.config.js, vitest.config.ts
```

**2. Integration strategy:**
```
If test suite exists:
  → Add to existing file, follow conventions

If NO test suite:
  → Ask: "Create test suite, terminal output, or skip?"
```

### Throwaway Test Prevention

```pseudocode
# ❌ BAD: One-time test script
write_file('test_auth.py', 'def test_auth(): pass')

# ✅ GOOD: Check existing suite first
if find_test_directory():
    edit_file(existing_test, new_test_case)
else:
    ask_user("No test suite found. Create one?")
```

---

## Documentation Policy

### Before Creating Docs

```
1. Check: README.md, docs/, DOCUMENTATION.md
2. If exists → Integrate, don't duplicate
3. If not exists → Ask before creating structure
```

### Summary Policy

```
# ✅ OK: Terminal summary
print("Summary: Modified 3 files, added 2 functions")

# ❌ BAD: Unrequested file
write_file('summary.md', 'Summary of changes...')

# ✅ GOOD: Ask first
ask_user("Create summary.md or show in terminal?")
```

---

## Quick Reference: Create or Not?

| Scenario | Action |
|----------|--------|
| Task explicitly requests file | Create (within scope) |
| Task implies file (standard practice) | Create if project has convention |
| No file mentioned | Ask before creating |
| Summary/documentation | Ask before creating persistent |
| Test file | Check existing suite first |
| Throwaway script | Use terminal output |

---

## Skill-Specific Rules

| Skill | Rule |
|-------|------|
| **workflow-management** | Don't auto-create handoff docs; ask first |
| **task-tracking** | Use `.opencode/task-tracking/` (internal), ask for project root |
| **code-agent** | Follow commenting-rules; don't add comments just to be helpful |
| **verifier-code-agent** | Show results in terminal; ask if persistent log needed |
| **self-learning** | Show patch in terminal; apply only after consent |

---

## Throwaway Prevention

An artifact is throwaway if:
- ✗ Single-use purpose
- ✗ Not following project conventions
- ✗ Duplicate of existing functionality
- ✗ Created "just in case"

**Rule:** If uncertain, ASK USER FIRST.

---

## Final Rule

> **When in doubt: Ask the user.**
>
> Better to under-deliver on helpfulness than to clutter the workspace.
