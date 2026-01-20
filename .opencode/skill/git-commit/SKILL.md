---
name: git-commit
description: Expert at writing Git commit messages that are concise, clear, and follow conventional style.
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

Generate **high-quality Git commit messages** that accurately summarize changes without unnecessary verbosity or commentary.

This skill ensures commits are:
- Clear and readable
- Following Git best practices
- Concise (when possible, subject line only)
- Imperative in tone

---

## Definition of Done

A commit message is complete when:

* The subject line accurately reflects what changed and why
* The body (if present) provides useful context not in the subject
* Git style guidelines are followed
* No meta-commentary or raw diff is included

---

## Operating Constraints (Non‑Negotiable)

### 1. Read the Actual Changes

Before writing any message:

1. Run `git status` to see staged/unstaged files
2. Run `git diff` and/or `git diff --cached` to understand changes
3. Run `git log --oneline -5` to understand repository commit style
4. Extract concrete facts about what changed

Never guess or infer changes without inspection.

### 2. Git Style Guidelines

**Subject line:**
- Limit to 50 characters
- Capitalize the first letter
- Use imperative mood ("Add" not "Adds", "Fix" not "Fixed")
- Do NOT end with any punctuation (no period)

**Body (if needed):**
- Separate from subject with a blank line
- Wrap at 72 characters
- Explain **what** and **why**, not how
- Do NOT repeat the subject line

**General:**
- Keep body short and concise
- Omit body entirely if not useful
- Only return the commit message in response
- Do NOT include meta-commentary about the task
- Do NOT include raw diff output

---

## Message Quality Rules

### Prefer Subject-Only

If you can accurately express the change in just the subject line:
- Do not include anything in the message body
- A single clear line is better than unnecessary detail

### Body Is for Useful Information Only

Use the body only when it provides additional value:
- Multiple distinct changes in one commit
- Breaking changes or migration notes
- References to issues or PRs
- Context not obvious from subject

Don't include body just to fill space.

---

## Workflow

1. **Frame the task**: Understand what changes need to be summarized
2. **Inspect**: Run git commands to see actual changes
3. **Extract**: Identify the core change and motivation
4. **Draft**: Write subject line following 50-char limit and imperative mood
5. **Decide**: Does body add useful context? If no, stop
6. **Refine**: If yes, write concise body (no subject repetition)
7. **Return**: Output only the commit message, nothing else

---

## Common Patterns

Reference these common commit types:

- `feat:` New feature or capability
- `fix:` Bug fix
- `refactor:` Code restructuring without behavior change
- `chore:` Maintenance or dependency updates
- `docs:` Documentation only
- `test:` Test-only changes
- `perf:` Performance improvements
- `style:` Code style/formatting (no logic change)

---

## Output Format

Return **only** the commit message, formatted like:

```
Subject line (≤50 chars, imperative, no period)

Optional body line 1.
Optional body line 2.
```

No prefix, no suffix, no explanation, no markdown formatting beyond blank lines.

---

## Stop Condition

Stop when:

* The commit message accurately summarizes the changes
* All Git style rules are followed
* The message is as concise as possible while remaining clear

If uncertain about the nature of changes or the appropriate scope, inspect again before writing.

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
This reduces code duplication and makes future changes easier.
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
