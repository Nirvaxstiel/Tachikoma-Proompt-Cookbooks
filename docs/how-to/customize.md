# Customize

Tailor Tachikoma to your project.

## Add Project Rules

Create `.opencode/context/40-my-project.md`:

```yaml
---
module_id: my-project
name: My Rules
priority: 45
---

# My Rules

## Testing
Run `npm test` before commit.

## Naming
- Components: PascalCase
- Utils: camelCase
```

## Adjust Confidence

```yaml
routes:
  debug:
    confidence_threshold: 0.8  # stricter
```

- **>0.8** — Strict, ask more
- **0.5-0.8** — Balanced
- **<0.5** — Permissive

## Add Custom Intent

See [Add Intent](/how-to/add-intent)

## Common Customizations

| Goal | How |
|------|-----|
| Test rules | Custom context |
| New task type | New intent |
| Different skills | Create skill + route |

## See Also

- [Add Skill](/how-to/add-skill)
- [Add Intent](/how-to/add-intent)
- [Context Modules](/reference/context)
