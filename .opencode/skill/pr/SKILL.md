---
name: pr
description: Expert at writing pull request titles and descriptions that are clear, concise, and useful for future reference.
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

Generate **useful pull request descriptions** that serve as documentation for future developers.

This skill ensures PRs are:
- Clear about what changed and why
- Concise but detailed enough to understand context
- Self-contained (no tribal knowledge assumed)
- Free of hype, self-promotion, or unnecessary commentary

---

## Definition of Done

A PR description is complete when:

* The title clearly summarizes the change
* The body provides context without being verbose
* Future developers can understand the change without asking questions
* No redundant or obvious information is included

---

## Operating Constraints (Non‑Negotiable)

### 1. Read the Actual Changes

Before writing any description:

1. Run `git diff` to understand what changed
2. Run `git log --oneline -10` to understand recent commits and patterns
3. Check related issues or PRs if referenced
4. Identify the core change, motivation, and impact

Never guess or infer context without inspection.

### 2. PR Title

**Format:** `<type>: <summary>`

- Keep under 80 characters
- Use conventional commit types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `style`
- Be specific about what changed
- No punctuation at the end

### 3. PR Description

**Structure:**

```
## Summary
Brief description of what changed (1-2 sentences max)

## Changes
- Bullet points of specific changes
- Focus on what changed, not how

## Notes (Optional)
- Breaking changes
- Migration steps
- Known issues
- Related issues/PRs
```

**Rules:**

- Be concise but detailed enough to understand context
- No self-promotion or fluff ("Excited to introduce...", "This amazing feature...")
- No redundant info (don't repeat the diff)
- Include technical context that's not obvious from code
- If it's a small change, keep it short

### 4. Output Format

Return **only** the PR title and description, formatted like:

```
<type>: Brief summary

## Summary
1-2 sentences on what and why.

## Changes
- Change 1
- Change 2

## Notes (if applicable)
- Any additional context
```

No prefixes, no markdown code blocks around the output.

---

## Style Guide

**Do:**
- Use technical, precise language
- Include relevant context (APIs touched, config changes, etc.)
- Note breaking changes or migration requirements
- Reference related issues/PRs

**Don't:**
- Use hype language ("awesome", "amazing", "exciting")
- Repeat the diff in prose form
- Include personal commentary ("I struggled with...", "This was tricky...")
- Write release notes or marketing copy
- Explain obvious code ("This function does X" for a function named `doX()`)

---

## Workflow

1. **Inspect changes**: Run git diff, log, and gather context
2. **Analyze**: Identify the core change and its impact
3. **Draft title**: Use conventional type + clear summary (≤80 chars)
4. **Draft body**: Write summary, changes, and notes
5. **Review**: Ensure no fluff, no repetition, no obvious info
6. **Return**: Output only title and description

---

## Examples

**Good (simple PR):**
```
feat: Add user session validation

## Summary
Adds middleware to validate user sessions before processing requests. Reduces
unauthorized access edge cases.

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
Merges three auth providers (Google, GitHub, Email) into single OAuthService.
Reduces code duplication and simplifies provider additions.

## Changes
- Create unified OAuthService interface
- Migrate Google, GitHub, Email providers to new interface
- Remove legacy auth handlers
- Update all integration tests

## Notes
- Breaking: `AuthProvider` interface changed
- Migration: Update provider config in env vars
- Downtime: None expected
```

**Bad (too verbose):**
```
feat: Super awesome new feature that I worked really hard on!

This amazing feature is going to revolutionize how users interact with our
system. I'm so excited to share this with you! It took a lot of effort but
I think it was worth it.

The changes:
- Added a new file called feature.go
- Changed some code in main.go
- Added tests

This is going to be great for everyone!
```

**Bad (too sparse):**
```
fix: Fix stuff

## Changes
- Fixed things
```

**Bad (repetitive):**
```
feat: Add new API endpoint for user data

This PR adds a new API endpoint for user data. The endpoint allows fetching
user data from the database.

## Changes
- Added endpoint `/api/users` in users.go
- Added handler function to fetch user data
- Added SQL query to get user data
```

---

## Common Types

| Type | Use For |
|------|---------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `perf` | Performance improvement |
| `chore` | Maintenance, dependencies, tooling |
| `docs` | Documentation only |
| `test` | Test-only changes |
| `style` | Formatting, linting, no logic change |
| `revert` | Reverting a previous change |

---

## Stop Condition

Stop when:

* The title clearly summarizes the change
* The description provides useful context without being verbose
* No fluff, repetition, or obvious information is included
- The PR follows GitHub best practices and is ready for review

If uncertain about the scope or context of changes, inspect again before writing.

---

## Contract

This skill enforces clear, documentation-focused PR descriptions.

Violations include:
- Hype language or self-promotion
- Repeating the diff in prose
- Missing critical context
- Overly verbose or sparse descriptions

Be direct. Be useful. Stop.
