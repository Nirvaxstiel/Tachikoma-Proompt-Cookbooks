# Agent Skills Specification

> The complete format specification for Agent Skills, based on the official [agentskills.io](https://agentskills.io) standard.

## Overview

Agent Skills is a simple, open format for giving agents new capabilities and expertise. Skills are folders of instructions, scripts, and resources that agents can discover and use to perform better at specific tasks.

### Why Agent Skills?

Agents are increasingly capable, but often don't have the context they need to do real work reliably. Skills solve this by:

- **Domain expertise**: Package specialized knowledge into reusable instructions
- **New capabilities**: Give agents new abilities (e.g., creating presentations, analyzing datasets)
- **Repeatable workflows**: Turn multi-step tasks into consistent and auditable processes
- **Interoperability**: Reuse the same skill across different skills-compatible agent products

### Key Principles

- **Self-documenting**: A skill author or user can read a `SKILL.md` and understand what it does
- **Extensible**: Skills can range from simple text instructions to executable code, assets, and templates
- **Portable**: Skills are just files, making them easy to edit, version, and share
- **Progressive disclosure**: Context is loaded incrementally (metadata → instructions → resources)

## Directory Structure

A skill is a directory containing at minimum a `SKILL.md` file:

```
skill-name/
└── SKILL.md          # Required: instructions + metadata
```

### Optional Directories

```
skill-name/
├── SKILL.md          # Required
├── scripts/          # Optional: executable code
│   ├── script.py
│   └── tool.sh
├── references/       # Optional: documentation
│   ├── REFERENCE.md
│   └── FORMS.md
└── assets/           # Optional: templates, resources
    ├── template.html
    └── schema.json
```

## SKILL.md Format

The `SKILL.md` file must contain **YAML frontmatter** followed by **Markdown content**.

### Frontmatter (Required)

Minimal required frontmatter:

```yaml
---
name: skill-name
description: A description of what this skill does and when to use it.
---
```

Complete frontmatter with optional fields:

```yaml
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents.
license: Apache-2.0
metadata:
  author: example-org
  version: "1.0"
---
```

#### Frontmatter Field Reference

| Field | Required | Constraints | Description |
|-------|----------|-------------|-------------|
| `name` | **Yes** | Max 64 chars, lowercase letters, numbers, hyphens only. Must not start/end with hyphen. Must match directory name. | Short identifier for the skill |
| `description` | **Yes** | Max 1024 characters. Non-empty. | Describes what the skill does and when to use it |
| `license` | No | Free-form text | License name or reference to bundled license file |
| `compatibility` | No | Max 500 characters | Environment requirements (intended product, system packages, network access, etc.) |
| `metadata` | No | Arbitrary key-value mapping | Additional metadata |
| `allowed-tools` | No | Space-delimited tool list | Pre-approved tools the skill may use (Experimental) |

### name Field Requirements

The `name` field must:

- Be 1-64 characters long
- Contain only lowercase letters (a-z), numbers (0-9), and hyphens (-)
- Not start or end with a hyphen
- Not contain consecutive hyphens
- Match the parent directory name exactly

**Valid examples:**
```yaml
name: pdf-processing
name: data-analysis
name: code-review
```

**Invalid examples:**
```yaml
name: PDF-Processing  # ❌ Uppercase not allowed
name: -pdf            # ❌ Cannot start with hyphen
name: pdf--processing # ❌ Consecutive hyphens not allowed
```

### description Field Guidelines

The `description` field should:

- Be 1-1024 characters
- Describe **both** what the skill does **and** when to use it
- Include specific keywords that help agents identify relevant tasks

**Good example:**
```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
```

**Poor example:**
```yaml
description: Helps with PDFs.
```

### license Field

Specifies the license applied to the skill. Keep it short:

```yaml
license: Apache-2.0
license: Proprietary. LICENSE.txt has complete terms
```

### compatibility Field

Only include if your skill has specific environment requirements:

```yaml
compatibility: Designed for Claude Code (or similar products)
compatibility: Requires git, docker, jq, and access to the internet
```

> **Note:** Most skills do not need the `compatibility` field.

### metadata Field

Store additional properties as key-value pairs:

```yaml
metadata:
  author: example-org
  version: "1.0"
  tags: ["pdf", "documents", "extraction"]
```

### allowed-tools Field (Experimental)

List pre-approved tools:

```yaml
allowed-tools: Bash(git:*) Bash(jq:*) Read
```

## Body Content (Markdown)

The Markdown body after the frontmatter contains the skill instructions. There are **no format restrictions** — write whatever helps agents perform the task effectively.

### Recommended Sections

```markdown
# PDF Processing

## When to use this skill
Use this skill when the user needs to work with PDF files...

## How to extract text
1. Use pdfplumber for text extraction...

## How to fill forms
...

## Examples
### Example 1: Extract text
User: "Extract text from invoice.pdf"
Response: ...

## Edge Cases
- Encrypted PDFs
- Scanned documents (need OCR)
- Corrupted files
```

### Progressive Disclosure Guidelines

Skills should be structured for efficient context use:

1. **Metadata (~100 tokens)**: `name` and `description` fields loaded at startup
2. **Instructions (< 5000 tokens recommended)**: Full `SKILL.md` body loaded when skill activates
3. **Resources (as needed)**: Files in `scripts/`, `references/`, `assets/` loaded only when required

**Best practices:**
- Keep main `SKILL.md` under 500 lines
- Move detailed reference material to separate files
- Keep file references one level deep from `SKILL.md` (avoid deeply nested reference chains)

## File References

When referencing other files in your skill, use relative paths from the skill root:

```markdown
See [the reference guide](references/REFERENCE.md) for details.

Run the extraction script:
```bash
scripts/extract.py
```

## Optional Directories

### scripts/

Contains executable code that agents can run. Scripts should:

- Be self-contained or clearly document dependencies
- Include helpful error messages
- Handle edge cases gracefully

Supported languages depend on the agent implementation:
- **Python**: Most common, well-supported
- **Bash/Shell**: For CLI operations
- **JavaScript/Node.js**: For web-related tasks
- **Other**: Depends on agent capabilities

Example script:
```python
# scripts/analyze.py
#!/usr/bin/env python3
import sys

def analyze(input_file):
    """Analyze the input file"""
    try:
        with open(input_file, 'r') as f:
            content = f.read()
        # ... analysis logic ...
        return results
    except FileNotFoundError:
        print(f"Error: File {input_file} not found")
        sys.exit(1)
```

### references/

Contains additional documentation that agents can read on demand:

- **REFERENCE.md** - Detailed technical reference
- **FORMS.md** - Form templates or structured data formats
- Domain-specific files (`finance.md`, `legal.md`, `api-specs.md`)

Keep individual reference files focused. Agents load these on demand, so smaller files mean less context usage.

Example:
```markdown
<!-- references/API.md -->
# API Reference

## Authentication

### Bearer Token
```
Authorization: Bearer <token>
```

### API Key
```
X-API-Key: <key>
```

## Endpoints

### GET /users/{id}
Retrieves user information.

**Parameters:**
- `id` (path): User ID

**Response:**
```json
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com"
}
```
```

### assets/

Contains static resources:

- **Templates**: Document templates, configuration templates
- **Images**: Diagrams, screenshots, examples
- **Data files**: Lookup tables, schemas, sample data

Example:
```
assets/
├── templates/
│   ├── email-template.md
│   └── config-template.yaml
├── images/
│   └── workflow-diagram.png
└── data/
    └── country-codes.csv
```

## Validation

Use the [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref) reference library to validate your skills:

```bash
skills-ref validate ./my-skill
```

This checks:
- YAML frontmatter validity
- Naming conventions
- Required fields
- Format compliance

## Complete Skill Example

Here's a complete skill following the specification:

```yaml
---
name: code-quality-check
description: Analyze code for quality issues, adherence to coding standards, and potential bugs. Use when the user asks to review, audit, or check code quality.
license: Apache-2.0
metadata:
  version: "1.0"
  author: tachikoma
  category: code-review
---
```

```markdown
# Code Quality Check

## When to use this skill

Activate this skill when the user asks to:
- Review code quality
- Check for bugs or issues
- Analyze code adherence to standards
- Audit codebase for improvements
- Assess code maintainability

## Workflow

### 1. Load Context
- Read the relevant code files
- Load project coding standards if available
- Check for existing linting configurations (ESLint, Pylint, etc.)

### 2. Analyze Code
Check for:
- **Style violations**: Indentation, naming conventions, formatting
- **Potential bugs**: Null pointer dereferences, off-by-one errors, resource leaks
- **Security issues**: SQL injection, XSS, hardcoded secrets
- **Performance issues**: N+1 queries, inefficient algorithms
- **Maintainability**: Code duplication, complex functions, lack of documentation

### 3. Report Findings
Organize findings by priority:
- **Critical**: Security vulnerabilities, bugs that will crash
- **High**: Performance issues, maintainability concerns
- **Medium**: Style violations, minor bugs
- **Low**: Nitpicks, suggestions

### 4. Provide Recommendations
For each issue, provide:
- Description of the problem
- Why it's a problem
- Suggested fix (with code example if helpful)

## Example Usage

**User:** "Review the auth module for quality issues"

**Response:**
I'll analyze the auth module for code quality issues...

[Analysis follows, organized by priority]

## Tools to Use

- `Read`: To examine code files
- `Grep`: To search for patterns across files
- `Bash`: To run linting tools if available

## Boundaries

- Don't modify code unless explicitly asked
- Focus on actionable, high-value improvements
- Be constructive and helpful, not overly critical
- Consider project context and constraints

## References

See [coding standards](../context/10-coding-standards.md) for baseline expectations.
```

## Best Practices

### ✅ DO

1. **Keep descriptions descriptive**
   - Include when to use the skill
   - Mention relevant keywords
   - Be specific about capabilities

2. **Structure instructions clearly**
   - Use sections and subsections
   - Provide step-by-step workflows
   - Include examples

3. **Handle edge cases**
   - Document error conditions
   - Provide fallback approaches
   - Handle missing dependencies

4. **Test thoroughly**
   - Validate with `skills-ref`
   - Test with compatible agents
   - Get feedback from users

### ❌ DON'T

1. **Don't make skills too large**
   - Keep SKILL.md under 500 lines
   - Split detailed references into separate files
   - Use progressive disclosure

2. **Don't hardcode paths**
   - Use relative paths
   - Make skills portable
   - Document dependencies

3. **Don't over-specify**
   - Let agents use their general knowledge
   - Focus on domain-specific expertise
   - Avoid micromanaging

4. **Don't ignore compatibility**
   - Document required tools
   - Handle environment differences
   - Provide fallbacks for missing tools

## Tools and Resources

- **Official Documentation**: [agentskills.io](https://agentskills.io)
- **Specification**: [Specification Docs](https://agentskills.io/specification)
- **Example Skills**: [anthropics/skills](https://github.com/anthropics/skills) on GitHub
- **Reference Library**: [agentskills/skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref)
- **Validation**: Use `skills-ref validate ./my-skill`

## Related Documentation

- [Add Skill](/capabilities/customization/add-skill) - How to create and add skills to Tachikoma
- [Skill Execution](/capabilities/skill-execution) - How Tachikoma uses skills
- [Skill Chains](/capabilities/skill-chains) - Composing multiple skills
- [Context Modules](/capabilities/customization/context-modules) - Project-specific rules
