# Context Management

## What & Why

Context modules are project rules that Tachikoma loads by priority. They tell Tachikoma how your project works so you don't have to explain it every time. Think of them as `.gitignore` but for AI behavior patterns.

Without context management, you get repetitive explanations (have to explain your project conventions every time), inconsistent behavior (AI forgets your rules between sessions), and the "lost in the middle" problem (dumping all your docs causes AI to ignore important stuff). With context management, you get one-time setup (define rules once, use everywhere), selective loading (only load relevant rules, not everything), priority order (important rules at beginning - AI pays more attention), and automatic coupling (related rules load together like coding + commenting).

## Example

```
User: "Add a new component"
→ Tachikoma:
  1. Classifies: intent=implement
  2. Loads: coding-standards context (PascalCase components, src/components/)
  3. Routes to: code-agent skill
  4. Returns: Component added following your conventions
```

## How It Works

1. **Intent is classified** — Tachikoma figures out what you want to do
2. **Routes config specifies modules** — Each intent lists which context modules to load
3. **Modules load in priority order** — Lower numbers load first
4. **Rules are applied** — Skills follow loaded context while executing

## Available Context Modules

| Module | Priority | Purpose | When It Loads |
|--------|----------|---------|----------------|
| `00-core-contract` | 0 | Universal rules | Always (first) |
| `10-coding-standards` | 10 | Code patterns and conventions | Coding tasks (debug, implement, refactor, review) |
| `12-commenting-rules` | 12 | Commenting guidelines | Coding tasks (coupled with coding-standards) |
| `20-git-workflow` | 20 | Git conventions | Git tasks |
| `30-research-methods` | 30 | Investigation methodology | Research tasks |
| `50-prompt-safety` | 50 | Safety frameworks | All tasks |

## Priority System

Lower numbers load first. The spacing (10, 12, 20, etc.) leaves room for your custom modules.

**Custom module range:** 40-49
- 40: Your coding conventions
- 41: Your workflow rules
- 42: Your tooling preferences

## Context Coupling

Some modules are automatically coupled:

```yaml
module_coupling:
  10-coding-standards:
    must_co_load:
      - 12-commenting-rules
    reason: "Commenting rules are inseparable from coding standards"
```

**Why:** Coding tasks almost always need both. Tachikoma ensures this happens automatically. You don't have to remember to include both.

## How Loading Works

Context modules load in priority order for each intent. Each module builds on previous ones.

**Example: debug intent**

From `.opencode/config/intent-routes.yaml`:
```yaml
debug:
  context_modules:
    - 00-core-contract      # Load first
    - 10-coding-standards   # Load second
    - 12-commenting-rules   # Load third
```

**Load order:**
1. `00-core-contract` — Universal rules always first
2. `10-coding-standards` — Code patterns on top
3. `12-commenting-rules` — Commenting guidelines on top

Tachikoma reads `00-core-contract`, applies those rules, then reads `10-coding-standards` and applies on top, and so on. Later modules can override earlier ones if there's a conflict.

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
Always run `npm test` before committing. If tests fail, don't push.

## Code Style
- Use 2-space indentation
- Components: PascalCase
- Utils: camelCase
- No trailing whitespace
- Max line length: 80 characters

## Architecture
- Components in `src/components/`
- Utils in `src/utils/`
- No circular dependencies
- Export types from `src/types/`
```

## Use in Routes

Reference your custom modules in route definitions:

```yaml
routes:
  debug:
    context_modules:
      - 00-core-contract
      - 10-coding-standards
      - 40-my-rules          # Your custom rules
```

## Research Basis: Why Priority Loading?

Research shows LLMs have a "lost in the middle" problem:

- **U-shaped attention bias** — LLMs pay more attention to beginning and end of context (Hsieh et al., ACL 2024)
- **Serial position effects** — Middle items suffer from diminished attention (ACL 2025)
- **Selective retrieval outperforms full context** — RAG achieves 1250x cost reduction with better accuracy

**Our strategy:**
1. Load only relevant modules (don't dump everything)
2. Load in priority order (important stuff first)
3. Co-load coupled modules (rules that go together)
4. Delegate large context (>2000 tokens) to subagent

Result: Optimal attention utilization, better performance, lower cost.

## Tips

1. **Start with `core-contract`** — Never skip it, has universal rules
2. **Keep modules focused** — One concern per module
3. **Use custom modules** — Don't modify core modules, create your own
4. **Respect priority spacing** — Use 40-49 range, don't conflict with core
5. **Test with real tasks** — Verify rules work as expected

## See Also

- [Context Modules (Customization)](/capabilities/customization/context-modules) - How to create custom modules
- [Intent Routing](/capabilities/intent-routing) - How routing works
- [Customization Overview](/capabilities/customization/overview) - Other customization options
- [Architecture](/concepts/architecture) - How context fits into the pipeline
