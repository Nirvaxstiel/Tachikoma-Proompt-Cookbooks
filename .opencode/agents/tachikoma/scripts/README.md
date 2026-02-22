# Scripts

Utility scripts for Tachikoma framework.

> **Note**: All scripts have been migrated to TypeScript in `.opencode/cli/`.
> Python versions are archived in `_archive/` folders.

## TypeScript CLI

All operations use the TypeScript CLI with Bun:

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

# Edit format selection
bun run .opencode/cli/edit-format-selector.ts recommend

# Compression evaluation
bun run .opencode/cli/compression-evaluator.ts demo

# Hashline processing
bun run .opencode/cli/hashline.ts read <file>
```

## RLM Scripts

RLM (Recursive Language Model) scripts are in `.opencode/skills/rlm/`:

```bash
# Initialize REPL
bun run .opencode/skills/rlm/rlm-repl.ts init context.txt

# Adaptive chunking
bun run .opencode/skills/rlm/adaptive-chunker.ts chunk <file>

# Parallel processing
bun run .opencode/skills/rlm/parallel-processor.ts test
```

## Help

```bash
bun run .opencode/cli/help.ts
```
