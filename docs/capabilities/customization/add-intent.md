# Add Intent

Define new intent types for better request classification.

## Overview

Intents are how Tachikoma understands what you want to do. By adding custom intents, you can:
- Handle domain-specific tasks
- Improve classification accuracy
- Route to custom skills or subagents
- Define complex workflows as single intents

## When to Add Intents

Add new intents when:
- You have custom skills that need routing
- Tasks in your domain don't fit existing intents
- You want to handle specific workflows differently
- Existing intents don't capture your use cases

## How Intents Work

1. **User makes request** — "Do X"
2. **Intent classifier analyzes** — Matches to intent patterns
3. **Route is selected** — Based on intent and confidence
4. **Specialist executes** — Skill or subagent handles the task

## Step-by-Step Guide

### Step 1: Add Route

Update `.opencode/config/intent-routes.yaml`:

```yaml
routes:
  my-intent:
    description: Clear description of when this intent triggers
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
      - 10-coding-standards
    skill: my-skill
    tools:
      - Read
      - Write
      - Bash
    strategy: direct
    notes: Additional notes about this route
```

### Step 2: Add Intent Pattern (Optional)

Update `.opencode/skills/intent-classifier/SKILL.md`:

```markdown
### My Intent Patterns
- Keywords: `keyword1`, `keyword2`, `keyword3`
- Indicators: [what triggers this intent]
```

**Example:**
```markdown
### Database Migration Patterns
- Keywords: `migrate`, `migration`, `schema change`, `database update`, `sql migration`
- Indicators: User mentions tables, schemas, SQL changes, or database versions
```

### Step 3: Test Intent

Ask Tachikoma something that should trigger your intent:

```
User: "Migrate database to add new column"
→ Should route to: my-intent
→ Should use: my-skill
→ Should load: relevant context modules
```

## Route Configuration

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `description` | Human-readable explanation | "Handle database migrations" |
| `confidence_threshold` | Minimum confidence (0-1) | `0.7` |
| `context_modules` | Which context modules to load | `00-core-contract` |
| `skill` OR `subagent` | Who handles this intent | `code-agent` |

### Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| `tools` | Specific tools to make available | `Read`, `Write`, `Bash` |
| `strategy` | Execution strategy | `direct`, `rlm` |
| `notes` | Human-readable notes | "Use for critical operations" |

## Complete Example

### Scenario

You need an intent for database migrations that routes to a custom skill.

### Step 1: Create Skill

First, create the skill (see [Add Skill](add-skill.md)):

```yaml
---
name: database-migrator
description: Plan and execute database migrations. Use when user asks about database schema changes, migrations, or SQL updates.
---

# Database Migrator

## When to Use
User wants to:
- Add or modify database tables
- Run database migrations
- Update schemas
- Plan database changes

## Workflow
1. Analyze current schema
2. Plan migration steps
3. Generate migration scripts
4. Provide rollback plan
```

### Step 2: Add Intent Pattern

```markdown
### Database Migration Patterns
- Keywords: `migrate`, `migration`, `schema change`, `database update`, `sql migration`, `add column`, `alter table`
- Indicators: User mentions database, tables, schemas, SQL, or database versions
```

### Step 3: Add Route

```yaml
routes:
  database-migration:
    description: Plan and execute database migrations
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
      - 42-workflow-conventions
    skill: database-migrator
    tools:
      - Read
      - Write
      - Bash
    strategy: direct
    notes: Use for DB schema changes, migrations, and rollbacks
```

### Step 4: Test

```
User: "Migrate the user table to add email_verified column"
→ Intent: database-migration
→ Routes to: database-migrator skill
→ Returns: Migration plan and SQL script
```

## Intent Types

### Simple Intent

Routes to a single skill:

```yaml
routes:
  my-simple-task:
    skill: my-skill
    confidence_threshold: 0.7
```

### Complex Intent

Routes to a skill chain:

```yaml
routes:
  my-complex-task:
    skill_chain: my-complex-workflow
    confidence_threshold: 0.6
```

### Subagent Intent

Routes to a subagent for large context:

```yaml
routes:
  my-large-task:
    subagent: my-subagent
    confidence_threshold: 0.5
    fallback_subagent: rlm-subcall
```

## Confidence Thresholds

Choose the right threshold for your intent:

| Threshold | Behavior | When to Use |
|-----------|-----------|-------------|
| **>0.8** | Strict, asks more | Critical tasks, safety-critical operations |
| **0.5-0.8** | Balanced | Most cases, recommended default |
| **<0.5** | Permissive | Fast, may misroute but acts quickly |

## Best Practices

### DO

✅ **Use specific keywords** — Be clear about what triggers the intent
✅ **Provide examples** — Document when intent should trigger
✅ **Set appropriate thresholds** — Match task criticality
✅ **Load relevant context** — Include necessary context modules
✅ **Test with variations** — Try different phrasings

### DON'T

❌ **Over-generalize** — Make intents specific and focused
❌ **Ignore edge cases** — Handle unusual requests gracefully
❌ **Duplicate existing intents** — Check before adding new ones
❌ **Set wrong thresholds** — Match confidence to task criticality
❌ **Forget to test** — Verify intent triggers correctly

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Intent not recognized | Add keywords to intent classifier |
| Wrong skill being called | Check route name matches skill name |
| Low confidence on intent | Add more keywords or examples |
| Context not loading | Verify modules in route configuration |

## See Also

- [Intent Routing](../intent-routing.md) — How routing works
- [Skills Specification](../skills-specification.md) — Agent Skills format
- [Add Skill](add-skill.md) — Create custom skills
- [Add Agent](add-agent.md) — Create custom subagents
- [Context Modules](context-modules.md) — Add project rules

---

## Next Steps

- [Skills Specification](../skills-specification.md) — Understand the format
- [Add Skill](add-skill.md) — Create a skill for your intent
- [Intent Routing](../intent-routing.md) — Learn about routing
- [Troubleshooting](../../troubleshooting.md) — Common issues
