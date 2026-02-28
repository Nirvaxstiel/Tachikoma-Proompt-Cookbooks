# Context Management

Position-aware loading of project-specific rules and knowledge.

## Overview

Context management loads project-specific rules, patterns, and knowledge only when relevant to the task. This:

- Reduces token consumption
- Improves accuracy with project-specific guidance
- Optimizes for U-shaped attention patterns
- Compresses context when needed

## The Position Bias Problem

Transformers have a **U-shaped attention bias** — tokens at the start and end of context receive more attention than tokens in the middle.

**Research:** "Found in the Middle" (Hsieh et al., ACL 2024)

**Impact:**

- Start position: 100% weight
- Middle position: 50% weight
- End position: 100% weight

## Tachikoma's Solution

### Position-Aware Loading

Place the most critical information at the **start** or **end** of context:

```text
[Most Critical Info] ← 100% weight
    ↓
[Supporting Details] ← 75% weight
    ↓
[Context Details] ← 50% weight
    ↓
[Less Important] ← 50% weight
    ↓
[Most Critical Info] ← 100% weight
```

### Critical Information Placement

**Place at start/end:**

- Project-specific rules
- Architecture constraints
- Critical patterns
- Must-have constraints
- Error conditions to avoid

**Place in middle:**

- File listings
- Code examples
- Implementation details
- Reference information

## Context Modules

Context modules are reusable blocks of project-specific knowledge.

### Module Structure

```text
.opencode/context-modules/
├── project-rules.md          # General project guidelines
├── architecture.md          # Architecture decisions
├── coding-standards.md      # Style and conventions
├── security-guidelines.md   # Security requirements
├── testing-standards.md     # Testing practices
├── api-conventions.md       # API design patterns
└── deployment-guide.md      # Deployment instructions
```

### Example Module

```markdown
# Architecture Rules

## Microservices Pattern

All new features must follow microservices architecture:

1. **Separate Concerns** — Each service handles one domain
2. **API-First** — Define OpenAPI specs before implementation
3. **Event-Driven** — Use message queues for async communication
4. **Stateless** — Services should not maintain local state
5. **Fail-Fast** — Gracefully handle downstream failures

## Database Rules

- Read replicas for high-traffic endpoints
- Connection pooling with max 10 connections
- All queries must be parameterized
- No N+1 queries allowed

## Security Requirements

CRITICAL: All endpoints must authenticate via JWT tokens.

- Validate tokens on every request
- Refresh tokens expire after 7 days
- Access tokens expire after 1 hour
- Implement rate limiting (100 req/min)
```

### Loading a Module

Skills reference modules instead of duplicating content:

```yaml
# skill: code-agent
context_module: architecture.md
```

This saves ~15% in token consumption vs inline duplication.

## Context Compression

Triggered at 70-80% context utilization.

### Compression Strategy

```markdown
## Files Changed (23 files)

### Core (8 files)

- src/core/router.ts (added routing)
- src/core/middleware.ts (auth middleware)
- src/core/handlers.ts (request handlers)
- src/core/errors.ts (error handling)
- ...

### Services (7 files)

- src/services/auth.service.ts
- src/services/user.service.ts
- ...

### Tests (8 files)

- tests/auth.test.ts
- tests/user.test.ts
- ...
```

**Benefits:**

- Maintains structure with explicit sections
- Can be read incrementally
- Merges with existing (don't regenerate)
- Reduces token usage by 40-60%

### When to Compress

| Metric              | Threshold     | Action               |
| ------------------- | ------------- | -------------------- |
| Context utilization | > 80%         | Compress immediately |
| History length      | > 5000 tokens | Summarize            |
| File count          | > 20 files    | Group by category    |

## Filesystem Patterns

For managing large outputs and avoiding re-fetching:

### Large Tool Outputs

Write outputs >2000 tokens to files:

```python
# Instead of returning massive output
return file.read()

# Write to file and return summary
file.write("analysis_results.json", results)
return {
    "summary": "Analysis complete",
    "results_file": "analysis_results.json",
    "key_findings": [...]
}
```

### Plan Persistence

Store intermediate results:

```python
# Save plan state
plan.save_state("plan_state.json")

# Load plan state
plan.load_state("plan_state.json")
```

## Project-Specific Context: AGENTS.md

Each project can include an `AGENTS.md` file with project-specific rules.

### Example AGENTS.md

```markdown
# Project Agent Configuration

## Coding Standards

- Use TypeScript strict mode
- Follow ESLint rules in .eslintrc.json
- Write tests for all new functions
- Use functional patterns where possible

## Architecture

- Frontend: Next.js with App Router
- Backend: FastAPI with async/await
- Database: PostgreSQL with pgBouncer
- Cache: Redis with 1h TTL

## Security

- All API calls must authenticate
- No hardcoded credentials
- Validate all user input
- Use parameterized queries

## Deployment

- Use GitHub Actions for CI/CD
- Deploy to Vercel (frontend) and Railway (backend)
- Environment variables in Railway dashboard
```

## Context Loading Order

When a skill is loaded, context is loaded in this order:

1. **System Prompt** — Core Tachikoma instructions
2. **Skill Instructions** — Skill-specific guidance
3. **AGENTS.md** — Project-specific rules (if exists)
4. **Context Module** — Referenced module (if specified)
5. **Project Files** — Relevant code files
6. **User Context** — Conversation history

## Best Practices

### For Context Module Authors

1. **Start with the most important** — Critical rules first
2. **Use explicit sections** — Files, decisions, next steps
3. **Keep it concise** — Token efficiency matters
4. **Avoid duplication** — Reference instead of repeat

### For Users

1. **Keep AGENTS.md updated** — Reflect current project rules
2. **Use context modules** — Reusable knowledge blocks
3. **Organize by priority** — Most critical first
4. **Review compression** — Ensure key info is preserved

## Research

This feature is based on research from:

- **Position Bias** — "Found in the Middle" (Hsieh et al., ACL 2024)
  - Finding: U-shaped attention bias in transformers
  - Implication: Place critical info at start/end

[Learn more about position bias →](../research/position-bias.md)

## See Also

- [Intent Routing](./intent-routing.md) — How context is selected
- [Skill Execution](./skill-execution.md) — Using context in skills
- [PAUL Methodology](./paul-methodology.md) — Structured context usage
