---
name: reflection-orchestrator
description: Explicit self-verification and reflection for reliable outputs. Implements adversarial self-correction methodology.
mode: skill
temperature: 0.1
permission:
  edit: allow
  read: allow
  bash: allow
tools:
  read: true
  write: true
  edit: true
  grep: true
  bash: true
---

# Reflection Orchestrator

> **Key Pattern**: "Vibe-proving" - adversarial self-correction through iterative refinement
> **Research Basis**: Based on Gemini Deep Think research (Google, arXiv:2602.03837) - collaborative reasoning with balanced prompting
> **Notation**: `@skill-name` means "invoke that skill and wait for completion" - for skill chaining

## Core Concept

Models often miss their own errors. This skill implements explicit reflection stages discovered in Gemini's research:

| Stage | Function | What Happens |
|-------|----------|--------------|
| **Latent Control** | Encode "thinking budget" | Model decides how much compute to allocate |
| **Semantic Pivot** | Process discourse cues | "Wait," "but," "therefore" tokens appear |
| **Behavior Overt** | Generate reflection | Self-correction tokens become probable |

## When to Use

Use this skill for:
- Complex reasoning tasks
- High-stakes decisions
- When you need confidence in the output
- After @verifier-code-agent completes

## The Reflection Protocol

### Phase 1: Initial Output

Produce initial solution with standard approach.

### Phase 2: Self-Critique (The "Wait" Phase)

After initial output, explicitly challenge it:

```
Now critically analyze your own output above:

1. What's one thing that could be WRONG about this?
2. What's one assumption you're making that might be FALSE?
3. What's the simplest counterexample that would break this?
4. If this fails in production, what will be the symptom?

Be harsh. Find the weak spots.
```

### Phase 3: Revision (The "But" Phase)

Address the critiques:

```
Based on your self-critique above:
1. Fix the most serious issue you identified
2. Document why the original was problematic
3. Check if your fix introduces new issues
```

### Phase 4: Final Verification (The "Therefore" Phase)

Synthesize and verify:

```
Final verification:
1. Summarize: What did you originally think? What did you realize?
2. Confirm: Is the revised solution correct?
3. Document: What would prove this wrong?
```

## Reflection Templates

### Template A: Code Review Reflection

```
After reviewing this code, ask yourself:

1. TRUTH: "Is this code correct?"
   - Walk through the logic line by line
   - Check edge cases
   
2. ASSUMPTIONS: "What am I assuming?"
   - Input always valid?
   - No race conditions?
   - Memory always available?
   
3. COUNTER: "What would break this?"
   - What input breaks it?
   - What concurrent access breaks it?
   - What edge case breaks it?
   
4. HALLUCINATION: "Did I make anything up?"
   - Are these library functions real?
   - Are these parameters correct?
   - Is this behavior documented?
```

### Template B: Problem Solving Reflection

```
After solving this problem, ask:

1. IS THIS RIGHT?
   - Does this solve the stated problem?
   - Did I address the root cause?
   
2. IS THERE A BETTER WAY?
   - Is this the simplest solution?
   - Is this the most efficient?
   
3. WHAT COULD GO WRONG?
   - Edge case 1: ...
   - Edge case 2: ...
   - Edge case 3: ...
   
4. HOW WOULD I TEST THIS?
   - Unit test: ...
   - Integration test: ...
   - Edge case test: ...
```

### Template C: Research/Analysis Reflection

```
After providing this analysis:

1. ACCURACY: "Is this factually correct?"
   - Verify each claim
   - Check sources
   
2. COMPLETENESS: "Did I miss anything?"
   - Alternative perspectives?
   - Contradicting evidence?
   - Important edge cases?
   
3. UNCERTAINTY: "What don't I know?"
   - Explicitly label assumptions
   - Note confidence levels
   
4. VALIDATION: "How would someone prove this wrong?"
   - What evidence would contradict this?
   - What test would fail?
```

## The Vibe-Proving Protocol

From Gemini's research: "Informally this interactive workflow has been called 'vibe-proving'"

Key elements:
1. **Scaffolded reasoning** - Break problems into verifiable parts
2. **Adversarial prompting** - Have the model attack its own solutions
3. **Iterative refinement** - Guide through multiple correction rounds
4. **Explicit uncertainty** - Label confidence levels

## Integration with Other Skills

This skill composes with:
- **@verifier-code-agent**: Add reflection after verification
- **@code-review**: Use reflection templates for deeper review
- **@research-agent**: Use for verifying research findings

## Output Format

```
## Reflection Summary

### Stage 1: Self-Critique
- **Issue found**: {description}
- **Severity**: HIGH/MEDIUM/LOW

### Stage 2: Revision
- **Original**: {what was wrong}
- **Fix**: {how it was addressed}

### Stage 3: Final Verification
- **Confidence**: HIGH/MEDIUM/LOW
- **Remaining concerns**: {if any}
```

## Example

**Task**: Implement user authentication

**Initial output**: Generated auth function

**Self-critique**:
- "What if the database is down? No error handling"
- "What if tokens are expired? No validation"
- "Race condition: two concurrent logins"

**Revision**:
- Added database error handling
- Added token expiration check
- Added idempotency for login attempts

**Final verification**:
- "The revised solution properly handles failures at each layer"
- Confidence: HIGH
- "One remaining concern: token rotation on refresh"

---

**Note**: This skill is about explicit, structured self-verification. It's complementary to @verifier-code-agent - use both for maximum reliability.
