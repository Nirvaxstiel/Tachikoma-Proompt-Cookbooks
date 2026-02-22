# Routing Configuration

Modular intent routing configuration for Tachikoma orchestrator.

## Files

| File               | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `intents.yaml`     | Intent definitions + keywords for classification |
| `skills.yaml`      | Skill definitions with loading instructions      |
| `contexts.yaml`    | Context module mappings + priorities             |
| `features.yaml`    | Feature flags (RLM, etc.)                        |
| `workflows.yaml`   | Sequential skill chains                          |
| `skills-bulk.yaml` | All-at-once skill loading groups                 |
| `composite.yaml`   | Composite intent definitions                     |
| `fallback.yaml`    | Fallback rules                                   |
| `behavior.yaml`    | Routing behavior + module coupling               |
| `variance.yaml`    | Strategic variance configuration                 |

## Usage

```bash
# Test router
bun run .opencode/cli/router.ts full "fix the bug" --json

# List routes
bun run .opencode/cli/router.ts route --list
```

## Migration

Replaced monolithic `intent-routes.yaml` (1068 lines) with modular structure.
