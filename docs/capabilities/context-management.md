# Context Management

How Tachikoma loads and manages project-specific rules.

## What Are Context Modules?

Context modules are project rules loaded by priority. They tell Tachikoma how your project works so you don't have to explain it every time.

Think of them as `.gitignore` but for AI behavior patterns.

## Available Modules

| Module | Priority | Purpose |
|--------|----------|---------|
| `core-contract` | 0 | Universal rules (always first) |
| `coding-standards` | 10 | Code patterns and conventions |
| `commenting-rules` | 15 | Commenting guidelines |
| `git-workflow` | 20 | Git commit conventions |
| `research-methods` | 30 | Investigation methodology |
| `prompt-safety` | 50 | Safety frameworks |

## Priority System

Lower numbers load first. The spacing between priorities (10, 15, 20, etc.) leaves room for your custom modules.

Your custom rules should go between 40-49:
- 40: Your coding conventions
- 41: Your workflow rules
- 42: Your tooling preferences

## How Loading Works

Context modules load in priority order. Each module builds on the previous ones.

```yaml
# Example: debug intent
debug:
  context_modules:
    - 00-core-contract      # Load first
    - 10-coding-standards   # Load second
    - 12-commenting-rules   # Load third
```

Tachikoma reads `00-core-contract`, applies those rules, then reads `10-coding-standards` and applies on top, and so on. Later modules can override earlier ones if there's a conflict.

## Why Priority Matters

Research shows LLMs have a "lost in the middle" problem — they pay more attention to the beginning and end of context and ignore the middle (Hsieh et al., ACL 2024).

By loading context in priority order and only loading what's relevant for each intent, we ensure:
- Important rules are at the beginning (highest attention)
- No rule gets "lost in the middle"
- Context stays lean and focused

## Add Custom Module

Create `.opencode/context/40-my-rules.md`:

```yaml
---
module_id: my-rules
name: My Project Rules
priority: 45
---

# My Project Rules

## Testing
Always run tests before committing. If tests fail, don't push.

## Code Style
- Use 2-space indentation
- No trailing whitespace
- Max line length: 80 characters

## Architecture
- Components in `src/components/`
- Utils in `src/utils/`
- No circular dependencies
```

## Use in Routes

```yaml
routes:
  debug:
    context_modules:
      - 00-core-contract
      - 10-coding-standards
      - 40-my-rules          # Your custom rules
```

## Context Coupling

Some modules are coupled — if you load one, you must also load the other:

- `coding-standards` ↔ `commenting-rules`
  - If you're coding, you probably also need commenting rules
  - Tachikoma automatically loads both when you specify either

## Pro Tips

1. Start with `core-contract` — never skip it
2. Keep modules focused — one concern per module
3. Use custom modules for project-specific rules — don't modify core modules
4. Priority spacing matters — leave gaps for future additions

## See Also

- [Customization Overview](/capabilities/customization/overview) - How to extend context
- [Add Intent](/capabilities/customization/add-intent) - Routing configuration
- [Architecture](/concepts/architecture) - How context fits into the pipeline
