# OpenSage Integration

Comprehensive orchestration system integrating 6 research-backed features for production-ready agent orchestration.

## Overview

OpenSage coordinator unifies state-of-the-art research (January-March 2026) into a single, production-ready orchestration framework. Each feature addresses a specific gap in the performance convergence era.

## Integrated Features

### 1. Topology-Aware Routing

**Research:** AdaptOrch (arXiv:2602.16873)
**Improvement:** 12-23% over static baselines

#### What It Does

Classifies task structure and selects optimal orchestration topology from four canonical patterns:

| Topology | Best For | Characteristics |
|-----------|------------|----------------|
| **Parallel** | Independent subtasks | No dependencies, maximum throughput |
| **Sequential** | Linear workflows | Clear order matters, pipeline tasks |
| **Hierarchical** | Structured decomposition | Master-slave, clear ownership |
| **Hybrid** | Complex multi-domain | Cross-cutting ties, mixed patterns |

#### How It Works

1. **Task DAG Analysis** - O(|V| + |E|) complexity
2. **Characteristic Detection** - Identify independence, dependencies, hierarchy
3. **Topology Scoring** - Score each topology against characteristics
4. **Selection** - Choose highest-scoring topology above confidence threshold
5. **Rationale Generation** - Explain why topology was selected

#### Example

```typescript
const plan = await coordinator.planExecution(
  "Implement authentication with user registration and password reset"
);

console.log(plan.topology.type);
// Output: "hierarchical"

console.log(plan.topology.rationale);
// Output: "Task decomposes naturally into hierarchical structure..."
```

### 2. Graph-Based Tool Routing

**Research:** Graph-Based Self-Healing (arXiv:2603.01548)
**Improvement:** 93% reduction in LLM control-plane calls

#### What It Does

Provides deterministic tool selection using cost-weighted graphs with automatic fallback.

#### Graph Structure

```
Tools (nodes):
├── bash (cost: 2, latency: 100ms)
├── edit (cost: 1, latency: 50ms)
├── write (cost: 1, latency: 50ms)
├── read (cost: 1, latency: 30ms)
├── glob (cost: 1, latency: 30ms)
└── grep (cost: 1, latency: 50ms)

Edges (weighted by cost + latency):
read → edit (51)
write → skill-dev (151)
bash → skill-dev (151)
```

#### Routing Algorithm

1. **Request Analysis** - Infer required capabilities from task
2. **Graph Traversal** - Find shortest path using Dijkstra's algorithm
3. **Health Check** - Filter out degraded/unavailable tools
4. **Fallback** - If no feasible path, fall back to LLM routing
5. **Statistics Tracking** - Monitor graph routing vs LLM fallback ratio

#### Example

```typescript
const path = await coordinator.routeTools(
  "Edit file with search and replacement",
  "read",
  "edit"
);

console.log(`Path: ${path.nodes.join(" → ")}`);
// Output: "read → edit"

console.log(`LLM Fallback: ${path.fallbackToLLM}`);
// Output: false
```

### 3. Hierarchical Memory Indexing

**Research:** LycheeCluster (arXiv:2603.08453)
**Improvement:** 3.6x speedup via O(log N) retrieval

#### What It Does

Organizes memory in hierarchical clusters with boundary-aware chunking for semantic coherence.

#### Index Structure

```
Level 0 (root)
├── Level 1 (semantic clusters)
│   ├── Level 2 (sub-clusters)
│   │   └── Level 3 (leaf nodes - actual content)
│   └── ...
└── ...
```

#### Chunking Strategy

**Boundary-Aware Chunking:**
- Detects semantic boundaries (headings, code blocks, separators)
- Preserves logical coherence within chunks
- Respects natural document structure

**Benefits:**
- Semantic chunks maintain context
- Better similarity search results
- More relevant memory retrieval

#### Example

```typescript
// Add content to index
await coordinator.indexMemory(
  "user-auth-implementation",
  `
# Authentication Flow

1. User submits credentials
2. Server validates
3. Token generated

\`\`\`typescript
function authenticate(credentials) {
  // implementation
}
\`\`\`
  `,
  { domain: "security", language: "typescript" }
);

// Search with O(log N) complexity
const results = await coordinator.searchIndexedMemory(
  "authentication token generation"
);

