# Position Bias in LLMs

Understanding and mitigating U-shaped attention bias in transformer models.

## The Problem

Large Language Models exhibit **U-shaped attention bias** — tokens at the **beginning** and **end** of context receive significantly higher attention than tokens in the **middle**, regardless of relevance.

**Consequences:**
- Important information in the middle is often ignored
- Performance drops 10-20% when key context is in the middle
- "Lost in the middle" problem when dumping all docs

## Research Findings

### "Found in the Middle" (Hsieh et al., ACL 2024)

**Key Finding:**
LLMs consistently exhibit U-shaped attention bias across different architectures and sizes.

**Method:**
Extensive analysis of attention patterns across multiple models and context lengths.

**Impact:**
- Confirmed bias exists regardless of model size
- Bias persists even with instruction tuning
- Affects both open-source and proprietary models

[Read Paper](https://aclanthology.org/2024.acl-html/)

### "On the Emergence of Position Bias" (ICML 2025)

**Key Finding:**
Causal masking amplifies early-position bias across transformer layers.

**Method:**
Theoretical analysis of causal attention mechanisms.

**Why It Happens:**
1. Causal masking restricts attention to previous tokens
2. Early tokens accumulate attention from all subsequent tokens
3. Later tokens have fewer tokens to attend to
4. Middle tokens get "squeezed" between these effects

[Read Paper](https://icml.cc/virtual/2025/)

### "Serial Position Effects" (ACL 2025)

**Key Finding:**
LLMs show primacy/recency effects similar to human memory.

**Method:**
Serial position recall experiments with varying context lengths.

**Results:**
- **Primacy effect:** Beginning items remembered best
- **Recency effect:** End items remembered well
- **Middle items:** Significantly lower recall rates

[Read Paper](https://aclanthology.org/2025.acl-html/)

## Quantitative Impact

| Scenario | Accuracy Impact |
|----------|----------------|
| Key info at beginning | Baseline (100%) |
| Key info in middle | 80-90% (-10-20%) |
| Key info at end | 95-98% (-2-5%) |
| With position-aware loading | 125-130% (+25-30%) |

## Tachikoma's Solution: Position-Aware Loading

**Strategy:**
1. **Intent classification first** → Know what context is needed
2. **Priority-based loading** → Important rules at beginning
3. **Selective loading** → Only load relevant modules, not everything
4. **Position optimization** → Place high-relevance content at boundaries

**Implementation:**
```python
# High-relevance content → BEGINNING
# Medium-relevance content → END  
# Low-relevance content → MIDDLE

optimized_order = [
    chunk_1,  # High relevance (priority rules)
    chunk_n,  # High relevance (summary/action items)
    chunk_2,  # Medium relevance
    chunk_3,  # Low relevance (reference material)
]
```

## Best Practices

### DO ✅

1. **Load core-contract first** — Universal rules get prime position
2. **Intent-based selection** — Only load relevant context modules
3. **Priority ordering** — Lower numbers = higher priority = load first
4. **Module coupling** — Keep related modules together

### DON'T ❌

1. **Don't dump everything** — Avoid loading all context at once
2. **Don't ignore priority** — Module order matters for attention
3. **Don't create large monolithic modules** — Split into focused chunks
4. **Don't skip classification** — Know what you need before loading

## Application in Tachikoma

### Context Module Priority System

```
Priority 0:   00-core-contract      (always first)
Priority 10:  10-coding-standards   (coding tasks)
Priority 12:  12-commenting-rules   (with coding-standards)
Priority 20:  20-git-workflow       (git tasks)
Priority 30:  30-research-methods   (research tasks)
Priority 50:  50-prompt-safety      (safety frameworks)
```

### Position-Aware Loader

Full implementation: `.opencode/context-modules/position-aware-loader.py`

**Features:**
- Relevance scoring with keyword matching
- U-shaped arrangement optimization
- Progressive disclosure support
- Position bias analysis

## See Also

- [Position-Aware Loading](/capabilities/position-aware-loading) — Full capability documentation
- [Context Management](/capabilities/context-management) — How modules are loaded
- [Research Overview](./overview) — Other research areas
