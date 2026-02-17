# Add Skill

Create custom capabilities for Tachikoma following the official [Agent Skills specification](/capabilities/skills-specification).

## Quick Start

1. Create folder: `.opencode/skills/my-skill/`
2. Add `SKILL.md` following the specification
3. Add route in `intent-routes.yaml`
4. Test the skill

## Step-by-Step Guide

### Step 1: Create the Skill Directory

```bash
mkdir -p .opencode/skills/my-skill
```

The skill directory name must:
- Match the `name` field in SKILL.md exactly
- Be lowercase letters, numbers, and hyphens only
- Not start or end with a hyphen
- Not contain consecutive hyphens

### Step 2: Create SKILL.md

Your `SKILL.md` must have **YAML frontmatter** with at minimum:

```yaml
---
name: my-skill
description: A clear description of what this skill does and when to use it.
---
```

Followed by **Markdown instructions**:

```markdown
# My Skill

You are an expert at [domain].

## When to use this skill

Activate this skill when the user asks about:
- Topic A
- Topic B
- [specific keywords]

## Instructions

1. First, do this...
2. Then, do that...
3. Finally, report the results

## Examples

### Example 1
**User:** [user query]
**Response:** [expected response]

## Boundaries

- Don't do X
- Always check Y before proceeding
```

### Step 3: Add Optional Components

#### scripts/ (Optional)

Add executable scripts:

```bash
mkdir -p .opencode/skills/my-skill/scripts
```

Example script (`scripts/process.py`):
```python
#!/usr/bin/env python3
"""Process data for my-skill"""

def process(input_data):
    """Process the input data"""
    # Your logic here
    return result

if __name__ == "__main__":
    import sys
    result = process(sys.stdin.read())
    print(result)
```

#### references/ (Optional)

Add documentation files:

```bash
mkdir -p .opencode/skills/my-skill/references
```

Example (`references/REFERENCE.md`):
```markdown
# Technical Reference

Detailed technical documentation goes here.
```

#### assets/ (Optional)

Add static resources:

```bash
mkdir -p .opencode/skills/my-skill/assets/{templates,images,data}
```

### Step 4: Add Route in intent-routes.yaml

Open `.opencode/config/intent-routes.yaml` and add:

```yaml
routes:
  my-intent:
    description: Description of when this intent triggers
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
    skill: my-skill
    tools:
      - Read
      - Grep
      - Bash
    strategy: direct
    notes: Additional notes about this route
```

### Step 5: Update Intent Classifier (If creating new intent)

If you're adding a new intent type, update `.opencode/skills/intent-classifier/SKILL.md`:

```markdown
### My Intent Patterns
- Keywords: `keyword1`, `keyword2`, `keyword3`
- Indicators: [what triggers this intent]
```

## Complete Example

Here's a complete skill example:

### Directory Structure

```
.opencode/skills/pull-request-manager/
├── SKILL.md
├── scripts/
│   ├── create-pr.py
│   └── merge-pr.py
└── references/
    └── pr-templates.md
```

### SKILL.md

```yaml
---
name: pull-request-manager
description: Create, update, and manage pull requests. Use when user asks about PRs, merging, code reviews, or version control operations involving branches.
license: Apache-2.0
metadata:
  version: "1.0"
  author: tachikoma
  category: git-operations
---
```

```markdown
# Pull Request Manager

## When to use this skill

Activate this skill when the user wants to:
- Create a new pull request
- Update an existing PR
- Merge a PR
- Review PR status
- Manage PR workflows

## Workflow

### 1. Gather Information
- Check current git status (`git status`)
- Identify the branch to merge
- Check for conflicts (`git diff`)
- Review target branch

### 2. Create PR
1. Use `scripts/create-pr.py` to create the PR:
   ```bash
   scripts/create-pr.py --source feature-branch --target main --title "Feature title"
   ```

2. Generate PR description using best practices:
   - What changed
   - Why it changed
   - How to test
   - Related issues

### 3. Update PR (if needed)
1. Add commits to the branch
2. Update PR description
3. Address review comments

### 4. Merge PR
1. Ensure all checks pass
2. Get necessary approvals
3. Use `scripts/merge-pr.py`:
   ```bash
   scripts/merge-pr.py --pr-number 123 --method squash
   ```

## Tools to Use

- `Bash`: For git operations
- `Read`: To read configuration files
- `Grep`: To search for relevant information

## Examples

### Example 1: Create a PR
**User:** "Create a PR for my feature branch"

**Response:**
I'll create a PR for your feature branch...

[Follows workflow above]

### Example 2: Merge a PR
**User:** "Merge PR #42"

**Response:**
I'll merge PR #42...

[Checks, then merges]

## Boundaries

- Don't merge PRs without user confirmation
- Always verify tests pass before suggesting merge
- Don't force merge without explicit request
- Check for conflicts before merging

## Error Handling

If a git operation fails:
1. Check git status
2. Identify the error
3. Provide clear guidance on how to fix it
4. Offer to retry after user resolves issues

## References

See [PR Templates](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) for standard PR descriptions.
```

### Route Configuration

```yaml
routes:
  pr-create:
    description: Create a new pull request
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
      - 20-git-workflow
    skill: pull-request-manager
    tools:
      - Bash
      - Read
    strategy: direct
    notes: Use when user wants to create a PR

  pr-merge:
    description: Merge an existing pull request
    confidence_threshold: 0.8
    context_modules:
      - 00-core-contract
      - 20-git-workflow
    skill: pull-request-manager
    tools:
      - Bash
      - Read
    strategy: direct
    notes: Use when user wants to merge a PR
```

