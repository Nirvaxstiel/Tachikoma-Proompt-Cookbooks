# Modules

Context modules that are loaded based on the detected intent.

## Core Modules (Always Loaded)

| Module | Description |
|--------|-------------|
| **00-core-contract** | Non-negotiable foundational rules and execution principles |

## Context Modules (Intent-Based)

| Module | Description |
|--------|-------------|
| **10-coding-standards** | Design primitives, patterns, style bias |
| **15-commenting-rules** | Minimal commenting philosophy |
| **20-git-workflow** | Git conventions, validation commands |
| **25-delegation-patterns** | When to use subagents |
| **30-research-methods** | Research, source evaluation |
| **35-workflow-management** | 6-phase spec-driven workflow |
| **40-task-tracking** | Progressive 3-file tracking system |
| **45-agent-orchestration** | Sequential agent workflows & handoffs |
| **50-prompt-safety** | Prompt engineering safety & compliance |

## Usage

Modules are automatically loaded based on the detected intent:

- **Implement** → Core + coding standards + commenting rules + workflow management + task tracking
- **Debug** → Core + coding standards
- **Research** → Core + research methods
- **Review** → Core + coding standards + delegation patterns
- **Git** → Core + git workflow
- **Complex tasks** → Core + delegation patterns → rlm-subcall

See the parent [README](../../../README.md) for more information on how the system works.
