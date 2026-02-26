<p align="center">
    <img width="300px" src= "assets/tachikoma1.png" alt="tachikoma1.png">
</p>

# Tachikoma

A general purpose AI agent named after the curious AI tanks from _Ghost in the Shell_.

## Features

- **Cost-Aware Routing**: Match task complexity to optimal execution strategy
- **PAUL Methodology**: Structured Plan-Apply-Unify loop with mandatory closure
- **Verification Loops**: Generator-Verifier-Reviser pattern for complex tasks
- **Position-Aware Context**: Mitigates U-shaped attention bias in LLMs
- **Model-Aware Editing**: Dynamic edit format selection based on model

## Installation

Install Tachikoma as an OpenCode plugin:

```bash
bun run install
```

This runs an interactive installer that lets you choose between:
- **Local** - `.opencode/` (current project only)
- **Global** - `~/.config/opencode/` (all projects)
- **Custom** - Specify any installation path

After installation, run `opencode` and use `@tachikoma` in the TUI.

See [Installation Guide](docs/installation.md) for detailed installation options.

## Themes

Ghost in the Shell inspired themes for OpenCode terminal:

| Theme                     | View  | Dark                                                  | Light                                           |
| ------------------------- | ----- | ----------------------------------------------------- | ----------------------------------------------- |
| ghost-in-the-shell        | Start | ![start](assets/tachikoma-dark-theme-gits-solid.png)  | ![start](assets/tachikoma-light-theme-gits.png) |
| lucent-ghost-in-the-shell | Start | ![start](assets/tachikoma-dark-theme-gits-lucent.png) | ![start](assets/tachikoma-light-theme-gits.png) |

> Other screenshots [here](assets/)

### Using Tachikoma Tools

Tachikoma exposes scripts as OpenCode tools:

```
@tachikoma Check edit format for current model
[Agent uses tachikoma.edit-format-selector tool]

@tachikoma Where is Tachikoma installed?
[Agent uses tachikoma.where tool]

> Check the `plugins` folder for more tools available.
```

## Core Concepts

### Cost-Aware Routing

| Complexity | Strategy          | Latency |
| ---------- | ----------------- | ------- |
| Low        | Direct response   | 1-2s    |
| Medium     | Single skill      | 5-15s   |
| High       | Skill chain       | 15-45s  |
| Very High  | RLM orchestration | 45-120s |

### PAUL Methodology

1. **PLAN**: Define objective, acceptance criteria (Given/When/Then), tasks with verify steps, boundaries
2. **APPLY**: Execute tasks sequentially, each with verification
3. **UNIFY**: Reconcile plan vs actual, update `.tachikoma/state/STATE.md`, create `.tachikoma/state/summary.md`

**Never skip UNIFY** - this is the heartbeat that prevents drift.

### Verification Loops

For complex implementations, use up to 3 verification iterations:

1. GENERATE - Produce initial solution
2. VERIFY - Check with explicit criteria
3. REVISE - Fix based on verification
4. REFLECT - Question approach, flag issues

Use verification for: complex implementations, high-stakes fixes, first-time features, correctness-critical tasks.

## Adding New Scripts

1. Create a new `.ts` file in `src/plugin/tachikoma/`:

```typescript
#!/usr/bin/env bun
/**
 * My new capability
 * Description of what it does
 */

const args = Bun.argv.slice(2);

// Your logic here
console.log(`Processing: ${args[0] || "no args"}`);
```

2. Reinstall: `bun run install`

3. Script automatically becomes `tachikoma.my-new-capability` tool!

## Documentation

- [INSTALL.md](INSTALL.md) - Installation guide
- [AGENTS.md](AGENTS.md) - Project-specific context
- [src/agents/tachikoma.md](src/agents/tachikoma.md) - Agent configuration

Links and stuff are in the `docs/` either on the [vitepress](https://nirvaxstiel.github.io/Tachikoma-Proompt-Cookbooks/), or [text](/docs)

## License

MIT
