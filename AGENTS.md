# Tachikoma Framework Development

This is the Tachikoma framework repository itself.

---

## Project Structure

```
├── .opencode/           # Framework implementation
│   ├── agents/          # Orchestrator + subagents
│   ├── skills/          # Capability modules
│   ├── context-modules/ # Foundational knowledge
│   ├── cli/             # TypeScript CLI tools
│   └── commands/        # Slash commands
├── docs/                # VitePress documentation
├── bin/                 # npm bin entry point
└── temp-docs/           # Reference docs (PAUL, OpenCode)
```

---

## After Modifying docs/

```bash
cd docs && bun run build
```

VitePress will fail on dead links. Fix them before committing.

---

## Key Conventions

### Framework Files

- **Skills**: `.opencode/skills/*/SKILL.md` - Reference context modules, don't duplicate
- **Context modules**: `.opencode/context-modules/*.md` - Canonical sources
- **Templates**: `.opencode/cli/lib/templates.ts` - TypeScript template literals

### Token Optimization

Skills reference context modules instead of duplicating:
- Reflection → `00-core-contract.md`
- Functional Thinking → `11-functional-thinking.md`
- Exception: `research-agent` keeps its Connection table (not loaded via context)

---

## Install Script

`.opencode/agents/tachikoma/tachikoma-install.sh` - Preserves user's existing `AGENTS.md` and `opencode.json`

---

## Testing

```bash
# Test router
bun run .opencode/cli/router.ts full "fix the bug"

# Test state management
bun run .opencode/cli/state-update.ts --help

# Build docs
cd docs && bun run build
```
