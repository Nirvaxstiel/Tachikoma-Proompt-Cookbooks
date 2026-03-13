# Research Gap Analysis: Tachikoma vs OpenCode 2026-03-13

Analysis of new research findings against existing OpenCode and Tachikoma capabilities to identify gaps and avoid reinventing the wheel.

---

## Executive Summary

**Key Finding:** Most new research findings **complement** existing capabilities rather than **supercede** them. Tachikoma's research foundation is well-aligned with 2025-2026 research directions.

**Top Gaps Identified:**
1. **Topology-Aware Orchestration** - Not implemented in either system
2. **Graph-Based Self-Healing Routing** - Tachikoma has OpenSage routing but lacks deterministic recovery
3. **Skill Learning from Execution** - Skills are static in both systems
4. **Hierarchical Memory Indexing** - Tachikoma has graph memory but linear retrieval
5. **Position Bias Architectural Understanding** - Documentation needs updating

---

## Mapping Matrix

| Capability | OpenCode | Tachikoma | New Research | Gap Status |
|------------|----------|------------|-------------|------------|
| **Intent Routing** | ✓ Pattern-based agents | AdaptOrch: Topology-aware | **Implement topology classification** |
| **Skill Chains** | ✗ | ✓ Sequential skills | SkillOrchestra: Learning | **Add skill outcome tracking** |
| **Agent Orchestration** | ✗ | ✓ OpenSage (V/H) | Graph-Based Self-Healing | **Add deterministic recovery** |
| **Tool Routing** | ✓ Permission-based | OpenSage routing | AdaptOrch: Topology routing | **Integrate with OpenSage** |
| **Memory System** | ✗ | ✓ Graph-based | LycheeCluster: Indexing | **Add hierarchical indexing** |
| **Long Context** | ✗ | ✓ RLM | FlashPrefill/VSPrefill | **Consider sparse attention** |
| **Verification** | ✗ | ✓ GVR loops | Rubric-based verification | **Add failure taxonomy** |
| **Reflection** | ✗ | ✓ (OpenSage) | Dual-level reflection | **Already in OpenSage** |
| **Ensemble Methods** | ✗ | ✓ Horizontal | Inter-agent semantic attention | **Add to horizontal ensemble** |
| **Position Bias** | ✗ | ✓ Priority loading | Architectural bias theory | **Update documentation** |

**Legend:**
- ✓ = Exists
- ✗ = Does not exist
- **Bold** = Research finding that could be implemented

---

## Detailed Analysis by Research Area

### 1. Agent Orchestration & Routing

#### Current State

**OpenCode:**
- Primary/Secondary agent system with Tab switching
- Simple intent routing through agent selection
- No systematic orchestration topology management
- Tool routing: Permission-based, not strategy-based

**Tachikoma:**
- Cost-aware routing based on complexity (4 levels)
- Intent classification with pattern matching
- Skill chains for sequential execution
- OpenSage: Vertical decomposition + Horizontal ensemble
- Subagent types: General, Explore, compaction, title, summary

#### New Research Findings

**AdaptOrch (arXiv:2602.16873) - Task-Adaptive Orchestration**
- **Finding:** Orchestration topology now dominates model capability in performance convergence era
- **Four canonical topologies:** Parallel, Sequential, Hierarchical, Hybrid
- **Topology Routing Algorithm:** O(|V| + |E|) mapping task DAGs to patterns
- **Results:** 12-23% improvement over static single-topology baselines
- **Complement to Tachikoma:** Extend intent routing with topology classification

**Graph-Based Self-Healing Tool Routing (arXiv:2603.01548)**
- **Finding:** Fault-tolerant orchestration with deterministic recovery without LLM
- **Mechanism:** Cost-weighted tool graph + parallel health monitors + Dijkstra's shortest path
- **Results:** Matches ReAct correctness while reducing control-plane LLM calls by **93%** (9 vs 123)
- **Complement to Tachikoma:** Replace LLM-based tool routing with graph-based deterministic routing
- **Supercedes:** Current OpenSage routing which relies on LLM orchestration

**SkillOrchestra (arXiv:2602.19672)**
- **Finding:** Explicit skill modeling enables sample-efficient orchestration
- **Problem:** Input-level routers ignore evolving task requirements; RL suffers routing collapse
- **Solution:** Learn fine-grained skills from execution experience, build competence models
- **Results:** Outperforms SoTA RL-based orchestrators by 22.5% with 700x learning cost reduction
- **Gap in both systems:** Skills are static definitions, not learned from execution

#### Implementation Recommendations

**HIGH PRIORITY:**
1. ✅ **Graph-Based Self-Healing Routing** (arXiv:2603.01548)
   - **Tachikoma Action:** Replace OpenSage's LLM-based routing with graph-based routing
   - **Implementation:**
     - Build cost-weighted tool graph from skill chain configurations
     - Add parallel health monitors for tool status
     - Use Dijkstra's algorithm for deterministic shortest-path routing
     - Fallback to LLM only when no feasible path exists
   - **Benefit:** 93% reduction in LLM control-plane calls
   - **Status:** Neither system has this

