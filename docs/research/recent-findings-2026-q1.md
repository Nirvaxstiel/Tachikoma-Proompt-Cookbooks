# Recent Research Findings for Tachikoma (Jan-Mar 2026)

Research synthesis comparing new findings to Tachikoma's existing foundation.

---

## Executive Summary

**Major Research Shifts (2026 Q1):**

1. **Topology-aware orchestration** now outperforms model selection as optimization target
2. **Position bias is architectural** (not learned) - present at initialization
3. **Graph-based self-healing routers** eliminate LLM calls for recovery (93% reduction)
4. **Hierarchical multi-agent patterns** dominate over single-agent approaches
5. **Mirror loop phenomenon** identified: reflection without grounding leads to epistemic stasis

---

## 1. Agent Orchestration & Routing

### New Findings That Supercede Current Research

#### AdaptOrch: Task-Adaptive Multi-Agent Orchestration
**Paper:** arXiv:2602.16873 (February 2026)

**Finding:** Orchestration topology dominates model capability in performance convergence era.

- **Performance Convergence Scaling Law:** Formalizes when orchestration selection > model selection
- **Four canonical topologies:** Parallel, sequential, hierarchical, hybrid
- **Topology Routing Algorithm:** O(|V| + |E|) mapping task DAGs to patterns
- **Results:** 12-23% improvement over static single-topology baselines

**Tachikoma Impact:**
- Current cost-aware routing (arXiv:2601.02663) focuses on complexity levels
- **Complement:** Extend routing to include topology-aware decisions
- **Implementation:** Add topology classifier to intent routing

#### SkillOrchestra: Learning to Route Agents via Skill Transfer
**Paper:** arXiv:2602.19672 (February 2026)

**Finding:** Explicit skill modeling enables sample-efficient orchestration.

- **Problem:** Input-level routers ignore evolving task requirements; RL suffers routing collapse
- **Solution:** Learn fine-grained skills from execution experience
- **Results:** Outperforms SoTA RL-based orchestrators by 22.5% with 700x learning cost reduction

**Tachikoma Impact:**
- Current skills are static definitions
- **Complement:** Add skill learning from execution traces
- **Implementation:** Track skill outcomes, build competence models

#### Graph-Based Self-Healing Tool Routing
**Paper:** arXiv:2603.01548 (March 2026)

**Finding:** Fault-tolerant orchestration with deterministic recovery without LLM invocation.

- **Problem:** Tools fail mid-execution; LLM routing adds latency and cost
- **Solution:** Cost-weighted tool graph + parallel health monitors + Dijkstra's shortest path
- **Results:** Matches ReAct correctness while reducing control-plane LLM calls by **93%** (9 vs 123)
- **Binary observability:** Every failure logged or escalated (no silent failures)

**Tachikoma Impact:**
- Current: Skills orchestrated by LLM (OpenSage routing)
- **Supercedes:** Implement graph-based routing for predictable workflows
- **Complement:** Use graph routing for known patterns, LLM for novel tasks

#### IronEngine: Unified Orchestration Core
**Paper:** arXiv:2603.08425 (March 2026)

**Finding:** Three-phase pipeline separates planning quality from execution.

- **Discussion:** Planner--Reviewer collaboration
- **Model Switch:** VRAM-aware transition
- **Execution:** Tool-augmented action loop
- **Features:** Hierarchical memory, vectorized skill repository (ChromaDB), 92 model profiles

**Tachikoma Impact:**
- Complements existing architecture
- Potential insights for VRAM-aware model management

### Complementary Findings

#### CASTER: Context-Aware Strategy for Task Efficient Routing
**Paper:** arXiv:2601.19793 (February 2026)

**Finding:** Context-aware routing improves cost-performance tradeoff.

**Complement:** Enhances Tachikoma's cost-aware routing

#### ORCH: Deterministic Multi-Agent Orchestrator
**Paper:** arXiv:2602.01797 (February 2026)

**Finding:** "Many analyses, one merge" with EMA-guided routing.

**Complement:** Deterministic coordination for discrete-choice reasoning

---

## 2. Long-Context & Attention Mechanisms

### New Findings That Supercede Current Research

#### Lost in the Middle at Birth: Exact Theory of Transformer Position Bias
**Paper:** arXiv:2603.10123 (March 2026)

