# Customization

Tailor Tachikoma to your project's needs.

Tachikoma works out of the box, but you can adapt it to your project's conventions, add new capabilities, or adjust its behavior.

## What You Can Customize

| Goal | How |
|------|-----|
| Add project rules | Custom context module |
| Add new task type | New intent + route |
| Create specialized behavior | New skill |
| Adjust routing behavior | Confidence thresholds |
| Organize context | Custom modules |

## Add Project Rules

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
```

Tachikoma loads these rules automatically when routing to intents that specify `40-my-rules` in their context modules.

## Adjust Confidence Thresholds

Make Tachikoma stricter or more permissive:

```yaml
routes:
  debug:
    confidence_threshold: 0.8  # stricter - asks more

  implement:
    confidence_threshold: 0.5  # permissive - acts faster
```

**Guidelines:**
- **>0.8** — Strict, asks more. Good for critical tasks.
- **0.5-0.8** — Balanced. Recommended for most cases.
- **<0.5** — Permissive. Fast but may misroute.

## Next Steps

- [Add Skill](/capabilities/customization/add-skill) - Create custom capabilities
- [Add Intent](/capabilities/customization/add-intent) - Define new task types
- [Context Modules](/capabilities/customization/context-modules) - Detailed context configuration

## See Also

- [Intent Routing](/capabilities/intent-routing) - How routing works
- [Context Management](/capabilities/context-management) - How context modules work
