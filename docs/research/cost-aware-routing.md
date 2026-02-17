# Cost-Aware Routing

Matching strategy to task complexity for optimal speed/accuracy tradeoffs.

## The Problem

Tools improve accuracy but add significant latency. Using the wrong tool for the task wastes time or produces poor results.

**Question:** When should we use tools vs. direct responses?

**Answer:** Match the strategy to task complexity.

## Research Findings

### Tool-Augmented LLMs (arXiv:2601.02663)

**Key Finding:**
Tools improve accuracy by +20% but add 40x latency.

**Results:**

| Metric | No Tools | With Tools | Delta |
|--------|----------|------------|-------|
| Accuracy | 47.5% | 67.5% | +20% |
| Latency | 8s | 317s | 40x |

**Implications:**
1. **Simple tasks** — Don't over-engineer. Direct response is faster and sufficient.
2. **Complex tasks** — Don't cut corners. Tools are necessary for accuracy.
3. **Sweet spot** — Match tool complexity to task complexity.

**The Tradeoff Curve:**
```
Accuracy
  100% |                    ****
       |                ****
   80% |            ****
       |        ****
   60% |    ****
       |****
   40% +----+----+----+----+----+  Latency
       1s   10s  30s  60s  120s  300s
       
       Direct  Skill  Chain  RLM
```

[Read Paper](https://arxiv.org/abs/2601.02663)

## Tachikoma's Solution: Complexity-Based Routing

**Strategy:** Match execution approach to task complexity.

| Complexity | Strategy | Latency | Use When |
|------------|----------|---------|----------|
| **Low** | Direct response | 1-2s | Simple Q&A, clarifications |
| **Medium** | Single skill | 5-15s | Standard tasks |
| **High** | Multi-skill chain | 15-45s | Verification needed |
| **Very High** | Full orchestration | 45-120s | Large context, novel problems |

## Routing Decision Tree

```
User Request
    ↓
Classify Intent
    ↓
Is intent clear? (confidence > 0.7)
    ├── NO → Ask for clarification
    ↓ YES
Context size > 2000 tokens?
    ├── YES → Use RLM subagent
    ↓ NO
Task complexity?
    ├── Simple → Direct skill
    ├── Medium → Single skill
    ├── High → Skill chain
    └── Critical → Full orchestration
```

## Implementation

### Intent Routes Configuration

```yaml
# .opencode/config/intent-routes.yaml
routes:
  # Low complexity → Direct execution
  document:
    confidence_threshold: 0.6
    skill: self-learning
    strategy: direct
  
  # Medium complexity → Single skill
  debug:
    confidence_threshold: 0.7
    skill: code-agent
    strategy: direct
  
  # High complexity → Skill chain
  verify:
    confidence_threshold: 0.6
    skill_chain: implement-verify
    strategy: sequential
  
  # Very high complexity → RLM orchestration
  complex:
    confidence_threshold: 0.5
    subagent: rlm-optimized
    strategy: rlm
```

### Cost Transparency

Before executing high-complexity routes, Tachikoma reports estimated costs:

```
Task Analysis:
├── Intent: research (confidence: 0.88)
├── Complexity: HIGH
├── Estimated Latency: 45-90s
├── Estimated Cost: Medium
└── Proposed Strategy: Multi-skill composition
    ├── Step 1: context7 (live docs)
    ├── Step 2: research-agent (analysis)
    ├── Step 3: code-agent (prototype)
    └── Step 4: synthesis

Proceed with this plan? (yes/no/modify)
```

### Confidence-Based Escalation

Lower confidence = more verification needed:

```yaml
# .opencode/config/confidence-routes.yaml
escalation_rules:
  low_confidence:
    threshold: 0.7
    action: add_verification
    route_to: verifier-code-agent
  
  very_low_confidence:
    threshold: 0.5
    action: ask_user
    reason: "Confidence too low for autonomous action"
  
  high_confidence:
    threshold: 0.9
    action: proceed_direct
```

## Complexity Estimation

Tachikoma estimates complexity using:

### Input Factors
- Query length and vocabulary complexity
- Number of distinct domains mentioned
- Presence of constraints/requirements
- Ambiguity level (inverse of confidence)

### Context Factors
- Size of relevant context (>2000 tokens increases complexity)
- Number of files/systems involved
- External dependencies (APIs, libraries)

### Historical Factors
- Similar past tasks duration
- Previous success rate with this task type
- User feedback on complexity

## Optimization Strategies

### Minimize Costs

**When:** Budget-conscious, time-sensitive

**Strategies:**
- Use direct responses for simple queries
- Batch multiple small tasks into single invocation
- Cache results from expensive operations
- Skip unnecessary skills

**Example:**
```
Instead of: 5 separate "fix typo" requests
Use: "Fix typos in these 5 files" (batch)
```

### Maximize Quality

**When:** Accuracy-critical, high-stakes

**Strategies:**
- Use multi-agent orchestration
- Invest in research phase for novel problems
- Parallelize independent operations
- Add verification/validation steps

**Example:**
```
Task: Implement payment processing
├── Research: Payment security best practices
├── Implement: Secure code
├── Verify: Security audit
├── Reflect: Self-critique
└── Format: Clean up
```

### Balance Strategy

**When:** General use, most tasks

**Strategies:**
- Prefer single-skill for routine tasks
- Use composition for one-off complex tasks
- Ask user for very high-cost operations
- Provide "quick" vs "thorough" options

## Special Cases

### Time-Sensitive Tasks

**Strategy:** Reduce complexity threshold by 0.2

```
Normal threshold: 0.7
Time-sensitive: 0.5

Prefer: Parallel execution over sequential
Skip: Non-critical validation steps
Use: Faster models if available
```

### Accuracy-Critical Tasks

**Strategy:** Increase complexity threshold by 0.1

```
Normal threshold: 0.7
Accuracy-critical: 0.8

Always: Use composition for research/analysis
Add: Verification/validation steps
Use: Reflection-orchestrator for self-review
```

### Budget-Constrained Mode

**Strategy:** Cap individual operation cost

```
Cap: $0.50 per operation
Prefer: CLI tools over LLM inference
Use: Cached/context-manager results
Ask: User confirmation for expensive operations
```

## User Override

Users can override cost-aware routing:

```
User: "Quick answer, I don't need thorough research"
Tachikoma: Acknowledged. Using fast mode.
           (reduced complexity: 0.82 → 0.55)

User: "I need the most thorough analysis possible"
Tachikoma: Acknowledged. Using comprehensive mode.
           (increased complexity: 0.45 → 0.75)
```

## Best Practices

### DO ✅

1. **Match strategy to complexity** — Don't use a sledgehammer to crack nuts
2. **Report costs transparently** — Inform users of expensive operations
3. **Allow overrides** — Let users choose speed vs thoroughness
4. **Learn from telemetry** — Adjust thresholds based on success rates
5. **Cache expensive operations** — Don't repeat research/docs fetching

### DON'T ❌

1. **Don't over-engineer simple tasks** — Direct response often sufficient
2. **Don't cut corners on critical tasks** — Security/payments need thoroughness
3. **Don't hide costs** — Always report estimated latency
4. **Don't ignore user preferences** — Respect speed vs quality choices
5. **Don't optimize prematurely** — Measure first, then optimize

## See Also

- [Intent Routing](/capabilities/intent-routing) — How routing works
- [Architecture](/concepts/architecture) — Cost-aware design
- [Research Overview](./overview) — Other research areas