2. ✅ **Topology-Aware Orchestration** (arXiv:2602.16873)
   - **Tachikoma Action:** Extend intent routing with topology classification
   - **Implementation:**
     - Add topology classifier to intent routing (4 canonical patterns)
     - Map task decomposition DAGs to optimal topologies
     - Dynamic topology selection based on task characteristics
   - **Status:** Partial in Tachikoma (complexity levels), missing topology patterns

**MEDIUM PRIORITY:**
3. ⚠️ **Skill Learning** (arXiv:2602.19672)
   - **Tachikoma Action:** Track skill outcomes and build competence models
   - **Implementation:**
     - Add telemetry to track skill success/failure rates per task type
     - Build competence model: `skill -> (success_rate, avg_time, cost)`
     - Use competence scores for skill selection
     - Learn from execution experience (700x cost reduction possible)
   - **Status:** Neither system has this

---

### 2. Long-Context & Memory Systems

#### Current State

**OpenCode:**
- No explicit long-context handling documented
- No memory system beyond session state
- Tool context: File-based operations
- Agent system: Built-in subagents (general, explore)

**Tachikoma:**
- **RLM:** Recursive Language Models for 10M+ token contexts
  - Adaptive chunking with semantic boundaries
  - Parallel processing (5 chunks concurrently)
  - Symbolic recursion via sub_LLM()
  - Plugin system for tool discovery
- **Graph Memory:** Node/edge knowledge graph
  - Add nodes (entities, code, concepts)
  - Add edges (relationships)
  - Query by similarity, pattern, traversal
  - Visualize with Mermaid diagrams
- **OpenSage Memory:** Hierarchical memory with multi-level consolidation
- **Position-Aware Loading:** Priority-based context loading (Priority 0: core, Priority 10: coding, etc.)

#### New Research Findings

**LycheeCluster (arXiv:2603.08453)**
- **Finding:** Hierarchical indexing with O(log N) retrieval vs linear scans
- **Mechanism:**
  - Boundary-aware chunking preserving semantic coherence
  - Recursive hierarchical indexing based on triangle inequality
  - Lazy update strategy for streaming generation
- **Results:** 3.6x end-to-end speedup with negligible performance degradation
- **Complement to Tachikoma:** Add hierarchical indexing to RLM memory system
- **Supercedes:** Linear retrieval in current graph memory implementation

**FlashPrefill (arXiv:2603.06199)**
- **Finding:** Instantaneous pattern discovery with dynamic thresholding
- **Mechanism:**
  - Fast block-searching for vertical, slash, and block-sparse patterns
  - Dynamic thresholding eliminates sorting/accumulation overhead
- **Results:** 27.78x speedup on 256K sequences; 1.71x speedup even at 4K
- **Complement to Tachikoma:** Consider sparse attention for RLM optimization

**VSPrefill (arXiv:2603.04460)**
- **Finding:** 4.95x speedup at 128k context with 98.35% accuracy retention
- **Mechanism:** Vertical-slash structural pattern with lightweight indexing
- **Complement to Tachikoma:** Vertical-slash patterns align with structure-aware chunking

**Cross-Family Speculative Prefill (arXiv:2603.02631)**
- **Finding:** Cross-family draft models work for prompt compression
- **Mechanism:** Attention-based token importance estimation transfers across model families
- **Results:** 90-100% baseline performance retention with substantial TTFT reduction
- **Complement to Tachikoma:** Use any smaller model as draft for long contexts

#### Implementation Recommendations

**HIGH PRIORITY:**
1. ✅ **Hierarchical Memory Indexing** (LycheeCluster 2603.08453)
   - **Tachikoma Action:** Add hierarchical indexing to graph memory
   - **Implementation:**
     - Implement recursive hierarchical index structure
     - Use triangle inequality for O(log N) retrieval
     - Lazy update strategy for streaming
     - Integrate with existing node/edge graph
   - **Benefit:** 3.6x speedup for memory queries
   - **Status:** Tachikoma has graph memory but uses linear retrieval

**MEDIUM PRIORITY:**
2. ⚠️ **Sparse Attention for RLM** (FlashPrefill/VSPrefill)
   - **Tachikoma Action:** Consider sparse attention patterns for RLM
   - **Implementation:**
     - Add pattern discovery for vertical/slash/block-sparse attention
     - Dynamic thresholding to eliminate sorting overhead
     - Evaluate trade-offs between accuracy and speed
   - **Status:** RLM uses linear chunking, no sparse optimization

---

### 3. Verification & Self-Reflection

#### Current State

**OpenCode:**
- No explicit verification loops documented
- Plan agent exists but is read-only (no execution)
- No reflection mechanisms beyond basic conversation flow
- No structured verification or critique systems

