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
4. Explore [orchestrator-opencode](https://github.com/bc100000000000/orchestrator-opencode)

## See Also

- [Architecture](/explanation/architecture)
