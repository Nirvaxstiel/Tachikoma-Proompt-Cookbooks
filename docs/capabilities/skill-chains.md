# Skill Chains

Link multiple skills together for complex workflows.

## What Are Skill Chains?

Skill chains link multiple skills in sequence. The output of one skill becomes the input for the next. This enables sophisticated workflows beyond what any single skill can accomplish.

Think of it as an assembly line: each skill does its part, passes it along, and the next skill refines it further.

## Why Use Chains?

**Single Skill Limitations:**
- One perspective only
- Fixed approach
- No verification step
- Errors propagate silently

**Chain Advantages:**
- Multiple verification stages
- Progressive refinement
- Error catching at each step
- Higher reliability for critical tasks

## Available Skill Chains

### implement-verify

**Description:** Implementation with verification loop

**Skills:** `code-agent` → `verifier-code-agent` → `formatter`

**Use When:**
- High-stakes implementations
- Security-critical code
- Complex multi-file changes
- When correctness is paramount

**Flow:**
```
1. code-agent: Generate initial implementation
2. verifier-code-agent: Verify and fix issues
3. formatter: Clean up and standardize
```

**Example:**
```
User: "Implement authentication system"
→ Chain: implement-verify
→ Result: Generated code, verified for issues, formatted
```

### research-implement

**Description:** Research followed by implementation

**Skills:** `research-agent` → `context7` → `code-agent` → `formatter`

**Use When:**
- Implementing unfamiliar APIs
- New technology adoption
- Need to understand before building
- Best practice research required

**Flow:**
```
1. research-agent: Investigate solutions
2. context7: Fetch latest documentation
3. code-agent: Implement based on research
4. formatter: Clean up result
```

**Example:**
```
User: "Add OAuth2 authentication with Google"
→ Chain: research-implement
→ Result: Researched OAuth2 flows, fetched docs, implemented
```

### security-implement

**Description:** Security-critical implementation with maximum verification

**Skills:** `context7` → `code-agent` → `verifier-code-agent` → `reflection-orchestrator`

**Use When:**
- Authentication/authorization code
- Cryptographic implementations
- Payment processing
- Security-sensitive features

**Flow:**
```
1. context7: Fetch latest security best practices
2. code-agent: Generate secure implementation
3. verifier-code-agent: Verify correctness
4. reflection-orchestrator: Self-critique and validate
```

**Example:**
```
User: "Implement JWT token handling"
→ Chain: security-implement
→ Result: Secure, verified, self-validated implementation
```

### deep-review

**Description:** In-depth code review with self-verification

**Skills:** `analysis-agent` → `reflection-orchestrator`

**Use When:**
- Critical code review
- Security audit
- Architecture evaluation
- Before major releases

**Flow:**
```
1. analysis-agent: Initial code analysis
2. reflection-orchestrator: Self-critique findings
```

**Example:**
```
User: "Review this payment module thoroughly"
→ Chain: deep-review
→ Result: Analysis + adversarial self-verification
```

### complex-research

**Description:** Multi-source research with verification

**Skills:** `research-agent` → `context7` → `reflection-orchestrator`

**Use When:**
- Deep technology investigation
- Competitive analysis
- Architecture decisions
- Need high-confidence research

**Flow:**
```
1. research-agent: Initial investigation
2. context7: Fetch authoritative sources
3. reflection-orchestrator: Validate findings
```

**Example:**
```
User: "Research best database for our use case"
→ Chain: complex-research
→ Result: Comprehensive, verified research
```

## Configuration

Skill chains are defined in `intent-routes.yaml`:

```yaml
skill_chains:
  implement-verify:
    description: "Implementation with verification loop"
    skills:
      - code-agent
      - verifier-code-agent
      - formatter
    mode: sequential
    context_modules:
      - 00-core-contract
      - 10-coding-standards
```

## Chain Modes

### Sequential (Default)

Skills execute one after another:
```
Skill A → Output → Skill B → Output → Skill C
```

**Best for:** Verification chains, progressive refinement

### Parallel (Future)

Skills execute simultaneously:
```
          ┌→ Skill A ─┐
Input ────┼→ Skill B ─┼→ Synthesize → Output
          └→ Skill C ─┘
```

**Best for:** Multi-perspective analysis

## Cost Considerations

Skill chains provide reliability at the cost of latency:

| Chain | Skills | Estimated Latency | Best For |
|-------|--------|-------------------|----------|
| implement-verify | 3 | 30-60s | Critical features |
| research-implement | 4 | 45-90s | Unfamiliar tech |
| security-implement | 4 | 45-90s | Security code |
| deep-review | 2 | 20-40s | Important reviews |
| complex-research | 3 | 30-60s | Deep investigation |

## When to Use Chains

**Use a chain when:**
- ✓ Task is high-stakes (production, security, payments)
- ✓ Multiple verification stages needed
- ✓ You need research + implementation
- ✓ Error detection is critical
- ✓ Time allows for thoroughness

**Use single skill when:**
- ✓ Task is routine
- ✓ Quick turnaround needed
- ✓ Low risk if imperfect
- ✓ Budget constraints

## Creating Custom Chains

Define custom chains in `intent-routes.yaml`:

```yaml
skill_chains:
  my-custom-chain:
    description: "Custom workflow"
    skills:
      - skill-a
      - skill-b
      - skill-c
    mode: sequential
    context_modules:
      - 00-core-contract
```

## Debugging Chains

If a chain fails:
1. Check which skill failed
2. Review that skill's output
3. Consider adjusting context modules
4. Try simpler chain or single skill

## See Also

- [Composite Intents](/capabilities/composite-intents) - Multi-intent workflows
- [Skill Execution](/capabilities/skill-execution) - Individual skill documentation
- [Intent Routing](/capabilities/intent-routing) - Configuration details
