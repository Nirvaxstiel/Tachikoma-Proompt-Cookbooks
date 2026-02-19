# Intent Routing

Classifies requests and routes to the right specialist.

## Example

```
User: "Implement authentication system"
    ↓
1. Classify: implement (confidence: 0.88)
2. Load: coding-standards + commenting-rules
3. Route: code-agent
4. Result: Authentication implemented
```

## How It Works

1. User makes request
2. Intent classifier analyzes
3. Route matches intent → specialist
4. Context loads
5. Skill executes
6. Result returns

## Configuration

```yaml
# .opencode/config/intent-routes.yaml
routes:
  debug:
    skill: code-agent
    context_modules:
      - 00-core-contract
      - 10-coding-standards
      - 12-commenting-rules
    confidence_threshold: 0.7

  explore:
    subagent: explore  # OpenCode built-in
    confidence_threshold: 0.5

  complex:
    subagent: rlm-optimized
    fallback_subagent: rlm-subcall
```

## Route Options

| Option | What | Required |
|--------|------|----------|
| `skill` | Which skill | Yes (unless subagent) |
| `subagent` | Which subagent | Yes (unless skill) |
| `context_modules` | Which modules | Yes |
| `confidence_threshold` | Min confidence (0-1) | Yes |
| `tools` | Available tools | No |

## Confidence Thresholds

- **>0.8** — Strict, ask more
- **0.5-0.8** — Balanced (recommended)
- **<0.5** — Permissive, may misroute

## Available Intents

### Core

| Intent | Description | Handler |
|--------|-------------|---------|
| `debug` | Fix issues | code-agent |
| `implement` | Write code | code-agent |
| `review` | Analyze code | analysis-agent |
| `research` | Find info | research-agent |
| `git` | Version control | git-commit |
| `document` | Documentation | self-learning |

### Extended

| Intent | Description | Handler |
|--------|-------------|---------|
| `refactor` | Restructure | code-agent |
| `verify` | High-reliability | verifier-code-agent |
| `reflect` | Self-critique | reflection-orchestrator |
| `creative` | Exploration | analysis-agent (high variance) |

### Subagent

| Intent | Description | Handler |
|--------|-------------|---------|
| `explore` | Fast search | subagent: explore |
| `deep-research` | Multi-step research | subagent: general |
| `complex` | Large context | subagent: rlm-optimized |

## Context Coupling

```yaml
module_coupling:
  10-coding-standards:
    must_co_load:
      - 12-commenting-rules
```

## Fallback

```yaml
fallback:
  low_confidence:
    action: ask
    message: "I'm not sure. Could you clarify?"

  no_match:
    action: ask
    message: "I don't recognize this task type."
```

## Add Custom Intent

```yaml
routes:
  database-migration:
    description: Plan and execute migrations
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
    skill: database-migration-manager
```

## See Also

- [Context Management](/capabilities/context-management)
- [Add Intent](/capabilities/customization/add-intent)
- [Concepts Overview](/concepts/overview)
