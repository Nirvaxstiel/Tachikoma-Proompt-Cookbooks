---
name: formatter
description: Automated code quality cleanup - removes debug code, formats, optimizes imports, fixes linting, and validates types. Used by Tachikoma during the cleanup phase of implementation.
version: 1.0.0
author: tachikoma
type: skill
category: development
tags:
  - formatter
  - cleanup
  - quality
  - linter
  - cli
---

# Formatter Skill

> **Purpose**: Production-ready code cleanup. Tachikoma invokes this during the "Cleanup" phase to ensure code is formatted, linted, and production-ready before review.

---

## How Tachikoma Uses This

During the 6-phase workflow, after implementation:

```
Phase 5: Cleanup ← USES: formatter skill

Tachikoma:
  1. Implementation complete
  2. Invoke formatter: bash router.sh cleanup
  3. Review cleanup results
  4. Proceed to Phase 6: Review
```

### Example Workflow

```
User: "Add a new authentication feature"

Tachikoma:
  Phase 1: Plan
    - Load workflow-management skill
    - Create implementation plan
  
  Phase 2: Implement
    - Load code-agent skill
    - Write authentication code
  
  Phase 3: Validate
    - Run tests
  
  Phase 4: Document
    - Add comments
  
  Phase 5: CLEANUP ← Formatter skill
    Command: bash .opencode/skills/formatter/router.sh cleanup
    Actions:
      ✓ Removed 3 console.log statements
      ✓ Formatted with Prettier
      ✓ Optimized imports
      ✓ Fixed 2 ESLint issues
      ✓ TypeScript check passed
  
  Phase 6: Review
    - Present cleaned code
```

---

## Operations

### 1. CLEANUP - Full Pipeline

**Purpose**: Run complete cleanup on codebase

```bash
bash router.sh cleanup [target]
```

**Steps** (in order):
1. **Remove debug code** - console.log, debugger statements
2. **Format code** - Prettier, Black, gofmt, rustfmt (auto-detected)
3. **Optimize imports** - ESLint, isort (sort and remove unused)
4. **Fix linting** - ESLint, flake8, clippy (auto-fixable issues)
5. **Type checking** - TypeScript, mypy, cargo check

**Example Output**:
```
══════════════════════════════════════════════════════════
FORMATTER: Code Quality Cleanup
══════════════════════════════════════════════════════════

Target: .
Project type: nodejs

ℹ Step 1: Removing debug code...
  ✓ Removed 3 debug statements

ℹ Step 2: Formatting code...
  Running Prettier...
  ✓ Formatted with Prettier

ℹ Step 3: Optimizing imports...
  ✓ No import optimization needed

ℹ Step 4: Fixing linting issues...
  ✓ Fixed ESLint issues

ℹ Step 5: Type checking...
  ✓ TypeScript check passed

══════════════════════════════════════════════════════════
CLEANUP SUMMARY
══════════════════════════════════════════════════════════

✓ Cleanup completed with improvements

Actions performed:
  - Debug code removal
  - Code formatting
  - Import optimization
  - Linting fixes
  - Type checking
```

---

### 2. CHECK - Dry Run

**Purpose**: Check for issues without making changes

```bash
bash router.sh check [target]
```

**Use when**:
- Want to preview what cleanup would do
- Auditing code quality
- CI/CD pipeline validation

---

## Supported Projects

| Language | Tools Detected | Actions |
|----------|---------------|---------|
| **Node.js** | Prettier, ESLint, TypeScript | Format, lint, type check |
| **Python** | Black, isort, flake8, mypy | Format, organize imports, lint, type check |
| **Go** | gofmt, golint | Format, lint |
| **Rust** | rustfmt, clippy, cargo | Format, lint, check |
| **PHP** | - | Limited support |
| **Generic** | - | Debug code removal only |

---

## Integration with Workflow

### intent-routes.yaml

