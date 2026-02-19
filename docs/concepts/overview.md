# What is Tachikoma?

Routes requests to the right specialist. Classifies intent, loads context, executes.

## Example

```
User: "Fix authentication bug"
    ↓
1. Classify: debug intent (95% confidence)
2. Load: coding-standards + commenting-rules
3. Route: code-agent skill
4. Execute: Bug fixed
```

## Core Intents

| Intent | What | Example |
|--------|------|---------|
| `debug` | Fix issues | "fix bug", "why broken" |
| `implement` | Write code | "add feature", "create" |
| `review` | Analyze code | "review this" |
| `research` | Find info | "find docs", "research API" |
| `git` | Version control | "commit", "create PR" |
| `document` | Documentation | "update README" |
| `complex` | Large context | "refactor entire codebase" |

## Extended Intents

| Intent | Description | Skill |
|--------|-------------|-------|
| `refactor` | Restructure code | code-agent |
| `verify` | High-reliability generation | verifier-code-agent |
| `reflect` | Self-critique | reflection-orchestrator |
| `explore` | Fast codebase search | subagent: explore |
| `deep-research` | Multi-step research | subagent: general |

## Context Modules

Project-specific rules loaded automatically:

| Module | Priority | Purpose |
|--------|----------|---------|
| `core-contract` | 0 | Universal rules |
| `coding-standards` | 10 | Code patterns |
| `commenting-rules` | 12 | Comments |
| `git-workflow` | 20 | Git conventions |
| `research-methods` | 30 | Investigation |

## Skills vs Subagents

| Type | Use When |
|------|----------|
| **Skill** | Routine tasks, normal context |
| **Subagent** | Large context, multi-step reasoning |

## Architecture

```
User Request
    ↓
[MUST] Intent Classification
    ↓
[MUST] Route → Skill or Subagent
    ↓
[MUST] Load Context Modules
    ↓
[MUST] Execute
    ↓
[FREE] Reflect
    ↓
Return Results
```

**Structure at the start, freedom at the end.**
User Request
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

## Research Basis

- **Position Bias** — Selective context loading
- **Tool-Augmented LLMs** — Cost-aware routing
- **Modular Skills** — Specialized beats monolithic
- **Verification Loops** — Self-verification improves reliability

See [Research Overview](../research/overview.md).

## Next Steps

- [Getting Started](../getting-started.md)
- [Skill Execution](../capabilities/skill-execution.md)
- [Intent Routing](../capabilities/intent-routing.md)
