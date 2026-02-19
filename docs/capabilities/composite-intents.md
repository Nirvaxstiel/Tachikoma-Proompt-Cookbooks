# Composite Intents

Handle multi-part requests automatically.

## What This Is

Detects requests with multiple intents and executes them in order.

```
User: "Research X then implement it"
    ↓
Composite: research-and-implement
    ↓
1. research: Investigate X
2. implement: Build solution
    ↓
Reflect: Question approach, flag issues, suggest improvements
```

## Available Composites

| Composite | Components | Use When |
|-----------|------------|----------|
| `research-and-implement` | research + implement | "research X then implement" |
| `implement-and-test` | implement + debug | "implement X and test it" |
| `refactor-and-test` | implement + debug | "refactor X and ensure tests pass" |

## Configuration

```yaml
composite:
  enabled: true
  resolution_strategy: union

  definitions:
    - name: research-and-implement
      components:
        - research
        - implement
      description: Investigate then implement
```

## Detection

| Keywords | Composite |
|----------|-----------|
| "research... then implement" | research-and-implement |
| "implement... and test" | implement-and-test |
| "refactor... and test" | refactor-and-test |

## Context Merging

Context modules from all components combine (deduplicated):

```yaml
research-and-implement:
  research: [core-contract, research-methods]
  implement: [core-contract, coding-standards, commenting-rules]
  Combined: [core-contract, coding-standards, commenting-rules, research-methods]
```

## Composites vs Workflows

| Feature | Composite | Workflow |
|---------|-----------|----------|
| What | Multiple user intents | Sequential skills |
| Execution | Intent → Intent | Skill → Skill |
| Use case | "do X then Y" | Verification steps |

## Add Custom Composite

```yaml
composite:
  definitions:
    - name: my-composite
      components:
        - intent-a
        - intent-b
      description: What it does
```

## See Also

- [Skill Chains](/capabilities/skill-chains)
- [Intent Routing](/capabilities/intent-routing)
