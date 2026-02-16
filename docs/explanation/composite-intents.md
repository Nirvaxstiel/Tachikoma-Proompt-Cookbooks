# Composite Intents

Multi-intent workflows for complex user requests.

## What Are Composite Intents?

Sometimes a user's request contains multiple distinct intents that should be handled together. Composite intents automatically decompose these requests and execute the component intents in order.

## Why Composites?

**Example Request:**
```
"Research how to implement JWT authentication, then implement it"
```

This contains TWO intents:
1. `research` - Learn about JWT
2. `implement` - Write the code

Without composites, you'd have to:
- Choose one intent (lose information)
- Ask user to split request (friction)
- Guess (risky)

With composites, Tachikoma handles both automatically.

## Available Composite Intents

### 1. research-and-implement

**Components:** `research` + `implement`

**Description:** Investigate a topic, then implement the solution

**Use When:**
- User says "research X, then implement"
- "Figure out how to do Y and code it"
- "Learn about Z and add it"

**Example:**
```
User: "Research the best React state management library and implement it"
→ Composite: research-and-implement
→ Actions:
  1. Research Redux, Zustand, Jotai, Context
  2. Implement chosen solution
→ Result: Informed implementation with best practices
```

### 2. implement-and-test

**Components:** `implement` + `debug`

**Description:** Write code and verify it works

**Use When:**
- User says "implement X and test it"
- "Add Y and make sure it works"
- "Build Z and verify"

**Example:**
```
User: "Implement the API endpoint and test it works"
→ Composite: implement-and-test
→ Actions:
  1. code-agent: Implement endpoint
  2. debug: Run tests, verify functionality
→ Result: Working, verified implementation
```

### 3. refactor-and-test

**Components:** `implement` + `debug`

**Description:** Refactor code with verification

**Use When:**
- User says "refactor X and ensure it still works"
- "Clean up Y and test"
- "Restructure Z and verify"

**Example:**
```
User: "Refactor the authentication module and ensure tests pass"
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

1. **Keep it Simple** - Max 2-3 components per composite
2. **Logical Order** - Components should make sense in sequence
3. **Clear Documentation** - Describe what each composite does
4. **Test Edge Cases** - What if component 1 fails?

## Composites vs Skill Chains

| Feature | Composite Intents | Skill Chains |
|---------|------------------|--------------|
| What | Multiple user intents | Multiple skills for one intent |
| Execution | Intent → Intent | Skill → Skill → Skill |
| Use Case | User has multi-part request | One intent needs verification |
| Example | Research + Implement | Generate → Verify → Format |

**When to use what:**
- User says "do X then Y" → **Composite**
- Task needs verification steps → **Skill Chain**
- Both apply → Use both (composite calls skill chain)

## Troubleshooting

**Composite not detected?**
- Check intent classifier keywords
- Verify composite is enabled in config
- Try rephrasing request

**Component fails?**
- Check individual intent configuration
- Review context modules for each component
- Consider fallback rules

## Examples in Action

### Example 1: Research + Implement
```
User: "I need to add Redis caching. Research the best approach then implement it."

Detected: research-and-implement composite

Step 1 (Research):
- Research: Redis patterns, libraries, best practices
- Fetches context7 for latest Redis docs

Step 2 (Implement):
- Implements chosen caching strategy
- Adds proper error handling

Result: Well-researched, properly implemented caching layer
```

### Example 2: Implement + Test
```
User: "Build the payment webhook handler and make sure it handles errors properly"

Detected: implement-and-test composite

Step 1 (Implement):
- Creates webhook handler
- Adds validation logic

Step 2 (Debug/Test):
- Runs error scenarios
- Fixes edge cases
- Verifies logging

Result: Robust, tested webhook handler
```

## See Also

- [Skill Chains](/explanation/skill-chains) - Multi-skill workflows
- [Intent Routing](/explanation/intent-routing) - Configuration details
- [Intent Classifier](/reference/skills) - How detection works
