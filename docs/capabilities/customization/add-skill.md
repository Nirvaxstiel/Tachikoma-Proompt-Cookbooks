# Add Skill

Create custom capabilities for Tachikoma.

## Steps

1. Create folder: `.opencode/skills/my-skill/`
2. Add `SKILL.md`
3. Add route in `intent-routes.yaml`

## SKILL.md

Define your skill:

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

Connect your skill to an intent:

```yaml
routes:
  my-intent:
    skill: my-skill
    context_modules:
      - 00-core-contract
```

## Test

1. Add examples to SKILL.md
2. Make request to Tachikoma
3. Check if routing works correctly

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Skill not loading | Check YAML is valid (frontmatter matters) |
| Low confidence on intent | Add keywords to intent classifier |
| Wrong skill being called | Check route name matches skill name |
| Instructions not followed | Check skill formatting and clarity |

## See Also

- [Skill Execution](/capabilities/skill-execution) - How skills work
- [Add Intent](/capabilities/customization/add-intent) - Define new intents
- [Intent Routing](/capabilities/intent-routing) - How routing works
