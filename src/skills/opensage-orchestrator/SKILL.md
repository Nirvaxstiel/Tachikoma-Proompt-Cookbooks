---
name: opensage-orchestrator
description: Coordinate self-generating agent topology, dynamic tools, and hierarchical memory
keywords: [opensage, self-programming, dynamic-agents, tool-generation, graph-memory]
---

# OpenSage Orchestrator

This skill enables AI-centered agent construction following the OpenSage framework.

## Core Principles

1. **Self-Generating Topology**: Create specialized agents dynamically based on task needs
2. **Dynamic Tool Synthesis**: Write custom tools at runtime for specific requirements
3. **Hierarchical Memory**: Use graph-based memory with dedicated memory agent
4. **AI-Centered Paradigm**: Let AI decide structure, tools, and persistence

## Vertical Decomposition Pattern

Use for complex multi-step tasks:

```
1. @vertical-decompose task="Implement GraphQL auth API"
   subtasks=["Analyze existing auth system", "Design GraphQL schema", "Generate resolvers", "Implement JWT validation", "Write tests"]

2. Run generated agents sequentially, passing context forward
3. Each agent can spawn its own subagents
4. Results integrated by parent
```

## Horizontal Ensemble Pattern

Use for exploring alternative approaches:

```
1. @horizontal-ensemble task="Optimize database query"
   strategies=["Index optimization", "Query rewriting", "Caching layer", "Denormalization"]

2. All agents explore in parallel
3. Analyze results and merge best approaches
4. Ensemble coordinator selects optimal solution
```

## Dynamic Tool Generation

When existing tools are insufficient:

```
1. Identify the specific requirement that existing tools can't satisfy
2. Write the tool specification (type, description, parameters)
3. Generate implementation using available languages (TypeScript, Python, Bash)
4. Test the tool immediately
5. Save state for reuse across sessions
```

## Memory Operations

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

## Coordination Flow

1. **Analyze Task**: Determine if vertical or horizontal approach is best
2. **Generate Agents**: Use `@generate-agent` or decomposition tools
3. **Coordinate Execution**: Launch agents, manage context passing
4. **Integrate Results**: Merge outputs, resolve conflicts
5. **Persist Knowledge**: Store learnings for future reference
6. **Iterate**: Based on feedback, regenerate or specialize agents

## Cost Optimization

- Use weaker models for specialized subagents
- Reuse successful agents for similar tasks
- Enable ensemble only when uncertainty is high
- Compress memory frequently to reduce context
- Track agent performance to recommend best options

## Safety Rules

1. Always validate generated agent prompts before execution
2. Review generated tool code for security issues
3. Use sandboxed execution for untrusted code
4. Limit recursion depth in agent spawning
5. Enforce permissions on all generated tools
