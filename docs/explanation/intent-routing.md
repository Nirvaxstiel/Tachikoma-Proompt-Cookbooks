# Intent Routing

## How It Works

1. User makes request
2. Intent classifier analyzes
3. Routes match intent → skill
4. Context loads
5. Skill executes

## Config

Edit `intent-routes.yaml`:

```yaml
routes:
  debug:
    skill: code-agent
    context_modules:
      - 00-core-contract
      - 10-coding-standards
    confidence_threshold: 0.7

  complex:
    subagent: rlm-optimized
    confidence_threshold: 0.5
```

## Options

| Option | What |
|--------|------|
| `skill` | Skill to invoke |
| `subagent` | Subagent to invoke |
| `context_modules` | Which modules to load |
| `confidence_threshold` | 0-1, when to auto-route |

## Confidence Threshold

- **>0.8** — Strict, ask more
- **0.5-0.8** — Balanced (recommended)
- **<0.5** — Permissive, may misroute

## Fallback

```yaml
fallback:
  low_confidence:
    action: ask
    message: "Clarify what you need?"
```

## Pro Tips

1. Always include `core-contract`
2. Keep threshold at 0.7
3. Use fallback rules

## See Also

- [Context Modules](/reference/context)
- [Add Intent](/how-to/add-intent)
