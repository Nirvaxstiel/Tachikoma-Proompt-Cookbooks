# Add Intent

Define new task types for Tachikoma to handle.

## Steps

1. Add route in `intent-routes.yaml`
2. (Optional) Add keywords to intent-classifier

## Add Route

Define how Tachikoma handles your new intent:

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

| Field | Required? | What it does |
|-------|-----------|--------------|
| `description` | Yes | Human-readable explanation |
| `confidence_threshold` | Yes | Minimum confidence (0-1) to auto-route |
| `context_modules` | Yes | Which context modules to load |
| `skill` OR `subagent` | Yes | Who handles this intent |
| `tools` | No | Specific tools to make available |

## Test

1. Add test queries to intent-classifier
2. Make request to Tachikoma
3. Check if classification works

## Examples

### Simple Intent

```yaml
routes:
  security:
    skill: security-audit
    confidence_threshold: 0.8
    context_modules:
      - 00-core-contract
      - 50-prompt-safety
```

### Complex Intent (subagent)

```yaml
routes:
  analyze-big:
    subagent: rlm-optimized
    confidence_threshold: 0.6
    context_modules:
      - 00-core-contract
      - 10-coding-standards
```

## See Also

- [Intent Routing](/capabilities/intent-routing) - How routing works
- [Add Skill](/capabilities/customization/add-skill) - Create custom skills
- [Context Management](/capabilities/context-management) - Configuring context modules
