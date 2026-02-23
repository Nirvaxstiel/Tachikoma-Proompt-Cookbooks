# Subagents

Workers for large-context discovery and parallel task execution.

## Overview

Subagents are specialized worker agents that handle tasks that:

- Require large contexts (>2000 tokens)
- Benefit from parallel execution
- Need specialized exploration
- Run for extended periods

## When to Use Subagents

**Use subagents when:**
- Large-scale codebase discovery
- Parallel search across multiple locations
- Complex multi-step research
- Exploring unfamiliar codebases
- Running long-running analyses

**Examples:**
- "Find all authentication patterns across the codebase"
- "Research how payments are handled in this system"
- "Explore the API architecture and document all endpoints"
- "Analyze performance bottlenecks across the entire app"

## Subagent Types

### 1. Explore Agent

**Purpose:** Fast codebase exploration and discovery

**Best for:**
- Finding files by patterns
- Searching code for keywords
- Understanding architecture
- Quick exploration

**Thoroughness Levels:**
- `quick` — Basic search, shallow analysis
- `medium` — Balanced exploration
- `very thorough` — Comprehensive, deep analysis

**Example:**

```python
# Launch explore subagent
task(
  subagent_type="explore",
  description="Find authentication patterns",
  prompt="Find all files related to authentication, including login, signup, and session management. Search for patterns like 'auth', 'login', 'session', 'token'. Look at medium thoroughness level.",
)
```

### 2. General Agent

**Purpose:** General-purpose research and multi-step tasks

**Best for:**
- Complex research tasks
- Multi-step workflows
- Cross-domain tasks
- Extended analysis

**Example:**

```python
# Launch general subagent
task(
  subagent_type="general",
  description="Analyze payment system",
  prompt="""
  Analyze the payment processing system in this codebase:
  1. Find all payment-related files
  2. Identify payment providers used
  3. Trace the payment flow from API to database
  4. Document the architecture
  5. Identify potential issues

  Return a comprehensive report with file paths, diagrams, and recommendations.
  """,
)
```

## Subagent Lifecycle

```
Main Agent
    ↓
Identify Subagent Task
    ↓
Launch Subagent
    ├─ Isolated context
    ├─ Dedicated tools
    └─ Extended session
    ↓
Subagent Executes
    ├─ Research/Explore
    ├─ Multi-step work
    └─ Parallel tasks
    ↓
Subagent Returns
    ├─ Summary of findings
    ├─ File paths
    ├─ Recommendations
    └─ Next steps
    ↓
Main Agent Integrates
    ├─ Review results
    ├─ Apply findings
    └─ Continue work
```

## Task Tool Usage

The `task` tool launches subagents:

```python
task(
  subagent_type="general",
  description="Short description of task",
  prompt="Detailed task instructions",
  task_id="optional-task-id"  # Resume existing session
)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `subagent_type` | string | Type of subagent (general, explore) |
| `description` | string | Short description (3-5 words) |
| `prompt` | string | Detailed task instructions |
| `task_id` | string | Optional: Resume existing session |

### Resuming Sessions

Use `task_id` to continue work:

```python
# First call
task(
  subagent_type="general",
  description="Analyze architecture",
  prompt="Analyze the system architecture...",
  task_id="arch-analysis"
)

# Resume later
task(
  subagent_type="general",
  description="Continue analysis",
  prompt="Continue the architecture analysis, now focus on the data layer",
  task_id="arch-analysis"  # Resume!
)
```

## Parallel Execution

Subagents can run multiple tasks in parallel:

```python
# Launch multiple subagents in parallel
task(
  subagent_type="explore",
  description="Find auth patterns",
  prompt="Find authentication patterns...",
)

task(
  subagent_type="explore",
  description="Find API endpoints",
  prompt="Find all API endpoints...",
)

task(
  subagent_type="explore",
  description="Find database models",
  prompt="Find all database models...",
)

# All run in parallel!
```

**Benefits:**
- Faster overall execution
- Independent tasks don't block
- Better resource utilization

## Use Cases

### Use Case 1: Large-Scale Discovery

**Scenario:** Understand a new codebase with 1000+ files

**Approach:**

```python
# Subagent 1: Find architecture
task(
  subagent_type="explore",
  description="Find architecture patterns",
  prompt="Find the main architecture patterns: MVC, microservices, etc.",
)

# Subagent 2: Find API endpoints
task(
  subagent_type="explore",
  description="Document all API endpoints",
  prompt="Find and document all REST API endpoints",
)

# Subagent 3: Find database schema
task(
  subagent_type="explore",
  description="Analyze database schema",
  prompt="Analyze the database schema and relationships",
)

# Main agent: Integrate findings
# Wait for all subagents to complete
# Create comprehensive documentation
```

### Use Case 2: Parallel Research

**Scenario:** Research payment providers across multiple services

**Approach:**

```python
# Research Stripe integration
task(
  subagent_type="explore",
  description="Research Stripe integration",
  prompt="Find all Stripe-related code, analyze the integration",
)

# Research PayPal integration
task(
  subagent_type="explore",
  description="Research PayPal integration",
  prompt="Find all PayPal-related code, analyze the integration",
)

# Research crypto payments
task(
  subagent_type="explore",
  description="Research crypto payments",
  prompt="Find all crypto payment code, analyze the integration",
)

# Main agent: Compare and document
```

### Use Case 3: Extended Analysis

**Scenario:** Analyze performance across entire application

**Approach:**

```python
task(
  subagent_type="general",
  description="Performance analysis",
  prompt="""
  Perform comprehensive performance analysis:

  1. Find all database queries
  2. Identify N+1 query patterns
  3. Analyze caching strategies
  4. Check for memory leaks
  5. Review async operations
  6. Identify bottlenecks

  For each issue found:
  - Document the file and line
  - Explain the problem
  - Provide a solution

  Return a detailed performance report with prioritized recommendations.
  """,
  task_id="perf-analysis"
)
```

## Subagent vs Main Agent

| Aspect | Main Agent | Subagent |
|--------|-----------|----------|
| **Context** | In-session | Isolated |
| **Duration** | Short-medium | Medium-long |
| **Focus** | Implementation | Research/Exploration |
| **Tool Access** | All tools | Subset of tools |
| **Best For** | Code writing, edits | Discovery, analysis |
| **Latency** | Low (1-45s) | High (45-120s) |
| **Token Usage** | Efficient | Higher |

## Best Practices

### For Users

1. **Be specific** — Clear tasks get better results
2. **Set thoroughness** — Use appropriate exploration level
3. **Resume sessions** — Use task_id for long tasks
4. **Review results** — Always check subagent outputs

### For Skill Authors

1. **Use for discovery** — Don't use subagents for simple edits
2. **Parallelize** — Launch multiple subagents for speed
3. **Provide guidance** — Clear instructions = better results
4. **Set expectations** — Inform user about latency

## Research

This feature is based on research from:

- **RLM** — "Recursive Language Models" (arXiv:2512.24601)
  - Finding: Adaptive chunking enables 10M+ token contexts
  - Implication: Subagents can handle massive contexts

[Learn more about RLM →](../research/rlm.md)

## See Also

- [Intent Routing](./intent-routing.md) — How to use subagents
- [Skill Execution](./skill-execution.md) — Main agent execution
- [Research Overview](../research/overview.md) — Using research skill