**Tachikoma:**
- **Verification Loops:** Generator-Verifier-Reviser pattern (GVR)
  - Research: "Towards Autonomous Mathematics Research" (arXiv:2602.10177)
  - System: Problem → Generator → Candidate → Verifier → [Pass | Revise | Restart]
  - 90% on IMO-ProofBench Advanced vs 67% base
- **Verification Skills:** verifier-code-agent skill
- **Skill Chains:** implement-verify chain
- **Reflection-Orchestrator:** Self-critique with reflection phase
- **OpenSage Reflection:** Hierarchical memory with multi-level consolidation includes reflection

#### New Research Findings

**The Mirror Loop (arXiv:2510.21861)**
- **Finding:** Reflection without grounding leads to informational closure (epistemic stasis)
- **Study:** 144 reasoning sequences across GPT-4o-mini, Claude 3 Haiku, Gemini 2.0 Flash
- **Results:** Mean informational change declined 55% in ungrounded runs (0.193 → 0.087)
- **Grounding Intervention:** Single verification step at iteration 3 caused +28% rebound
- **Validation of Tachikoma:** Confirms that GVR pattern is essential
- **Complement:** Ensure every reflection loop has grounding step (already done in Tachikoma)

**Inference-Time Scaling of Verification (arXiv:2601.15808)**
- **Finding:** Self-evolving agent via test-time rubric-guided verification
- **Mechanism:**
  - DeepVerifier: Rubric-based outcome reward verifier
  - Failure taxonomy: 5 major categories, 13 sub-categories
  - Test-time scaling: 8-11% accuracy gains on GAIA and XBench-DeepResearch
- **Complement to Tachikoma:** Add rubric-based verification to verifier-code-agent
- **Status:** Tachikoma has verification but no structured failure taxonomy

**ReTreVal (arXiv:2601.02880)**
- **Finding:** Hybrid framework integrating Tree-of-Thoughts, self-refinement, LLM critique, reflexion memory
- **Mechanism:**
  - Structured reasoning tree with adaptive depth
  - Dual validation: reasoning quality, coherence, correctness
  - Cross-problem memory: insights from successful paths and failure patterns
- **Complement to Tachikoma:** Enhance verification with structured tree exploration
- **Status:** Tachikoma has sequential verification, no tree exploration

**RISE (arXiv:2505.13445)**
- **Finding:** Online RL framework training both problem-solving and self-verification
- **Mechanism:**
  - Verifier provides on-the-fly feedback for both tasks
  - Online RL without auxiliary models
  - Improves accuracy while fostering self-verification skills
- **Complement to Tachikoma:** Self-verification training for skill learning
- **Status:** Tachikoma has no RL-based skill learning

#### Implementation Recommendations

**HIGH PRIORITY:**
1. ✅ **Rubric-Based Verification** (Inference-Time Scaling 2601.15808)
   - **Tachikoma Action:** Add failure taxonomy for rubric-based verification
   - **Implementation:**
     - Build failure taxonomy: 5 categories, 13 sub-categories
     - Add rubric-based verifier agent
     - Integrate with existing verification loops
     - Enable test-time scaling without retraining
   - **Benefit:** 8-11% accuracy gains
   - **Status:** Tachikoma has verification but lacks structured failure taxonomy

**MEDIUM PRIORITY:**
2. ⚠️ **Tree-Based Verification** (ReTreVal 2601.02880)
   - **Tachikoma Action:** Add structured reasoning tree to verification
   - **Implementation:**
     - Implement adaptive depth based on problem complexity
     - Dual validation: reasoning quality, coherence, correctness
     - Cross-problem memory buffer
     - Critique-based pruning for computational control
   - **Status:** Tachikoma has sequential verification only

---

### 4. Mixture of Agents / Ensemble Systems

#### Current State

**OpenCode:**
- Single agent at a time (primary or subagent)
- No ensemble mechanisms
- Parallel execution: Not documented
- Multi-agent coordination: Minimal (task tool for subagents)

**Tachikoma:**
- **OpenSage:**
  - Vertical decomposition: Sequential task breakdown into subtasks
  - Horizontal ensemble: Parallel exploration with multiple strategies
  - Merge strategies: Consensus, majority_vote, best_score
  - Dynamic tool synthesis: AI-generated tools on-demand
  - Hierarchical memory: Multi-level consolidation
- **Subagent Types:**
  - General: General-purpose multi-step tasks
  - Explore: Fast codebase exploration (read-only)
  - Compaction: Context compression
  - Title: Session title generation
  - Summary: Session summary

#### New Research Findings

**Attention-MoA (arXiv:2601.16596)**
- **Finding:** Deep semantic interaction between agents via Inter-agent Semantic Attention
- **Mechanism:**
  - Inter-agent Semantic Attention enables deep semantic interaction
  - Inter-layer Residual Module with Adaptive Early Stopping
- **Results:** 91.15% LC Win Rate on AlpacaEval 2.0
- **Complement:** Enables small open-source models to outperform massive proprietary models
- **Gap:** Tachikoma has horizontal ensemble but no inter-agent semantic attention

