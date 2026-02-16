# Context Modules

Project-specific rules, loaded by priority.

## Available

| Module | Priority | Purpose |
|--------|----------|---------|
| core-contract | 0 | Always first |
| coding-standards | 10 | Code patterns |
| commenting-rules | 15 | Comments |
| git-workflow | 20 | Git conventions |
| research-methods | 30 | Investigation |
| prompt-safety | 50 | Safety |

## Priority

Lower = loads first. Space between numbers leaves room for custom modules (40-49).

## Add Custom

Create `.opencode/context/40-my-project.md`:

```yaml
---
module_id: my-project
name: My Rules
priority: 45
---

# My Rules

[your rules]
```

## Use in Routes

```yaml
routes:
  debug:
    context_modules:
      - 00-core-contract
      - 10-coding-standards
```

## See Also

- [Intent Routing](/explanation/intent-routing)
- [Customize](/how-to/customize)
