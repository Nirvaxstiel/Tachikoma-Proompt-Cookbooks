# RLM Skill Removal Checklist

> **Purpose**: Complete checklist for removing RLM skill when opencode bakes it in natively.

## Files to Delete

### Core Skill Files

- [ ] `.opencode/skills/rlm/SKILL.md`
- [ ] `.opencode/skills/rlm/adaptive_chunker.py`
- [ ] `.opencode/skills/rlm/parallel_processor.py`
- [ ] `.opencode/skills/rlm/scripts/rlm_repl.py`
- [ ] `.opencode/skills/rlm/scripts/__init__.py` (if exists)
- [ ] `.opencode/skills/rlm/__pycache__/` (directory)
- [ ] `.opencode/skills/rlm/scripts/__pycache__/` (directory)
- [ ] `.opencode/skills/rlm/` (entire directory)

### Subagent Definitions

- [ ] `.opencode/agents/subagents/core/rlm-optimized.md`
- [ ] `.opencode/agents/subagents/core/rlm-subcall.md`

### State Files (runtime, may exist)

- [ ] `.opencode/rlm_state/` (directory, if exists)

## Files to Modify

### Intent Routes

- [ ] `.opencode/config/intent-routes.yaml`
  - Remove `complex` route or update to use native opencode RLM
  - Remove references to `rlm-optimized` and `rlm-subcall`
  - Update `strategy: rlm` to appropriate native strategy

### Documentation

- [ ] `docs/research/rlm.md` - Update or remove
- [ ] `docs/capabilities/subagents.md` - Remove RLM subagent references
- [ ] `docs/capabilities/intent-routing.md` - Update complex intent docs
- [ ] `docs/concepts/architecture.md` - Remove RLM references
- [ ] `docs/troubleshooting.md` - Remove RLM troubleshooting
- [ ] `AGENTS.md` - Remove RLM subagent references

### Tachikoma Agent

- [ ] `.opencode/agents/tachikoma.md`
  - Remove `rlm-subcall` from allowed subagents
  - Update routing table to remove `complex → rlm-subcall`

## Search Patterns

Run these to find any remaining references:

```bash
# Find all RLM references
grep -r "rlm" --include="*.md" --include="*.yaml" --include="*.py" .opencode/

# Find subagent references
grep -r "rlm-optimized\|rlm-subcall" .opencode/

# Find skill references
grep -r "skills/rlm" .opencode/
```

## Migration Path

When opencode adds native RLM support:

1. **Verify native support** - Check opencode release notes for RLM feature
2. **Update intent-routes.yaml** - Point `complex` to native implementation
3. **Test thoroughly** - Ensure native RLM handles all use cases
4. **Delete files** - Follow checklist above
5. **Update docs** - Remove or update RLM documentation

## Rollback

If removal causes issues:

1. Restore files from git: `git checkout HEAD -- .opencode/skills/rlm/`
2. Restore subagent definitions: `git checkout HEAD -- .opencode/agents/subagents/core/rlm-*.md`
3. Restore intent routes: `git checkout HEAD -- .opencode/config/intent-routes.yaml`

---

**Version**: 1.0.0
**Created**: 2026-02-20
**Last Updated**: 2026-02-20
