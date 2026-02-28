# Intent Routing

Automatic classification and routing of user requests to optimal execution strategies.

## Overview

Intent routing is the first phase of every Tachikoma request. It:

1. **Classifies** the user's intent
2. **Evaluates** task complexity
3. **Routes** to the optimal execution strategy
4. **Ensures** clarity before proceeding

## Classification Process

```
User Request
    ↓
Extract Intent
    ↓
Match to Patterns
    ↓
Confidence Score
    ↓
Route Decision
```

## Complexity Levels

### Low Complexity

**When:**

- Simple queries (<50 lines)
- Well-defined, single-step tasks
- High confidence (>0.9)

**Strategy:** Direct response
**Latency:** 1-2s

**Examples:**

- "What does this function do?"
- "How do I implement X?"
- "Explain this error message"

### Medium Complexity

**When:**

- Focused tasks requiring tools
- One domain of knowledge
- Moderate confidence (0.7-0.9)

**Strategy:** Single skill
**Latency:** 5-15s

**Examples:**

- "Create a new API endpoint"
- "Refactor this component"
- "Add tests for this module"

### High Complexity

**When:**

- Multi-step workflows
- Cross-domain knowledge
- Moderate confidence (0.5-0.7)

**Strategy:** Skill chain
**Latency:** 15-45s

**Examples:**

- "Implement authentication flow"
- "Set up CI/CD pipeline"
- "Migrate database schema"

### Very High Complexity

**When:**

- Large-context tasks (>2000 tokens)
- Complex orchestration
- Lower confidence (<0.5)

**Strategy:** RLM orchestration or subagent
**Latency:** 45-120s

**Examples:**

- "Refactor entire codebase"
- "Research architecture patterns"
- "Optimize system performance"

## Confidence Thresholds

| Score   | Action             | Rationale                         |
| ------- | ------------------ | --------------------------------- |
| < 0.5   | Ask clarification  | Too uncertain, risk of error      |
| 0.5-0.7 | RLM/Subagent       | Complex, needs exploration        |
| 0.7-0.9 | Single skill/chain | Clear intent, moderate complexity |
| > 0.9   | Direct response    | Simple, well-understood           |

## Configuration

Intent routes are defined in `config/intent-routes.yaml`:

```yaml
routes:
  # Debug and troubleshooting
  debug:
    patterns:
      - "debug"
      - "fix bug"
      - "troubleshoot"
    confidence_threshold: 0.7
    skill: dev
    strategy: direct

  # Verification-focused tasks
  verify:
    patterns:
      - "verify"
      - "test"
      - "validate"
    confidence_threshold: 0.6
    skill_chain: implement-verify
    strategy: sequential

  # Complex tasks
  complex:
    patterns:
      - "refactor"
      - "migrate"
      - "optimize"
    confidence_threshold: 0.5
    subagent: rlm-optimized
    strategy: rlm

  # Simple queries
  query:
    patterns:
      - "what is"
      - "how do i"
      - "explain"
    confidence_threshold: 0.9
    strategy: direct
```

## Decision Tree

```
User Input
    ↓
Extract Intent Keywords
    ↓
Match Against Routes
    ↓
Confidence > 0.7?
    ├── NO → Ask user for clarification
    ↓ YES
Context > 2000 tokens?
    ├── YES → Use RLM subagent
    ↓ NO
Task Complexity?
    ├── Simple → Direct response
    ├── Medium → Single skill
    ├── High → Skill chain
    └── Very High → RLM orchestration
    ↓
Load context module (if applicable)
    ↓
Execute
    ↓
Reflect (freedom to question)
```

## Best Practices

### For Users

1. **Be specific** — Clear requests get classified faster
2. **Provide context** — Mention relevant files or domains
3. **Clarify ambiguity** — If asked, provide more detail

### For Skill Authors

1. **Define clear patterns** — Specific keywords improve routing
2. **Set appropriate thresholds** — Match confidence to task risk
3. **Consider complexity** — Route based on actual task requirements

## Examples

### Example 1: Clear Intent → Direct Response

**User:** "How do I create a new API endpoint in Express?"

**Classification:**

- Pattern: "how do i"
- Domain: Express
- Confidence: 0.95
- Complexity: Low

**Route:** Direct response
**Latency:** 1-2s

### Example 2: Medium Complexity → Single Skill

**User:** "Create a new REST API endpoint for user authentication"

**Classification:**

- Pattern: "create", "api endpoint"
- Domain: Authentication
- Confidence: 0.85
- Complexity: Medium

**Route:** Single skill (code-agent)
**Latency:** 5-15s

### Example 3: High Complexity → Skill Chain

**User:** "Implement OAuth2 authentication with JWT tokens, refresh tokens, and role-based access control"

**Classification:**

- Pattern: "implement", "authentication"
- Domain: OAuth2, JWT, RBAC
- Confidence: 0.75
- Complexity: High

**Route:** Skill chain (implement-verify-test)
**Latency:** 15-45s

### Example 4: Very High Complexity → RLM

**User:** "Refactor the entire authentication system to use microservices architecture with proper separation of concerns"

**Classification:**

- Pattern: "refactor", "entire system"
- Domain: Microservices
- Confidence: 0.5
- Complexity: Very High

**Route:** RLM orchestration
**Latency:** 45-120s

## Research

This feature is based on research from:

- **Cost-Aware Routing** — "When Do Tools and Planning Help LLMs Think?" (arXiv:2601.02663)
  - Finding: Tools improve accuracy by +20% but add 40x latency
  - Implication: Match tool usage to task complexity

[Learn more about the research →](../research/cost-aware-routing.md)

## See Also

- [Context Management](./context-management.md) — Loading project-specific context
- [Skill Execution](./skill-execution.md) — How skills are invoked
- [Skill Chains](./skill-chains.md) — Orchestrating multiple skills
- [PAUL Methodology](./paul-methodology.md) — Structured development
