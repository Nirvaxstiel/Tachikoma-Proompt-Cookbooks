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

## Topology-Aware Routing

**Based on AdaptOrch (arXiv:2602.16873): Orchestration topology now dominates model capability in performance convergence era.**

Tachikoma extends intent routing with topology-aware orchestration, adding four canonical topologies to the existing complexity-based routing.

### Four Canonical Topologies

| Topology | Best For | Execution Mode | Coordination | Example Tasks |
|-----------|------------|----------------|-------------|---------------|
| **Parallel** | Independent subtasks, no dependencies | No coordination needed | Code formatting, independent tests, parallel searches |
| **Sequential** | Linear dependencies, order matters | Simple queue | Multi-step features with clear order, pipeline tasks |
| **Hierarchical** | Natural tree structure, master-slave | Master orchestrator, subordinate roles | Refactoring, multi-layer architecture, domain decomposition |
| **Hybrid** | Mixed patterns, cross-cutting ties | Dynamic coordination | Complex multi-domain projects, research with synthesis |

### Topology Selection Algorithm

Topology is selected using O(|V| + |E|) mapping:

```
Task DAG Analysis
     ↓
Extract Characteristics (independence, dependencies, hierarchy, ties)
     ↓
Score Each Topology (parallel, sequential, hierarchical, hybrid)
     ↓
Select Highest Score (with confidence)
     ↓
Rationale Generation
```

**Characteristic Analysis:**
- `hasIndependentSubtasks` - Can subtasks execute in parallel?
- `hasSequentialDependencies` - Are dependencies linear/sequential?
- `hasHierarchicalStructure` - Does task have natural tree structure?
- `hasCrossCuttingTies` - Are there cross-cutting dependencies between branches?
- `requiresCoordination` - Are there merge points needing explicit coordination?
- `requiresConsensus` - Do subtasks have conflicting approaches needing resolution?

**Scoring Matrix:**

| Factor | Parallel | Sequential | Hierarchical | Hybrid |
|---------|----------|-----------|-------------|---------|
| Independent subtasks | +4 | -2 | -2 | +3 |
| No sequential deps | +3 | +4 | +2 | +2 |
| Hierarchical structure | -2 | +1 | +4 | +3 |
| Cross-cutting ties | - | -3 | -2 | +2 |
| No coordination needed | +2 | - | +2 | +2 |
| Consensus needed | -2 | -2 | - | +2 |

### Integration with Complexity-Based Routing

Topology-aware routing **extends** (does not replace) complexity-based routing:

1. **First Pass:** Classify task characteristics and select topology
2. **Second Pass:** Apply complexity-based routing within selected topology
3. **Synergy:** Topology determines structure, complexity determines resource allocation

**Example Integration:**

```
User: "Implement authentication and integrate with existing user system"
     ↓
Topology Classification: Hierarchical (has structure, requires coordination)
     ↓
Complexity: High (multi-step, cross-domain)
     ↓
Route: Hierarchical decomposition with skill chain
     ↓
Execution: Master orchestrator → Auth subtask → Integration subtask
```

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

## Topology-Aware Routes

Intent routes support topology hints for optimal orchestration:

