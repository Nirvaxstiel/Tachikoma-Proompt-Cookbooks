# Installation

## Quick Start

Install Tachikoma agent as an OpenCode plugin:

```bash
bun run install
```

Or run the install script directly:

```bash
bun run install.ts
```

## Installation Options

1. **Local** → `.opencode/` (current project only)
   - Best for project-specific configurations
   - Agent available only in this repository
   - Copies to `./.opencode/`

2. **Global** → `~/.config/opencode/` (all projects)
   - Agent available across all your projects
   - Single source of truth for agent updates
   - Copies to `~/.config/opencode/`

3. **Custom** → Specify a path
   - Install to any directory you prefer
   - Useful for development or testing
   - **Note**: Appends `.opencode/` to your custom path
   - Example: `/path/to/project` → `/path/to/project/.opencode/`

## What Gets Installed?

The installer creates a plugin structure with:

```
.opencode/
├── plugins/
│   ├── tachikoma.ts                 # Main plugin (auto-discovers scripts)
│   └── tachikoma/                  # Scripts & agent modules
│       ├── edit-format-selector.ts  # tachikoma.edit-format-selector
│       ├── where.ts                 # tachikoma.where
│       ├── core.ts                 # Core orchestrator
│       ├── router.ts               # Cost-aware routing
│       ├── verifier.ts             # Verification loops
│       ├── context-manager.ts      # Position-aware context
│       ├── model-harness.ts        # Model-aware editing
│       └── rlm-handler.ts          # RLM orchestration
├── skills/                        # Agent Skills (OpenCode standard)
│   ├── paul/SKILL.md            # PAUL Framework
│   ├── carl/SKILL.md           # CARL Layer
│   ├── code/SKILL.md            # Code implementation
│   ├── planning/SKILL.md         # Planning methodology
│   ├── research/SKILL.md          # Codebase exploration
│   ├── verification/SKILL.md       # Code validation
│   ├── context7/SKILL.md         # Live documentation
│   ├── refactor/SKILL.md          # Code refactoring
│   ├── git-commit/SKILL.md        # Conventional commits
│   └── reasoning/SKILL.md        # Functional thinking
└── agents/
    └── tachikoma.md                # Agent configuration
```

### How It Works

1. **Plugin Auto-Discovery**: The `tachikoma.ts` plugin automatically discovers all `.ts` files in the `tachikoma/` subdirectory
2. **Tool Registration**: Each script is registered as a tool with the name `tachikoma.<script-name>`
3. **Zero Configuration**: Just drop a new script in the directory - it becomes available automatically
4. **Agent Modules**: All agent logic (core, router, verifier, etc.) lives in the same directory
5. **Skills**: Agent Skills.io skills are also in the plugins directory

### Adding New Scripts

To add a new capability:

1. Create a new `.ts` file in `src/plugin/tachikoma/`
2. Add a JSDoc comment at the top for description
3. Reinstall: `bun run install`

Example script:

```typescript
#!/usr/bin/env bun
/**
 * My new Tachikoma capability
 * Does something useful
 */

const args = Bun.argv.slice(2);

// Your script logic here
console.log(`Processing: ${args[0] || "no args"}`);
```

After reinstall, it becomes `tachikoma.my-new-capability` tool!

### Adding New Skills

To add a new skill:

1. Create a new directory in `.opencode/skills/`
2. Add a `SKILL.md` file with frontmatter
3. The skill is automatically discovered by OpenCode

Example skill:

```markdown
---
name: my-skill
description: My specialized skill
keywords:
  - keyword1
  - keyword2
triggers:
  - trigger1
  - trigger2
---

# My Skill

Instructions for this specialized skill...
```

Skills are loaded via the `skill` tool and don't require reinstallation.

## Installation Flow

1. Select installation location using arrow keys (↑/↓) or k/j
2. Press Enter to confirm selection
3. For custom paths, type destination
4. Review installation summary
5. Confirm to proceed
6. Installer creates backup if target exists
7. Files are copied (respects gitignore)
8. Installation complete!

## Backup

The installer automatically backs up existing `.opencode` directories before installation:

```
.opencode.backup-2026-02-23T16-30-00
```

Keep the backup until you're satisfied with the installation, then delete it manually.

## After Installation

Run OpenCode and use Tachikoma:

```bash
opencode
```

Then in OpenCode TUI:

```
@tachikoma help me refactor this function
```

### Using Tachikoma Tools

The agent has access to all Tachikoma scripts as tools:

```
Agent: Let me check where Tachikoma is installed
[Uses tachikoma.where tool]

Agent: I'll select the best edit format for this model
[Uses tachikoma.edit-format-selector with args="recommend"]
```

## About the Installer

The installer uses **clack**, a modern TUI library that provides:

- Clean, minimal aesthetics
- Native arrow key navigation (no bugs)
- Proper terminal handling
- Cross-platform support
- No manual cursor management

This follows modern Node.js/Bun CLI standards for interactive prompts.

## Manual Installation

If you prefer manual installation, copy these files:

### Global Installation

```bash
# Create directories
mkdir -p ~/.config/opencode/plugins/tachikoma
mkdir -p ~/.config/opencode/plugins/tachikoma/skills
mkdir -p ~/.config/opencode/agents

# Copy files
cp src/plugin/tachikoma.ts ~/.config/opencode/plugins/
cp src/plugin/tachikoma/*.ts ~/.config/opencode/plugins/tachikoma/
cp src/plugin/skills/*.ts ~/.config/opencode/plugins/tachikoma/skills/
cp src/agents/tachikoma.md ~/.config/opencode/agents/
```

### Local Installation

```bash
# Create directories
mkdir -p .opencode/plugins/tachikoma
mkdir -p .opencode/plugins/tachikoma/skills
mkdir -p .opencode/agents

# Copy files
cp src/plugin/tachikoma.ts .opencode/plugins/
cp src/plugin/tachikoma/*.ts .opencode/plugins/tachikoma/
cp src/plugin/skills/*.ts .opencode/plugins/tachikoma/skills/
cp src/agents/tachikoma.md .opencode/agents/
```

## Troubleshooting

### Scripts Not Showing Up

1. Ensure scripts are in `plugins/tachikoma/` directory
2. Script filenames must end in `.ts`
3. Scripts starting with `_` are ignored
4. Restart OpenCode after adding new scripts

### Tool Errors

If a tool fails to execute:

1. Check that the script has executable permissions
2. Verify the script accepts arguments correctly
3. Check that the script outputs to stdout (not stderr)
4. Look at OpenCode logs for detailed error messages

### Installation Fails

1. Ensure you have write permissions to the target directory
2. Check that `bun` is installed and in your PATH
3. Try removing the existing `.opencode` directory and retry
4. Use the `--help` flag for detailed usage information