**Mixture-of-Models (arXiv:2601.16863)**
- **Finding:** Runtime Mixture-of-Models (MoM) with Dynamic Expertise Broker
- **Mechanism:**
  - N-Way Self-Evaluating Deliberation (NSED): Runtime optimization
  - Dynamic Expertise Broker: Treats model selection as Knapsack Problem
  - Macro-Scale Recurrent Neural Network for consensus
  - Quadratic Voting for non-linear consensus
- **Results:** Ensembles of <20B models match or exceed 100B+ parameter models
- **Complement:** Dynamic model selection for horizontal ensembles
- **Status:** Tachikoma uses OpenSage but no dynamic model selection

**Pyramid MoA (arXiv:2602.19509)**
- **Finding:** Hierarchical Mixture-of-Agents for cost-optimized anytime inference
- **Mechanism:**
  - Lightweight Router escalates queries only when necessary
  - Semantic agreement + confidence calibration among ensemble
- **Results:** 93.0% accuracy on GSM8K (vs 98.0% Oracle) with 61% cost reduction
- **Complement:** Hierarchical model selection for cost-aware routing
- **Status:** Tachikoma has cost-aware routing but not hierarchical MoA

**Multi-Agent Debate Framework (arXiv:2510.12697)**
- **Finding:** Multi-agent debate judge framework with adaptive stability detection
- **Mechanism:**
  - Mathematical analysis of agent interactions
  - Stability detection: Time-varying Beta-Binomial mixture
  - Adaptive stopping based on Kolmogorov-Smirnov test
- **Results:** Improves judgment accuracy over majority voting
- **Complement:** Debate mechanism for ensemble synthesis
- **Status:** Tachikoma has consensus/voting but no debate framework

**TUMIX (arXiv:2510.01279)**
- **Finding:** Ensemble framework with distinct tool-use strategies
- **Mechanism:**
  - Multiple agents with different tool-use strategies
  - Iterative sharing and refinement
  - Halt on sufficient confidence to preserve performance at lower cost
- **Results:** +3.55% average accuracy improvement; 49% inference cost at equal performance
- **Complement:** Diverse tool strategies for horizontal ensemble
- **Status:** Tachikoma has ensemble but no diverse tool strategies

#### Implementation Recommendations

**HIGH PRIORITY:**
1. ⚠️ **Inter-Agent Semantic Attention** (Attention-MoA 2601.16596)
   - **Tachikoma Action:** Add inter-agent semantic attention to horizontal ensemble
   - **Implementation:**
     - Add semantic attention mechanism between ensemble agents
     - Inter-layer residual module with adaptive early stopping
     - Enables deep semantic interaction for consensus/voting
   - **Benefit:** 91.15% LC Win Rate improvement
   - **Status:** Tachikoma has horizontal ensemble but no inter-agent semantic attention

**MEDIUM PRIORITY:**
2. ⚠️ **Dynamic Model Selection** (Mixture-of-Models 2601.16863)
   - **Tachikoma Action:** Add dynamic model selection to horizontal ensemble
   - **Implementation:**
     - Implement Dynamic Expertise Broker (Knapsack Problem formulation)
     - Macro-Scale RNN for consensus with semantic forget gate
     - Enables ensembles of <20B models to exceed 100B+ models
     - Reduces sycophancy via peer-mediated correction
   - **Status:** Tachikoma uses static model selection in OpenSage

3. ⚠️ **Hierarchical Model Selection** (Pyramid MoA 2602.19509)
   - **Tachikoma Action:** Add hierarchical model selection to cost-aware routing
   - **Implementation:**
     - Lightweight router with semantic agreement + confidence calibration
     - Escalates queries only when necessary
     - 61% cost reduction with minimal accuracy loss
     - **Status:** Tachikoma has cost-aware routing but not hierarchical MoA

---

### 5. Position Bias & Context Management

#### Current State

**OpenCode:**
- No explicit position bias handling documented
- No context management beyond file operations
- Tool context: Basic file read/write
- No priority-based loading or context optimization

**Tachikoma:**
- **Position-Aware Loading:**
  - Priority-based context loading (Priority 0: core, Priority 10: coding, Priority 20: git, Priority 30: research)
  - Research: "Found in the Middle" (Hsieh et al., ACL 2024) + "On the Emergence of Position Bias" (Wu et al., ICML 2025)
  - Strategy:
    - Intent classification first → know what context needed
    - Priority-based loading → important rules at beginning
    - Selective loading → only relevant modules
    - Position optimization → high-relevance at boundaries
    - Reflect → Was context sufficient?
  - Skill System: Context module with priority levels
- **Context Management:**
  - Skills have context requirements
  - Progressive disclosure based on task needs
  - Reflection after execution

#### New Research Findings