**Finding:** U-shape position bias is architectural, present at Step 0, before any training.

- **Mathematical proof:** Models multi-layer causal attention as iterated powers of Cesàro matrix
- **Three zones:**
  - Primacy Tail: Logarithmic divergence at start (causal masking)
  - Recency Delta: O(1) anchor at final token (residual connections)
  - Middle Dead Zone: O(1/(H-1)!) - structurally hostile
- **Validation:** Untrained Qwen2 and GPT-2 exhibit U-shape at initialization

**Tachikoma Impact:**
- **Supercedes:** Current position bias research (Hsieh et al. ACL 2024, Wu et al. ICML 2025)
- Current view: Bias is learned
- **New view:** Bias is inherent to architecture; standard training doesn't overcome it
- **Implication:** Position-aware loading is even more critical than previously understood

#### LycheeCluster: Efficient Long-Context with Structure-Aware Chunking
**Paper:** arXiv:2603.08453 (March 2026)

**Finding:** Recursive hierarchical indexing with logarithmic-time pruning.

- **Boundary-aware chunking:** Preserves local semantic coherence
- **Triangle inequality indexing:** Transforms retrieval from O(N) to O(log N)
- **Lazy update:** Supports streaming generation
- **Results:** 3.6x end-to-end speedup with negligible performance degradation

**Tachikoma Impact:**
- **Supercedes:** RLM's manual chunking and sequential processing
- **Complement:** RLM implementation with adaptive chunking already exists
- **Upgrade:** Add hierarchical indexing to RLM for faster retrieval

#### FlashPrefill: Instantaneous Pattern Discovery for Ultra-Fast Long-Context Prefilling
**Paper:** arXiv:2603.06199 (March 2026)

**Finding:** 27.78x speedup on 256K sequences with dynamic thresholding.

- **Fast block-searching:** Locates vertical, slash, and block-sparse patterns
- **Dynamic thresholding:** Eliminates sorting/accumulating overhead
- **Results:** 1.71x speedup even at 4K context length

**Tachikoma Impact:**
- **Supercedes:** Existing sparse attention methods
- Potential to integrate with long-context processing

#### VSPrefill: Vertical-Slash Sparse Attention with Lightweight Indexing
**Paper:** arXiv:2603.04460 (March 2026)

**Finding:** 4.95x speedup at 128k context with 98.35% accuracy retention.

**Complement:** Vertical-slash patterns align with structure-aware chunking

#### Cross-Family Speculative Prefill
**Paper:** arXiv:2603.02631 (March 2026)

**Finding:** Cross-family draft models work for prompt compression.

- **Finding:** Attention-based token importance estimation transfers across model families
- **Results:** 90-100% baseline performance retention with substantial TTFT reduction
- **Implication:** No need for in-family draft models

**Tachikoma Impact:**
- **Complement:** Use any available smaller model as draft for long contexts

### Complementary Findings

#### Stem: Rethinking Causal Information Flow in Sparse Attention
**Paper:** arXiv:2603.06274 (March 2026)

**Finding:** Position-dependent top-k retains initial tokens for recursive dependencies.

**Complement:** Aligns with position-aware loading principles

---

## 3. Verification & Self-Reflection

### New Findings That Complement Current Research

#### The Mirror Loop: Recursive Non-Convergence in Generative Reasoning Systems
**Paper:** arXiv:2510.21861 (October 2025)

**Finding:** Reflection without grounding leads to informational closure (epistemic stasis).

- **Study:** 144 reasoning sequences across GPT-4o-mini, Claude 3 Haiku, Gemini 2.0 Flash
- **Results:** Mean informational change declined 55% in ungrounded runs (0.193 → 0.087)
- **Grounding intervention:** Single verification step at iteration 3 caused +28% rebound
- **Implication:** Minimal grounding functions as dissipative coupling, reintroducing informational flux

**Tachikoma Impact:**
- **Crucial finding:** Validates Tachikoma's verification loops approach
- **Confirms:** Generator-Verifier-Reviser pattern (arXiv:2602.10177) is essential
- **Implementation:** Ensure every reflection loop has grounding step

#### Inference-Time Scaling of Verification: Self-Evolving Deep Research Agents
**Paper:** arXiv:2601.15808 (January 2026)

