# Research Overview

The scientific foundation behind Tachikoma's design.

## Quick Lookup

| Technique              | What                        | Used In            | Research                             |
| ---------------------- | --------------------------- | ------------------ | ------------------------------------ |
| Position-Aware Loading | Optimizes context placement | Context Management | [Position Bias](./position-bias)     |
| Verification Loops     | GVR pattern                 | Skill Chains       | [Verification](./verification-loops) |
| Reflection Phase       | Freedom to revisit, rethink | All skills         | [Verification](./verification-loops) |
| Model-Aware Editing    | Optimal edit format         | Skill Execution    | [Model Harness](./model-harness)     |

---

Edit format selection matters as much as model choice. Research in **[Model Harness](./model-harness)**.
| RLM | Large context handling | Subagents | [RLM](./rlm) |
| Cost-Aware Routing | Match complexity to strategy | Intent Routing | [Cost-Aware](./cost-aware-routing) |
| Skill Composition | Modular architecture | Skill Chains | [Modularity](./modularity) |

## Research Areas

### [Position Bias](./position-bias)

U-shaped attention bias in transformers.

**Papers:**

- "Found in the Middle" (Hsieh et al., ACL 2024)
- "On the Emergence of Position Bias" (Wu et al., ICML 2025)

### [Verification Loops](./verification-loops)

Why verification beats retries.

**Papers:**

- "Towards Autonomous Mathematics Research" (arXiv:2602.10177)
- "Accelerating Scientific Research with Gemini" (arXiv:2602.03837)

### [Model Harness](./model-harness)

Edit format selection matters as much as model choice.

**Source:** Can.ac blog (Feb 2026)

### [RLM](./rlm)

10M+ token contexts through adaptive chunking.

**Paper:** "Recursive Language Models" (arXiv:2512.24601)

### [Cost-Aware Routing](./cost-aware-routing)

Matching strategy to task complexity.

**Paper:** "When Do Tools and Planning Help LLMs Think?" (arXiv:2601.02663)

### [Modularity](./modularity)

Why focused components beat monolithic approaches.

**Paper:** "Agentic Proposing" (arXiv:2602.03279)

## Reading Order

1. [Position Bias](./position-bias) — Context loading (foundational)
2. [Cost-Aware Routing](./cost-aware-routing) — Speed vs accuracy
3. [Modularity](./modularity) — Why skills beat monolithic
4. [RLM](./rlm) — Large context (advanced)
5. [Verification Loops](./verification-loops) — Reliability
6. [Model Harness](./model-harness) — Edit optimization

## Caveat

Some claims from papers are reported but not independently verified. Always verify with original sources if you need certainty.

## See Also

- [Architecture](/concepts/architecture)
- [Capabilities](/capabilities/index)
