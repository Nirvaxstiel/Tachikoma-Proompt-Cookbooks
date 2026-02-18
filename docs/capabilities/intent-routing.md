# Intent Routing

## What & Why

Intent routing is the mechanism that takes your request, figures out what type of task it is, and matches it to the appropriate skill, subagent, or skill chain. This is defined in `.opencode/config/intent-routes.yaml`.

Without intent routing, you get the "do thing" problem (one model has to guess what you mean), wrong tool usage (using a generalist for a specialist task), and lost context (loading everything and losing important info in the middle). With intent routing, you get no guessing (know what you want before doing anything), the right specialist (each skill is optimized for its domain), selective context (only load what's relevant, not everything), and confidence transparency (see how certain Tachikoma is about the classification).

## Example

```
User: "Implement authentication system"
→ Tachikoma:
  1. Classifies: intent=implement, confidence=0.88
  2. Loads: coding-standards + commenting-rules context
  3. Routes to: code-agent skill
  4. Returns: Authentication implemented
```

## How It Works

1. **User makes request** — You say something
2. **Intent classifier analyzes** — What do you want to do?
3. **Routes match intent → specialist** — Find the right tool
4. **Context loads** — Load project rules relevant to this task
5. **Skill executes** — Do the work
6. **Result returns** — What happened + confidence

## Configuration

Routes are defined in `.opencode/config/intent-routes.yaml`:

```yaml
routes:
  # Skill route
  debug:
    skill: code-agent
    context_modules:
      - 00-core-contract
      - 10-coding-standards
      - 12-commenting-rules
    confidence_threshold: 0.7

  # Subagent routes
  explore:
    subagent: explore  # OpenCode built-in
    confidence_threshold: 0.5

  deep-research:
    subagent: general  # OpenCode built-in
    confidence_threshold: 0.5

  complex:
    subagent: rlm-optimized  # Tachikoma custom
    fallback_subagent: rlm-subcall
    confidence_threshold: 0.5
```

## Route Options

| Option | What It Does | Required? |
|--------|---------------|-----------|
| `skill` | Which skill handles this intent | Yes (unless subagent) |
| `subagent` | Which subagent handles this intent | Yes (unless skill) |
| `context_modules` | Which context modules to load | Yes |
| `confidence_threshold` | Minimum confidence to auto-route (0-1) | Yes |
| `tools` | Specific tools to make available | No |
| `strategy` | Execution strategy (`direct`, `rlm`) | No |
| `notes` | Human-readable notes | No |

## Confidence Thresholds

Confidence is Tachikoma's certainty about what you want.

- **>0.8** — Strict, ask more. Good for critical tasks.
- **0.5-0.8** — Balanced (recommended). Works for most cases.
- **<0.5** — Permissive, may misroute. Risky but fast.

**Practical advice:** Keep it at 0.7. High enough to avoid bad guesses, low enough to not be annoying.

## Confidence-Based Escalation

The `.opencode/config/confidence-routes.yaml` file configures confidence-based behavior:

```yaml
escalation_rules:
  low_confidence:
    threshold: 0.7
    action: add_verification
    route_to: verifier-code-agent

  very_low_confidence:
    threshold: 0.5
    action: ask_user
    reason: "Confidence too low for autonomous action"
```

This adds a second layer of intelligence: if confidence < 0.7, add verification before executing. If confidence < 0.5, ask for clarification.

## Fallback Behavior

When confidence is low or no route matches, Tachikoma doesn't guess:

```yaml
fallback:
  low_confidence:
    action: ask
    message: "I'm not sure how to categorize this request. Could you clarify what you're trying to do?"

  no_match:
    action: ask
    message: "I don't recognize this type of task. Please describe your goal in different terms."
```

Better to ask than to break something.

## Available Intents

### Core Intents

| Intent | Description | Handler |
|--------|-------------|---------|
| `debug` | Fix issues | skill: `code-agent` |
| `implement` | Write code | skill: `code-agent` |
| `review` | Analyze code | skill: `analysis-agent` |
| `research` | Find info | skill: `research-agent` |
| `git` | Version control | skill: `git-commit` |
| `document` | Documentation tasks | skill: `self-learning` |

### Extended Intents

| Intent | Description | Handler |
|--------|-------------|---------|
| `refactor` | Restructure code | skill: `code-agent` |
| `skill-compose` | Combine skills | skill: `skill-composer` |
| `optimize` | Context/token optimization | skill: `context-manager` |
| `verify` | High-reliability generation | skill: `verifier-code-agent` |
| `reflect` | Self-critique and verification | skill: `reflection-orchestrator` |
| `creative` | Creative exploration | skill: `analysis-agent` (high variance) |

### Subagent Intents

| Intent | Description | Handler |
|--------|-------------|---------|
| `explore` | Fast codebase exploration | subagent: `explore` (OpenCode built-in) |
| `deep-research` | Multi-step parallel research | subagent: `general` (OpenCode built-in) |
| `complex` | Large context (>2000 tokens) | subagent: `rlm-optimized` |

### Special Intents

| Intent | Description | Behavior |
|--------|-------------|-----------|
| `unclear` | Ambiguous requests | Ask for clarification |

## Context Coupling

Some context modules are coupled — if you load one, Tachikoma automatically loads the other:

```yaml
module_coupling:
  10-coding-standards:
    must_co_load:
      - 12-commenting-rules
    reason: "Commenting rules are inseparable from coding standards"
```

**Why:** Coding tasks almost always need both. Tachikoma ensures this happens automatically. You don't have to remember to include both.

## Real-World Examples

### Example 1: Adding a Custom Intent

Let's say you have a custom skill for database migrations. Add it to `intent-routes.yaml`:

```yaml
routes:
  database-migration:
    description: Plan and execute database migrations
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
      - 42-workflow-conventions
    skill: database-migration-manager
    tools:
      - Read
      - Write
      - Bash
    strategy: direct
    notes: Use for DB schema changes, migrations, and rollbacks
```

Then update the intent classifier to recognize migration requests:

```markdown
### Database Migration Patterns
- Keywords: `migrate`, `migration`, `schema change`, `database update`, `sql migration`
- Indicators: User mentions tables, schemas, SQL changes, or database versions
```

**Usage:**
```
User: "Migrate the user table to add email_verified column"
→ Intent: database-migration (confidence: 0.89)
→ Loads: core-contract + workflow-conventions
→ Routes to: database-migration-manager skill
→ Result: Migration planned and executed
```

### Example 2: Workflow for Security

For security-critical tasks, use a workflow (sequential):

```yaml
workflows:
  security-implementation:
    description: "Implementation with security verification"
    skills: [context7, code-agent, verifier-code-agent, reflection-orchestrator]
    mode: sequential
    context_modules:
      - 00-core-contract
      - 10-coding-standards
```

Add to routes:
```yaml
routes:
  security-implement:
    description: Security-critical implementations
    confidence_threshold: 0.6
    workflow: security-implementation
```

**Usage:**
```
User: "Implement password reset with secure tokens"
→ Intent: security-implement
→ Executes workflow:
  1. context7: Fetches OWASP password reset guidelines
  2. code-agent: Implements password reset
  3. verifier-code-agent: Verifies implementation is correct
  4. reflection-orchestrator: Self-critiques and validates
→ Result: Secure implementation with verification
```

### Example 3: Skills Bulk for Multi-Perspective

For flexibility, use skills_bulk (all at once):

```yaml
skills_bulk:
  comprehensive-review:
    description: "Multi-perspective code review"
    skills: [analysis-agent, reflection-orchestrator]
```

Add to routes:
```yaml
routes:
  comprehensive-review:
    description: Thorough multi-perspective code review
    confidence_threshold: 0.7
    skills_bulk: comprehensive-review
```

**Usage:**
```
User: "Do a comprehensive review of the payment module"
→ Skills loaded: analysis-agent + reflection-orchestrator
→ Agent decides: Uses analysis first, then reflection to validate
→ Result: Comprehensive report with self-verification
```

### Example 4: Complex Task with Confidence Escalation

For high-stakes tasks, configure confidence-based escalation:

```yaml
routes:
  production-deploy:
    description: Deploy to production
    confidence_threshold: 0.8  # High threshold for safety
    context_modules:
      - 00-core-contract
      - 42-workflow-conventions
    skill: deployment-workflow
    strategy: direct

confidence_routing:
  production-deploy:
    action: verify
    route_to: verifier-code-agent
    verification_required: true
    difficulty: critical
```

**Usage:**
```
User: "Deploy version 2.0.0 to production"
→ Intent: production-deploy
→ Confidence: 0.75 (below threshold of 0.8)
→ Action: Escalate to verifier-code-agent first
→ Verifier: Validates deployment plan
→ If verified: Proceed with deployment
→ If not verified: Ask for clarification
```

### Example 5: Custom Intent with Conditional Context

Load different context modules based on project type:

```yaml
routes:
  test-code:
    description: Run or write tests
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
      - 10-coding-standards
      - conditional:
        - if: project_type == "react"
          load: 43-testing-conventions
        - if: project_type == "python"
          load: 43-python-testing-standards
    skill: code-agent
```

## Pro Tips

1. **Always include `core-contract`** — It has universal rules that everything needs
2. **Keep threshold at 0.7** — Balance between safety and speed
3. **Use fallback rules** — Better to ask than to break something
4. **Test with real queries** — Intent classifier improves with pattern matching
5. **Add to confidence routes** — Configure escalation for your project's needs
6. **Document your routes** — Use the `notes` field to explain when each route applies
7. **Use workflows** — For sequential, multi-step workflows (implement → verify → format)
8. **Use skills_bulk** — When agent should decide which skills to use

## See Also

- [Context Management](/capabilities/context-management) - What context modules do
- [Add Intent](/capabilities/customization/add-intent) - How to extend routing
- [Concepts Overview](/concepts/overview) - Why we classify first
- [Architecture](/concepts/architecture) - How routing fits into the pipeline