console.log(`Found ${results.length} results`);
console.log(`Score: ${results[0].score.toFixed(3)}`);
console.log(`Level: ${results[0].level}`);
```

### 4. Rubric-Based Verification

**Research:** Inference-Time Scaling (arXiv:2601.15808)
**Improvement:** 8-11% accuracy gains on challenging benchmarks

#### What It Does

Verifies execution results against 65 failure types across 5 categories using hierarchical rubric.

#### Failure Taxonomy

| Category | Subcategories | Types |
|----------|--------------|-------|
| **Syntax** | Types, Expressions, Statements | 10 types |
| **Semantics** | Logic, Data Flow, Control Flow | 13 types |
| **Behavior** | Edge Cases, Error Handling | 12 types |
| **Performance** | Latency, Memory, I/O | 15 types |
| **Security** | Injection, Authorization, Data | 15 types |

#### Verification Process

1. **Result Analysis** - Parse output and identify relevant rubric criteria
2. **Criteria Evaluation** - Check against failure taxonomy
3. **Scoring** - Generate confidence scores for each criterion
4. **Aggregation** - Combine scores into final verdict
5. **Iteration** - If failed, retry with feedback

#### Example

```typescript
const verification = await coordinator.verifyResult(
  "Implement user authentication",
  { success: true, code: "function auth() { return true; }" }
);

console.log(`Verified: ${verification.verified}`);
console.log(`Rubric Verdict: ${verification.verification.rubricVerdict}`);
console.log(`GVR Verdict: ${verification.verification.gvrVerdict}`);
console.log(`Iterations: ${verification.verification.iterations}`);
```

### 5. Inter-Agent Semantic Attention

**Research:** Attention-MoA (arXiv:2601.16596)
**Improvement:** 91.15% LC Win Rate

#### What It Does

Enhances horizontal ensemble synthesis using multi-head attention over agent outputs.

#### Attention Mechanism

**Scaled Dot-Product Attention:**
```
1. Compute Q, K, V matrices from agent outputs
2. Calculate attention weights: softmax(QK^T / sqrt(d_k))
3. Apply attention: attention_weights × V
4. Multi-head extension: parallel attention heads
```

**Synthesis Strategies:**
- **Weighted Average** - Weight by attention scores
- **Consensus** - Combine with attention-based confidence
- **Selection** - Pick highest-scoring output
- **Concatenation** - Join all outputs with attention

#### Example

```typescript
const plan = await coordinator.planExecution(
  "Optimize database queries for performance",
  { enableEnsemble: true }
);

// Horizontal ensemble with attention
const result = await coordinator.executePlan(plan, context);

// Ensemble automatically uses attention if multiple agents
console.log(`Attention Enabled: ${result.attentionEnabled}`);
console.log(`Synthesis Confidence: ${result.synthesisConfidence}`);
```

### 6. Skill Outcome Tracking

**Research:** SkillOrchestra (arXiv:2602.19672)
**Improvement:** 700x learning cost reduction

#### What It Does

Tracks skill execution outcomes to build competence models for adaptive routing.

#### Competence Model

**EMA-Based Tracking:**
- Exponential Moving Average for smooth learning
- Decay factor for temporal relevance
- Confidence intervals for uncertainty estimation

**Metrics Tracked:**
- Success rate
- Average quality
- Average latency
- Average cost
- Task type performance
- Trend detection (improving/stable/declining)

#### Adaptive Routing

**Routing Strategies:**
- **Competence-Based** - Route to highest-competence skill
- **Exploration** - Epsilon-greedy exploration
- **Hybrid** - Balance exploitation and exploration
- **Static** - Traditional routing (no learning)

#### Example

```typescript
// Skill automatically tracked during execution
const plan = await coordinator.planExecution("Refactor code");

// Competence models update automatically
const metrics = await coordinator.getLearningMetrics();

console.log(`Routing Accuracy: ${metrics.routingAccuracy.toFixed(2)}`);
console.log(`Convergence Rate: ${metrics.convergenceRate.toFixed(2)}`);

