# Verification Loops

Why verification beats retries.

## The Problem

Single-pass generation assumes outputs are correct. Models often miss their own errors, and retrying produces different (not necessarily better) results.

## Research

### "Towards Autonomous Mathematics Research" (Google DeepMind, arXiv:2602.10177)

**Finding:** Generator-Verifier-Reviser pattern achieves 90% on IMO-ProofBench (math proofs) vs 67% base.

**System:**

```
Problem → Generator → Candidate → Verifier → [Pass | Revise | Restart]
```

**Results:**

- 90% on IMO-ProofBench Advanced (vs 67% base)
- Autonomous solutions to 4 open Erdős problems
- Natural language verifier admits failure

**Why It Works:**

1. Separate concerns — generator creates, verifier validates
2. Different perspectives — verifier approaches from critique angle
3. Explicit checking — verifier justifies pass/fail
4. Admits uncertainty — prevents false positives

[arXiv](https://arxiv.org/abs/2602.10177)

### "Accelerating Scientific Research with Gemini" (Google, arXiv:2602.03837)

**Finding:** Human-AI collaboration with adversarial review detects subtle flaws.

**Techniques:**

- Iterative refinement
- Problem decomposition
- Adversarial reviewer to detect flaws
- Neuro-symbolic loop for code verification

[arXiv](https://arxiv.org/abs/2602.03837)

## Quantitative Impact (IMO-ProofBench)

| Approach          | Accuracy |
| ----------------- | -------- |
| Base Model        | 67%      |
| Retry (3x)        | 72%      |
| Verification Loop | 90%      |

> **Note**: These results are from mathematical proof benchmarks. Your mileage may vary for code tasks.

## Tachikoma's Implementation

### Verifier-Code-Agent

```
1. GENERATE — Produce initial solution
2. VERIFY — Check with explicit criteria
3. REVISE — Fix based on verification
4. [Loop max 3 iterations]
5. REFLECT — Question approach, flag issues
```

### Reflection-Orchestrator

```
1. Initial Output
2. Self-Critique
3. Revision
4. Final Verification
5. Reflect on confidence
```

### Skill Chain

```yaml
implement-verify:
  skills:
    - code-agent # Generate
    - verifier-code-agent # Verify
    - formatter # Clean up
```

## When to Use

**Use verification when:**

- Complex implementations
- High-stakes fixes
- First-time features
- Correctness is paramount

**Skip verification when:**

- Simple tasks (<50 lines)
- Prototypes
- Well-understood patterns

## See Also

- [Skill Chains](/capabilities/skill-chains)
- [Research Overview](./overview)