```yaml
routes:
  # Independent parallel tasks
  parallel-coding:
    patterns:
      - "format code"
      - "run tests in parallel"
    confidence_threshold: 0.7
    topology_hint: "parallel"
    skill: dev
    strategy: direct

  # Hierarchical decomposition
  hierarchical-refactor:
    patterns:
      - "refactor.*architecture"
      - "reorganize.*structure"
    confidence_threshold: 0.6
    topology_hint: "hierarchical"
    skill_chain: decomposition-implement
    strategy: hierarchical

  # Complex hybrid tasks
  hybrid-research:
    patterns:
      - "research.*and.*implement"
      - "design.*and.*build"
    confidence_threshold: 0.5
    topology_hint: "hybrid"
    skill_chain: research-design-implement
    strategy: hybrid
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
    Topology Classification
     ↓ Analyze task characteristics (independence, dependencies, hierarchy, ties)
     ↓ Classify into topology (parallel, sequential, hierarchical, hybrid)
     ↓ Select orchestration pattern based on topology
     ↓
     Context > 2000 tokens?
     ├── YES → Use RLM subagent
     ↓ NO
    Task Complexity & Topology
     ├── Simple + Parallel → Direct response
     ├── Simple + Sequential → Direct response
     ├── Simple + Hierarchical → Direct response
     ├── Simple + Hybrid → Direct response
     ├── Medium + Parallel → Single skill (parallel)
     ├── Medium + Sequential → Single skill (sequential)
     ├── Medium + Hierarchical → Skill chain (master-slave)
     ├── Medium + Hybrid → Skill chain (coordinated)
     ├── High + Parallel → RLM orchestration (parallel)
     ├── High + Sequential → RLM orchestration (sequential)
     ├── High + Hierarchical → RLM orchestration (hierarchical)
     ├── High + Hybrid → RLM orchestration (coordinated)
     └── Very High + Any → RLM orchestration
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

---

## OpenSage Integration with Topology-Aware Routing

OpenSage coordinator has been enhanced with full topology-aware orchestration, integrating all 6 research-backed features:

### Integrated Features

| Feature | Research Paper | Performance Improvement | Status |
|---------|---------------|----------------------|---------|
| **Topology-Aware Routing** | AdaptOrch (arXiv:2602.16873) | 12-23% improvement | ✅ Integrated |
| **Graph-Based Tool Routing** | Graph Self-Healing (arXiv:2603.01548) | 93% LLM reduction | ✅ Integrated |
| **Hierarchical Memory** | LycheeCluster (arXiv:2603.08453) | 3.6x speedup | ✅ Integrated |
| **Rubric-Based Verification** | Inference Scaling (arXiv:2601.15808) | 8-11% accuracy gains | ✅ Integrated |
| **Inter-Agent Attention** | Attention-MoA (arXiv:2601.16596) | 91.15% LC Win Rate | ✅ Integrated |
| **Skill Outcome Tracking** | SkillOrchestra (arXiv:2602.19672) | 700x learning cost reduction | ✅ Integrated |

### OpenSage Usage

```typescript
import { OpensageCoordinator, type OpenSageIntegrationConfig } from '@opencode-ai/plugin/tachikoma';

const coordinator = new OpensageCoordinator({
  // Core configuration
  worktree: process.cwd(),
  enableMemory: true,
  enableTools: true,
  enableAgents: true,
  maxAgents: 10,
  maxTools: 20,

  // Topology-aware routing
  topology: {
    enabled: true,
    autoSelectTopology: true,
    minConfidence: 0.5,
  },

  // Graph-based routing
  graphRouting: {
    enableGraphRouting: true,
    llmFallbackThreshold: 0.5,
    maxLLMFallbackPercentage: 10,
  },

  // Hierarchical memory indexing
  hierarchicalIndexing: {
    maxLevelSize: 100,
    branchingFactor: 5,
    chunkStrategy: "boundary-aware",
    semanticBoundaryTokens: 512,
    enableLazyUpdates: true,
  },

  // Rubric-based verification
  verification: {
    enableRubricVerification: true,
    combineWithGVR: true,
    enableTestTimeScaling: true,
    maxHistorySize: 1000,
    confidenceThresholds: {
      very_low: 0.1,
      low: 0.25,
      medium: 0.5,
      high: 0.75,
      very_high: 0.95,
      critical: 1.0,
    },
  },

  // Inter-agent attention
  attention: {
    mechanism: "scaled-dot-product",
    numHeads: 8,
    temperature: 1.0,
    dropout: 0.1,
    enableCaching: true,
    cacheSize: 1000,
  },

  // Skill outcome tracking
  skillTracking: {
    enabled: true,
    tracking: {
      learningRate: 0.1,
      maxHistorySize: 1000,
      confidenceThreshold: 0.7,
    },
    routing: {
      strategy: "competence-based",
      useCompetenceModel: true,
    },
  },
});

// Initialize coordinator
await coordinator.initialize();

// Plan execution with topology classification
const plan = await coordinator.planExecution("Implement authentication system with user registration", {
  enableEnsemble: true,
});

console.log(`Topology: ${plan.topology?.type}`);
console.log(`Agents: ${plan.agents.length}`);
console.log(`Estimated cost: ${plan.estimatedCost}`);

// Execute plan
const result = await coordinator.executePlan(plan, {
  userId: "user-123",
  sessionId: "session-456",
});