// Get competence for specific skill
const competence = await coordinator.getSkillCompetence("code-agent");
console.log(`Competence: ${competence.competence.toFixed(2)}`);
console.log(`Total Executions: ${competence.totalExecutions}`);
```

## Configuration

### Full Configuration Example

```typescript
const config: OpenSageIntegrationConfig = {
  // Core OpenSage settings
  worktree: process.cwd(),
  enableMemory: true,
  enableTools: true,
  enableAgents: true,
  maxAgents: 10,
  maxTools: 20,

  // Feature-specific settings
  topology: {
    enabled: true,
    autoSelectTopology: true,
    defaultTopology: undefined,
    minConfidence: 0.5,
  },

  graphRouting: {
    enableGraphRouting: true,
    llmFallbackThreshold: 0.5,
    maxLLMFallbackPercentage: 10,
  },

  hierarchicalIndexing: {
    maxLevelSize: 100,
    branchingFactor: 5,
    chunkStrategy: "boundary-aware",
    semanticBoundaryTokens: 512,
    enableLazyUpdates: true,
  },

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

  attention: {
    mechanism: "scaled-dot-product",
    numHeads: 8,
    temperature: 1.0,
    dropout: 0.1,
    enableCaching: true,
    cacheSize: 1000,
  },

  skillTracking: {
    enabled: true,
    tracking: {
      enableTracking: true,
      maxHistorySize: 1000,
      learningRate: 0.1,
      confidenceThreshold: 0.7,
      updateFrequency: 10,
      minExecutionsForConfidence: 5,
      decayFactor: 0.99,
      enableExploration: true,
      explorationRate: 0.1,
      anomalyDetection: true,
      anomalyThreshold: 0.3,
    },
    routing: {
      strategy: "competence-based",
      useCompetenceModel: true,
      fallbackToStatic: false,
      competenceWeight: 0.7,
      costWeight: 0.2,
      speedWeight: 0.1,
      diversityFactor: 0.1,
    },
  },
};
```

### Preset Configurations

**Production (Maximum Performance):**
```typescript
const productionConfig = {
  topology: { enabled: true, autoSelectTopology: true, minConfidence: 0.7 },
  graphRouting: { enabled: true, llmFallbackThreshold: 0.7 },
  verification: { enableRubricVerification: true, confidenceThresholds: { high: 0.85, very_high: 0.95 } },
  skillTracking: { enabled: true, routing: { strategy: "competence-based" } },
};
```

**Development (Fast Iteration):**
```typescript
const developmentConfig = {
  topology: { enabled: true, autoSelectTopology: true, minConfidence: 0.3 },
  graphRouting: { enabled: true, llmFallbackThreshold: 0.3 },
  verification: { enableRubricVerification: false }, // Disable for speed
  skillTracking: { enabled: false }, // Disable to reduce overhead
};
```

**Cost Optimization:**
```typescript
const costOptimizedConfig = {
  topology: { enabled: true, minConfidence: 0.5 },
  graphRouting: { enabled: true, llmFallbackThreshold: 0.5, maxLLMFallbackPercentage: 5 },
  hierarchicalIndexing: { enableLazyUpdates: true },
  verification: { enableRubricVerification: false }, // Reduce LLM calls
  skillTracking: { enabled: true, routing: { strategy: "competence-based" } },
};
```

## Performance Metrics

### Expected Improvements

Based on research validation:

| Feature | Metric | Expected Improvement | Status |
|---------|--------|-------------------|---------|
| Topology Routing | Accuracy | +12-23% | ✅ Implemented |
| Graph Routing | LLM Calls | -93% | ✅ Implemented |
| Hierarchical Memory | Retrieval Speed | 3.6x faster | ✅ Implemented |
| Verification | Accuracy | +8-11% | ✅ Implemented |
| Attention | LC Win Rate | 91.15% | ✅ Implemented |
| Skill Tracking | Learning Cost | -700x | ✅ Implemented |

### Monitoring

OpenSage provides comprehensive metrics through 16 tools:

```typescript
// Get all integration statistics
const tools = coordinator.getTools();

// Graph routing statistics
await tools["graph-stats"]();

// Memory index statistics
await tools["index-stats"]();

// Verification report
await tools["verification-report"]();

