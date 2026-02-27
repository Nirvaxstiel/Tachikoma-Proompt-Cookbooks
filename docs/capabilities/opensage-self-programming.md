# OpenSage Integration

## What It Is

OpenSage is a **self-programming agent generation engine** that transforms Tachikoma from a **human-centered orchestrator** into an **AI-centered system**.

### The Paradigm Shift

**Before (Human-Centered)**:
- Engineers manually design agent structures
- Developers create fixed toolsets upfront
- Memory is pre-defined by humans
- Agents follow rigid, predefined workflows

**After (AI-Centered)**:
- LLMs create specialized agents on-demand
- AI writes its own tools when needed
- Knowledge graph structures emerge from interactions
- Agents adapt and optimize over time

### Core Concept

OpenSage enables Tachikoma to **delegate agency to AI** itself. Instead of routing to pre-defined agents or skills, Tachikoma can now:

1. **Generate new agents** dynamically based on task requirements
2. **Create custom tools** at runtime for specific needs
3. **Build knowledge graphs** that grow and adapt with use
4. **Coordinate multi-agent topologies** that form and reform based on the task

This is analogous to how modern machine learning shifted from **feature engineering** (humans defining features) to **representation learning** (models learning features from data).

## How It's Implemented

### Self-Generating Agent Topology

**What it does:**
Creates specialized agents dynamically from task descriptions, then coordinates their execution.

**How it works:**

When you request: "Implement a complete REST API with authentication, CRUD operations, and tests"

Tachikoma:
1. Analyzes the task complexity
2. Determines this needs multiple specialized sub-tasks
3. Generates agents for each sub-task:
   - `api-designer`: Designs API schema and endpoints
   - `auth-specialist`: Handles JWT authentication
   - `crud-implementer`: Creates models and controllers
   - `test-generator`: Writes comprehensive tests
4. Executes agents sequentially, passing context forward
5. Integrates results into complete API

**What powers this:**
- **OpensageAgentsPlugin** (`src/plugin/tachikoma/opensage/opensage-agents.ts`)
  - `@generate-agent`: Creates agent from task description
  - `@vertical-decompose`: Breaks task into sequential sub-tasks
  - `@horizontal-ensemble`: Creates parallel agents for exploring alternatives
  - `@list-generated-agents`: Lists all AI-generated agents
- **OpensageCoordinator** (`src/plugin/tachikoma/opensage/coordinator.ts`)
  - Analyzes task complexity
  - Creates optimal execution plans
  - Coordinates agent execution
  - Tracks performance metrics

**Types:** (`src/types/opensage-agent.ts`)
- `AgentSpec`: Defines agent name, description, mode, tools, model
- `VerticalDecomposition`: Sequential multi-agent topology
- `HorizontalEnsemble`: Parallel ensemble with coordinator

### Dynamic Tool Synthesis

**What it does:**
Creates custom tools at runtime when existing tools don't meet requirements.

**How it works:**

When you need: "A tool that validates JWT tokens with RS256 algorithm"

Tachikoma:
1. Calls `@generate-tool` with the requirement
2. AI generates:
   - Tool specification (name, description, parameters)
   - TypeScript/Python/Bash implementation
   - Dependencies (npm packages if needed)
3. Tool is registered and immediately available
4. Can be executed with state persistence

**What powers this:**
- **DynamicToolsPlugin** (`src/plugin/tachikoma/opensage/dynamic-tools.ts`)
  - `@generate-tool`: Creates tool from requirement
  - `@list-generated-tools`: Lists all generated tools
  - `@execute-tool-stateful`: Runs tools with state save/load
  - `@async-tool-background`: Executes long-running tools asynchronously
  - `@poll-async-job`: Checks status of background jobs

**Types:** (`src/types/opensage-tool.ts`)
- `ToolSpec`: Defines tool structure
- `ToolState`: Tracks tool state across invocations
- `AsyncJob`: Manages background tool execution

### Hierarchical Memory Management

**What it does:**
Stores knowledge in a graph structure (nodes and edges) rather than linear context, enabling efficient retrieval and relationship-aware queries.

**How it works:**

When Tachikoma encounters code structures, decisions, or patterns:

1. **Add nodes** to knowledge graph:
   ```
   @memory-add-node 
     type="code"
     label="AuthService.authenticate"
     content="Authenticates users via JWT tokens, returns User object"
   
   @memory-add-node 
     type="code"
     label="JWTMiddleware"
     content="Validates JWT tokens before protected routes"
   ```

2. **Add relationships** between nodes:
   ```
   @memory-add-edge 
     fromId="AuthService.authenticate"
     toId="JWTMiddleware"
     type="uses"
   ```

3. **Query knowledge** when needed:
   ```
   @memory-query 
     query="authentication mechanisms"
     mode="similarity"
     maxResults=10
   ```

