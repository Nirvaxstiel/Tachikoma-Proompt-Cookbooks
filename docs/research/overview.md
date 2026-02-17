# Research Overview

The scientific foundation behind Tachikoma's design.

## What & Why

Tachikoma's design is based on real research from AI, language models, and agent systems. Each technique is grounded in published work — we don't make things up.

**Why this matters:**
- Understand *why* the system works the way it does
- Verify claims against original sources
- Make informed decisions about configuration
- Trust that techniques are battle-tested

## Quick Lookup

| Technique | What It Does | Used In | Research Basis |
|-----------|--------------|---------|----------------|
| **Position-Aware Loading** | Optimizes context placement | [Context Management](/capabilities/context-management) | [Position Bias in LLMs](./position-bias) |
| **Verification Loops** | Generator-Verifier-Reviser pattern | [Skill Chains](/capabilities/skill-chains) | [Aletheia](./verification-loops) |
| **Balanced Prompting** | Prevents confirmation bias | [Reflection](/capabilities/skill-execution) | [Vibe-Proving](./verification-loops) |
| **Model-Aware Editing** | Optimal edit format per model | [Skill Execution](/capabilities/skill-execution) | [Harness Problem](./model-harness) |
| **RLM** | Large context handling | [Subagents](/capabilities/subagents) | [MIT RLM](./rlm) |
| **Cost-Aware Routing** | Match complexity to strategy | [Intent Routing](/capabilities/intent-routing) | [Tool-Augmented LLMs](./cost-aware-routing) |
| **Skill Composition** | Modular skill architecture | [Skill Chains](/capabilities/skill-chains) | [Agentic Proposing](./modularity) |

## Research Areas

### [Position Bias in LLMs](./position-bias)

How transformer attention patterns affect context processing and how to mitigate them.

**Key finding:** LLMs exhibit U-shaped attention bias — tokens at beginning and end receive higher attention than middle context.

**Papers:**
- "Found in the Middle" (Hsieh et al., ACL 2024)
- "On the Emergence of Position Bias" (ICML 2025)
- "Serial Position Effects" (ACL 2025)

### [Verification Loops](./verification-loops)

Why verification beats retries and how self-critique improves reliability.

**Key finding:** Running a verification pass catches more errors than just retrying generation.

**Papers:**
- Aletheia (Google DeepMind, arXiv:2602.10177)
- Vibe-Proving (Google, arXiv:2602.03837)

### [Model Harness](./model-harness)

Why edit format selection matters as much as model choice.

**Key finding:** Choosing the right edit format can improve success by 10x.

**Paper:**
- Harness Problem (Can.ac, Feb 2026)

### [Recursive Language Models](./rlm)

How to handle 10M+ token contexts through adaptive chunking.

**Key finding:** Treat context as environment with semantic boundary detection.

**Paper:**
- MIT RLM (arXiv:2512.24601)

### [Cost-Aware Routing](./cost-aware-routing)

Matching strategy to task complexity for optimal speed/accuracy tradeoffs.

**Key finding:** Tools improve accuracy by +20% but add 40x latency.

**Paper:**
- Tool-Augmented LLMs (arXiv:2601.02663)

### [Modularity](./modularity)

Why smaller, focused components beat monolithic approaches.

**Key finding:** 4B proposer + modular skills = 91.6% accuracy.

**Paper:**
- Agentic Proposing (arXiv:2602.03279)

## Reading Order

If you want to understand the research backing:

1. **[Position Bias](./position-bias)** — Context loading strategy (foundational)
2. **[Cost-Aware Routing](./cost-aware-routing)** — Speed vs accuracy tradeoffs
3. **[Modularity](./modularity)** — Why skills beat monolithic models
4. **[RLM](./rlm)** — Large context handling (advanced)
5. **[Verification Loops](./verification-loops)** — Reliability patterns
6. **[Model Harness](./model-harness)** — Edit format optimization

## Caveat

Some claims from papers (like specific quantitative improvements) are reported but not independently verified by us. We're careful to label confidence levels in research. Always verify with original sources if you need certainty.

## See Also

- [Architecture](/concepts/architecture) — How research influences system design
- [Capabilities](/capabilities/index) — Where research is applied