**Lost in the Middle at Birth (arXiv:2603.10123)**
- **Finding:** U-shaped position bias is architectural, present at Step 0, before any training
- **Mechanism:**
  - Mathematical proof: Multi-layer causal attention as iterated powers of Cesàro matrix
  - Three zones:
    - Primacy Tail: Logarithmic divergence at start (causal masking)
    - Recency Delta: O(1) anchor at final token (residual connections)
    - Middle Dead Zone: O(1/(H-1)!) - structurally hostile
  - Validation: Untrained Qwen2 and GPT-2 exhibit U-shape at initialization
  - Standard training does not overcome topological valley
- **Supercedes:** Current position bias research (assumed learned)
- **Implication:** Position-aware loading becomes necessity, not optimization
- **Complement to Tachikoma:** Update documentation to reflect architectural understanding

#### Implementation Recommendations

**HIGH PRIORITY:**
1. ✅ **Update Position Bias Documentation** (Lost in the Middle at Birth 2603.10123)
   - **Tachikoma Action:** Update position bias documentation with architectural understanding
   - **Implementation:**
     - Update docs/research/position-bias.md
     - Explain that U-shape is architectural, not learned
     - Emphasize that position-aware loading is necessity, not optimization
     - Add references to new paper
   - **Benefit:** Accurate documentation reflecting latest research
   - **Status:** Current docs say bias is learned; needs updating

---

### 6. Self-Programming & Dynamic Tools

#### Current State

**OpenCode:**
- Custom tools supported via config
- Tool definitions in opencode.json
- No dynamic tool synthesis
- Tool system: bash, edit, write, read, grep, glob, list, skill, webfetch, websearch, question

**Tachikoma:**
- **OpenSage Dynamic Tool Synthesis:**
  - Research: OpenSage: Self-programming Agent Generation Engine (ICML 2026, arXiv:2602.16891)
  - Agents write their own tools on-demand
  - Tool Specification: Name, Description, Args (Zod schema), Implementation, Dependencies
  - Tool Registration: Add to tool registry, set permissions, create metadata
  - Results: 25% improvement from domain-specific toolkit; 39 tools generated during CyberGym eval
  - Tools: Fuzzers, generators, validators

#### New Research Findings

**Stream of Revision (arXiv:2602.01187)**
- **Finding:** Internal revision tokens enable seamless backtracking and editing
- **Mechanism:**
  - Action tokens enable model to backtrack and edit history in single forward pass
  - Problem: Code generation is monotonic (appends tokens linearly)
  - Solution: Internal revision for self-correction within generation
  - Results: Significantly reduces vulnerabilities with minimal inference overhead
- **Complement to Tachikoma:** Add revision tokens to code-agent skill for self-correction
- **Status:** Tachikoma has no internal revision mechanism

**AutoAgent (arXiv:2502.05957)**
- **Finding:** Users can create LLM agents through natural language alone
- **Mechanism:**
  - Agentic System Utilities, LLM-powered Actionable Engine, Self-Managing File System
  - Self-Play Agent Customization module
  - Fully-Automated and Zero-Code framework
  - Results: Surpasses SoTA on GAIA benchmark
- **Complement to Tachikoma:** Natural language agent configuration interface
- **Status:** Tachikoma has custom agents but requires YAML/Markdown configuration

**Learning Randomized Reductions (arXiv:2412.18134)**
- **Finding:** Agentic Bitween uses LLMs to discover novel query functions for RSR
- **Mechanism:**
  - Linear regression outperforms genetic algorithms, symbolic regression, MILP
  - LLMs dynamically discover query functions
  - Agentic Bitween discovers new RSR properties using frontier models
- **Complement to Tachikoma:** LLM-driven discovery of optimization patterns
- **Status:** Tachikoma has no automated discovery of optimization patterns

#### Implementation Recommendations

**LOW PRIORITY:**
1. ⚠️ **Internal Revision Tokens** (Stream of Revision 2602.01187)
   - **Tachikoma Action:** Add revision tokens to code-agent skill for self-correction
   - **Implementation:**
     - Add action tokens for backtracking and editing
     - Internal revision within single forward pass
     - Reduces vulnerabilities with minimal overhead
   - **Status:** Tachikoma has no internal revision mechanism

---

### 7. Hierarchical & Meta-Orchestration

#### Current State

**OpenCode:**
- No hierarchical orchestration
- Simple primary/subagent model
- No meta-orchestration capabilities
- No multi-agent coordination beyond basic task tool

**Tachikoma:**
- **OpenSage:**
  - Self-generating agent topology
  - Vertical decomposition: Sequential task breakdown
  - Horizontal ensemble: Parallel exploration with consensus
  - Three innovations:
    - Self-generating agent topology
    - Dynamic tool synthesis
    - Hierarchical memory management
  - Results from paper: 60.2% resolved rate on CyberGym (vs 39.4% baseline)
- **MA-CoNav Pattern (research-backed):**
  - Master-Slave hierarchical collaboration with dual-level reflection
  - Master Agent: Global orchestration
  - Subordinate Agents: Observation, Planning, Execution, Memory
  - Dual reflection: Local-Global reflection mechanism
- **Meta Skill:** Self-generating agent orchestration (OpenSage)

#### New Research Findings

