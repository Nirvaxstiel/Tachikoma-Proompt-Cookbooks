# Context Navigation

**Quick Start:** Load context modules based on what you're doing.

---

## Structure

```
.opencode/context-modules/
├── 00-core-contract.md        # Universal rules (always loaded first)
├── 10-coding-standards.md     # Code patterns & design philosophy
├── 15-commenting-rules.md     # Comment guidelines
├── 20-git-workflow.md         # Git conventions & validation
├── 30-research-methods.md     # Investigation methodology
└── 50-prompt-safety.md        # Safety frameworks & compliance
```

---

## Quick Routes

| Task | Load These Context Files |
|------|-------------------------|
| **Debug code** | core-contract + coding-standards |
| **Implement feature** | core-contract + coding-standards + commenting-rules |
| **Review code** | core-contract + coding-standards |
| **Research topic** | core-contract + research-methods |
| **Git operations** | core-contract + git-workflow |
| **Write docs** | core-contract + commenting-rules |
| **Complex analysis** | core-contract |

---

## By Priority (Load Order)

Files are loaded in priority order (lower number = higher priority):

1. **00-core-contract** - Always loaded first (priority 0)
2. **10-coding-standards** - Design primitives (priority 10)
3. **15-commenting-rules** - Comment guidelines (priority 15)
4. **20-git-workflow** - Git conventions (priority 20)
5. **30-research-methods** - Research methodology (priority 30)
6. **50-prompt-safety** - Safety frameworks (priority 50)

---

## Using the Context Manager

For advanced context operations:

```bash
# Discover what context exists
bash .opencode/skills/context-manager/router.sh discover

# Fetch external documentation
bash .opencode/skills/context-manager/router.sh fetch "React" "hooks"

# Organize context files
bash .opencode/skills/context-manager/router.sh organize

# Clean up temporary files
bash .opencode/skills/context-manager/router.sh cleanup
```

See [Context Manager Skill](../skills/context-manager/SKILL.md) for full documentation.

---

## Adding Custom Context

Create new context files following the naming convention:

```bash
# Create a new context module (priority 40)
cat > .opencode/context-modules/40-my-project.md << 'EOF'
---
module_id: my-project-rules
name: My Project Patterns
priority: 40
depends_on:
  - core-contract
  - coding-standards
---

# My Project Specific Rules

## Testing
Always run `npm test` before committing.

## Naming
- Components: PascalCase
- Utilities: camelCase
- Constants: UPPER_CASE
EOF
```

Then add it to `intent-routes.yaml` to load it for specific intents.
