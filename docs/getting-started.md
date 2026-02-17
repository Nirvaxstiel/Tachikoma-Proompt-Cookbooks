# Getting Started

Quick setup guide to start using Tachikoma with your AI agent.

## What You Need

- An AI coding agent that supports Agent Skills (OpenCodeAI, Claude Code, etc.)
- Your project directory
- 5 minutes

## Installation

### Option 1: Install Script (Recommended)

```bash
# Install to current directory
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash -s --

# Install to specific directory
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash -s -- -C /your/project

# Install from specific branch
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash -s -- -b develop
```

### Option 2: Manual Copy

```bash
cp -r .opencode AGENTS.md /your/project/
```

**Important:** Don't gitignore `AGENTS.md` or `.opencode/` - these are needed for Tachikoma to work.

## Update

If you installed using the script:

```bash
# Update to latest version
./.opencode/tachikoma-install.sh

# Update to specific branch
./.opencode/tachikoma-install.sh -b develop
```

## What Gets Installed

```
your-project/
├── AGENTS.md              # System constitution (for AI agent)
└── .opencode/
    ├── agents/            # Primary agent + subagents
    ├── skills/            # 20 specialized skills
    ├── context/           # 6 context modules
    └── config/
        └── intent-routes.yaml  # Routing configuration
```

## Quick Test

1. Open your project in your AI agent
2. Ask: "What can you do?"
3. Tachikoma should respond by classifying your intent and explaining what it can do

**Example response:**
```
I can help you with various tasks:

✅ Code implementation
✅ Debugging and fixes
✅ Code review and analysis
✅ Research and investigation
✅ Git operations (commits, PRs)
✅ Documentation
✅ Complex tasks (large codebase analysis)

What would you like help with?
```

## How It Works

Tachikoma automatically:
1. **Classifies your request** - Figures out what you want to do
2. **Loads relevant context** - Brings in project-specific rules
3. **Routes to the right skill** - Uses the best tool for the job
4. **Executes and reports** - Does the work and tells you what happened

No manual configuration needed - it just works out of the box!

## Next Steps

- [How It Works](concepts/overview.md) - Understand the system architecture
- [Skills Specification](capabilities/skills-specification.md) - How skills are structured
- [Create Your First Skill](capabilities/customization/add-skill.md) - Add custom capabilities
- [Context Modules](capabilities/customization/context-modules.md) - Add project rules
- [Skill Templates](capabilities/skill-templates.md) - Ready-to-use examples
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

## Common Questions

**Q: Do I need to configure anything?**
A: No! Tachikoma works out of the box. Just install and start asking questions.

**Q: Which AI agents work with Tachikoma?**
A: Any agent that supports the [Agent Skills](https://agentskills.io) standard, including OpenCodeAI, Claude Code, and others.

**Q: Can I customize Tachikoma for my project?**
A: Yes! You can add custom skills, agents, and context modules. See the [Customization](capabilities/customization/overview.md) section.

**Q: How do I update Tachikoma?**
A: Just run the install script again or update manually from the repository.

## Support

If you run into issues:
1. Check [Troubleshooting](troubleshooting.md) for common problems
2. Review [AGENTS.md](../AGENTS.md) for system details
3. Check the [Agent Skills Specification](capabilities/skills-specification.md)

**Need help?** Check out the [Troubleshooting Guide](troubleshooting.md) or [FAQ](troubleshooting.md#faq).
