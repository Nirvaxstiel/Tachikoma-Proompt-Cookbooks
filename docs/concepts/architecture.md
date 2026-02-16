# Architecture

How the pieces fit together.

## Orchestrator Pattern

Tachikoma handles all requests through a predictable pipeline:

1. Receives request
2. Classifies intent
3. Loads context
4. Routes to skill/subagent
5. Returns result + confidence

Think of it as a router for your AI tasks. Instead of one model trying to do everything, we route requests to the right specialist.

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

Each step happens in sequence, with the option to stop early if something goes wrong. If intent classification is uncertain (low confidence), we ask for clarification instead of guessing.

## Cost-Aware Routing

We don't use a sledgehammer to crack nuts. Match strategy to task complexity:

| Complexity | Strategy | Latency |
|------------|----------|---------|
| Low | Direct | 1-2s |
| Medium | Single skill | 5-15s |
| High | Multi-skill | 15-45s |
| Very High | Orchestration | 45-120s |

**Research backing:** Tool use = +20% accuracy but +40x latency (arXiv:2601.02663). Using tools for simple tasks wastes time. Using direct responses for complex tasks hallucinates. We pick the right tool for the job.

## Execution Standard

All skills follow this standard:

1. **ANALYSIS** — What's the task?
2. **ASSUMPTIONS** — What do we know? (STOP if unclear)
3. **BUILD** — Execute
4. **VERIFY** — Did we invent anything?

**Priority order:** Accuracy → Determinism → Completeness → Speed

Notice speed is last. We prefer correct over fast, consistent over clever.

## Key Files

| File | Purpose |
|------|---------|
| `intent-routes.yaml` | Route definitions |
| `navigation.md` | Context index |
| `tachikoma.md` | Agent definition |

## See Also

- [Intent Routing](/capabilities/intent-routing) - How routing works in detail
- [Context Management](/capabilities/context-management) - Project rules
- [Skill Execution](/capabilities/skill-execution) - How skills work
- [Research](/research/overview) - Why this architecture works