**Finding:** Self-evolving agent via test-time rubric-guided verification.

- **DeepVerifier:** Rubric-based outcome reward verifier
- **Failure taxonomy:** 5 major categories, 13 sub-categories
- **Results:** 8-11% accuracy gains on GAIA and XBench-DeepResearch

**Tachikoma Impact:**
- **Complement:** Add rubric-based verification to verifier-code-agent
- **Implementation:** Build failure taxonomy for coding tasks

#### ReTreVal: Reasoning Tree with Validation
**Paper:** arXiv:2601.02880 (January 2026)

**Finding:** Hybrid framework integrating Tree-of-Thoughts, self-refinement, LLM critique, reflexion memory.

- **Structured reasoning tree:** Adaptive depth based on problem complexity
- **Dual validation:** Evaluates reasoning quality, coherence, correctness at each node
- **Cross-problem memory:** Stores insights from successful paths and failure patterns

**Tachikoma Impact:**
- **Complement:** Enhance verification with structured tree exploration
- **Implementation:** Add reasoning tree to complex verification scenarios

#### RISE: Self-Verification Approach to RL with Verifiable Rewards
**Paper:** arXiv:2505.13445 (May 2025)

**Finding:** Online RL framework training both problem-solving and self-verification.

- **Mechanism:** Verifier provides on-the-fly feedback for both tasks
- **Results:** Improves accuracy while fostering strong self-verification skills

**Tachikoma Impact:**
- **Complement:** Self-verification training for skill learning

---

## 4. Position Bias Advances

### New Findings That Supercede Current Research

#### Lost in the Middle at Birth (Detailed Above)

**Key insight from paper:**
- U-shape is **not** due to learned Softmax artifacts or distance-decay of positional encodings
- U-shape is present at **initialization** (Step 0)
- It's an **inherent geometric property** of causal decoder with residual connections
- Standard training **does not overcome** the topological valley

**Implications for Tachikoma:**
- Current position-aware loading strategy is validated but understated in importance
- **Critical:** Middle-context retrieval is structurally hostile, not just learned weakness
- **Action:** Priority-based loading becomes necessity, not optimization

### Complementary Findings

#### Length-Aware Attention Priors
**Paper:** arXiv:2603.09253 (March 2026)

**Finding:** Position-aware bias guides attention without inference parameters.

**Complement:** Aligns with position-aware loading principles

#### ViewRope: Geometry-Aware Rotary Position Embedding
**Paper:** arXiv:2602.07854 (February 2026)

**Finding:** Camera-ray directions for 3D-consistent long-context video.

**Complement:** Specialized position encoding for multimodal contexts

---

## 5. Mixture of Agents / Ensemble Systems

### New Findings That Complement Current Research

#### Attention-MoA: Enhancing Mixture-of-Agents via Inter-Agent Semantic Attention
**Paper:** arXiv:2601.16596 (January 2026)

**Finding:** Deep semantic interaction between agents via Inter-agent Semantic Attention.

- **Problem:** Existing MoA fails to facilitate deep semantic interaction
- **Solution:** Semantic attention between agents + inter-layer residual module
- **Results:** 91.15% LC Win Rate on AlpacaEval 2.0; Enables small open-source models to outperform massive proprietary models

**Tachikoma Impact:**
- **Complement:** OpenSage's horizontal ensemble could benefit from inter-agent semantic attention
- **Implementation:** Add semantic attention between ensemble agents

#### Mixture-of-Models: Unifying Heterogeneous Agents via N-Way Self-Evaluating Deliberation
**Paper:** arXiv:2601.16863 (January 2026)

**Finding:** Runtime Mixture-of-Models (MoM) with Dynamic Expertise Broker.

- **N-Way Self-Evaluating Deliberation (NSED):** Treats model selection as Knapsack Problem
- **Results:** Ensembles of <20B models match or exceed 100B+ parameter models
- **Safety:** Peer-mediated correction reduces sycophancy scores

**Tachikoma Impact:**
- **Complement:** Dynamic model selection for horizontal ensembles
- **Implementation:** Add NSED protocol to horizontal ensemble routing

#### Pyramid MoA: Hierarchical Mixture-of-Agents for Cost-Optimized Anytime Inference
**Paper:** arXiv:2602.19509 (February 2026)