**MA-CoNav (arXiv:2603.03024)**
- **Finding:** Master-Slave hierarchical agent collaboration with dual-level reflection
- **Mechanism:**
  - Master Agent: Global orchestration
  - Observation Agent: Environment descriptions
  - Planning Agent: Task decomposition + verification
  - Execution Agent: Mapping + action
  - Memory Agent: Structured experiences
  - Dual-Level Reflection: Local-Global reflection mechanism
- **Complement to Tachikoma:** Extends OpenSage's vertical decomposition
- **Status:** Partially in OpenSage (vertical decomposition), missing dual-level reflection

**MagicAgent (arXiv:2602.19000)**
- **Finding:** Foundation models for generalized agent planning
- **Mechanism:**
  - Lightweight and scalable synthetic data framework
  - High-quality trajectories across diverse planning tasks
  - Two-stage training: Supervised fine-tuning + multi-objective RL
  - Results: 75.1% on Worfbench, 86.9% on BFCL-v3; Surpasses GPT-5.2, Kimi-K2, GLM-4.7
- **Complement to Tachikoma:** Specialized planning models for orchestration
- **Status:** Tachikoma has no specialized planning models

**HarmonyCell (arXiv:2603.01396)**
- **Finding:** Dual-track orchestration with LLM-driven semantic unifier + adaptive MCTS
- **Mechanism:**
  - LLM-driven Semantic Unifier: Maps disparate metadata to canonical interface
  - Adaptive Monte Carlo Tree Search engine
  - Synthesizes architectures with optimal statistical inductive biases
  - Results: 95% valid execution rate on heterogeneous datasets
- **Complement to Tachikoma:** Dual-track orchestration for complex workflows
- **Status:** Tachikoma has single-track orchestration

#### Implementation Recommendations

**MEDIUM PRIORITY:**
1. ⚠️ **Dual-Level Reflection** (MA-CoNav 2603.03024)
   - **Tachikoma Action:** Add dual-level reflection to OpenSage
   - **Implementation:**
     - Add Local-Global reflection mechanism to vertical decomposition
     - Master Agent: Global orchestration with dual reflection
     - Observes local reflections, integrates with global goals
     - **Status:** Partially in OpenSage (vertical decomposition), missing dual-level reflection

---

## Existing Capabilities Summary

### OpenCode Strengths
- ✅ **Well-structured agent system** with primary agents and subagents
- ✅ **Fine-grained permission control** with pattern matching
- ✅ **Skills system** with SKILL.md format
- ✅ **Tool system** with wide range of built-in tools
- ✅ **Custom tools** and MCP server support
- ✅ **Good documentation** and examples
- ✅ **Open source** with active development

### OpenCode Gaps
- ✗ **No orchestration topology management**
- ✗ **No graph-based tool routing**
- ✗ **No verification loops**
- ✗ **No memory system**
- ✗ **No long-context handling**
- ✗ **No ensemble methods**
- ✗ **No position bias handling**
- ✗ **No skill learning**
- ✗ **No reflection mechanisms**

### Tachikoma Strengths
- ✅ **Research-backed architecture** (7 research papers)
- ✅ **OpenSage self-programming** (ICML 2026)
- ✅ **RLM for 10M+ token contexts**
- ✅ **Graph-based memory system** with visualization
- ✅ **Skill chains** with state passing
- ✅ **Cost-aware routing** with complexity classification
- ✅ **Verification loops** (GVR pattern)
- ✅ **Position-aware loading** based on position bias research
- ✅ **Meta orchestration** (meta skill)
- ✅ **Subagent types**: General, Explore, Compaction, Title, Summary
- ✅ **Context system** with progressive disclosure

### Tachikoma Gaps (vs New Research)
- ⚠️ **No topology-aware orchestration** (AdaptOrch 2602.16873)
- ⚠️ **No graph-based self-healing routing** (Graph-Based Self-Healing 2603.01548)
- ⚠️ **No skill learning** (SkillOrchestra 2602.19672)
- ⚠️ **No hierarchical memory indexing** (LycheeCluster 2603.08453)
- ⚠️ **No rubric-based verification** (Inference-Time Scaling 2601.15808)
- ⚠️ **No tree-based verification** (ReTreVal 2601.02880)
- ⚠️ **No inter-agent semantic attention** (Attention-MoA 2601.16596)
- ⚠️ **No dynamic model selection** (Mixture-of-Models 2601.16863)
- ⚠️ **No hierarchical model selection** (Pyramid MoA 2602.19509)
- ⚠️ **No internal revision tokens** (Stream of Revision 2602.01187)
- ⚠️ **Position bias docs outdated** (Lost in the Middle at Birth 2603.10123)

---

## Don't Reinvent the Wheel: What Already Exists