## Skill Templates

### Simple Task Skill

For straightforward, well-defined tasks:

```yaml
---
name: format-json
description: Format and validate JSON files. Use when user mentions JSON formatting, validation, or pretty-printing.
---

# JSON Formatter

## When to use

User wants to:
- Format JSON files
- Validate JSON syntax
- Pretty-print JSON

## Instructions

1. Read the JSON file
2. Parse it to validate syntax
3. If valid, format with 2-space indentation
4. If invalid, report the error location

## Example

**User:** "Format this JSON file"

**Response:**
I'll format the JSON file for you...
```

### Complex Workflow Skill

For multi-step processes:

```yaml
---
name: deployment-pipeline
description: Manage deployment workflows including build, test, and deploy stages. Use when user asks about deployments, CI/CD, or releasing code.
---

# Deployment Pipeline

## When to use

User wants to:
- Deploy code to production
- Set up deployment pipeline
- Check deployment status
- Rollback deployments

## Workflow Stages

### 1. Build
- Compile code
- Build artifacts
- Check for build errors

### 2. Test
- Run unit tests
- Run integration tests
- Check test coverage

### 3. Deploy
- Deploy to staging (optional)
- Run smoke tests
- Deploy to production
- Monitor deployment

### 4. Verify
- Check service health
- Run monitoring checks
- Verify functionality

## Rollback Procedure

If deployment fails:
1. Stop deployment
2. Identify failure point
3. Rollback to previous version
4. Investigate and fix issue
```

### Domain-Specific Skill

For specialized knowledge:

```yaml
---
name: security-audit
description: Perform security audits following OWASP guidelines. Use when user asks about security, vulnerabilities, or code safety.
---

# Security Auditor

## When to use

User wants to:
- Audit code for security issues
- Check for vulnerabilities
- Review security practices
- Apply security patches

## OWASP Checklist

### Injection
- SQL injection
- Command injection
- LDAP injection

### Authentication
- Weak passwords
- Session management
- Multi-factor authentication

### Data Protection
- Encryption at rest
- Encryption in transit
- Data sanitization

## Tools to Use

- Static analysis tools
- Dependency scanners
- Penetration testing

## Report Format

Organize findings by severity:
- Critical
- High
- Medium
- Low
```

## Validation

Before deploying your skill, validate it:

```bash
# If you have the skills-ref tool
skills-ref validate .opencode/skills/my-skill
```

Manual validation checklist:
- [ ] YAML frontmatter is valid
- [ ] `name` field matches directory name
- [ ] `name` follows naming rules (lowercase, hyphens, no consecutive hyphens)
- [ ] `description` is descriptive and mentions when to use
- [ ] Markdown content is well-structured
- [ ] All file references use relative paths
- [ ] Scripts are executable if needed
- [ ] Route configuration is correct in `intent-routes.yaml`

## Testing Your Skill

### 1. Unit Test

Test each component individually:
- Scripts run correctly
- Reference files are accessible
- Instructions are clear

### 2. Integration Test

Test the skill within Tachikoma:
```
User: "[query that should trigger your skill]"
Tachikoma: [should use your skill]
```

### 3. Edge Cases Test

Test unusual situations:
- Missing dependencies
- Invalid input
- Empty files
- Network failures

## Best Practices

### ✅ DO

1. **Make descriptions descriptive**
   - Include when to use the skill
   - Mention relevant keywords
   - Be specific about capabilities

2. **Structure instructions clearly**
   - Use numbered steps
   - Include examples
   - Provide troubleshooting guidance

3. **Handle errors gracefully**
   - Document error conditions
   - Provide helpful error messages
   - Suggest recovery actions

4. **Keep skills focused**
   - One primary purpose per skill
   - Avoid scope creep
   - Use skill chains for complex workflows

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

4. **Don't ignore edge cases**
   - Handle missing files
   - Handle invalid input
   - Provide fallback options

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Skill not loading | Check YAML is valid (frontmatter matters) |
| Low confidence on intent | Add keywords to intent classifier SKILL.md |
| Wrong skill being called | Check route name matches skill name |
| Instructions not followed | Check skill formatting and clarity |
| Scripts not found | Use relative paths from skill root |
| Missing tools in route | Add tools to `intent-routes.yaml` route configuration |

## Common Patterns

### Pattern 1: Information Retrieval

For skills that find and present information:
- Step 1: Gather information (read files, search, query)
- Step 2: Process information (filter, organize, format)
- Step 3: Present information (structured output, summaries)

### Pattern 2: Code Transformation

For skills that modify code:
- Step 1: Analyze current code
- Step 2: Determine changes needed
- Step 3: Apply changes (with backup if needed)
- Step 4: Verify changes (test, lint, review)

### Pattern 3: Workflow Orchestration

For skills that manage multi-step processes:
- Step 1: Plan the workflow
- Step 2: Execute each step
- Step 3: Handle failures/rollbacks
- Step 4: Report results

## See Also

- [Skills Specification](/capabilities/skills-specification) - Complete format reference
- [Skill Execution](/capabilities/skill-execution) - How Tachikoma uses skills
- [Skill Chains](/capabilities/skill-chains) - Composing multiple skills
- [Add Intent](/capabilities/customization/add-intent) - Define new intents
- [Intent Routing](/capabilities/intent-routing) - How routing works
