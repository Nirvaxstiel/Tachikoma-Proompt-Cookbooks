# Context Modules

Configure project-specific rules for Tachikoma.

Context modules define how your project works. Tachikoma loads them by priority, so you don't have to explain your conventions every time.

## Available Modules

| Module | Priority | Purpose |
|--------|----------|---------|
| `core-contract` | 0 | Universal rules (always first) |
| `coding-standards` | 10 | Code patterns |
| `commenting-rules` | 15 | Comments |
| `git-workflow` | 20 | Git conventions |
| `research-methods` | 30 | Investigation |
| `prompt-safety` | 50 | Safety |

## Priority System

Lower numbers load first. The spacing (10, 15, 20) leaves room for your custom modules.

**Custom module range:** 40-49
- 40: Your coding conventions
- 41: Your workflow rules
- 42: Your tooling preferences

## Add Custom Module

Create `.opencode/context/40-my-rules.md`:

```yaml
---
module_id: my-rules
name: My Project Rules
priority: 45
---

# My Project Rules

## Testing
Always run `npm test` before committing. If tests fail, don't push.

## Code Style
- Use 2-space indentation
- Components: PascalCase
- Utils: camelCase
- No trailing whitespace
- Max line length: 80 characters

## Architecture
- Components in `src/components/`
- Utils in `src/utils/`
- No circular dependencies
- Export types from `src/types/`
```

## Use in Routes

Reference your custom modules in route definitions:

```yaml
routes:
  debug:
    context_modules:
      - 00-core-contract
      - 10-coding-standards
      - 40-my-rules          # Your custom rules
```

## Context Coupling

Some modules are coupled — if you load one, Tachikoma automatically loads the other:

- `coding-standards` ↔ `commenting-rules`
  - Coding tasks usually need both

## Tips

1. **Keep modules focused** — One concern per module
2. **Don't modify core modules** — Create custom ones instead
3. **Use appropriate priority** — Respect the spacing
4. **Test with real tasks** — Verify rules work as expected

## See Also

- [Context Management](/capabilities/context-management) - How context loading works
- [Customization Overview](/capabilities/customization/overview) - Other customization options
- [Add Intent](/capabilities/customization/add-intent) - How to reference modules in routes