**Finding:** Lightweight Router escalates queries only when necessary.

- **Mechanism:** Semantic agreement + confidence calibration among ensemble of small models
- **Results:** 93.0% accuracy on GSM8K (vs 98.0% Oracle) with 61% cost reduction
- **Latency:** +0.82s overhead

**Tachikoma Impact:**
- **Complement:** Hierarchical model selection for cost-aware routing
- **Implementation:** Add Pyramid routing tier to cost-aware routing

#### Multi-Agent Debate Framework
**Paper:** arXiv:2510.12697 (October 2025)

**Finding:** Multi-agent debate judge framework with adaptive stability detection.

- **Formalization:** Mathematical analysis of agent interactions
- **Stability detection:** Time-varying Beta-Binomial mixture + Kolmogorov-Smirnov test
- **Results:** Improves judgment accuracy over majority voting

**Tachikoma Impact:**
- **Complement:** Debate mechanism for OpenSage ensemble synthesis

#### TUMIX: Multi-Agent Test-Time Scaling with Tool-Use Mixture
**Paper:** arXiv:2510.01279 (September 2025)

**Finding:** Ensemble framework with distinct tool-use strategies.

- **Mechanism:** Multiple agents with different tool strategies, iteratively share/refine
- **Results:** +3.55% average accuracy improvement; 49% inference cost at equal performance

**Tachikoma Impact:**
- **Complement:** Diverse tool strategies in horizontal ensemble

---

## 6. Self-Programming & Dynamic Tools

### Findings That Complement Current Research

#### AutoAgent: Fully-Automated Zero-Code Framework
**Paper:** arXiv:2502.05957 (February 2025)

**Finding:** Users can create LLM agents through natural language alone.

- **Components:** Agentic System Utilities, LLM-powered Actionable Engine, Self-Managing File System, Self-Play Agent Customization
- **Results:** Surpasses SoTA on GAIA benchmark

**Tachikoma Impact:**
- **Complement:** OpenSage's self-programming aligns with AutoAgent vision
- **Implementation:** Natural language agent configuration interface

#### Stream of Revision: Autoregressive, Yet Revisable
**Paper:** arXiv:2602.01187 (February 2026)

**Finding:** Internal revision tokens enable seamless backtracking and editing.

- **Problem:** Code generation is monotonic (appends tokens linearly)
- **Solution:** Action tokens enable model to backtrack and edit history in single forward pass
- **Results:** Significantly reduces vulnerabilities with minimal inference overhead

**Tachikoma Impact:**
- **Complement:** Add revision tokens to code-agent skill for self-correction

#### Learning Randomized Reductions
**Paper:** arXiv:2412.18134 (January 2026)

**Finding:** Agentic Bitween uses LLMs to discover novel query functions for RSR.

- **Method:** Linear regression outperforms genetic algorithms, symbolic regression, MILP
- **Agentic approach:** LLMs dynamically discover query functions

**Tachikoma Impact:**
- **Complement:** LLM-driven discovery of optimization patterns

---

## 7. Hierarchical & Meta-Orchestration

### New Findings That Complement Current Research

#### MA-CoNav: Master-Slave Multi-Agent with Hierarchical Collaboration
**Paper:** arXiv:2603.03024 (March 2026)

**Finding:** Hierarchical agent collaboration with dual-level reflection.

- **Master Agent:** Global orchestration
- **Subordinate Agents:**
  - Observation Agent: Environment descriptions
  - Planning Agent: Task decomposition + verification
  - Execution Agent: Mapping + action
  - Memory Agent: Structured experiences
- **Dual reflection:** Local-Global reflection mechanism

**Tachikoma Impact:**
- **Complement:** Extends OpenSage's vertical decomposition
- **Implementation:** Add dual-level reflection to hierarchical orchestration

#### MagicAgent: Generalized Agent Planning
**Paper:** arXiv:2602.19000 (February 2026)

**Finding:** Foundation models for generalized agent planning.

- **Synthetic data framework:** High-quality trajectories across diverse planning tasks
- **Two-stage training:** Supervised fine-tuning + multi-objective RL
- **Results:** 75.1% on Worfbench, 86.9% on BFCL-v3; Surpasses GPT-5.2, Kimi-K2, GLM-4.7

