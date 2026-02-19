---
title: Agent Skills Format
description: The open standard for defining agent capabilities - SKILL.md specification.
---

# Agent Skills Format

[Agent Skills](https://agentskills.io) is an open format for giving agents new capabilities. Write once, use everywhere.

## Why Agent Skills?

- **Portable**: Works across different agent implementations
- **Simple**: Just a `SKILL.md` file
- **Progressive**: Load metadata first, full content on demand
- **Extensible**: Add scripts, references, and assets

## Directory Structure

```
skill-name/
└── SKILL.md          # Required
```

Optional directories:

```
skill-name/
├── SKILL.md
├── scripts/          # Executable code
├── references/       # Additional docs
└── assets/           # Static resources
```

## SKILL.md Format

### Required Frontmatter

```yaml
---
name: skill-name
description: What this skill does and when to use it.
---
```

### Optional Fields

```yaml
---
name: pdf-processing
description: Extracts text and tables from PDF files.
license: Apache-2.0
compatibility: Requires poppler-utils
metadata:
  author: example-org
  version: "1.0"
allowed-tools: Bash(git:*) Read
---
```

### Field Specifications

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | 1-64 chars, lowercase, numbers, hyphens only |
| `description` | Yes | 1-1024 chars, describes what and when |
| `license` | No | License name or file reference |
| `compatibility` | No | 1-500 chars, environment requirements |
| `metadata` | No | Arbitrary key-value mapping |
| `allowed-tools` | No | Space-delimited pre-approved tools |

### Name Rules

- 1-64 characters
- Lowercase letters (`a-z`), numbers, hyphens only
- Cannot start or end with hyphen
- No consecutive hyphens (`--`)
- Must match parent directory name

**Valid:**
```yaml
name: pdf-processing
name: data-analysis
name: code-review
```

**Invalid:**
```yaml
name: PDF-Processing    # uppercase
name: -pdf              # starts with hyphen
name: pdf--processing   # consecutive hyphens
```

### Description Best Practices

**Good:**
```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
```

**Poor:**
```yaml
description: Helps with PDFs.
```

## Body Content

After frontmatter, write instructions in Markdown:

```markdown
---
name: code-review
description: Reviews code for quality, security, and best practices.
---

## When to Use

- Reviewing pull requests
- Checking code quality
- Security audits

## Instructions

1. Read the code changes
2. Check for common issues:
   - Security vulnerabilities
   - Performance problems
   - Style inconsistencies
3. Provide actionable feedback

## Examples

### Good Feedback
- "Consider using `const` instead of `let` here"
- "This could be a SQL injection risk"

### Bad Feedback
- "This code is bad"
- "Fix this"
```

## Optional Directories

### scripts/

Executable code agents can run:

```
scripts/
├── analyze.py
└── transform.sh
```

Scripts should:
- Be self-contained or document dependencies
- Include helpful error messages
- Handle edge cases gracefully

### references/

Additional documentation loaded on demand:

```
references/
├── REFERENCE.md      # Detailed technical reference
├── FORMS.md          # Form templates
└── domain.md         # Domain-specific docs
```

### assets/

Static resources:

```
assets/
├── templates/
│   └── config.yaml
└── images/
    └── diagram.png
```

## Progressive Disclosure

Skills load in stages:

1. **Metadata** (~100 tokens): `name` + `description` at startup
2. **Instructions** (< 5000 tokens): Full `SKILL.md` when activated
3. **Resources** (as needed): Scripts, references, assets

Keep `SKILL.md` under 500 lines. Move details to separate files.

After loading, reflect:
- Was the skill content sufficient?
- Should I add more instructions?
- Are there edge cases to document?

## File References

Use relative paths from skill root:

```markdown
See [the reference guide](references/REFERENCE.md) for details.

Run the extraction script:
scripts/extract.py
```

Keep references one level deep. Avoid nested chains.

## Validation

```bash
skills-ref validate ./my-skill
```

Checks:
- Valid frontmatter
- Name constraints
- Description length
- Required fields

## Example: Complete Skill

**Directory structure:**

```
pdf-processing/
├── SKILL.md
├── scripts/
│   ├── extract.py
│   └── merge.py
├── references/
│   └── FORMATS.md
└── assets/
    └── templates/
        └── form.pdf
```

**SKILL.md content:**

```yaml
---
name: pdf-processing
description: Extracts text and tables from PDF files, fills PDF forms, and merges PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
license: Apache-2.0
compatibility: Requires poppler-utils and Python 3.8+
metadata:
  author: example-org
  version: "1.0"
allowed-tools: Bash(python:*) Read Write
---

## Capabilities

- Extract text from PDFs
- Extract tables as CSV/JSON
- Fill PDF forms
- Merge multiple PDFs

## Usage

### Extract Text
python scripts/extract.py input.pdf --output text.txt

### Extract Tables
python scripts/extract.py input.pdf --tables --output tables.csv

### Merge PDFs
python scripts/merge.py file1.pdf file2.pdf --output merged.pdf

## Supported Formats

See references/FORMATS.md for supported PDF versions and features.
```

## Compatibility

Agent Skills is supported by:

- OpenCode
- Claude Code
- Cursor
- Goose
- And more...

## Resources

- [Official Documentation](https://agentskills.io)
- [Specification](https://agentskills.io/specification)
- [Example Skills](https://github.com/anthropics/skills)
- [GitHub Repository](https://github.com/agentskills/agentskills)
