# Research

The techniques behind how Tachikoma works.

## What & Why

Tachikoma's design is based on real research from AI, language models, and agent systems. We don't make things up — each technique is grounded in published work. This section provides a quick lookup table to find research for any feature, plus deeper dives into the key findings.

Use this to understand why Tachikoma works the way it does, or to verify claims if you want to go deeper.

## Example

```
User: "Why does Tachikoma use skill chains instead of just one skill?"
→ Check research table:
  Feature: Skill Chains
  Research Basis: Agentic Proposing (arXiv:2602.03279)
→ Finding: Modular beats monolithic — 4B proposer + modular skills = 91.6% accuracy
```

## Quick Lookup

| Technique | What It Does | Used In | Research Basis |
|-----------|--------------|----------|----------------|
| **Intent Classification** | Figures out what you want | [Intent Routing](/capabilities/intent-routing) | Pattern matching, keyword analysis, semantic understanding |
| **Context Modules** | Loads project rules by priority | [Context Management](/capabilities/context-management) | Selective retrieval research, position bias studies |
| **Skill Chains** | Chains skills for complex workflows | [Skill Chains](/capabilities/skill-chains) | Agentic proposing (arXiv:2602.03279) |
| **Skill Composition** | Combines skills dynamically | skill-composer skill | Modular vs monolithic research |
| **Verification Loop** | Generator-Verifier-Reviser pattern | verifier-code-agent | Aletheia (arXiv:2602.10177) |
| **Balanced Prompting** | Prevents confirmation bias | reflection-orchestrator | Vibe-Proving (arXiv:2602.03837) |
| **Model-Aware Editing** | Optimizes edit formats per model | model-aware-editor | Harness Problem (Can.ac, Feb 2026) |
| **RLM** | Handles massive context efficiently | [Subagents](/capabilities/subagents) | MIT RLM (arXiv:2512.24601) |
| **Cost-Aware Routing** | Matches complexity to strategy | [Intent Routing](/capabilities/intent-routing), [Architecture](/concepts/architecture) | Tool-augmented LLMs (arXiv:2601.02663) |

## Key Research Findings

### Position Bias in Transformers

**Problem:** LLMs exhibit U-shaped attention bias (Hsieh et al., ACL 2024)
- Tokens at **beginning** and **end** receive higher attention
- Middle context is often **ignored** regardless of relevance
- Performance drops 10-20% when key info is in the middle

**Application in Tachikoma:**
- Intent classification first → Know what context to load
- Priority-based loading → Important rules at beginning
- Selective loading → Only load relevant modules, not everything

### Balanced Prompting Prevents Bias

### Position Bias in LLMs

**Problem:** LLMs exhibit U-shaped attention bias (Hsieh et al., ACL 2024)
- Tokens at the **beginning** and **end** receive higher attention
- Middle context is often **ignored** regardless of relevance
- Performance drops 10-20% when key info is in the middle

**Application in Tachikoma:**
- Intent classification first → Know what context to load
- Priority-based loading → Important rules at beginning
- Selective loading → Only load relevant modules, not everything

### Verification Beats Retries

**Finding:** Running a verification pass catches more errors than just retrying generation

**Research:** Aletheia (Google DeepMind, arXiv:2602.10177) — Generator-Verifier-Reviser pattern
- Achieved 90% on IMO-ProofBench Advanced (vs. 67% base model)
- Autonomous solutions to 4 open Erdős problems
- Natural language verifier admits failure (crucial for efficiency)

**Application in Tachikoma:**
- `verifier-code-agent` skill implements this pattern
- Used for high-stakes implementations where correctness is paramount

### Balanced Prompting Prevents Bias

**Finding:** Asking for "proof OR refutation" prevents confirmation bias

**Research:** Vibe-Proving (Google, arXiv:2602.03837) — Collaborative research framework
- Advisor model guides AI through iterative cycles
- Balanced prompting (request proof OR refutation)
- Code verification with executable validation

**Application in Tachikoma:**
- `reflection-orchestrator` skill uses balanced prompting
- Self-critique and adversarial questioning

### Harness Problem: Edit Format Matters

**Finding:** Choosing the right edit format for your model can improve success by 10x