**Tachikoma Impact:**
- **Complement:** Specialized planning models for orchestration

#### HarmonyCell: Automating Single-Cell Perturbation Modeling
**Paper:** arXiv:2603.01396 (March 2026)

**Finding:** Dual-track orchestration with LLM-driven semantic unifier + adaptive MCTS.

- **Semantic unifier:** Maps disparate metadata to canonical interface
- **Adaptive MCTS:** Synthesizes architectures with optimal statistical inductive biases
- **Results:** 95% valid execution rate on heterogeneous datasets

**Tachikoma Impact:**
- **Complement:** Dual-track orchestration for complex workflows

---

## 8. Performance & Efficiency

### New Findings That Supercede Current Research

#### ThunderAgent: Program-Aware Agentic Inference System
**Paper:** arXiv:2602.13692 (February 2026)

**Finding:** Program-aware scheduler for agentic workflows.

- **Abstraction:** LLM Programs enable unified view of heterogeneous resources (KV caches, system states, tools)
- **Program-aware scheduler:** Maximizes KV cache hit rates, mitigates memory imbalances
- **Results:** 1.5-3.6x throughput improvements in serving, 1.8-3.9x in RL rollout

**Tachikoma Impact:**
- **Supercedes:** LLM Program abstraction for resource management
- **Complement:** Add program-aware scheduling to orchestration

#### PrefillShare: Shared Prefill Module for KV Reuse
**Paper:** arXiv:2602.12029 (February 2026)

**Finding:** Share prefill stage across multiple models in disaggregated setting.

- **Factorization:** Prefill + decode modules; freeze prefill, fine-tune decode
- **Routing:** Effective prefill sharing across heterogeneous models
- **Results:** 4.5x lower p95 latency, 3.9x higher throughput

**Tachikoma Impact:**
- **Complement:** Prefill sharing for multi-model orchestration

---

## Implementation Priority Matrix

### High Priority (Superceding Research)

| Area | Paper | Finding | Tachikoma Action |
|------|-------|---------|------------------|
| **Position Bias** | Lost in Middle at Birth (2603.10123) | Bias is architectural, not learned - update documentation |
| **Orchestration** | AdaptOrch (2602.16873) | Add topology-aware routing to intent classification |
| **Tool Routing** | Graph-Based Self-Healing (2603.01548) | Implement graph-based routing for deterministic workflows |
| **Long Context** | LycheeCluster (2603.08453) | Add hierarchical indexing to RLM |
| **Reflection** | Mirror Loop (2510.21861) | Verify grounding exists in every reflection loop |

### Medium Priority (Complementary Research)

| Area | Paper | Finding | Tachikoma Action |
|------|-------|---------|------------------|
| **Skill Learning** | SkillOrchestra (2602.19672) | Track skill outcomes, build competence models |
| **Verification** | Inference-Time Scaling (2601.15808) | Add rubric-based verification |
| **MoA** | Attention-MoA (2601.16596) | Add inter-agent semantic attention to ensembles |
| **Model Selection** | Pyramid MoA (2602.19509) | Add hierarchical model selection to routing |
| **Code Revision** | Stream of Revision (2602.01187) | Add revision tokens to code-agent |

### Low Priority (Future Considerations)

| Area | Paper | Finding | Tachikoma Action |
|------|-------|---------|------------------|
| **Sparse Attention** | FlashPrefill (2603.06199) | Investigate for long-context optimization |
| **Prefill Sharing** | PrefillShare (2602.12029) | Multi-model orchestration efficiency |
| **Debate** | Multi-Agent Debate (2510.12697) | Ensemble synthesis mechanisms |
| **Program-Aware** | ThunderAgent (2602.13692) | Agentic workflow optimization |

---

## Key Research Gaps in Tachikoma

1. **Topology-Aware Orchestration:** Current routing doesn't consider orchestration topology
2. **Graph-Based Recovery:** LLM used for tool failure recovery (inefficient)
3. **Skill Learning:** Skills are static, not learned from execution
4. **Hierarchical Indexing:** RLM uses linear scan for retrieval
5. **Rubric-Based Verification:** Verification lacks structured failure taxonomy
6. **Inter-Agent Semantic Attention:** Horizontal ensemble lacks deep semantic interaction
7. **Dual-Level Reflection:** Vertical decomposition missing local-global reflection
8. **Program-Aware Scheduling:** Agentic workflows not optimized for KV cache

