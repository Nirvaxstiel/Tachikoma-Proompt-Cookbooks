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

### "On the Emergence of Position Bias" (Wu et al., ICML 2025)

**Finding:** Causal masking amplifies early-position bias across layers.

**Why:**

1. Causal masking restricts attention to previous tokens
2. Early tokens accumulate attention from all subsequent tokens
3. Middle tokens get "squeezed"

[OpenReview](https://openreview.net/forum?id=YufVk7I6Ii)

## Quantitative Impact

| Scenario                    | Accuracy |
| --------------------------- | -------- |
| Key info at beginning       | Baseline |
| Key info in middle          | -10-20%  |
| Key info at end             | -2-5%    |
| With position-aware loading | +25-30%  |

## Tachikoma's Solution

**Strategy:**

1. Intent classification first → know what context is needed
2. Priority-based loading → important rules at beginning
3. Selective loading → only relevant modules
4. Position optimization → high-relevance at boundaries
5. Reflect → Was context sufficient? Should I have loaded more?

## Context Module Priority

```
Priority 0:   00-core-contract      (always first)
Priority 10:  10-coding-standards   (coding tasks)
Priority 12:  12-commenting-rules   (with coding-standards)
Priority 20:  20-git-workflow       (git tasks)
Priority 30:  30-research-methods   (research tasks)
```

## See Also

- [Context Management](/capabilities/context-management)
- [Research Overview](./overview)