4. **Visualize** knowledge graph:
   ```
   @memory-visualize centerNode="AuthService" radius=2
   ```

**What powers this:**
- **GraphMemoryPlugin** (`src/plugin/tachikoma/opensage/graph-memory.ts`)
  - `@memory-add-node`: Add entities to knowledge graph
  - `@memory-add-edge`: Add relationships
  - `@memory-query`: Search by similarity, pattern, or traversal
  - `@memory-compress-session`: Extract knowledge from session history
  - `@memory-visualize`: Generate Mermaid diagrams
  - **Session hooks**: Auto-record events, compress when needed

**Types:** (`src/types/opensage-memory.ts`)
- `MemoryNode`: Represents entities (code, concepts, queries, answers)
- `MemoryEdge`: Represents relationships (uses, depends_on, implements)
- `MemoryGraph`: Collection of nodes and edges
- `MemoryQuery`: Search parameters (query, mode, filters)

### Performance Tracking

**What it does:**
Tracks agent performance over time to recommend the best agents for specific task types.

**How it works:**

Every time an agent executes:

1. Registry records success/failure, cost, latency
2. Calculates metrics per agent-task pair:
   - Success rate
   - Average cost
   - Average latency
3. Recommends best agent for future similar tasks
4. Enables agent optimization based on history

**Example:**
```
Task: "Review code for security vulnerabilities"

First time:
→ Tachikoma generates @security-reviewer agent
→ Records performance: success=true, cost=$0.02, latency=3.2s

Future similar task:
→ Tachikoma recommends @security-reviewer (98.2% success rate)
→ Fast and reliable for security audits
```

**What powers this:**
- **AgentRegistry** (`src/plugin/tachikoma/opensage/agent-registry.ts`)
  - `recordSuccess()`: Log successful agent execution
  - `recordFailure()`: Log failed agent execution
  - `recommendAgent()`: Get best agent for task type
  - `getTaskHistory()`: Get agent's past executions
  - **File-based persistence**: `.opencode/agent-metrics.json`

**Types:** (`src/types/opensage-registry.ts`)
- `AgentMetrics`: Success/failure counts, cost, latency
- `TaskRecord`: Individual task execution details
- `PerformanceStats`: Aggregated statistics

## What Problems It Solves

### Problem 1: Rigid Agent Structures

**Issue:** Pre-defined agents can't adapt to new task types or domains. Every new domain requires manual agent design.

**Solution:** Self-generating agents
- AI creates specialized agents on-demand
- Each agent is optimized for its specific sub-task
- Agents can be re-used for similar future tasks
- No manual agent design needed

**Example:**
Instead of manually creating a "PostgreSQL audit agent", Tachikoma:
- Generates `@database-auditor` when first PostgreSQL audit task appears
- Optimizes prompt based on PostgreSQL-specific patterns
- Learns from past PostgreSQL audits to improve future performance

### Problem 2: Limited Tool Capabilities

**Issue:** Fixed toolsets can't support novel requirements or domain-specific needs without manual tool development.

**Solution:** Dynamic tool synthesis
- AI writes tools when existing ones aren't sufficient
- Tools are immediately available in current session
- Stateful tools can persist data across invocations
- Async tools don't block agent execution

**Example:**
Instead of being limited to generic `bash` and `read`, you can:
- Generate `@rs256-jwt-validator` tool for RS256 JWT validation
- Generate `@graphql-schema-generator` tool for GraphQL schema creation
- Generate `@fuzzer-generator` tool for security testing

### Problem 3: Context Overflow in Long Sessions

**Issue:** As sessions grow, context becomes too large, causing summarization and loss of important details.

**Solution:** Hierarchical memory with compression
- Knowledge is stored in structured graph
- Short-term event history compressed automatically
- Relevant knowledge retrieved without loading full context
- Memory agent manages what to keep and what to compress

**Example:**
Instead of loading entire codebase history:
- Query: "How is user authentication handled?"
- Retrieves: `AuthService.authenticate` node + related `JWTMiddleware` node
- Gets exact answer without loading thousands of lines

### Problem 4: Suboptimal Agent Selection

**Issue:** Which agent should handle a task is often unclear, leading to suboptimal choices.

**Solution:** Performance-based recommendation
- Track success rates, costs, latency per agent-task pair
- Recommend agents with highest success rate for specific task types
- Enable agent optimization over time
- Learn which models work best for which tasks

**Example:**
Task: "Generate unit tests for code"
- `test-generator` agent: 95% success rate, avg 2.1s
- `@unit-tester` agent: 78% success rate, avg 3.5s
- Tachikoma recommends `test-generator` for future test generation tasks

### Problem 5: Inability to Explore Alternatives

