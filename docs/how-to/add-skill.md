# Add Skill

## Steps

1. Create folder: `.opencode/skills/my-skill/`
2. Add `SKILL.md`
3. Add route in `intent-routes.yaml`

## SKILL.md

```yaml
---
name: my-skill
description: What it does
category: implementation
---

# My Skill

You are an expert at...

## When to use

User asks about...

## Instructions

1. Do this
2. Then that

## Boundaries

- Don't do X
```

## Add Route

```yaml
routes:
  my-intent:
    skill: my-skill
    context_modules:
      - 00-core-contract
```

## Test

1. Add examples to SKILL.md
2. Make request
3. Check confidence

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Not loading | Check YAML valid |
| Low confidence | Add keywords |
| Wrong route | Check route name |

## See Also

- [Skills Reference](/reference/skills)