---

## Recommended Next Steps

### Immediate (This Week)

1. **Update position-bias documentation** with new architectural understanding
2. **Verify grounding** exists in all reflection loops (Mirror Loop finding)
3. **Add topology classifier** to intent routing (AdaptOrch pattern)

### Short-term (This Month)

1. **Implement graph-based tool routing** for predictable workflows
2. **Add hierarchical indexing** to RLM (LycheeCluster pattern)
3. **Build failure taxonomy** for rubric-based verification
4. **Track skill outcomes** for competence modeling

### Medium-term (Next Quarter)

1. **Implement topology-aware routing** with AdaptOrch patterns
2. **Add inter-agent semantic attention** to horizontal ensembles
3. **Implement dual-level reflection** for vertical decomposition
4. **Add hierarchical model selection** to cost-aware routing

### Long-term (Next 6 Months)

1. **Implement program-aware scheduling** for agentic workflows
2. **Add prefill sharing** for multi-model orchestration
3. **Build rubric-based verification** system
4. **Implement dynamic skill learning** from execution traces

---

## Bibliography

### Position Bias
- Lost in the Middle at Birth: An Exact Theory of Transformer Position Bias (arXiv:2603.10123)
- A Residual-Aware Theory of Position Bias in Transformers (arXiv:2602.16837)
- Length-Aware Attention Priors (arXiv:2603.09253)

### Orchestration & Routing
- AdaptOrch: Task-Adaptive Multi-Agent Orchestration (arXiv:2602.16873)
- SkillOrchestra: Learning to Route Agents via Skill Transfer (arXiv:2602.19672)
- Graph-Based Self-Healing Tool Routing (arXiv:2603.01548)
- IronEngine: Towards General AI Assistant (arXiv:2603.08425)
- CASTER: Context-Aware Strategy for Task Efficient Routing (arXiv:2601.19793)
- ORCH: many analyses, one merge (arXiv:2602.01797)

### Verification & Reflection
- The Mirror Loop: Recursive Non-Convergence (arXiv:2510.21861)
- Inference-Time Scaling of Verification (arXiv:2601.15808)
- ReTreVal: Reasoning Tree with Validation (arXiv:2601.02880)
- RISE: Self-Verification Approach (arXiv:2505.13445)

### Long-Context
- LycheeCluster: Efficient Long-Context (arXiv:2603.08453)
- FlashPrefill: Ultra-Fast Long-Context Prefilling (arXiv:2603.06199)
- VSPrefill: Vertical-Slash Sparse Attention (arXiv:2603.04460)
- Cross-Family Speculative Prefill (arXiv:2603.02631)
- Stem: Rethinking Causal Information Flow (arXiv:2603.06274)

### Mixture of Agents
- Attention-MoA: Enhancing MoA (arXiv:2601.16596)
- Mixture-of-Models: Unifying Heterogeneous Agents (arXiv:2601.16863)
- Pyramid MoA: Cost-Optimized Anytime Inference (arXiv:2602.19509)
- Multi-Agent Debate Framework (arXiv:2510.12697)
- TUMIX: Tool-Use Mixture (arXiv:2510.01279)

### Self-Programming
- AutoAgent: Fully-Automated Zero-Code Framework (arXiv:2502.05957)
- Stream of Revision: Autoregressive, Yet Revisable (arXiv:2602.01187)
- Learning Randomized Reductions (arXiv:2412.18134)

### Hierarchical Orchestration
- MA-CoNav: Master-Slave Multi-Agent (arXiv:2603.03024)
- MagicAgent: Generalized Agent Planning (arXiv:2602.19000)
- HarmonyCell: Automating Single-Cell Perturbation (arXiv:2603.01396)

### Performance & Efficiency
- ThunderAgent: Program-Aware Agentic Inference (arXiv:2602.13692)
- PrefillShare: Shared Prefill Module (arXiv:2602.12029)

---

**Last Updated:** 2026-03-13
**Research Period:** January 2026 - March 2026
**Sources:** arXiv, ACL Anthology, NeurIPS Workshops
