# Research

Sources behind Tachikoma's design.

## Architecture

| Source | Key Insight |
|--------|-------------|
| [rothnic/opencode-agents](https://github.com/rothnic/opencode-agents) | Specialized agents, metrics |
| [orchestrator-opencode](https://github.com/bc100000000000/orchestrator-opencode) | 4-phase execution |

## RLM

| Source | Key Insight |
|--------|-------------|
| [arXiv:2512.24601](https://arxiv.org/html/2512.24601v1) | MIT RLM - context as environment |
| [brainqub3/claude_code_RLM](https://github.com/brainqub3/claude_code_RLM) | Practical RLM implementation |
| [Issue #11829](https://github.com/anomalyco/opencode/issues/11829) | 91% on 10M tokens |

## Verification & Self-Correction

### Aletheia (arXiv:2602.10177)

Google DeepMind's math research agent using Gemini Deep Think. Features a **Generator-Verifier-Reviser** loop:

```
Problem → Generator → Candidate → Verifier → [Correct | Revise | Restart]
```

**Key Results:**
- 90% on IMO-ProofBench Advanced (vs. 67% base model)
- Autonomous solutions to 4 open Erdős problems
- Natural language verifier admits failure (crucial for efficiency)

**Tachikoma Application:** `verifier-code-agent` skill implements this pattern for high-reliability code generation.

### Vibe-Proving (arXiv:2602.03837)

Collaborative research framework for CS/physics with Gemini:

| Technique | Purpose |
|-----------|---------|
| **Advisor Model** | Human guides AI through iterative cycles |
| **Balanced Prompting** | Request proof OR refutation (prevents confirmation bias) |
| **Code Verification** | Executable validation of reasoning |

**Results:** 18 research problems across algorithms, ML, optimization, physics.

**Tachikoma Application:** `reflection-orchestrator` skill uses balanced prompting for self-verification.

### Gemini Deep Think

[February 2026 announcement](https://deepmind.google/blog/accelerating-mathematical-and-scientific-discovery-with-gemini-deep-think/) - specialized reasoning mode achieving:
- Gold medal at IMO 2025
- Gold medal at ICPC World Finals
- 84.6% on ARC-AGI-2
- 48.4% on Humanity's Last Exam

## Model Evaluation & Harness Design

### ARC Prize

[ARC-AGI Leaderboard](https://arcprize.org/leaderboard) measures fluid intelligence efficiency:

> "True intelligence isn't just about solving problems, but solving them efficiently with minimal resources."

Key insight: Cost-per-task vs. performance scatter plot reveals reasoning efficiency. Systems like o3 achieve high scores but at massive compute cost.

### The Harness Problem (Can.ac, Feb 2026)

[Blog post](https://blog.can.ac/2026/02/12/the-harness-problem/) demonstrates **edit format matters as much as model**:

| Format | Best For | Issue |
|--------|----------|-------|
| `apply_patch` (OpenAI) | GPT models | 50%+ failure on non-OpenAI models |
| `str_replace` (Claude) | Exact matching | "String not found" errors |
| **Hashline** | Universal | Line-hash anchoring, 8-14% improvement |

**Finding:** +8% improvement on Gemini from harness change alone > most model upgrades.

**Tachikoma Application:** `model-aware-editor` skill selects optimal edit format per model.

## Anti-Hallucination

From orchestrator-opencode:

| Priority | Principle |
|----------|-----------|
| 1 | Accuracy - never fabricate |
| 2 | Determinism - reproducible |
| 3 | Completeness - full coverage |
| 4 | Speed - efficient |

Rules:
- ✓ Use docs, verify, ask when blocked
- ✗ Invent, guess, assume

## Cost-Aware

From arXiv:2601.02663:

| Metric | No Tools | With Tools |
|--------|----------|------------|
| Accuracy | 47.5% | 67.5% |
| Latency | 8s | 317s |

Lesson: Match strategy to task complexity.

## Skill Composition

From arXiv:2602.03279:

4B proposer + modular skills = 91.6% accuracy. Modular beats monolithic.

## Study Path

1. Read [MIT RLM paper](https://arxiv.org/html/2512.24601v1)
2. Check [Implementation Principles](https://github.com-Pines-Cheng/blog/issues/135)
3. Study [claude_code_RLM](https://github.com/brainqub3/claude_code_RLM)
4. Read [Aletheia paper](https://arxiv.org/abs/2602.10177) (verification)
5. Read [Vibe-Proving paper](https://arxiv.org/abs/2602.03837) (collaboration)
6. Review [Gemini Deep Think](https://deepmind.google/blog/accelerating-mathematical-and-scientific-discovery-with-gemini-deep-think/) (reasoning)
7. Explore [orchestrator-opencode](https://github.com/bc100000000000/orchestrator-opencode)

## See Also

- [Architecture](/explanation/architecture)
