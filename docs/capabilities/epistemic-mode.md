# Epistemic Mode

Confidence labeling system that helps agents know what they don't know.

## What & Why

**Problem:** Agents make claims with varying levels of certainty. Without explicit confidence labeling, it's unclear:
- What is well-established vs. speculated
- When to proceed vs. ask for clarification
- What requires verification vs. can be trusted

**Solution:** **Epistemic mode** requires every claim to be labeled with a confidence level, indicating how certain the agent is about the claim.

## Confidence Levels

| Level | Meaning | When to Use |
|-------|---------|--------------|
| `established_fact` | Multiple sources confirm | Always proceed |
| `strong_consensus` | Most experts agree | Proceed |
| `emerging_view` | Newer finding, gaining traction | Proceed with caution |
| `speculation` | Logical inference, limited evidence | Proceed with verification |
| `unknown` | Cannot determine | **STOP** - Don't proceed |

### Level Definitions

#### 1. `established_fact`

**Definition:** Multiple independent sources confirm this claim.

**Examples:**
- Standard library behavior: `os.path.exists()` returns `True` if path exists
- Framework features: `AGENTS.md` defines tribal rules
- Language syntax: Python's `for` loop syntax
- Configuration: `intent-routes.yaml` structure

**Proceed:** Always
**Verification:** Not needed

#### 2. `strong_consensus`

**Definition:** Most experts in the field agree on this claim.

**Examples:**
- Industry standards: REST API design patterns
- Best practices: Clean Code principles (SOLID)
- Common algorithms: Hash tables for lookups
- Framework conventions: Git branching strategies

**Proceed:** Yes
**Verification:** Consider verifying if critical

#### 3. `emerging_view`

**Definition:** Newer finding gaining traction among experts, but not yet consensus.

**Examples:**
- Recent research findings: Position bias mitigation strategies
- New techniques: RLM adaptive chunking
- Early adoption: New LLM architectures
- Proposed patterns: Still being validated

**Proceed:** With caution
**Verification:** Recommended

#### 4. `speculation`

**Definition:** Logical inference based on limited evidence. Educated guess.

**Examples:**
- Pattern extrapolation: This usually happens in similar codebases
- Heuristic reasoning: Likely needs to be optimized
- Assumption based: Probably similar to previous implementation
- Limited testing: Should work but not verified

**Proceed:** With verification
**Verification:** Required before critical actions

#### 5. `unknown`

**Definition:** Cannot determine with available information.

**Examples:**
- Ambiguous query: "Fix the thing"
- Missing context: No project structure visible
- Contradictory evidence: Sources disagree
- Insufficient information: Cannot make informed decision

**Proceed:** **STOP** - Ask for clarification
**Verification:** Not possible - need more information

## Application

### When to Label

**EVERY claim** made by an agent must include confidence level:

**Required Elements:**
1. **The claim itself**
2. **Confidence level** (one of 5 levels)
3. **Evidence or reasoning** (why this confidence)

**Example Claims:**

**Established Fact:**
```
The function should use async/await (established_fact)
Based on: Pattern in similar files, verified in this project
```

**Speculation:**
```
The function should use async/await (speculation, confidence: 0.6)
Based on: Pattern in similar files, but not verified in this project
```

**Unknown:**
```
Unknown how to fix (unknown)
Reason: Insufficient information about the issue
```

### When to Stop

**STOP immediately when confidence is `unknown`:**

```
Uncertain about: Where the bug is
Confidence: unknown
Action: Ask user for clarification
```

**STOP when evidence is weak and action is critical:**

```
Proposed fix: Delete entire database (speculation, confidence: 0.4)
Evidence: Pattern suggests data corruption
Risk: HIGH
Action: STOP - Ask user for confirmation
```

## In Tachikoma Framework

### Universal Tribal Rule #1

**From AGENTS.md:**
```markdown
### 1. EPISTEMIC MODE: Know What You Don't Know

**Confidence Labeling (REQUIRED for every claim):**
- `established_fact` - Multiple sources confirm
- `strong_consensus` - Most experts agree
- `emerging_view` - Newer finding, gaining traction
- `speculation` - Logical inference, limited evidence
- `unknown` - Cannot determine

**Rules:**
- Label EVERY claim with confidence level
- Downgrade confidence when evidence is weak
- Never present speculation as fact
- Stop when confidence < 0.5
```

### Application in Agents

All agents (primary and subagents) must:
1. **Label all claims** with confidence
2. **Downgrade when uncertain**
3. **Stop when confidence is `unknown`**
4. **Never present speculation as fact**

## Best Practices

### DO ✅

1. **Always Label Claims**
   - Every assertion gets a confidence level
   - Include reasoning for the confidence
   - Be honest about uncertainty

