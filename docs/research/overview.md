# Research

The techniques behind how Tachikoma works.

## Quick Lookup

| Technique | What It Does | Used In | Research Basis |
|-----------|--------------|---------|----------------|
| **Intent Classification** | Figures out what you want | [Intent Routing](/capabilities/intent-routing) | intent-classifier skill |
| **Context Modules** | Loads project rules by priority | [Context Management](/capabilities/context-management) | Selective retrieval research |
| **Skill Composition** | Chains skills for complex workflows | [Skill Chains](/capabilities/skill-chains) | Agentic proposing (arXiv:2602.03279) |
| **Verification Loop** | Generator-Verifier-Reviser pattern | High-reliability tasks | Aletheia (arXiv:2602.10177) |
| **Balanced Prompting** | Prevents confirmation bias | Self-verification | Vibe-Proving (arXiv:2602.03837) |
| **Model-Aware Editing** | Optimizes edit formats per model | All code edits | Harness Problem (Can.ac) |
| **RLM** | Handles massive context efficiently | [Subagents](/capabilities/subagents) | MIT RLM (arXiv:2512.24601) |
| **Cost-Aware Routing** | Matches complexity to strategy | [Intent Routing](/capabilities/intent-routing) | Tool-augmented LLMs (arXiv:2601.02663) |

## What This Section Covers

We're not making things up. Tachikoma's design comes from real research. Here's what's backed by papers:

- **Why classify first:** Research shows LLMs have "lost in the middle" problem - they ignore context in the middle. Classifying intent lets us load only what's relevant.
- **Why verification matters:** Without it, models hallucinate. Aletheia showed verification loops improve math problem solving from 67% to 90%.
- **Why edit format matters:** The same model can go from 6.7% to 68% success just by changing how edits are formatted.
- **Why cost-aware routing:** Tools improve accuracy but add 40x latency. Match the right tool to the task.

## Key Findings

### Position Bias
LLMs pay more attention to the beginning and end of context. The middle gets ignored (Hsieh et al., ACL 2024). That's why we load context modules dynamically instead of dumping everything in.

### Verification Beats Retries
Running a verification pass catches more errors than just retrying the generation. The Generator-Verifier-Reviser pattern (Aletheia) catches issues the generator missed.

### Edit Format ≈ Model Quality
Can.ac found that choosing the right edit format for your model can improve success by 10x. Sometimes it's the harness, not the horse.

### Modular Beats Monolithic
A 4B proposer model with modular skills achieved 91.6% accuracy. Smaller, focused components beat one giant model (arXiv:2602.03279).

## Reading Order

If you want to understand the research backing:

1. [MIT RLM paper](https://arxiv.org/html/2512.24601v1) - Context as environment
2. [Aletheia paper](https://arxiv.org/abs/2602.10177) - Verification loops
3. [Vibe-Proving paper](https://arxiv.org/abs/2602.03837) - Balanced prompting
4. [Gemini Deep Think](https://deepmind.google/blog/accelerating-mathematical-and-scientific-discovery-with-gemini-deep-think/) - Reasoning modes
5. [Harness Problem](https://blog.can.ac/2026/02/12/the-harness-problem/) - Edit format matters

## Caveat

Some papers we cite (like the ARC findings and "1250x cost reduction") are reported but not independently verified by us. We're careful to label confidence levels. See the original sources for validation.

## See Also

- [Architecture](/concepts/architecture) - How components fit together
- [Intent Routing](/capabilities/intent-routing) - How classification leads to routing