// Skill tracking metrics
await tools["skill-metrics"]();
```

## Best Practices

### For Production Deployments

1. **Enable All Features** - Maximum performance requires all integrations
2. **Use Auto-Selection** - Let topology and routing adapt automatically
3. **Set Appropriate Thresholds** - Balance confidence vs overhead
4. **Monitor Metrics** - Track LLM fallback, cache hit rates, routing accuracy
5. **Enable Skill Tracking** - Continuous improvement over time

### For Development

1. **Enable Topology and Graph Routing** - Faster iteration
2. **Disable Verification** - Reduce overhead during development
3. **Lower Confidence Thresholds** - Easier testing
4. **Use Static Routing** - Predictable behavior

### For Cost Optimization

1. **Enable Graph Routing** - 93% LLM reduction
2. **Use Hierarchical Memory** - 3.6x faster retrieval
3. **Disable Verification** - Unless high-stakes tasks
4. **Enable Skill Tracking** - Adaptive routing reduces unnecessary calls
5. **Limit LLM Fallback** - Keep maxLLMFallbackPercentage low

### For High-Stakes Tasks

1. **Enable Verification** - Catch errors before production
2. **Use High Confidence Thresholds** - 0.8+ for critical domains
3. **Enable Attention** - Better ensemble synthesis
4. **Use Hierarchical Topology** - Clear ownership and verification

## Troubleshooting

### Topology Classification Issues

**Problem:** Topology confidence too low, falling back to default

**Solution:**
- Lower `topology.minConfidence` (e.g., 0.3)
- Check task description clarity
- Enable `topology.autoSelectTopology` with `defaultTopology`

### Graph Routing Not Working

**Problem:** Everything falling back to LLM

**Solution:**
- Check `graph-health` for degraded tools
- Increase `graphRouting.llmFallbackThreshold`
- Verify tool dependencies are correct

### Memory Index Slow

**Problem:** Search not faster than linear scan

**Solution:**
- Check cache hit rate (should be >80%)
- Enable `hierarchicalIndexing.enableLazyUpdates`
- Adjust `hierarchicalIndexing.maxLevelSize` and `branchingFactor`

### Verification Too Slow

**Problem:** Adding significant latency

**Solution:**
- Disable for non-critical tasks
- Increase `verification.confidenceThresholds`
- Disable `verification.enableTestTimeScaling`

### Skill Tracking Not Learning

**Problem:** Routing accuracy not improving

**Solution:**
- Increase `skillTracking.tracking.learningRate`
- Ensure `skillTracking.tracking.enableExploration` is true
- Check `tracking-stats` for execution counts
- Verify routing strategy is not "static"

## API Reference

### OpensageCoordinator

#### Constructor

```typescript
constructor(config: Partial<OpenSageIntegrationConfig> = {})
```

#### Methods

```typescript
async initialize(): Promise<void>
async planExecution(task: string, options?: ExecutionOptions): Promise<ExecutionPlan>
async executePlan(plan: ExecutionPlan, context?: any): Promise<ExecutionResult>
getTools(): Record<string, ToolHandler>
getIntegrationConfig(): OpenSageIntegrationConfig
updateIntegrationConfig(config: Partial<OpenSageIntegrationConfig>): void

// Feature-specific methods
async indexMemory(id: string, content: string, metadata?: any): Promise<IndexedNode>
async searchIndexedMemory(query: string, topK?: number): Promise<QueryResult[]>
async verifyResult(task: string, result: any): Promise<VerificationResult>
async routeTools(task: string, startNode?: string, endGoal?: string): Promise<RoutingPath>
getLearningMetrics(): LearningMetrics | null
```

### Interfaces

```typescript
interface ExecutionPlan {
  type: "vertical" | "horizontal" | "single";
  topology?: AgentTopology;
  agents: AgentSpec[];
  estimatedCost: number;
  estimatedLatency: number;
}

interface ExecutionResult {
  success: boolean;
  results: any[];
  metrics: ExecutionMetrics;
  errors?: string[];
}

interface OpenSageIntegrationConfig {
  worktree: string;
  enableMemory: boolean;
  enableTools: boolean;
  enableAgents: boolean;
  maxAgents: number;
  maxTools: number;
  topology?: TopologyConfig;
  graphRouting?: GraphRoutingConfig;
  hierarchicalIndexing?: IndexConfig;
  verification?: VerificationPluginConfig;
  attention?: AttentionConfig;
  skillTracking?: {
    enabled: boolean;
    tracking: Partial<TrackingConfig>;
    routing: Partial<RoutingConfig>;
  };
}
```

## See Also

- [Intent Routing](./intent-routing.md) - How tasks are classified and routed
- [Context Management](./context-management.md) - Loading project-specific context
- [Skill Execution](./skill-execution.md) - How skills are invoked
- [PAUL Methodology](./paul-methodology.md) - Structured development

## Research References

1. **Topology-Aware Orchestration** - "Task-Adaptive Multi-Agent Orchestration in the Era of LLM Performance Convergence" (arXiv:2602.16873)
2. **Graph-Based Self-Healing** - "Graph-Based Self-Healing Tool Routing" (arXiv:2603.01548)
3. **Hierarchical Memory Indexing** - "LycheeCluster: Hierarchical Cluster-Based Vector Search" (arXiv:2603.08453)
4. **Inference-Time Scaling** - "Inference-Time Scaling of Verification" (arXiv:2601.15808)
5. **Inter-Agent Attention** - "Attention-MoA: Multi-Agent Orchestration with Inter-Agent Semantic Attention" (arXiv:2601.16596)
6. **Skill Outcome Tracking** - "SkillOrchestra: Adaptive Skill Selection via Outcome Tracking" (arXiv:2602.19672)