### ✅ Already Implemented in Tachikoma
1. ✅ **Cost-Aware Routing** - Matches "When Do Tools and Planning Help LLMs Think?" (arXiv:2601.02663)
2. ✅ **Modularity** - Matches "Agentic Proposing" (arXiv:2602.03279)
3. ✅ **Verification Loops** - Matches "Towards Autonomous Mathematics Research" (arXiv:2602.10177)
4. ✅ **Position-Aware Loading** - Matches "Found in the Middle" (Hsieh et al. ACL 2024)
5. ✅ **RLM** - Matches "Recursive Language Models" (arXiv:2512.24601)
6. ✅ **OpenSage Self-Programming** - Based on ICML 2026 paper (arXiv:2602.16891)
7. ✅ **Graph Memory** - Based on hierarchical memory from OpenSage paper
8. ✅ **Skill Chains** - Sequential execution with state passing
9. ✅ **Vertical Decomposition** - OpenSage subtask breakdown
10. ✅ **Horizontal Ensemble** - OpenSage parallel exploration
11. ✅ **Consensus/Voting** - OpenSage merge strategies
12. ✅ **Dynamic Tool Synthesis** - OpenSage AI-generated tools
13. ✅ **Hierarchical Memory** - OpenSage multi-level consolidation
14. ✅ **Subagent Types** - General, Explore, Compaction, Title, Summary
15. ✅ **Skill Format** - Matches OpenCode SKILL.md format
16. ✅ **Permission System** - OpenCode has more granular permissions (could adopt)

### ✅ Already Implemented in OpenCode
1. ✅ **Primary/Secondary Agent Model** - Build (full access) and Plan (restricted)
2. ✅ **Subagent System** - General and Explore subagents
3. ✅ **Skills System** - SKILL.md format with frontmatter
4. ✅ **Permission System** - Fine-grained pattern-based control (allow, deny, ask)
5. ✅ **Tool System** - Comprehensive built-in tools
6. ✅ **Custom Tools Support** - Custom tool definitions
7. ✅ **MCP Server Support** - Model Context Protocol integration
8. ✅ **Session Management** - Multi-session workflow

---

## Priority Implementation Roadmap

### Immediate (This Week)
1. ✅ **Update Position Bias Documentation**
   - Add architectural understanding from "Lost in the Middle at Birth"
   - Explain U-shape is present at initialization, not learned
   - Status: HIGH PRIORITY, LOW EFFORT

### Short-term (This Month)
1. ✅ **Graph-Based Self-Healing Tool Routing**
   - Replace LLM-based tool routing with cost-weighted graph + Dijkstra
   - Add parallel health monitors for tool status
   - Fallback to LLM only when no feasible path exists
   - Benefit: 93% reduction in LLM control-plane calls
   - Status: HIGH PRIORITY, MEDIUM EFFORT

2. ✅ **Topology-Aware Orchestration**
   - Extend intent routing with topology classification (4 patterns)
   - Map task decomposition DAGs to optimal topologies
   - Dynamic topology selection based on task characteristics
   - Benefit: 12-23% improvement over static single-topology baselines
   - Status: HIGH PRIORITY, MEDIUM EFFORT

3. ✅ **Hierarchical Memory Indexing**
   - Add hierarchical indexing to graph memory system
   - Implement recursive structure based on triangle inequality
   - Lazy update strategy for streaming
   - Benefit: 3.6x speedup for memory queries
   - Status: HIGH PRIORITY, MEDIUM EFFORT

### Medium-term (Next Quarter)
1. ⚠️ **Rubric-Based Verification**
   - Build failure taxonomy (5 categories, 13 sub-categories)
   - Add rubric-based verifier agent
   - Enable test-time scaling without retraining
   - Benefit: 8-11% accuracy gains on challenging benchmarks
   - Status: HIGH PRIORITY, HIGH EFFORT

2. ⚠️ **Inter-Agent Semantic Attention**
   - Add semantic attention mechanism between ensemble agents
   - Implement inter-layer residual module with adaptive early stopping
   - Enables deep semantic interaction for consensus/voting
   - Benefit: 91.15% LC Win Rate improvement
   - Status: MEDIUM PRIORITY, HIGH EFFORT

3. ⚠️ **Tree-Based Verification**
   - Implement adaptive depth based on problem complexity
   - Add dual validation (reasoning quality, coherence, correctness)
   - Implement cross-problem memory buffer
   - Add critique-based pruning for computational control
   - Benefit: Structured reasoning tree with validation
   - Status: MEDIUM PRIORITY, HIGH EFFORT

4. ⚠️ **Skill Learning**
   - Track skill outcomes and build competence models
   - Build competence model: skill -> (success_rate, avg_time, cost)
   - Use competence scores for skill selection
   - Learn from execution experience
   - Benefit: 22.5% improvement with 700x learning cost reduction
   - Status: MEDIUM PRIORITY, HIGH EFFORT

### Low Priority (Future Consideration)
1. ⚠️ **Sparse Attention for RLM**
   - Add pattern discovery (vertical, slash, block-sparse)
   - Implement dynamic thresholding to eliminate sorting overhead
   - Evaluate trade-offs between accuracy and speed
   - Benefit: 27.78x speedup on 256K sequences
   - Status: LOW PRIORITY, HIGH EFFORT

