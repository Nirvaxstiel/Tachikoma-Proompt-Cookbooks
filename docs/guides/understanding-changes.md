# Understanding Changes

For future you. How to trace what affects what.

## Dependency Chain

```
Request → intent-classifier → intent-routes.yaml → context/modules → Skill
```

## Files That Reference Things

| This File | References |
|-----------|------------|
| intent-routes.yaml | All skills, contexts |
| navigation.md | All contexts |
| skills/README.md | All SKILL.md |
| AGENTS.md | All agents, subagents |

## Find References

```bash
# What's using this skill?
grep -r "skill-name" .opencode/config/

# What's using this context?
grep -r "context-name" .opencode/config/
```

## Common Changes

### New Intent
1. Add to `intent-routes.yaml`
2. (Optional) Add keywords to intent-classifier

### New Context
1. Create `.opencode/context/XX-name.md`
2. Add to route in `intent-routes.yaml`
3. Add to `navigation.md`

### New Skill
1. Create `.opencode/skills/name/SKILL.md`
2. Add route in `intent-routes.yaml`

## When in Doubt

1. Check `navigation.md`
2. Check `intent-routes.yaml`
3. Run grep commands above

## See Also

- [Massive Refactor](/guides/massive-refactor)
