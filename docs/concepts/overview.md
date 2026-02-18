# What is Tachikoma?

A smart dispatcher for your AI assistant that routes requests to the right specialist.

## What and Why

Instead of throwing every request at one general-purpose model, Tachikoma:

- **Classifies your request** - Figures out what you want to do
- **Routes to the right specialist** - Uses the best tool for the job
- **Loads relevant context** - Brings in project-specific rules

### Why This Matters

**Without Tachikoma:**

- One model tries to do everything
- Works for simple tasks, fails at complex ones
- Frequent confusion and hallucinations
- Slower, less reliable

**With Tachikoma:**

- Specialists handle what they're good at
- Consistent, high-quality results
- Fewer mistakes and hallucinations
- Faster and more efficient

## Example

```
User: "Fix authentication bug"
    ↓
Tachikoma:
  1. Classifies: debug intent (confidence: 95%)
  2. Loads: coding-standards context
  3. Routes to: code-agent skill
  4. Returns: Bug fixed
```

## How It Works

1. **Classify** - What are you asking?
2. **Load** - Load project rules (context modules)
3. **Route** - Send to the right skill or subagent
4. **Return** - Result + confidence score

## Core Intents

| Intent      | What It Means   | Example                                         |
| ----------- | --------------- | ----------------------------------------------- |
| `debug`     | Fix issues      | "fix bug", "why is this broken"                 |
| `implement` | Write code      | "add feature", "create component"               |
| `review`    | Analyze code    | "review this code", "check for issues"          |
| `research`  | Find info       | "find docs", "research API"                     |
| `git`       | Version control | "commit changes", "create PR"                   |
| `document`  | Documentation   | "update README", "write docs"                   |
| `complex`   | Large context   | "refactor entire codebase", "analyze all files" |

## Extended Intents

| Intent          | Description                    | Skill                                                         |
| --------------- | ------------------------------ | ------------------------------------------------------------- |
| `refactor`      | Restructure code               | [code-agent](../capabilities/skill-execution.md)              |
| `skill-compose` | Combine skills                 | [skill-composer](../capabilities/skill-chains.md)             |
| `optimize`      | Context/token optimization     | [context-manager](../capabilities/context-management.md)      |
| `verify`        | High-reliability generation    | [verifier-code-agent](../capabilities/skill-execution.md)     |
| `reflect`       | Self-critique and verification | [reflection-orchestrator](../capabilities/skill-execution.md) |
| `edit-optimize` | Model-aware edit format        | [model-aware-editor](../capabilities/skill-execution.md)      |

See [Intent Routing](../capabilities/intent-routing.md) for complete configuration.

## Composite Intents

For multi-step tasks, intents can be combined:

| Composite                | Components           | When It Triggers                   |
| ------------------------ | -------------------- | ---------------------------------- |
| `research-and-implement` | research + implement | "research X, then implement"       |
| `implement-and-test`     | implement + debug    | "implement X and test it"          |
| `refactor-and-test`      | implement + debug    | "refactor X and ensure tests pass" |

## Context Modules

Project-specific rules that Tachikoma loads automatically:

| Module             | Priority | Purpose                        |
| ------------------ | -------- | ------------------------------ |
| `core-contract`    | 0        | Universal rules (always first) |
| `coding-standards` | 10       | Code patterns                  |
| `commenting-rules` | 15       | Comments                       |
| `git-workflow`     | 20       | Git conventions                |
| `research-methods` | 30       | Investigation methodology      |

See [Context Modules](../capabilities/customization/context-modules.md) to add your own.

## Skills vs Subagents

| Type         | Use When           | Description                         |
| ------------ | ------------------ | ----------------------------------- |
| **Skill**    | Simple, fast tasks | Routine work, normal context        |
| **Subagent** | Complex tasks      | Large context, multi-step reasoning |

See [Subagents](../capabilities/subagents.md) for details.

## System Architecture

```
User Request
    ↓
Tachikoma (Primary Agent)
    ↓
Intent Classification
    ↓
Route → Skill or Subagent
    ↓
Load Context Modules
    ↓
Execute
    ↓
Return Results
```

See [Architecture](architecture.md) for detailed system design.

## Research Basis

Tachikoma is built on research-backed patterns from peer-reviewed papers.

Key findings include:

- **Position Bias** — Selective context loading addresses U-shaped attention bias
- **Tool-Augmented LLMs** — Cost-aware routing balances speed and accuracy
- **Modular Skills** — Specialized components beat monolithic approaches
- **Verification Loops** — Self-verification improves reliability for complex tasks

See [Research Overview](../research/overview.md) for complete references and detailed findings.

## Named After

**Tachikoma** — curious AI tanks from _Ghost in the Shell_. Always learning.

## Next Steps

- [Getting Started](../getting-started.md) - Install and setup
- [Skill Execution](../capabilities/skill-execution.md) - How skills work
- [Intent Routing](../capabilities/intent-routing.md) - How routing works
- [Skills Specification](../capabilities/skills-specification.md) - Agent Skills format
- [Create Custom Skill](../capabilities/customization/add-skill.md) - Add your own capabilities
