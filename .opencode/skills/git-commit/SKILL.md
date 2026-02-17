---
name: git-commit
description: Write clear git commit messages that document changes for the project's history.
license: MIT
allowed-tools:
  - Bash
compatibility:
  - opencode
  - claude-code
metadata:
  audience: software engineers
  workflow: inspect changes → analyze → write message → return only message
---

## Purpose

Document what changed in the commit history. Each commit message should answer:

- What changed?
- Why did it change? (when it's not obvious)

That's the job. Nothing more.

Git history is a logbook, not a diary. Be clear. Be concise. Move on.

---

## Definition of Done

A commit message is done when:

- Subject line says what changed (and why, if needed)
- Body adds context only if the subject isn't enough
- It follows the standard format
- No meta-commentary, no raw diff

---

## Operating Constraints

### 1. Read the Actual Changes

Before writing anything:

1. Run `git status` to see what's staged/unstaged
2. Run `git diff` or `git diff --cached` to see the actual changes
3. Run `git log --oneline -5` to see the repo's commit style
4. Extract concrete facts about what changed

Don't guess. Look at the actual changes.

### 2. Git Style Guidelines

**Subject line:**

- Keep it under 50 characters
- Capitalize the first letter
- Use imperative mood ("Add" not "Adds", "Fix" not "Fixed")
- No punctuation at the end

**Body (if needed):**

- Separate from subject with a blank line
- Wrap at 72 characters
- Explain **what** and **why**, not how
- Don't repeat the subject line

**General:**

- Keep it short
- Skip the body if the subject is enough
- Return only the commit message
- No meta-commentary about the task
- No raw diff output

---

## Message Quality

### Prefer Subject-Only

If the subject line covers it, stop there.

- One clear line > unnecessary detail
- The diff exists for a reason

### Use Body Only When Useful

Add a body when it provides actual value:

- Multiple distinct changes in one commit
- Breaking changes or migration notes
- References to issues or PRs
- Context not obvious from the subject

Don't add body just to have body.

---

## Workflow

1. **Frame the task**: What needs to be documented?
2. **Inspect**: Run git commands to see actual changes
3. **Extract**: Find the core change and reason
4. **Draft**: Write subject line (≤50 chars, imperative)
5. **Decide**: Does body add value? If no, done.
6. **Refine**: If yes, write concise body (no repetition)
7. **Return**: Just the commit message, nothing else

---

## Common Patterns

| Type       | Use For                                    |
| ---------- | ------------------------------------------ |
| `feat:`    | New feature or capability                  |
| `fix:`     | Bug fix                                    |
| `refactor:`| Code restructuring without behavior change |
| `chore:`   | Maintenance or dependency updates          |
| `docs:`    | Documentation only                         |
| `test:`    | Test-only changes                          |
| `perf:`    | Performance improvements                   |
| `style:`   | Code style/formatting (no logic change)    |

---

## Output Format

Return **only** the commit message:

```
Subject line (≤50 chars, imperative, no period)

Optional body line 1.
Optional body line 2.
```

No prefix, no suffix, no markdown formatting.

---

## Stop Condition

Stop when:

- The message accurately documents what changed
- It follows the format rules
- It's as concise as possible while remaining clear

If uncertain about the changes, inspect again.

---

## Examples

**Good (subject-only):**

```
feat: Add user authentication middleware
```

**Good (with body):**

```
refactor: Simplify authentication flow

Consolidate duplicate validation logic into shared validator.
Reduces duplication and makes future changes easier.
```

**Bad (too long):**

```
feat: Add a new user authentication middleware system that handles JWT tokens and session management
```

**Bad (repetitive body):**

```
fix: Correct login validation error

This commit fixes the login validation error that was occurring.
```

**Bad (wrong mood):**

```
Adds new feature for user management
```

---

## Notes

- This is about documenting changes, not explaining them
- Future you will thank present you for clear commit messages
- When in doubt, keep it shorter