**Issue:** Single-path execution misses potentially better solutions that would be found by exploring multiple approaches.

**Solution:** Horizontal ensemble
- Create multiple agents with different strategies
- Execute in parallel
- Coordinator merges results and selects best
- Reduces bias from single approach

**Example:**
Task: "Optimize slow SQL query"
- `@index-optimizer`: Suggests adding indexes
- `@query-rewriter`: Rewrites query structure
- `@caching-expert`: Adds caching layer
- Coordinator selects best approach based on context (table size, read vs write ratio, etc.)

## When to Use OpenSage Features

### Use Self-Generating Agents When:

- Task has 3+ distinct sub-steps that benefit from specialization
- Each sub-step has clear separation of concerns
- Task is in a new domain that Tachikoma hasn't optimized for
- You want agents that improve over time with their specific tasks

**Examples:**
- "Implement a complete microservice with database, API, tests, and documentation"
- "Migrate a large codebase to new architecture"
- "Build a comprehensive CI/CD pipeline with multiple stages"

### Use Dynamic Tools When:

- You need a tool that doesn't exist in the standard toolset
- Task requires domain-specific validation or transformation
- Repeated operations would benefit from a dedicated tool
- Integration with external service requires custom logic

**Examples:**
- "Validate OpenAPI schemas according to OpenAPI specification"
- "Generate API documentation from TypeScript interfaces"
- "Run load tests on a staging environment"
- "Validate Kubernetes manifests against cluster constraints"

### Use Knowledge Graph When:

- You need to understand relationships between code components
- Querying for patterns across multiple files or sessions
- Building up understanding of a new codebase
- Need to recall architectural decisions or patterns

**Examples:**
- "What components are involved in user authentication flow?"
- "Find all code that depends on the PaymentService"
- "What patterns do we use for error handling?"
- "How does this codebase handle database migrations?"

### Avoid OpenSage When:

- Simple, single-step tasks (< 50 lines of code)
- One-time operations with no reuse value
- Tasks that are well-served by existing agents
- When you want complete control over the implementation
- When the added complexity outweighs the benefits

## Integration Points

### Within Tachikoma

OpenSage features are integrated into Tachikoma's existing systems:

1. **Intent Routing** (`src/config/intent-routes.yaml`)
   - New routes for `opensage_vertical`, `opensage_horizontal`, `opensage_tool`, `opensage_memory_*`
   - Automatically detects when OpenSage should be used

2. **Skill System** (`src/skills/opensage-orchestrator/SKILL.md`)
   - Documentation for OpenSage patterns
   - Best practices and usage examples

3. **Tachikoma Agent** (`src/agents/tachikoma.md`)
   - Updated routing table with OpenSage patterns
   - Integration instructions

4. **Plugin Architecture** (`src/plugin/tachikoma/opensage/`)
   - Modular plugin system
   - Each OpenSage feature is its own plugin
   - Plugins are loaded by OpenCode

### External Dependencies

OpenSage integrates with OpenCode's systems:

- **Agent System**: Generated agents stored as `.md` files in `.opencode/generated-agents/`
- **Tool System**: Generated tools stored as `.ts` files in `.opencode/generated-tools/`
- **Session Management**: Memory hooks into session lifecycle
- **Permission System**: Respects OpenCode's permission settings

## Performance Characteristics

Based on OpenSage paper benchmarks:

| Feature | Impact | Notes |
|---------|--------|-------|
| Vertical Decomposition | +20-30% task success | Sequential context passing prevents overflow |
| Horizontal Ensemble | +15% solution quality | Multiple approaches reduce bias |
| Dynamic Tools | +25% capability | Custom tools enable new capabilities |
| Graph Memory | +30% retrieval efficiency | Structured knowledge vs linear search |
| Performance Tracking | +10% efficiency | Better agent selection over time |

## Research Backing

All OpenSage features are implemented based on findings from:

- **"OpenSage: Self-programming Agent Generation Engine"** (arXiv:2602.16891, ICML 2026)
  - Demonstrates 20-50% improvement over baseline ADKs
  - Shows importance of self-generating agent topology
  - Validates dynamic tool synthesis approach
  - Proves effectiveness of graph-based memory

Key experimental results:
- CyberGym (security vuln exploitation): 60.2% vs 39.4% baseline (OpenHands)
- Terminal-Bench 2.0 (terminal tasks): 65.2% vs 64.7% baseline (Ante)
- SWE-Bench Pro (software engineering): 59.0% vs 40.2% baseline (SWE-agent)

## Architecture Overview

