# Add Intent

## Steps

1. Add route in `intent-routes.yaml`
2. (Optional) Add keywords to intent-classifier

## Add Route

```yaml
routes:
  my-intent:
    description: What it means
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
    skill: code-agent
    tools:
      - Read
      - Write
```

## Options

| Required | What |
|----------|------|
| description | Human-readable |
| confidence_threshold | Min 0-1 |
| context_modules | Which to load |
| skill OR subagent | Who handles it |

## Test

1. Add test queries to intent-classifier
2. Make request
3. Check classification

## Examples

### Simple
```yaml
routes:
  security:
    skill: security-audit
    confidence_threshold: 0.8
```

### Complex (subagent)
```yaml
routes:
  analyze-big:
    subagent: rlm-optimized
    confidence_threshold: 0.6
```

## See Also

- [Intent Routing](/explanation/intent-routing)
