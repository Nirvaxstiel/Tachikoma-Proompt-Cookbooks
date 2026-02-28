# OpenSage Research Integration

Research backing for Tachikoma's OpenSage self-programming agent generation engine.

## Overview

**Paper:** OpenSage: Self-programming Agent Generation Engine
**Authors:** Hongwei Li, Zhun Wang, Qinrun Dai, et al.
**Venue:** ICML 2026
**arXiv:** https://arxiv.org/abs/2602.16891
**Implementation:** [Implementation Status](../capabilities/opensage-self-programming.md)

## Problem Statement

Traditional Agent Development Kits (ADKs) follow a **human-centered paradigm**:

- Engineers manually design agent topologies
- Developers create toolsets upfront
- Fixed memory structures defined by humans
- Limited scalability and generalizability

This is analogous to **early machine learning** with handcrafted features.

## OpenSage's Solution

**AI-centered paradigm** — Let LLMs create agents, tools, and memory structures.

Three core innovations:

### 1. Self-Generating Agent Topology

**Problem:** Static agent structures can't adapt to task requirements.

**Solution:** Agents dynamically create subagents based on task analysis.

#### Vertical Decomposition

```typescript
Complex task → Analyze → Subtask 1, Subtask 2, Subtask 3
                            ↓            ↓           ↓
                        Agent 1    Agent 2   Agent 3
```

**Results from paper:**

- 60.2% resolved rate on CyberGym (vs 39.4% baseline)
- 20% improvement from vertical decomposition alone
- Reduced context overflow (6.4 vs 13.1 summarization events)

#### Horizontal Ensemble

```typescript
Task → Multiple Strategies → Agent 1, Agent 2, Agent 3
                               ↓        ↓         ↓
                           Results → Merge → Best Solution
```

**Results from paper:**

- 15% improvement from ensemble mechanism
- Better for tasks with multiple valid approaches
- Reduced bias from single approach

### 2. Dynamic Tool Synthesis

**Problem:** Fixed toolsets limit agent capabilities and cause hallucinations.

**Solution:** Agents write their own tools on-demand.

#### Architecture

```
Agent Tool Generation:
┌──────────────────────────┐
│  Tool Specification      │
│  - Name, Description     │
│  - Args (Zod schema)     │
│  - Implementation        │
│  - Dependencies          │
└──────────────────────────┘
              ↓
┌──────────────────────────┐
│  Tool Registration       │
│  - Add to tool registry  │
│  - Set permissions       │
│  - Create metadata       │
└──────────────────────────┘
```

**Results from paper:**

- 25% improvement from domain-specific toolkit
- 39 tools generated during CyberGym eval
- Tools: fuzzers, generators, validators
- Enables heterogeneous tool support

### 3. Hierarchical Memory Management

**Problem:** Linear memory is inefficient and lacks structure.

**Solution:** Graph-based memory with nodes and edges.

#### Graph Structure

```
Memory Graph:
┌───────────────────────────────────────┐
│ Nodes: Entities (code, concepts       │
│ Edges: Relationships (uses, creates)  │
│ Embeddings: Similarity search         │
└───────────────────────────────────────┘
```

**Results from paper:**

- 3-5x more efficient retrieval
- 30% context efficiency gain
- Memory agent +20% compression efficiency
- Supports complex knowledge representation

## Experimental Results

### Benchmarks

| Benchmark          | Task Type      | Baseline (OpenHands) | OpenSage | Improvement |
| ------------------ | -------------- | -------------------- | -------- | ----------- |
| CyberGym           | Security vuln  | 39.4%                | 60.2%    | +52.8%      |
| Terminal-Bench 2.0 | Terminal tasks | 64.7%                | 65.2%    | +0.8%       |
| SWE-Bench Pro      | Software eng   | 40.2%                | 59.0%    | +46.8%      |

### Ablation Studies

#### Self-Generating Agent Topology

| Configuration                  | Resolved Rate |
| ------------------------------ | ------------- |
| Full OpenSage                  | 60.2%         |
| No Horizontal (no ensemble)    | 52.6%         |
| No Vertical (no decomposition) | 42.8%         |
| No Feature (baseline)          | 39.4%         |

**Key findings:**

- Vertical decomposition: +20% impact
- Horizontal ensemble: +15% impact
- Combined: +35% over baseline
- Both essential for optimal performance

#### Tooling System

| Configuration                 | Resolved Rate |
| ----------------------------- | ------------- |
| Full OpenSage + Domain Tools  | 60.2%         |
| No Tools (raw terminal)       | 23.4%         |
| No Domain Tools (basic tools) | 36.7%         |

**Key findings:**

- Domain-specific toolkit: +25% impact
- Dynamic tool creation: enables specialization
- Tool management essential for heterogeneous tools

#### Memory System

| Configuration               | Context Efficiency |
| --------------------------- | ------------------ |
| Graph Memory + Memory Agent | 30% improvement    |
| Graph Memory (no agent)     | 15% improvement    |
| Linear Memory               | baseline           |

**Key findings:**

