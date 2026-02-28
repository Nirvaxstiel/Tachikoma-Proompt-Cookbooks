# Cost-Aware Routing

Matching strategy to task complexity.

## The Problem

Tools improve accuracy but add latency. Using the wrong tool wastes time or produces poor results.

## Research

### "When Do Tools and Planning Help LLMs Think?" (arXiv:2601.02663)

**Finding:** Tools improve accuracy by +20% but add 40x latency.

| Metric   | No Tools | With Tools |
| -------- | -------- | ---------- |
| Accuracy | 47.5%    | 67.5%      |
| Latency  | 8s       | 317s       |

**Implications:**

1. Simple tasks — Direct response is faster and sufficient
2. Complex tasks — Tools are necessary for accuracy
3. Sweet spot — Match tool complexity to task

[arXiv](https://arxiv.org/abs/2601.02663)

## Tachikoma's Solution

| Complexity | Strategy          | Latency |
| ---------- | ----------------- | ------- |
| Low        | Direct response   | 1-2s    |
| Medium     | Single skill      | 5-15s   |
| High       | Multi-skill chain | 15-45s  |
| Very High  | RLM orchestration | 45-120s |

## Routing Decision

```
User Request
    ↓
Classify Intent
    ↓
Confidence > 0.7?
    ├── NO → Ask for clarification
    ↓ YES
Context > 2000 tokens?
    ├── YES → Use RLM subagent
    ↓ NO
Task complexity?
    ├── Simple → Direct skill
    ├── Medium → Single skill
    ├── High → Skill chain
    └── Critical → Full orchestration
    ↓
Reflect on approach (freedom to question, flag issues)
```

## Configuration

```yaml
routes:
  debug:
    confidence_threshold: 0.7
    skill: code-agent
    strategy: direct

  verify:
    confidence_threshold: 0.6
    skill_chain: implement-verify
    strategy: sequential

  complex:
    confidence_threshold: 0.5
    subagent: rlm-optimized
    strategy: rlm
```

## See Also

- [Intent Routing](/capabilities/intent-routing)
- [Research Overview](./overview)