2. ⚠️ **Dynamic Model Selection**
   - Implement Dynamic Expertise Broker (Knapsack Problem)
   - Add Macro-Scale RNN for consensus with semantic forget gate
   - Enables ensembles of <20B models to exceed 100B+ models
   - Reduces sycophancy via peer-mediated correction
   - Benefit: Ensembles of <20B match or exceed 100B+ models
   - Status: LOW PRIORITY, HIGH EFFORT

3. ⚠️ **Dual-Level Reflection**
   - Add Local-Global reflection mechanism to OpenSage
   - Master Agent: Global orchestration with dual reflection
   - Observes local reflections, integrates with global goals
   - Benefit: Better coordination for hierarchical orchestration
   - Status: LOW PRIORITY, MEDIUM EFFORT

4. ⚠️ **Hierarchical Model Selection**
   - Implement lightweight router with semantic agreement + confidence
   - Escalates queries only when necessary
   - Achieve 61% cost reduction with minimal accuracy loss
   - Status: LOW PRIORITY, MEDIUM EFFORT

5. ⚠️ **Internal Revision Tokens**
   - Add revision tokens to code-agent skill
   - Internal revision within single forward pass
   - Reduces vulnerabilities with minimal overhead
   - Benefit: Self-correction during generation
   - Status: LOW PRIORITY, MEDIUM EFFORT

---

## Recommendations Summary

### Don't Implement (Already Exists)
- ❌ **Cost-Aware Routing** - Already in Tachikoma
- ❌ **Modularity** - Already in Tachikoma (skills)
- ❌ **Verification Loops** - Already in Tachikoma
- ❌ **Position-Aware Loading** - Already in Tachikoma
- ❌ **RLM** - Already in Tachikoma
- ❌ **OpenSage** - Already in Tachikoma (full implementation)
- ❌ **Graph Memory** - Already in Tachikoma
- ❌ **Skill Chains** - Already in Tachikoma
- ❌ **Vertical/Horizontal Decomposition** - Already in Tachikoma
- ❌ **Tool Synthesis** - Already in Tachikoma
- ❌ **Hierarchical Memory** - Already in Tachikoma
- ❌ **Skill Format** - Both systems use SKILL.md format
- ❌ **Permission System** - OpenCode has more granular permissions
- ❌ **Primary/Secondary Agents** - Tachikoma has broader subagent types

### High Value Implementation Opportunities
1. ✅ **Graph-Based Self-Healing Routing** - Tachikoma can leverage OpenSage + add graph routing
2. ✅ **Topology-Aware Orchestration** - Extend existing intent routing
3. ✅ **Hierarchical Memory Indexing** - Add to existing graph memory
4. ✅ **Rubric-Based Verification** - Add to existing verification loops
5. ✅ **Inter-Agent Semantic Attention** - Enhance horizontal ensemble
6. ✅ **Skill Learning** - Add telemetry to existing skills
7. ✅ **Tree-Based Verification** - Enhance verification with tree exploration
8. ✅ **Update Position Bias Docs** - Documentation update only

### Complementary Enhancements
1. ⚠️ **Dynamic Model Selection** - Enhance ensemble routing
2. ⚠️ **Hierarchical Model Selection** - Enhance cost-aware routing
3. ⚠️ **Dual-Level Reflection** - Enhance OpenSage decomposition
4. ⚠️ **Internal Revision Tokens** - Enhance code generation
5. ⚠️ **Sparse Attention** - Enhance RLM performance
6. ⚠️ **Debate Framework** - Enhance ensemble synthesis

---

## Conclusion

**Key Insight:** Tachikoma is remarkably well-aligned with 2025-2026 research directions. The OpenSage implementation already covers most self-programming and orchestration patterns from the ICML 2026 paper.

**Primary Gaps:**
1. **Graph-Based Self-Healing Routing** - Deterministic recovery reduces LLM calls by 93%
2. **Topology-Aware Orchestration** - Topology selection outperforms model selection
3. **Skill Learning** - Static skills don't learn from execution
4. **Hierarchical Memory Indexing** - Linear retrieval is inefficient
5. **Rubric-Based Verification** - No structured failure taxonomy

**Recommendation:** Focus on implementing the HIGH PRIORITY items first, as they offer the best ROI:
1. Graph-Based Self-Healing Routing (93% LLM call reduction)
2. Topology-Aware Orchestration (12-23% improvement)
3. Hierarchical Memory Indexing (3.6x speedup)

**Status:** Tachikoma is a research-driven system that's ahead of OpenCode in most areas. Implement the high-priority gaps to stay at the cutting edge.

---

**Last Updated:** 2026-03-13
**Research Period:** January 2026 - March 2026
**Sources:**
- OpenCode Documentation: https://opencode.ai/docs
- OpenCode GitHub: https://github.com/anomalyco/opencode
- Tachikoma Research: docs/research/
- New Research: arXiv searches (Jan-Mar 2026)
