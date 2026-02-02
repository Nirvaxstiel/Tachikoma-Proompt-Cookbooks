---
module_id: git-workflow
name: Git Workflow & Conventions
version: 2.0.0
description: Git operations, commit conventions, and version control best practices. Loaded for git-related tasks.
priority: 20
type: context
depends_on:
  - core-contract
exports:
  - commit_conventions
  - branch_patterns
  - validation_commands
  - git_safety_rules
  - workflow_steps
---

# Git Workflow & Conventions

## Commit Message Conventions

### Subject Line (First Line)

- **Limit to 50 characters**
- **Capitalize first letter**
- **Use imperative mood:** "Add" not "Adds", "Fix" not "Fixed"
- **No punctuation at end** (no period)

**Examples:**
```
Add user authentication middleware
Fix memory leak in data processor
Update API documentation
```

### Body (Optional)

- **Separate from subject with blank line**
- **Wrap at 72 characters**
- **Explain WHAT and WHY, not how**
- **Do NOT repeat the subject**
- **Keep it short - omit if not useful**

**When to use body:**
- Multiple distinct changes in one commit
- Breaking changes or migration notes
- References to issues or PRs
- Context not obvious from subject

### Message Types

Use conventional prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, missing semi colons, etc)
- `refactor:` - Code change that neither fixes a bug nor adds a feature
- `test:` - Adding missing tests or correcting existing tests
- `chore:` - Changes to build process or auxiliary tools

**Examples:**
```
feat: add OAuth2 authentication support
fix: resolve race condition in cache invalidation
docs: update README with setup instructions
refactor: simplify user service error handling
test: add unit tests for payment gateway
```

---

## Branch Patterns

### Branch Naming

Use descriptive, kebab-case names:
```
feature/user-authentication
bugfix/memory-leak-data-processor
hotfix/security-patch-2024-01
docs/api-endpoint-updates
refactor/database-layer
```

### Branch Types

- `main` or `master` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring

---

## Validation Commands

### Before Committing

Always run validation:

```bash
# Check what changed
git status
git diff
git diff --cached

# See recent commit style
git log --oneline -5

# Run tests
npm test
# OR
pytest
# OR
cargo test

# Run linting
npm run lint
# OR
ruff check .
# OR
cargo clippy
```

### Git Safety Rules

**NEVER:**
- ❌ Commit without reviewing changes first
- ❌ Commit secrets or credentials
- ❌ Use `git push --force` on shared branches
- ❌ Commit large binary files without LFS
- ❌ Commit broken code intentionally

**ALWAYS:**
- ✅ Review `git diff` before committing
- ✅ Write clear, descriptive commit messages
- ✅ Keep commits focused and atomic
- ✅ Pull before pushing to avoid conflicts
- ✅ Run tests before pushing

---

## Workflow Steps

### Standard Commit Flow

1. **Review changes:**
   ```bash
   git status
   git diff
   ```

2. **Stage files:**
   ```bash
   git add <files>
   # Or stage all changes:
   git add -A
   ```

3. **Write commit message:**
   ```bash
   git commit -m "feat: add user authentication"
   ```

4. **Verify:**
   ```bash
   git log --oneline -1
   git show --stat
   ```

5. **Push (when ready):**
   ```bash
   git pull origin main
   git push origin feature/branch-name
   ```

### PR/MR Workflow

1. Create feature branch from main
2. Make commits with clear messages
3. Push branch to remote
4. Open Pull Request with:
   - Clear title
   - Description of changes
   - Testing notes
   - Screenshots (if UI changes)
5. Request review
6. Address feedback
7. Merge after approval

---

## Git Tool Usage

### Preferred Tools

- **CLI first:** Use git commands directly for transparency
- **Status check:** Always `git status` before operations
- **Diff review:** Always `git diff` before commits
- **Log inspection:** Use `git log --oneline` for quick history

### Common Commands

```bash
# See current state
git status
git branch

# Review changes
git diff
git diff --cached
git diff HEAD~1

# History
git log --oneline -10
git log --graph --oneline --all

# Staging
git add <file>
git add -p  # Interactive patch staging
git reset HEAD <file>  # Unstage

# Committing
git commit -m "message"
git commit --amend  # Fix last commit

# Branching
git checkout -b feature/name
git branch -d branch-name  # Delete merged branch
git branch -D branch-name  # Force delete

# Remote
git fetch origin
git pull origin main
git push origin branch-name
```

---

## Module Contract

This module enforces disciplined version control practices.

**Violations include:**
- Committing without reviewing changes
- Unclear or non-conventional commit messages
- Committing secrets or sensitive data
- Force pushing shared branches
- Skipping validation before commits

**When performing git operations:**
> Always inspect changes first, write clear messages, and validate before pushing.
