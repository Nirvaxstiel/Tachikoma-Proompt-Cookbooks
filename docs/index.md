---
layout: home

hero:
  name: Tachikoma
  text: Smart Agent Orchestration
  tagline: Route requests to the right specialist, automatically
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started.md
    - theme: alt
      text: How It Works
      link: /concepts/overview.md

features:
  - title: Smart Routing
    details: Classifies requests and routes to the right skill or subagent automatically.
  - title: Context Awareness
    details: Loads project-specific rules only when relevant, improving accuracy and reducing context pollution.
  - title: Cost-Aware
    details: Matches strategy to task complexity - fast for simple tasks, thorough for complex ones.
  - title: Extensible
    details: Add custom skills, agents, and context modules for your specific needs.
  - title: Research-Backed
    details: Built on proven patterns from LLM research for optimal performance.
  - title: Open Standard
    details: Uses the Agent Skills open standard - compatible with many AI agents.
---

## What is Tachikoma?

Tachikoma is an intelligent dispatcher for your AI assistant. Instead of throwing every request at one general-purpose model, it figures out what you need and routes it to the right specialist.

### Why Use Tachikoma?

**Better Results:**
- Specialists handle what they're good at
- Fewer mistakes and hallucinations
- Consistent, high-quality output

**Faster Performance:**
- No wasted time on wrong tools
- Cost-aware routing matches complexity
- Efficient context loading

**Easy Customization:**
- Add project-specific rules
- Create custom skills and agents
- Extend as needed

## Quick Start

1. **Install** — Copy `.opencode/` and `AGENTS.md` to your project
2. **Open** — Start your AI agent in your project directory
3. **Ask** — Start asking questions, Tachikoma handles the rest

```bash
# One-line installation
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash -s --
```

## How It Works

```
Your Request
    ↓
Tachikoma classifies intent
    ↓
Loads relevant context
    ↓
Routes to right specialist
    ↓
Returns results
```

**Example:**
```
You: "Fix authentication bug"
Tachikoma:
  → Intent: debug (95% confidence)
  → Loads: coding-standards context
  → Routes to: code-agent skill
  → Returns: Bug fixed
```

## Core Concepts

- [Intent Classification](concepts/overview.md#core-intents) — Understands what you want to do
- [Skills](capabilities/skill-execution.md) — Specialists for specific tasks
- [Context Modules](capabilities/customization/context-modules.md) — Project-specific rules
- [Subagents](capabilities/subagents.md) — Handle large, complex tasks

## Available Skills

Tachikoma includes 20+ specialized skills:

- **Code Skills:** code-agent, analysis-agent, verifier-code-agent
- **Git Skills:** git-commit, pr
- **Workflow Skills:** workflow-management, task-tracking
- **Utility Skills:** context-manager, context7, formatter
- **Advanced:** reflection-orchestrator, model-aware-editor

See [Skill Execution](capabilities/skill-execution.md) for complete list.

## Customize for Your Project

### Add Skills

Create custom capabilities for your specific needs:

[Create Your First Skill →](capabilities/customization/add-skill.md)

### Add Context Modules

Define project-specific rules and conventions:

[Add Context Rules →](capabilities/customization/context-modules.md)

### Add Agents

Create specialized subagents for complex tasks:

[Add Subagent →](capabilities/customization/add-agent.md)

## Documentation

- [Getting Started](getting-started.md) — Installation and setup
- [Concepts](concepts/overview.md) — How the system works
- [Capabilities](capabilities/skill-execution.md) — Available features
- [Customization](capabilities/customization/overview.md) — Extend the system
- [Troubleshooting](troubleshooting.md) — Common issues and solutions

## Compatibility

Works with any AI agent that supports the [Agent Skills](https://agentskills.io) open standard, including:
- OpenCodeAI
- Claude Code
- Other Agent Skills-compatible agents

## Research-Backed

Built on proven patterns from LLM research:
- **Selective Context Loading** — Addresses "lost in the middle" problem
- **Cost-Aware Routing** — Balances speed and accuracy
- **Verification Loops** — Improves reliability for complex tasks

See [Research Overview](research/overview.md) for details.

---

**Ready to get started?** [Install Tachikoma →](getting-started.md)