2. **Appropriate Confidence Levels**
   - Use `established_fact` for verifiable truths
   - Use `speculation` for educated guesses
   - Use `unknown` when truly uncertain

3. **Downgrade When Uncertain**
   - If evidence is weak, downgrade confidence
   - If multiple sources disagree, lower confidence
   - If you're guessing, label as speculation

4. **Stop When Appropriate**
   - `unknown` confidence = stop immediately
   - `speculation` + critical action = add verification
   - Don't proceed with high-risk uncertain actions

### DON'T ❌

1. **Don't Over-Claim Certainty**
   - Don't label speculation as fact
   - Don't say "definitely" when you're not sure
   - Don't hide uncertainty

2. **Don't Ignore Evidence**
   - Don't maintain high confidence with weak evidence
   - Don't ignore contradictory information
   - Don't cherry-pick supporting sources

3. **Don't Stop Too Early**
   - Don't stop on `speculation` if action is low-risk
   - Don't stop on `emerging_view` for non-critical actions
   - Proceed with verification, don't block

4. **Don't Confuse Levels**
   - Don't mix up `speculation` and `unknown`
   - `unknown` means can't determine
   - `speculation` means can make educated guess

## Confidence Escalation

### Automatic Downgrade

When confidence is challenged or evidence weakens, automatically downgrade:

**Example Flow:**
```
Initial Claim:
"This is the best approach" (strong_consensus)

User Feedback:
"That doesn't work in my case"

Downgraded:
"This approach may not work in your case" (emerging_view)
```

### Verification Loop

For `speculation` claims, add verification before proceeding:

```
Claim: Use async/await (speculation, confidence: 0.6)
Action: Verify by checking similar files
Result: Confirmed → Proceed
Result: Refuted → Try alternative
```

## Communication of Uncertainty

### Transparent Reporting

Always communicate confidence to users:

```
[UNCERTAIN] The fix approach is speculative (confidence: 0.6)
Reasoning: Based on similar codebases, not verified here
Action: Would you like me to verify this approach first?
```

### Asking for Clarification

When confidence is `unknown`, ask specific questions:

```
[UNKNOWN] Cannot determine the issue (confidence: 0.0)
I need more information:
1. Where exactly is the error occurring?
2. What error message are you seeing?
3. What were you trying to do when it happened?
```

## Related Research

### Epistemic Reasoning in AI

**Sources:**
- **"Gemini Deep Think"** (Google DeepMind) - Structured reasoning modes
- **"Chain of Thought"** (OpenAI) - Explicit reasoning for complex tasks
- **"Self-Consistency"** (Anthropic) - Reducing hallucinations

### Confidence in Research

**Academic Practice:**
- All scientific claims include confidence levels
- Explicit discussion of uncertainty
- Peer review validates confidence assessments
- Reproducibility established through evidence

## Examples

### Code Analysis

**Established Fact:**
```
This function has a syntax error (established_fact)
Confidence: 1.0
Evidence: Python parser raised SyntaxError at line 42
```

**Speculation:**
```
This function may need optimization (speculation, confidence: 0.7)
Reasoning: Similar patterns in codebase suggest caching could help
Action: Verify with performance testing
```

**Unknown:**
```
The root cause is unclear (unknown, confidence: 0.0)
Evidence: Multiple possible causes, no definitive evidence
Action: Need more information to proceed
```

### Project Decisions

**Strong Consensus:**
```
Use PostgreSQL as database (strong_consensus)
Confidence: 0.9
Evidence: Industry standard for this use case, team has expertise
```

**Emerging View:**
```
Consider GraphQL for API (emerging_view, confidence: 0.7)
Reasoning: Gaining traction, team has limited experience
Action: Prototype first to validate approach
```

## Tools & Skills

### Related Skills

All skills automatically apply epistemic mode:
- **code-agent** - Labels all code analysis claims
- **research-agent** - Labels all investigation claims
- **analysis-agent** - Labels all review findings
- All subagents - Apply to all operations

### Configuration

Confidence thresholds for routing:
```yaml
# .opencode/config/confidence-routes.yaml
confidence_routing:
  min_confidence_proceed: 0.5  # Speculation or above
  min_confidence_verify: 0.7  # Strong consensus or above
  min_confidence_ask: 0.3  # Unknown or below
  
escalation_rules:
  low_confidence:
    threshold: 0.7
    action: add_verification
    route_to: verifier-code-agent
    retry_max: 3
```

## See Also

- [Universal Tribal Rules](#universal-tribal-rules) - All 9 tribal rules
- [Validation](#validation) - How to inspect before acting
- [Communication Protocol](#communication-protocol) - Structured communication
- [Research Overview](../research/overview.md) - Research-backed techniques

**Last Updated:** 2026-02-17
**Tribal Rule:** Universal Rule #1 - Epistemic Mode
**Application:** All agents, all claims, always