```
User Request
      │
      ▼
┌─────────────────────────────────────────┐
│  Tachikoma Orchestrator           │
│  (routes to OpenSage features)      │
└──────────────┬──────────────────────┘
               │
    ┌────────┴────────┐
    │                  │
    ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Opensage      │  │Dynamic       │  │Graph         │
│Agents       │  │Tools         │  │Memory        │
│Plugin        │  │Plugin        │  │Plugin        │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │                │                │
      │                │                ▼
      │                │         ┌─────────────────┐
      │                │         │ Knowledge       │
      │                │         │ Graph         │
      │                │         └─────────────────┘
      │                │
      └────────────────┘
```

## Files

### Core Implementation

```
src/
├── types/
│   ├── opensage-agent.ts         # Agent topology types
│   ├── opensage-tool.ts          # Tool synthesis types
│   ├── opensage-memory.ts        # Memory graph types
│   ├── opensage-registry.ts      # Performance tracking types
│   └── opensage.ts              # Barrel export
│
├── plugin/tachikoma/opensage/
│   ├── index.ts                  # Plugin exports
│   ├── agent-registry.ts          # Performance tracking
│   ├── opensage-agents.ts        # Agent generation
│   ├── graph-memory.ts          # Knowledge graph
│   ├── dynamic-tools.ts          # Tool synthesis
│   └── coordinator.ts            # Unified API
│
├── skills/opensage-orchestrator/
│   └── SKILL.md                 # Documentation
│
├── config/
│   └── intent-routes.yaml        # OpenSage routes
│
└── agents/
    └── tachikoma.md             # Updated routing table
```

### Documentation

```
docs/
├── capabilities/
│   ├── opensage-self-programming.md  # Feature overview
│   └── index.md                    # Includes OpenSage
│
└── research/
    └── opensage.md                 # Research backing
```

## Key Differences from Traditional Agents

| Aspect | Traditional Agents | OpenSage-Powered Agents |
|--------|------------------|------------------------|
| **Agent Creation** | Human-designed | AI-generated on-demand |
| **Tool Availability** | Fixed pre-defined | Dynamic synthesis |
| **Memory Structure** | Linear context | Graph-based knowledge |
| **Optimization** | Manual tuning | Automatic performance learning |
| **Adaptability** | Static | Self-improving |
| **Scalability** | Manual scaling | Self-replicating |

## Getting Started

### Basic Usage

Once OpenSage is deployed to `.opencode/`, you can:

```bash
# Generate a specialized agent
@generate-agent task="Review code for security vulnerabilities" mode="subagent"

# Decompose a complex task
@vertical-decompose task="Build REST API" subtasks=["Schema","Models","Controllers","Tests"]

# Explore alternatives in parallel
@horizontal-ensemble task="Optimize SQL query" strategies=["Index","Cache","Rewrite"]

# Generate a custom tool
@generate-tool requirement="Validate OpenAPI spec" language="typescript" name="openapi-validator"

# Add knowledge to graph
@memory-add-node type="code" label="AuthService" content="JWT authentication"
@memory-add-edge fromId="AuthService" toId="JWTMiddleware" type="uses"

# Query knowledge
@memory-query query="authentication mechanisms" mode="similarity"

# List all generated agents
@list-generated-agents
```

### Advanced Usage

Combine OpenSage features for complex workflows:

```bash
# 1. Generate domain-specific agents
@generate-agent task="Handle PostgreSQL database migrations" mode="subagent" specialization="postgres"

# 2. Create custom tool for complex validation
@generate-tool requirement="Validate PostgreSQL migration SQL" language="sql" name="migration-validator"

# 3. Decompose migration task
@vertical-decompose 
  task="Migrate database schema to version 2.0"
  subtasks=[
    "Analyze existing schema differences",
    "Generate migration SQL",
    "Validate with migration-validator",
    "Test in staging environment",
    "Execute rollback plan"
  ]

# 4. Results integrated into complete migration workflow
```

## Status

| Component | Status |
|-----------|--------|
| Self-generating agent topology | ✅ Implemented |
| Dynamic tool synthesis | ✅ Implemented |
| Hierarchical memory management | ✅ Implemented |
| Performance tracking | ✅ Implemented |
| Integration with Tachikoma | ✅ Complete |
| Documentation | ✅ Complete |
| Tool sandboxing (Docker) | ⏳ Designed, not implemented |
| Real embeddings (beyond hash) | ⏳ Placeholder, needs production service |

## Notes

- OpenSage represents a paradigm shift from human-centered to AI-centered agent development
- Current models have limitations that prevent full utilization of self-programming capabilities
- Performance improvements come from better agent specialization, not magic
- OpenSage features are optional - Tachikoma works without them
- The system learns and improves over time through performance tracking

## References

- [OpenSage Paper](https://arxiv.org/abs/2602.16891)
- [OpenCode Documentation](https://opencode.ai/docs)
- [Tachikoma GitHub](https://github.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks)
- [OpenSage Research Integration](../research/opensage.md)
