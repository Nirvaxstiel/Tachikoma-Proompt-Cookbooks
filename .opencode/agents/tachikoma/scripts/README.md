# Scripts

Utility scripts for Tachikoma framework.

> **Note**: Most scripts have been migrated to TypeScript in `.opencode/cli/`. 
> This directory contains only legacy Python scripts that are still referenced by skills.

## Active Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| `compression_evaluator.py` | `context/` | Probe-based quality evaluation |
| `rlm_repl.py` | `skills/rlm/scripts/` | RLM REPL for large context processing |

## TypeScript CLI (Preferred)

For most operations, use the TypeScript CLI:

```bash
# Intent routing
bun run .opencode/cli/router.ts full "query" --json

# Spec management  
bun run .opencode/cli/spec-setup.ts "task name"
bun run .opencode/cli/state-update.ts <command>

# Handoffs
bun run .opencode/cli/handoff.ts pause
bun run .opencode/cli/handoff.ts resume

# Progress
bun run .opencode/cli/progress.ts
```
