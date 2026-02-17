---
name: pr
description: Write pull request descriptions that document what changed for future maintainers.
license: MIT
allowed-tools:
  - Bash
compatibility:
  - opencode
  - claude-code
metadata:
  audience: software engineers
  workflow: inspect changes → analyze → draft title → draft description → return PR
---

## Purpose

Document what changed and why, so future devs (including future you) don't have to guess.

A good PR description is a time capsule. It answers:
- What changed?
- Why was this necessary?
- What should reviewers know?

That's it. No hype, no essays, no selling the change.

---

## Definition of Done

A PR description is done when:

- Title clearly says what changed (type + summary)
- Body explains why without being a novel
- Someone reading this in 6 months understands the context
- No obvious or redundant info (the diff exists for a reason)

---

## Operating Constraints

### 1. Read the Actual Changes

Before writing anything:

1. Run `git diff` to see what actually changed
2. Run `git log --oneline -10` for recent context
3. Check if there are related issues or PRs
4. Figure out the core change and motivation

Don't guess. Don't assume. Look at the actual diff.

### 2. PR Title

**Format:** `<type>: <summary>`

- Keep under 80 characters
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `style`
- Be specific about what changed
- No punctuation at the end

### 3. PR Description

**Structure:**

```
## Summary
What changed and why (1-2 sentences)

## Changes
- Specific things that changed
- Technical details worth noting

## Notes (Optional)
- Breaking changes
- Migration steps
- Known issues
- Related issues/PRs
```

**Rules:**

- This is documentation, not a pitch
- Include context that isn't obvious from reading the code
- Don't narrate the diff (we can see the diff)
- Keep it factual and direct
- Small changes get small descriptions

### 4. Output Format

Return **only** the PR title and description:

```
<type>: Brief summary

## Summary
What and why.

## Changes
- Change 1
- Change 2

## Notes (if applicable)
- Additional context
```

No markdown code blocks around the output. Just the content.

---

## Style Guide

**Do:**

- State facts: what changed and why
- Note technical details (APIs touched, config changes)
- Call out breaking changes or migrations
- Reference related issues/PRs
- Write for someone who doesn't have your context

**Don't:**

- Use hype words ("awesome", "revolutionary", "exciting")
- Explain the obvious (function `doX()` does X)
- Add personal commentary ("I struggled with...", "This was tricky...")
- Write release notes or marketing copy
- Repeat the diff in prose

---

## Workflow

1. **Inspect**: Run git diff, log, gather context
2. **Analyze**: Find the core change and its impact
3. **Draft title**: Type + summary (≤80 chars)
4. **Draft body**: Summary, changes, notes
5. **Review**: Remove fluff, repetition, obvious info
6. **Return**: Just the title and description

---

## Examples

**Good (simple PR):**

```
feat: Add user session validation

## Summary
Adds middleware to validate user sessions before processing requests.

## Changes
- Add SessionValidator middleware
- Integrate with existing auth flow
- Add tests for validation scenarios

## Notes
- No breaking changes
- Related: #123
```

**Good (complex PR):**

```
refactor: Consolidate authentication providers

## Summary
Merges Google, GitHub, and Email auth into single OAuthService.
Reduces code duplication and simplifies adding new providers.

## Changes
- Create unified OAuthService interface
- Migrate all three providers to new interface
- Remove legacy auth handlers
- Update integration tests

## Notes
- Breaking: `AuthProvider` interface changed
- Migration: Update provider config in env vars
- Downtime: None expected
```

**Bad (marketing copy):**

```
feat: Introducing our amazing new user feature!

We're thrilled to announce this incredible new capability that will
revolutionize user experience. This represents months of hard work
and we're so proud of what we've accomplished!

The changes:
- Added feature.go with the implementation
- Modified main.go to use it
- Added some tests

We hope you love it! 🚀
```

**Bad (too vague):**

```
fix: Fix stuff

## Changes
- Fixed things
```

**Bad (repeats the diff):**

```
feat: Add new API endpoint for user data

This PR adds a new API endpoint for user data. The endpoint allows
fetching user data from the database by calling the handler function.

## Changes
- Added endpoint `/api/users` in users.go
- Added handler function to fetch user data
- Added SQL query to get user data
```

---

## Common Types

| Type       | Use For                                    |
| ---------- | ------------------------------------------ |
| `feat`     | New feature or capability                  |
| `fix`      | Bug fix                                    |
| `refactor` | Code restructuring without behavior change |
| `perf`     | Performance improvement                    |
| `chore`    | Maintenance, dependencies, tooling         |
| `docs`     | Documentation only                         |
| `test`     | Test-only changes                          |
| `style`    | Formatting, linting, no logic change       |
| `revert`   | Reverting a previous change                |

---

## Stop Condition

Stop when:

- Title clearly summarizes the change
- Description provides useful context without bloat
- No fluff, no repetition, no explaining the obvious

If uncertain about the scope, inspect again before writing.

---

## Contract

This skill produces documentation, not content marketing.

The goal is simple: someone reading this PR in the future should understand what happened and why, without having to ask questions.

Be factual. Be direct. Document what changed. Done.
