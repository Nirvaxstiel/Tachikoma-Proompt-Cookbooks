# Context Management

Project rules loaded by priority. Define once, use everywhere.

## Example

```
User: "Add a new component"
    ↓
1. Classify: implement intent
2. Load: coding-standards (PascalCase, src/components/)
3. Route: code-agent
4. Result: Component follows your conventions
```

## Available Modules

| Module | Priority | Purpose | When |
|--------|----------|---------|------|
| `00-core-contract` | 0 | Universal rules | Always first |
| `10-coding-standards` | 10 | Code patterns | Coding tasks |
| `12-commenting-rules` | 12 | Comments | Coding tasks (coupled) |
| `20-git-workflow` | 20 | Git conventions | Git tasks |
| `30-research-methods` | 30 | Investigation | Research tasks |
| `50-prompt-safety` | 50 | Safety | All tasks |

## Priority System

Lower numbers load first. Spacing (10, 12, 20) leaves room for custom modules.

**Custom range:** 40-49

## Context Coupling

Some modules load together automatically:

```yaml
module_coupling:
  10-coding-standards:
    must_co_load:
      - 12-commenting-rules
```

## How Loading Works

```yaml
debug:
  context_modules:
    - 00-core-contract      # First
    - 10-coding-standards   # Second
    - 12-commenting-rules   # Third
```

Later modules can override earlier ones.

## Add Custom Module

Create `.opencode/context-modules/40-my-rules.md`:

```yaml
---
module_id: my-rules
name: My Project Rules
priority: 45
---

# My Project Rules

## Testing
Run `npm test` before committing.

## Code Style
- 2-space indentation
- Components: PascalCase
- Utils: camelCase
```

## Use in Routes

```yaml
routes:
  debug:
    context_modules:
      - 00-core-contract
      - 10-coding-standards
      - 40-my-rules
```

## Research Basis

LLMs have U-shaped attention bias — they pay more attention to beginning and end of context.

Strategy:
1. Load only relevant modules
2. Load in priority order
3. Delegate large context to subagent
4. Reflect on whether context was sufficient

## See Also

- [Context Modules (Customization)](/capabilities/customization/context-modules)
- [Intent Routing](/capabilities/intent-routing)