**Research:** Harness Problem (Can.ac, Feb 2026) — Edit format matters as much as model
- Grok: 6.7% → 68.3% (10x improvement with hashline format)
- Gemini: +8% improvement from harness change alone
- `apply_patch` fails 50%+ on non-OpenAI models
- `str_replace` has "string not found" errors

**Application in Tachikoma:**
- `model-aware-editor` skill selects optimal edit format per model
- Supported: `str_replace` (Claude, Gemini), `apply_patch` (GPT), `hashline` (Universal)

### Edit Format Matters

**Finding:** Choosing the right edit format for your model can improve success by 10x

**Research:** Harness Problem (Can.ac, Feb 2026) — Edit format matters as much as model
- Grok: 6.7% → 68.3% (10x improvement with hashline format)
- Gemini: +8% improvement from harness change alone
- `apply_patch` fails 50%+ on non-OpenAI models
- `str_replace` has "string not found" errors
- `hashline` with line-hash anchoring: 8-14% improvement

**Application in Tachikoma:**
- `model-aware-editor` skill selects optimal edit format per model
- Supported: `str_replace` (Claude, Gemini), `apply_patch` (GPT), `hashline` (Universal)

### RLM: Context as Environment

**Finding:** Treat context as environment with adaptive chunking for massive context handling

**Research:** MIT RLM (arXiv:2512.24601) — Recursive Language Model
- Achieves 10M+ token context handling
- Semantic boundary detection (headings, JSON, logs)
- Adaptive chunk sizing (50K-200K based on content density)
- Parallel processing (3-5 chunks concurrently)
- 2-5x efficiency gain over naive full-context loading

**Application in Tachikoma:**
- `rlm-optimized` subagent coordinates RLM process
- `rlm-subcall` sub-LLM processes individual chunks
- Used for codebase analysis, bulk refactoring, multi-file work

### Cost-Aware Routing

**Finding:** Tools improve accuracy but add 40x latency. Match strategy to task complexity.

**Research:** Tool-Augmented LLMs (arXiv:2601.02663)
| Metric | No Tools | With Tools |
|--------|----------|------------|
| Accuracy | 47.5% | 67.5% |
| Latency | 8s | 317s |

**Application in Tachikoma:**
- Complexity-based routing → Direct (low), skill (medium), chain (high), orchestration (very high)
- Don't over-engineer simple tasks
- Don't cut corners on critical tasks

### Modular Beats Monolithic

**Finding:** Smaller, focused components beat one giant model

**Research:** Agentic Proposing (arXiv:2602.03279)
- 4B proposer model + modular skills = 91.6% accuracy
- Modular beats monolithic

**Application in Tachikoma:**
- `skill-composer` skill dynamically combines skills
- Each skill is focused and specialized
- Skills can be chained for complex workflows

## Reading Order

If you want to understand the research backing:

1. [Position Bias Studies](#position-bias-in-llms) — Context loading strategy
   - "Found in the Middle" (Hsieh et al., ACL 2024)
   - "On the Emergence of Position Bias" (ICML 2025)
   - "Serial Position Effects" (ACL 2025)
2. [Tool-Augmented LLMs](https://arxiv.org/abs/2601.02663) — Cost-aware routing
3. [Agentic Composing](https://arxiv.org/abs/2602.03279) — Modular vs monolithic
4. [Gemini Deep Think](https://deepmind.google/blog/accelerating-mathematical-and-scientific-discovery-with-gemini-deep-think/) — Reasoning modes
5. [MIT RLM](https://arxiv.org/html/2512.24601v1) — Context as environment
6. [Aletheia](https://arxiv.org/abs/2602.10177) — Verification loops
7. [Vibe-Proving](https://arxiv.org/abs/2602.03837) — Balanced prompting
8. [Harness Problem](https://blog.can.ac/2026/02/12/the-harness-problem/) — Edit format matters

## Caveat

Some claims from papers (like specific quantitative improvements) are reported but not independently verified by us. We're careful to label confidence levels in research. Always verify with original sources if you need certainty.

## See Also

- [Architecture](/concepts/architecture) — How components fit together
- [Intent Routing](/capabilities/intent-routing) — How research influences routing decisions
- [Skill Execution](/capabilities/skill-execution) — How research-based skills work
