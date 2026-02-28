---
name: meta
description: Coordinate self-generating agent topology and dynamic tools for complex tasks
keywords:
  - meta
  - self-programming
  - dynamic-agents
  - tool-generation
  - orchestration
  - vertical-decompose
  - horizontal-ensemble
triggers:
  - complex multi-step task
  - explore alternatives
  - generate agents
  - create specialized agent
  - dynamic tool
  - orchestrate
---

# Meta Orchestration

Coordinate self-generating agent construction following the OpenSage framework for AI-centered development.

## Core Principles

1. **Self-Generating Topology**: Create specialized agents dynamically based on task needs
2. **Dynamic Tool Synthesis**: Write custom tools at runtime for specific requirements
3. **AI-Centered Paradigm**: Let AI decide structure and tools
4. **Coordination Focus**: Manage agent lifecycles and result integration

## Vertical Decomposition Pattern

Use for complex multi-step tasks with dependencies:

```
1. @vertical-decompose task="Implement GraphQL auth API"
   subtasks=["Analyze existing auth system", "Design GraphQL schema", "Generate resolvers", "Implement JWT validation", "Write tests"]

2. Run generated agents sequentially, passing context forward
3. Each agent can spawn its own subagents
4. Results integrated by parent

Benefits:
- 60.2% resolved rate on CyberGym (vs 39.4% baseline)
- +20% improvement from vertical decomposition alone
- Reduced context overflow (6.4 vs 13.1 summarization events)
```

## Horizontal Ensemble Pattern

Use for exploring alternative approaches in parallel:

```
1. @horizontal-ensemble task="Optimize database query"
   strategies=["Index optimization", "Query rewriting", "Caching layer", "Denormalization"]

2. All agents explore in parallel
3. Analyze results and merge best approaches
4. Ensemble coordinator selects optimal solution

Benefits:
- +15% improvement from ensemble mechanism
- Better for tasks with multiple valid approaches
- Reduced bias from single approach
```

## Dynamic Tool Generation

When existing tools are insufficient:

```
1. Identify the specific requirement that existing tools can't satisfy
2. Write the tool specification (type, description, parameters)
3. Generate implementation using available languages (TypeScript, Python, Bash)
4. Test the tool immediately
5. Save state for reuse across sessions

Benefits:
- 25% improvement from domain-specific toolkit
- 39 tools generated during CyberGym eval
- Tools: fuzzers, generators, validators
- Enables heterogeneous tool support
```

## Coordination Flow

1. **Analyze Task**: Determine if vertical or horizontal approach is best
2. **Generate Agents**: Use `@generate-agent` or decomposition tools
3. **Coordinate Execution**: Launch agents, manage context passing
4. **Integrate Results**: Merge outputs, resolve conflicts
5. **Iterate**: Based on feedback, regenerate or specialize agents

## Cost Optimization

- Use weaker models for specialized subagents
- Reuse successful agents for similar tasks
- Enable ensemble only when uncertainty is high
- Track agent performance to recommend best options

## When to Use Meta Orchestration

**Use when**:
- Task involves multiple distinct sub-steps needing specialized handling
- Multiple approaches should be explored in parallel
- Domain-specific expertise would benefit from dedicated agents
- Task complexity warrants agent specialization over generalization
- Existing tools are insufficient for requirements

**Skip when**:
- Simple, well-understood tasks
- Single approach is clearly optimal
- Available tools are sufficient
- Time constraints prohibit orchestration overhead

## Memory Integration

Meta orchestration works with **context** skill for graph-based memory:

### Storing Knowledge
Store information when:
- A new code structure (class, function, module) is identified
- An architectural decision is made
- A user requirement is specified
- A bug or issue is discovered
- A solution pattern is found
- An API contract is defined

### Querying Memory
Query memory when:
- Understanding a new codebase area
- Looking for similar implementations
- Finding related functionality
- Understanding dependencies
- Locating configuration or setup code

**Note**: Memory operations require `context` skill loaded.

## Safety Rules

1. Always validate generated agent prompts before execution
2. Review generated tool code for security issues
3. Use sandboxed execution for untrusted code
4. Limit recursion depth in agent spawning
5. Enforce permissions on all generated tools

## Performance Insights

From OpenSage research:

| Configuration | Resolved Rate |
|---------------|---------------|
| Full OpenSage | 60.2% |
| No Horizontal | 52.6% |
| No Vertical | 42.8% |
| No Feature | 39.4% |

**Key findings**:
- Vertical decomposition: +20% impact
- Horizontal ensemble: +15% impact
- Combined: +35% over baseline
- Both essential for optimal performance

| Configuration | Context Efficiency |
|---------------|-------------------|
| Graph Memory + Memory Agent | +30% |
| Graph Memory (no agent) | +15% |
| Linear Memory | baseline |

**Key findings**:
- Graph structure: 2x efficiency
- Memory agent: +15% efficiency
- Compression critical for long sessions

## Integration with Other Skills

- **dev**: For implementing generated agent tasks
- **think**: For reasoning about agent architectures
- **plan**: For structured planning of orchestration
- **context**: For graph-based memory and knowledge persistence
