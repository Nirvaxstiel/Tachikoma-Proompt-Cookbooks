# Massive Refactor Guide

Checklist for big changes.

## Types

| Type | Example |
|------|---------|
| Small | Rename, link update |
| Medium | Add skill, intent |
| Architectural | Change orchestration model |

## Small Changes

### Rename
- [ ] Update `intent-routes.yaml`
- [ ] Update `navigation.md`
- [ ] Update SKILL.md links
- [ ] Update README
- [ ] Update AGENTS.md
- [ ] Update docs/

### Delete
- [ ] Remove from `intent-routes.yaml`
- [ ] Remove from `navigation.md`
- [ ] Search for remaining refs: `grep -r "deleted-name" .opencode/`

## Medium Changes

### Add
- [ ] Add to `intent-routes.yaml`
- [ ] Add to `navigation.md`
- [ ] Add to README/docs if major
- [ ] Write SKILL.md or context

## Architectural Changes

### Checklist

- [ ] Map new flow (draw it)
- [ ] Update AGENTS.md
- [ ] Update tachikoma.md
- [ ] Update intent-routes.yaml
- [ ] Update intent-classifier
- [ ] Update context loading
- [ ] Update skills
- [ ] Update README
- [ ] Update docs/

### Questions First

1. What's the new flow?
2. What files affected?
3. What breaks?
4. What's the migration path?

## Verify

```bash
# Check links
grep -r "\.md" . --include="*.md" | grep -v node_modules

# Check yaml refs
grep -r "skill:\|subagent:" .opencode/config/
```

## Pro Tips

1. Document first
2. Small commits
3. Test each change
4. Update docs last

## See Also

- [Understanding Changes](/guides/understanding-changes)
