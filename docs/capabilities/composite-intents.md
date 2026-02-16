# Composite Intents

Handle complex requests with multiple intents.

## What Are Composite Intents?

Sometimes your request contains multiple distinct tasks. Composite intents detect these multi-part requests and execute them together in the right order.

This saves you from having to split complex requests into multiple messages.

## Why Composites?

**Example Request:**
```
"Research how to implement JWT authentication, then implement it"
```

This contains TWO intents:
1. `research` - Learn about JWT
2. `implement` - Write the code

Without composites, we'd have to:
- Choose one intent (lose information)
- Ask you to split the request (friction)
- Guess which part you want (risky)

With composites, Tachikoma handles both automatically.

## Available Composite Intents

### research-and-implement

**Components:** `research` + `implement`

**Description:** Investigate a topic, then implement the solution

**Use When:**
- You say "research X, then implement"
- "Figure out how to do Y and code it"
- "Learn about Z and add it"

**Example:**
```
User: "Research best React state management library and implement it"
→ Composite: research-and-implement
→ Actions:
  1. Research Redux, Zustand, Jotai, Context
  2. Implement chosen solution
→ Result: Informed implementation with best practices
```

### implement-and-test

**Components:** `implement` + `debug`

**Description:** Write code and verify it works

**Use When:**
- You say "implement X and test it"
- "Add Y and make sure it works"
- "Build Z and verify"

**Example:**
```
User: "Implement API endpoint and test it works"
→ Composite: implement-and-test
→ Actions:
  1. code-agent: Implement endpoint
  2. debug: Run tests, verify functionality
→ Result: Working, verified implementation
```

### refactor-and-test

**Components:** `implement` + `debug`

**Description:** Refactor code with verification

**Use When:**
- You say "refactor X and ensure it still works"
- "Clean up Y and test"
- "Restructure Z and verify"

**Example:**
```
User: "Refactor authentication module and ensure tests pass"
→ Composite: refactor-and-test
→ Actions:
  1. code-agent: Refactor module
  2. debug: Run tests, fix any regressions
→ Result: Cleaner code with preserved functionality
```

## How Composites Work

```
User Request → Intent Classifier → Detect Multiple Intents?
    ↓
YES → Decompose → Execute Intent 1 → Execute Intent 2 → Synthesize
    ↓
Return Combined Result
```

The intent classifier analyzes your request and detects when multiple intents are present. It then breaks down the request, executes each intent with the appropriate skills and context, and synthesizes the results.

## Configuration

Composite intents are defined in `intent-routes.yaml`:

```yaml
composite:
  enabled: true
  resolution_strategy: union

  definitions:
    - name: research-and-implement
      components:
        - research
        - implement
      description: Investigate then implement solution
```

## Detection

The intent classifier automatically detects composite requests:

| Keywords | Likely Composite |
|----------|-----------------|
| "research... then implement" | research-and-implement |
| "implement... and test" | implement-and-test |
| "refactor... and test" | refactor-and-test |
| "figure out... then add" | research-and-implement |

## Resolution Strategy

Currently supported: `union`

**Union Strategy:**
- Execute all component intents
- Combine context modules (remove duplicates)
- Use highest confidence threshold
- Synthesize outputs

## Context Module Handling

When executing composites, context modules are intelligently merged:

```yaml
research-and-implement:
  research context modules:
    - 00-core-contract
    - 30-research-methods

  implement context modules:
    - 00-core-contract
    - 10-coding-standards
    - 12-commenting-rules

  Combined (deduplicated):
    - 00-core-contract
    - 10-coding-standards
    - 12-commenting-rules
    - 30-research-methods
```

## Cost Considerations

Composites cost more than single intents but less than separate requests:

| Workflow | Cost |
|----------|------|
| Single intent | 1x |
| Composite | 1.5-2x |
| Two separate requests | 2x |

## Creating Custom Composites

Add to `intent-routes.yaml`:

```yaml
composite:
  enabled: true
  resolution_strategy: union

  definitions:
    - name: my-composite
      components:
        - intent-a
        - intent-b
      description: What this composite does
```

## Best Practices

1. **Keep it Simple** — Max 2-3 components per composite
2. **Logical Order** — Components should make sense in sequence
3. **Clear Documentation** — Describe what each composite does
4. **Test Edge Cases** — What happens if component 1 fails?

## Composites vs Skill Chains

| Feature | Composite Intents | Skill Chains |
|---------|------------------|--------------|
| What | Multiple user intents | Multiple skills for one intent |
| Execution | Intent → Intent | Skill → Skill → Skill |
| Use Case | User has multi-part request | One intent needs verification |
| Example | Research + Implement | Generate → Verify → Format |

**When to use what:**
- You say "do X then Y" → **Composite**
- Task needs verification steps → **Skill Chain**
- Both apply → Use both (composite can call skill chain)

## Troubleshooting

**Composite not detected?**
- Check intent classifier keywords
- Verify composite is enabled in config
- Try rephrasing your request

**Component fails?**
- Check individual intent configuration
- Review context modules for each component
- Consider fallback rules

## See Also

- [Skill Chains](/capabilities/skill-chains) - Multi-skill workflows
- [Intent Routing](/capabilities/intent-routing) - Configuration details
- [Skill Execution](/capabilities/skill-execution) - How individual skills work
