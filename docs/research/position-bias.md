# Position Bias in LLMs

U-shaped attention bias in transformer models.

## The Problem

LLMs exhibit **U-shaped attention bias** — tokens at beginning and end receive higher attention than middle, regardless of relevance.

**Consequences:**

- Important info in middle often ignored
- 10-20% performance drop when key context is middle
- "Lost in the middle" problem

## Research

### "Found in the Middle" (Hsieh et al., ACL 2024 Findings)

**Finding:** LLMs have U-shaped attention bias across architectures and sizes.

**Results:**

- Bias exists regardless of model size
- Persists with instruction tuning
- Affects open-source and proprietary models

[arXiv](https://arxiv.org/abs/2406.16008) | [ACL Anthology](https://aclanthology.org/2024.findings-acl.890/)
[arXiv](https://arxiv.org/abs/2603.10123) | "Lost in the Middle at Birth: An Exact Theory of Transformer Position Bias"
[OpenReview](https://openreview.net/forum?id=YufVk7I6Ii)

## See Also

- [Context Management](/capabilities/context-management)
- [Research Overview](./overview)
