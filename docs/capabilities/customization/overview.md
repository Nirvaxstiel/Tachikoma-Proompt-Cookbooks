# Customization

Extend Tachikoma with your own skills, agents, and project rules.

## Overview

Tachikoma is designed to be extended and customized for your specific needs. You can add:
- **Custom skills** — New capabilities for specific tasks
- **Custom agents** — Specialized subagents for complex workflows
- **Context modules** — Project-specific rules and conventions
- **Custom intents** — New intent types for better routing

## What You Can Customize

### Skills

Add new capabilities that Tachikoma can use:

**When to create skills:**
- Domain-specific tasks (e.g., database migrations, API integrations)
- Repeated workflows (e.g., deployment pipelines, documentation generation)
- Company-specific processes (e.g., code review guidelines, release procedures)

**Example:** Create a skill that handles your company's specific deployment process.

[Create a Skill →](add-skill.md)

### Subagents

Add specialized workers for complex, large-context tasks:

**When to create subagents:**
- Tasks requiring processing large codebases or documents
- Multi-step reasoning workflows
- Domain expertise beyond general coding

**Example:** Create a subagent that specializes in database schema analysis.

[Create a Subagent →](add-agent.md)

### Context Modules

Define project-specific rules and conventions:

**What to include:**
- Coding standards (indentation, naming conventions)
- Architecture patterns (where to put what)
- Testing conventions (how to write tests)
- Git workflow (branch naming, commit message format)
- Deployment rules (how to deploy, when to get approval)

**Example:** Define your team's coding standards so Tachikoma always follows them.

[Create Context Modules →](context-modules.md)

### Intents

Add new intent types for better classification:

**When to create intents:**
- Domain-specific task types (e.g., "database-migration")
- Repeated complex workflows (e.g., "full-deploy")
- Custom business processes

**Example:** Add a "security-audit" intent that routes to a specialized security skill.

[Create Intents →](add-intent.md)

## Customization Workflow

1. **Identify Need** — What do you want to add?
2. **Create Definition** — Write the skill/agent/module
3. **Add Route** — Configure how Tachikoma should use it
4. **Test** — Verify it works with real requests
5. **Iterate** — Refine based on usage

## Quick Examples

### Example 1: Add a Custom Skill

You frequently work with a specific API. Create a skill:

```bash
mkdir -p .opencode/skills/my-api-client
```

Create `SKILL.md`:
```yaml
---
name: my-api-client
description: Interact with My Company API. Use when user mentions API, external service, or specific endpoint.
---

# My Company API Client

## When to Use
User asks about:
- Fetching data from API
- Sending requests to API
- API authentication
- Rate limiting

## Workflow
1. Check credentials
2. Make API request
3. Handle response
4. Report results
```

Add to `intent-routes.yaml`:
```yaml
routes:
  api-request:
    description: Interact with My Company API
    skill: my-api-client
    context_modules:
      - 00-core-contract
```

### Example 2: Add Context Modules

Your team follows specific coding conventions:

```bash
touch .opencode/context/40-team-standards.md
```

```yaml
---
module_id: team-standards
name: Team Coding Standards
priority: 40
---
```

```markdown
# Team Coding Standards

## Naming
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

## Structure
- All components in `src/components/`
- Utils in `src/utils/`
- Types in `src/types/`

## Testing
- Write tests alongside code
- Test files: `*.test.ts`
- Minimum 80% coverage
```

### Example 3: Adjust Confidence Thresholds

Make Tachikoma stricter or more permissive:

```yaml
routes:
  debug:
    confidence_threshold: 0.8  # stricter - asks more

  implement:
    confidence_threshold: 0.5  # permissive - acts faster
```

**Guidelines:**
- **>0.8** — Strict, asks more. Good for critical tasks.
- **0.5-0.8** — Balanced. Recommended for most cases.
- **<0.5** — Permissive. Fast but may misroute.

## Best Practices

### DO

✅ **Start small** — Create simple skills first, iterate
✅ **Be specific** — Each skill/agent should have clear purpose
✅ **Test thoroughly** — Verify with real requests before deploying
✅ **Document clearly** — Write instructions that others can understand
✅ **Reuse existing patterns** — Check built-in skills before creating new ones

### DON'T

❌ **Over-complicate** — Keep skills focused and simple
❌ **Duplicate effort** — Check if existing skill does what you need
❌ **Ignore standards** — Follow Agent Skills specification
❌ **Skip testing** — Always verify with real usage
❌ **Mix concerns** — One skill/agent should do one thing well

## Common Use Cases

### Domain-Specific Skills

- Database operations (PostgreSQL, MongoDB, etc.)
- Cloud platform interactions (AWS, GCP, Azure)
- API integrations (REST, GraphQL, gRPC)
- Framework-specific tasks (React, Vue, Django, Rails)

### Workflow Automation

- CI/CD pipeline management
- Deployment orchestration
- Release process automation
- Documentation generation

### Team Standards

- Coding conventions
- Git workflow rules
- Code review guidelines
- Testing requirements

## Resources

### Guides
- [Skills Specification](../skills-specification.md) — Complete format reference
- [Add Skill](add-skill.md) — Create custom skills
- [Add Agent](add-agent.md) — Create custom subagents
- [Add Intent](add-intent.md) — Define new intent types
- [Context Modules](context-modules.md) — Add project rules

### Templates
- [Skill Templates](../skill-templates.md) — Ready-to-use examples
- [Troubleshooting](../../troubleshooting.md) — Common issues and solutions

### Reference
- [Agent Skills](https://agentskills.io) — Official Agent Skills standard
- [AGENTS.md](../../AGENTS.md) — System constitution

## Getting Help

If you're stuck:
1. Check [Troubleshooting](../../troubleshooting.md) for common issues
2. Review [Skills Specification](../skills-specification.md) for format details
3. Look at [Skill Templates](../skill-templates.md) for examples
4. Check existing skills in `.opencode/skills/` for patterns

## Next Steps

- [Create Your First Skill](add-skill.md) — Add custom capability
- [Create Context Module](context-modules.md) — Define project rules
- [Skill Templates](../skill-templates.md) — Ready-to-use examples
- [Troubleshooting](../../troubleshooting.md) — Common issues
