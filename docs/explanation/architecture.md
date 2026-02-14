# Architecture

## Orchestrator Pattern

Tachikoma handles all requests:
1. Receives request
2. Classifies intent
3. Loads context
4. Routes to skill/subagent
5. Returns result + confidence

## Components

| Component | Location | What it does |
|-----------|----------|--------------|
| Primary Agent | `tachikoma.md` | Always-on orchestrator |
| Intent Classifier | `intent-classifier/SKILL.md` | Classifies requests |
| Intent Routes | `intent-routes.yaml` | Maps intents → skills |
| Context Modules | `context/*.md` | Project rules by priority |

## Request Flow

```
User Request → Classify → Load Context → Route → Execute → Report
```

## Cost-Aware Routing

Match strategy to task complexity:

| Complexity | Strategy | Latency |
|------------|----------|---------|
| Low | Direct | 1-2s |
| Medium | Single skill | 5-15s |
| High | Multi-skill | 15-45s |
| Very High | Orchestration | 45-120s |

Based on: Tool use = +20% accuracy but +40x latency. Don't over-engineer simple tasks.

## Execution Standard

All skills follow:

1. **ANALYSIS** — What's the task?
2. **ASSUMPTIONS** — What do we know? (STOP if unclear)
3. **BUILD** — Execute
4. **VERIFY** — Did we invent anything?

Priority: Accuracy → Determinism → Completeness → Speed

## Key Files

| File | Purpose |
|------|---------|
| `intent-routes.yaml` | Route definitions |
| `navigation.md` | Context index |
| `tachikoma.md` | Agent definition |

## See Also

- [Intent Routing](/explanation/intent-routing)
- [Context Modules](/reference/context)
- [Skills](/reference/skills)
- [Research](/research/index)