- Graph structure: 2x efficiency
- Memory agent: +15% efficiency
- Compression critical for long sessions

## Key Insights from Paper

### 1. AI-Centered Paradigm

**Finding:** LLMs can design better agent structures than humans for many tasks.

**Evidence:**

- Model-generated prompts often more precise
- Automatic specialization reduces cognitive load
- Task-specific tools generated on-demand
- Self-optimizing from performance data

**Implication for Tachikoma:**

- Enable agent generation for complex tasks
- Let models decide optimal decomposition
- Provide tools for tool creation
- Track and learn from agent performance

### 2. Task Decomposition Matters

**Finding:** Not all tasks benefit from the same approach.

**Evidence:**

- Sequential: Good for dependencies (API: design → models → impl)
- Parallel: Good for exploration (optimization, alternatives)
- Context isolation prevents overflow
- Specialized prompts improve focus

**Implication for Tachikoma:**

- Intent routing should detect decomposition needs
- Support both vertical and horizontal patterns
- Allow dynamic strategy selection
- Cost-aware routing for optimal choices

### 3. Dynamic Tooling is Powerful

**Finding:** AI-written tools enable capabilities impossible with fixed toolsets.

**Evidence:**

- 39 tools generated in CyberGym eval
- Fuzzers, validators, generators
- Task-specific optimization
- Adaptability to new domains

**Implication for Tachikoma:**

- Provide meta-tools for tool creation
- Tool sandboxing for safety
- Tool state management for complex workflows
- Async execution for long-running tools

### 4. Memory Structure Matters

**Finding:** Graph-based retrieval is significantly more efficient than linear.

**Evidence:**

- 3-5x efficiency improvement
- Relationship awareness improves relevance
- Memory agent enables compression
- Supports complex knowledge representation

**Implication for Tachikoma:**

- Implement graph-based memory
- Add memory agent for smart operations
- Support similarity and pattern search
- Memory compression hooks

## Limitations Observed

### Model Capability Gaps

The paper notes that SOTA models don't consistently use advanced features:

1. **Inconsistent topology creation** — Sometimes creates too many or too few agents
2. **Tool hallucinations** — Generated tools may reference non-existent functions
3. **Sub-agent scope mismatch** — Tools don't align with agent's task
4. **Over-complex instructions** — Generated prompts become confusing

**Implication for Tachikoma:**

- Add validation for generated agents
- Provide constraints for tool generation
- Use verification loops before deployment
- Simplify generated prompts when possible

### Current Model Limitations

Even with OpenSage, models have limitations:

- Not all models can effectively use self-programming
- Weaker models may struggle with coordination
- Complex tasks still require significant computation
- Context limits constrain agent depth

**Implication for Tachikoma:**

- Model-aware routing for OpenSage features
- Cost-aware decisions on when to use
- Fallback to traditional methods when needed
- Gradual introduction of self-programming

## Research Backing Tachikoma's Design

### Intent Routing

**From paper:** Task complexity determines optimal strategy.

**Tachikoma implementation:**

```yaml
opensage_vertical:
  patterns: ["multi-step task", "complex workflow"]
  confidence_threshold: 0.8

opensage_horizontal:
  patterns: ["explore alternatives", "ensemble"]
  confidence_threshold: 0.75
```

### Performance Tracking

**From paper:** Agents improve with experience.

**Tachikoma implementation:**

```typescript
class AgentRegistry {
  // Track success/failure per agent-task pair
  // Calculate averages for cost and latency
  // Recommend best agents for task types
}
```

### Graph Memory

**From paper:** Graph-based retrieval is 3-5x more efficient.

**Tachikoma implementation:**

```typescript
class GraphMemoryPlugin {
  // Add nodes (entities, code, concepts)
  // Add edges (relationships)
  // Query by similarity, pattern, traversal
  // Visualize with Mermaid diagrams
}
```

## Future Directions

Based on paper's conclusion and identified gaps:

### Short-term

1. **Better validation** — Prevent hallucinations in generated code
2. **Performance learning** — Optimize agent selection over time
3. **Tool templates** — Common patterns for tool generation
4. **Memory compression** — Smart summarization strategies

### Long-term

1. **Better models** — OpenSage needs stronger models to reach full potential
2. **Agent specialization** — Learn from task history to specialize prompts
3. **Tool ecosystem** — Share and reuse tools across sessions
4. **Memory integration** — Connect to codebases, documentation

### Research Opportunities

1. **Ablation studies** — Measure impact of each component
2. **Model comparison** — Which models benefit most from OpenSage?
3. **Task categorization** — When does self-programming help most?
4. **User studies** — How do users interact with self-programming agents?

## References

- [OpenSage Paper](https://arxiv.org/abs/2602.16891)
- [Tachikoma OpenSage Implementation](../capabilities/opensage-self-programming.md)
- [Research Overview](./overview.md)

## Notes

- Implementation aligns with paper's Section 3 (Key Techniques)
- Performance results from paper's Section 4 (Evaluation)
- Ablation analysis guides component prioritization
- Model limitations inform current implementation choices