console.log(`Success: ${result.success}`);
console.log(`Agents used: ${result.metrics.agentsUsed.join(", ")}`);
console.log(`Total time: ${result.metrics.totalTime}ms`);
```

### Execution Topologies

OpenSage now supports all four canonical topologies with intelligent routing:

1. **Parallel Topology** - Independent subtasks execute concurrently
   - Use when: Formatting code, running independent tests, parallel searches
   - Benefit: Maximum throughput for independent work

2. **Sequential Topology** - Linear dependencies executed in order
   - Use when: Multi-step features with clear order, pipeline tasks
   - Benefit: Correct execution when dependencies matter

3. **Hierarchical Topology** - Master orchestrator with subordinate agents
   - Use when: Refactoring, multi-layer architecture, domain decomposition
   - Benefit: Clear ownership and coordination

4. **Hybrid Topology** - Mixed patterns with cross-cutting coordination
   - Use when: Complex multi-domain projects, research with synthesis
   - Benefit: Flexible orchestration for complex tasks

### Available Tools

OpenSage coordinator exposes 16 tools for monitoring and management:

**Graph Routing Tools:**
- `graph-route` - Route task using deterministic graph routing
- `graph-stats` - Get routing statistics
- `graph-health` - Get tool health status
- `graph-reset-stats` - Reset routing statistics

**Memory Indexing Tools:**
- `index-add` - Add content to hierarchical index
- `index-search` - Search with O(log N) retrieval
- `index-stats` - Get index statistics
- `index-clear-cache` - Clear query cache
- `index-chunk` - Chunk content preserving semantic boundaries

**Verification Tools:**
- `rubric-verify` - Verify results with 65 failure types
- `verification-report` - Get verification statistics
- `rubric-config` - Manage verification configuration
- `clear-verification-cache` - Clear verification cache

**Skill Tracking Tools:**
- `skill-metrics` - Get learning metrics
- `competence-report` - Get competence for specific skill
- `tracking-stats` - Get tracking configuration

### Performance Expectations

Based on research validation and implementation:

| Metric | Expected Value | Implementation |
|--------|---------------|---------------|
| **Topology Classification** | 12-23% improvement | ✅ Implemented |
| **Graph-Based Routing** | 93% LLM call reduction | ✅ Implemented |
| **Hierarchical Retrieval** | 3.6x speedup (O(log N)) | ✅ Implemented |
| **Verification Accuracy** | 8-11% accuracy gain | ✅ Implemented |
| **Ensemble Synthesis** | 91.15% LC Win Rate | ✅ Implemented |
| **Skill Learning Efficiency** | 700x cost reduction | ✅ Implemented |

### Configuration Best Practices

**For Production:**
- Enable all features for maximum performance
- Use topology auto-selection for adaptive orchestration
- Set verification confidence thresholds to 0.8+
- Enable skill tracking for continuous improvement

**For Development:**
- Enable topology and graph routing for faster iteration
- Disable verification to reduce overhead during development
- Use lower confidence thresholds for testing

**For Cost Optimization:**
- Enable graph routing (93% LLM reduction)
- Use hierarchical memory (3.6x faster retrieval)
- Enable skill tracking for adaptive routing (700x learning cost reduction)

---

## Research

This feature is based on research from:

- **Cost-Aware Routing** — "When Do Tools and Planning Help LLMs Think?" (arXiv:2601.02663)
  - Finding: Tools improve accuracy by +20% but add 40x latency
  - Implication: Match tool usage to task complexity

- **Topology-Aware Orchestration** — "Task-Adaptive Multi-Agent Orchestration in the Era of LLM Performance Convergence" (arXiv:2602.16873)
  - Finding: Orchestration topology dominates model capability; 12-23% improvement over static single-topology baselines
  - Implication: Extend intent routing with topology classification; O(|V| + |E|) mapping algorithm

[Learn more about the research →](../research/cost-aware-routing.md)

## See Also

- [Context Management](./context-management.md) — Loading project-specific context
- [Skill Execution](./skill-execution.md) — How skills are invoked
- [Skill Chains](./skill-chains.md) — Orchestrating multiple skills
- [PAUL Methodology](./paul-methodology.md) — Structured development
