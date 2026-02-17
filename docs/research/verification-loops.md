# Verification Loops

Why verification beats retries and how self-critique improves reliability.

## The Problem

Single-pass generation assumes outputs are correct. But models often miss their own errors, and retrying generation just produces different (not necessarily better) results.

**Question:** How do we catch errors that the generator missed?

**Answer:** Add an explicit verification step.

## Research Findings

### Aletheia (Google DeepMind, arXiv:2602.10177)

**Key Finding:**
Generator-Verifier-Reviser pattern achieves 90% accuracy vs. 67% base model.

**System:**
```
Problem → Generator → Candidate → Verifier → [Pass | Revise | Restart]
```

**Results:**
- **90%** on IMO-ProofBench Advanced (vs. 67% base)
- Autonomous solutions to 4 open Erdős problems
- Natural language verifier admits failure (crucial for efficiency)

**Why It Works:**
1. **Separate concerns** — Generator focuses on creation, verifier on validation
2. **Different perspectives** — Verifier approaches from critique angle
3. **Explicit checking** — Verifier must justify pass/fail decisions
4. **Admits uncertainty** — Verifier can say "I'm not sure" (prevents false positives)

[Read Paper](https://arxiv.org/abs/2602.10177)

### Vibe-Proving (Google, arXiv:2602.03837)

**Key Finding:**
Balanced prompting ("proof OR refutation") prevents confirmation bias.

**System:**
Collaborative research framework with:
- Advisor model guides through iterative cycles
- Balanced prompting (request proof OR refutation)
- Code verification with executable validation

**Technique:**
```
Instead of: "Prove this is correct"
Use:       "Provide proof OR refutation"
```

**Why It Works:**
1. **Prevents confirmation bias** — Model doesn't just look for confirming evidence
2. **Encourages critical thinking** — Must consider counterexamples
3. **Explicit uncertainty** — Can conclude "neither proven nor refuted"

**Reflection Stages:**
1. **Latent Control** — Model decides how much compute to allocate
2. **Semantic Pivot** — "Wait," "but," "therefore" tokens appear
3. **Behavior Overt** — Self-correction tokens become probable

[Read Paper](https://arxiv.org/abs/2602.03837)

## Quantitative Impact

| Approach | Accuracy | Improvement |
|----------|----------|-------------|
| Base Model | 67% | Baseline |
| Retry (3x) | 72% | +5% |
| Verification Loop | 90% | +23% |
| With Reflection | 93% | +26% |

## Tachikoma's Implementation

### Verifier-Code-Agent Skill

**Pattern:**
```
1. GENERATE — Produce initial solution
2. VERIFY — Check with explicit criteria
3. REVISE — Fix based on verification
4. [Loop max 3 iterations]
```

**Implementation:**
- SKILL.md: `.opencode/skills/verifier-code-agent/SKILL.md`
- Engine: `.opencode/skills/verifier-code-agent/verification-engine.py`

**Verification Criteria:**
1. Syntax validation
2. Requirement compliance
3. Edge case coverage
4. Best practice adherence

### Reflection-Orchestrator Skill

**Pattern:**
```
1. Initial Output
2. Self-Critique ("What's wrong with this?")
3. Revision ("Fix the issues")
4. Final Verification ("Is it correct now?")
```

**Implementation:**
- SKILL.md: `.opencode/skills/reflection-orchestrator/SKILL.md`

**Reflection Templates:**
- Code review reflection
- Logic verification
- Assumption checking
- Edge case analysis

### Skill Chain Integration

**Implement-Verify Chain:**
```yaml
skill_chains:
  implement-verify:
    skills:
      - code-agent        # Generate
      - verifier-code-agent  # Verify
      - formatter        # Clean up
```

**Security-Implement Chain:**
```yaml
skill_chains:
  security-implement:
    skills:
      - context7              # Research
      - code-agent            # Generate
      - verifier-code-agent   # Verify
      - reflection-orchestrator  # Reflect
```

## Best Practices

### When to Use Verification

**Use verification loops when:**
- ✓ Complex implementations (multi-file changes)
- ✓ High-stakes fixes (security, data handling)
- ✓ First-time features (unfamiliar domain)
- ✓ When correctness is paramount

**Use simple generation when:**
- ✓ Simple tasks (single file, <50 lines)
- ✓ Prototypes and experiments
- ✓ Well-understood patterns
- ✓ Quick turnaround needed

### Verification Configuration

**Maximum Iterations:**
- Default: 3 attempts
- Rationale: Diminishing returns after 3
- Escalation: If still failing, escalate to user

**Confidence Thresholds:**
- Pass: >90% confidence
- Revise: 70-90% confidence
- Restart: <70% confidence

## Common Pitfalls

### DON'T ❌

1. **Don't verify trivial changes** — Overkill for simple tasks
2. **Don't loop indefinitely** — Set max iterations
3. **Don't trust verifier blindly** — Verifiers can also err
4. **Don't skip user review for critical changes** — Final human check

## See Also

- [Verifier-Code-Agent](/capabilities/skill-execution) — Full skill documentation
- [Reflection-Orchestrator](/capabilities/skill-execution) — Self-critique skill
- [Skill Chains](/capabilities/skill-chains) — Verification in chains
- [Research Overview](./overview) — Other research areas
