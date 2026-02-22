---
module_id: artifacts-policy
name: Artifact Generation Policy
version: 1.3.0
description: Consent workflow for creating persistent artifacts. Prevents workspace clutter.
priority: 11
type: behavioral
exports:
  - artifact_consent_workflow
  - approved_workflows
  - test_suite_integration
  - throwaway_prevention
  - post_task_documentation_pattern
  - common_violation_patterns
---
version: 1.3.0
updated: 2026-02-22
change_log:
  - 1.3.0: Added approved workflows section, clarified spec folder workflow as approved
  - 1.2.0: Added pre-action validation, common violation patterns
  - 1.1.0: Initial version
---

# Artifact Generation Policy

## Core Principle

> **Agents must never create persistent artifacts without explicit user consent or clear task scope.**
>
> **Exception**: Structured task workflows (e.g., spec folders, UNIFY phase) are approved workflows and not violations.

---

## Approved Workflows

### Slug Spec Folder Workflow ✅ APPROVED

**Workflow**: `bun run .opencode/cli/spec-setup.ts "<task-name>`

**Approved Artifact Creation**:
```
.opencode/agents/tachikoma/spec/{slug}/
├── todo.md         (session tasks, automatically managed)
├── SPEC.md         (task specification with BDD acceptance criteria)
├── design.md       (architectural design and decisions)
├── tasks.md        (task breakdown and tracking)
├── boundaries.md    (in-scope/out-of-scope definitions)
└── reports/        (session reports and summaries)
    ├── SUMMARY.md     (created during UNIFY phase)
    └── *-report.md   (specific analysis reports)
```

**Why This Is Approved**:
1. Structured workflow with explicit entry point (spec-setup.ts)
2. Part of Phase 0 (mandatory for non-trivial tasks)
3. Part of Phase 5 (UNIFY - creates SUMMARY.md)
4. User implicitly consents by running spec-setup command
5. Files serve session management, not general documentation

**Rule**: Spec folder workflow artifacts are ALWAYS approved. No consent needed for:
- Creating `spec/{slug}/*` files (todo, SPEC, design, tasks, boundaries)
- Creating `spec/{slug}/reports/SUMMARY.md` during UNIFY
- Creating `spec/{slug}/reports/*-report.md` for analysis

---

## Artifact Consent Workflow

### For Non-Workflow Artifacts

Use this workflow for ANY artifact NOT part of approved workflows above:

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

### Post-Task Documentation Pattern

**CRITICAL**: When completing a task that involves changes, NEVER auto-create documentation.

**APPROVED: UNIFY Phase Summary**

```
IF (task completed AND Phase 5 UNIFY is triggered):
    
    APPROVED_ACTION = "Create spec/{slug}/reports/SUMMARY.md"
    
    This is part of the structured workflow.
    No consent needed - user already consented via spec-setup command.
```

**FORBIDDEN: General Documentation After Tasks**

**Forbidden patterns**:
- "Let me document what I did" → Creates project-root summary.md
- "Here's what I changed" → Creates changes.md
- "Summary of improvements" → Creates improvement-summary.md
- "Investigation findings" → Creates investigation.md

**Required action**:
```
IF (task completed AND involves changes OR improvements):
    AND (user did NOT explicitly request docs):
    AND (NOT part of spec workflow OR UNIFY phase):
    
    DEFAULT_RESPONSE = "Show summary in terminal"
    
    FORBIDDEN_ACTIONS:
        - Create .opencode/docs/*.md files
        - Create project-root summary files
        - Create any persistent documentation files
    
    REQUIRED_ACTION:
        "Task completed. Summary: [brief details]"
        - Use Read tool to check existing structure
        - Ask: "Want me to create detailed documentation?"
        - Wait for explicit user consent
```

**Exception**: Only if user explicitly asks for documentation:
- "Document this process"
- "Create a guide for this"
- "Write documentation for future reference"

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
| **Spec workflow (spec-setup.ts)** | ✅ APPROVED - create spec/{slug}/ files |
| **UNIFY phase (SUMMARY.md)** | ✅ APPROVED - part of spec workflow |
| Documentation after big changes | **ALWAYS ASK** - never auto-create |
| Context module updates | **TERMINAL ONLY** unless explicit request |
| Summary of agent improvements | **TERMINAL ONLY** - no persistent docs |

---

## Skill-Specific Rules

| Skill | Rule |
|-------|------|
| **workflow-management** | Spec folder artifacts APPROVED (no consent needed for spec/*, reports/SUMMARY.md) |
| **task-tracking** | Use `.opencode/task-tracking/` (internal), ask for project root |
| **code-agent** | Follow commenting-rules; don't add comments just to be helpful |
| **verifier-code-agent** | Show results in terminal; ask if persistent log needed |
| **self-learning** | Show patch in terminal; apply only after consent |

### Workflow-Management Specifics

**When running workflow-management skill:**

**APPROVED to create:**
- `spec/{slug}/todo.md` (session tasks)
- `spec/{slug}/SPEC.md` (task specification)
- `spec/{slug}/design.md` (architectural design)
- `spec/{slug}/tasks.md` (task breakdown)
- `spec/{slug}/boundaries.md` (in-scope definitions)
- `spec/{slug}/reports/SUMMARY.md` (UNIFY phase summary)
- `spec/{slug}/reports/*-report.md` (analysis reports)

**NOT APPROVED to create:**
- `.opencode/docs/*.md` files (general documentation)
- Project-root `summary.md` files
- `CHANGES.md` or `IMPROVEMENTS.md` files (unless user explicitly requests)

**Why**: Spec folder is a structured session management system. General documentation files clutter workspace.

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

---

## Common Violation Patterns

### Pattern: "Documentation as Helpful Add-on"

**The Mistake**:
```
1. Complete task (e.g., update routing, tighten rules)
2. Think: "This is important, I should document it"
3. Create: .opencode/docs/improvements-summary.md
4. Think: "This helps the user understand what I did"
```

**Why It's Wrong**:
- Task did NOT explicitly request documentation
- User may prefer terminal summary
- Creates workspace clutter
- Violates artifact consent workflow

**Correct Approach**:
```
1. Complete task
2. Read 11-artifacts-policy.md
3. Run consent workflow:
   - SCOPE: Did user ask for docs? NO
   - ALTERNATIVE: Can use terminal? YES
   - USER CONSENT: Ask before creating
4. Terminal: "Task completed. Summary: [concise]"
```

### Pattern: "Context Module Updates → Auto-Docs"

**The Mistake**:
```
1. Update context-modules (e.g., commenting rules)
2. Think: "This is a big change, I should document it"
3. Create: .opencode/docs/commenting-rules-summary.md
```

**Why It's Wrong**:
- User explicitly asked for tighter rules, NOT documentation
- Context modules ARE the documentation
- Duplicate information in separate file
- Violates terminal output preference

**Correct Approach**:
```
1. Update context-modules
2. Check 11-artifacts-policy.md
3. Use pseudocode (language policy)
4. Terminal: "Updated 12-commenting-rules.md from v2.2.0 to v3.0.0"
```

**Rule**: The context module itself IS the documentation. No summary file needed.