```yaml
routes:
  implement:
    description: Writing or modifying code
    confidence_threshold: 0.7
    context_modules:
      - core-contract
      - coding-standards
    skill: code-agent
    # Optional: Auto-cleanup after implementation
    post_action: formatter
    tools:
      - Read
      - Write
      - Edit
      - Bash
```

### Manual Invocation

Tachikoma can invoke manually when needed:

```
User: "Clean up this file"

Tachikoma:
  Intent: implement (confidence: 0.9)
  Action: Run formatter on specific file
  Command: bash router.sh cleanup src/components/Button.tsx
```

---

## What Gets Cleaned

### Debug Code Removal
- `console.log` statements (JavaScript/TypeScript)
- `debugger;` statements
- Commented-out code blocks (selective)

### Formatting
- Prettier (JavaScript/TypeScript/CSS/HTML)
- Black (Python)
- gofmt (Go)
- rustfmt (Rust)

### Import Optimization
- Sort imports alphabetically
- Remove unused imports
- Group by type (libraries vs local)

### Linting
- ESLint auto-fixes (JavaScript/TypeScript)
- flake8 checks (Python)
- golint (Go)
- clippy (Rust)

### Type Checking
- TypeScript compiler
- mypy (Python)
- Go build
- cargo check (Rust)

---

## Workflow Integration

### As Part of 6-Phase Workflow

```yaml
# workflow-management skill
phases:
  - plan
  - implement
  - validate
  - document
  - cleanup      # ← Formatter runs here
  - review
```

### As Pre-Commit Hook

Can be run before git commit:

```bash
# In .git/hooks/pre-commit or via git-workflow skill
bash .opencode/skills/formatter/router.sh cleanup
```

### As CI/CD Step

```yaml
# In CI pipeline
- name: Code Quality
  run: bash .opencode/skills/formatter/router.sh check
```

---

## File Structure

```
.opencode/skills/formatter/
├── SKILL.md              # This documentation
└── router.sh             # Bash router script
```

---

## Best Practices

1. **Run after implementation** - Always cleanup before review
2. **Run check first** - Preview changes on unfamiliar codebases
3. **Commit before cleanup** - Easier to review what changed
4. **Configure tools** - Add .prettierrc, .eslintrc for consistent results
5. **CI/CD integration** - Use `check` in pipelines to catch issues

---

## Connection to Functional Thinking

This skill operationalizes principles from `11-functional-thinking.md`:

| Practice | Principle | How It Helps |
|----------|-----------|--------------|
| Remove debug code | Honesty Principle | Don't hide what changed |
| Optimize imports | Minimize Surface Area | Only expose what's needed |
| Type checking | Totality Principle | Handle all cases |
| Fix linting | Declarative Intent | Let tools handle "how" |

**For deeper understanding:** See `11-functional-thinking.md` for philosophical foundation.

---

## Configuration

Create project-level configs for consistent formatting:

**.prettierrc** (JavaScript/TypeScript):
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**.eslintrc.json** (JavaScript/TypeScript):
```json
{
  "extends": ["eslint:recommended"],
  "rules": {
    "no-console": ["warn", { "allow": ["error"] }]
  }
}
```

**pyproject.toml** (Python):
```toml
[tool.black]
line-length = 88

[tool.isort]
profile = "black"
```

---

## Troubleshooting

### "No formatter found"
Install appropriate tools for your project:
```bash
# Node.js
npm install --save-dev prettier eslint

# Python
pip install black isort flake8 mypy

# Go (built-in)
go install golang.org/x/lint/golint@latest

# Rust (built-in)
rustup component add clippy rustfmt
```

### "Permission denied"
Make router.sh executable:
```bash
chmod +x .opencode/skills/formatter/router.sh
```

### Type errors not auto-fixable
Formatter will report them but won't fix. Manual review needed.

---

**Formatter Skill** - Production-ready code, every time! ✨
