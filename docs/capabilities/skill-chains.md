# Skills & Workflows

Link multiple skills together for complex workflows using **workflows** (sequential) or **skills_bulk** (all at once).

## Two Modes

### Workflows (Sequential)

Skills execute **one after another** — each skill sees the result of the previous. Use when:
- Implementation → Verification → Format
- Research → Implement
- Analysis → Review → Validate

### Skills Bulk (All at Once)

All skills are loaded **at once** into context. The agent picks what to use. Use when:
- Multi-tool tasks
- Agent decides best approach
- Flexibility is needed

---

## How It Works

### Workflows

1. **Intent is classified** — Tachikoma figures out what you want
2. **Route specifies workflow** — Sequential execution
3. **Skills execute in sequence** — Output of skill A → input for skill B
4. **Results are synthesized** — Combined result from all skills

### Skills Bulk

1. **Intent is classified** — Tachikoma figures out what you want
2. **All skills loaded** — Via multiple `skill()` calls
3. **Agent decides** — Which skills to use and in what order
4. **Flexible execution** — Adapts to task needs

---

## Why This Matters

Without workflows/skills:
- **Single perspective** — One skill with its biases
- **No verification** — Errors propagate silently
- **Fixed approach** — Can't adapt to task complexity

With workflows:
- **Multiple perspectives** — Different skills have different strengths
- **Progressive refinement** — Each skill improves the output
- **Error catching** — Verification skills catch what generators missed

With skills_bulk:
- **Agent flexibility** — Adapts to what's needed
- **Efficient** — No unnecessary steps
- **Multi-tool** — Can handle varied tasks

---

## Available Workflows (Sequential)

### implement-verify

**Purpose:** Implementation with verification loop

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
→ Workflow: implement-verify
→ Result: Generated code, verified for issues, formatted
```

### research-implement

**Purpose:** Research followed by implementation

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

### security-implement

**Purpose:** Security-critical implementation with maximum verification

**Skills:** `context7` → `code-agent` → `verifier-code-agent` → `reflection-orchestrator`

**Use When:**
- Authentication/authorization code
- Cryptographic implementations
- Payment processing
- Security-sensitive features

### deep-review

**Purpose:** In-depth code review with self-verification

**Skills:** `analysis-agent` → `reflection-orchestrator`

**Use When:**
- Critical code review
- Security audit
- Architecture evaluation
- Before major releases

### complex-research

**Purpose:** Multi-source research with verification

**Skills:** `research-agent` → `context7` → `reflection-orchestrator`

**Use When:**
- Deep technology investigation
- Competitive analysis
- Architecture decisions
- Need high-confidence research

---

## Available Skills Bulk

### coding-all

**Purpose:** All coding skills available

**Skills:** `code-agent`, `verifier-code-agent`, `formatter`, `reflection-orchestrator`

**Use When:**
- Complex coding tasks
- Agent should decide approach
- Need multiple capabilities available

### research-all

**Purpose:** All research skills available

**Skills:** `research-agent`, `context7`, `analysis-agent`

**Use When:**
- Research tasks
- Agent should decide methodology
- Need flexibility in approach

### full-stack

**Purpose:** Full coding + research capabilities

**Skills:** `code-agent`, `verifier-code-agent`, `research-agent`, `context7`, `formatter`, `reflection-orchestrator`

**Use When:**
- Complex multi-domain tasks
- Agent decides best approach
- Maximum flexibility needed

---

## Configuration

Defined in `.opencode/config/intent-routes.yaml`:

```yaml
# Sequential - pass context through each stage
workflows:
  implement-verify:
    description: "Implementation with verification loop"
    skills: [code-agent, verifier-code-agent, formatter]
    mode: sequential
    context_modules:
      - 00-core-contract
      - 10-coding-standards

# All at once - inject all, agent decides
skills_bulk:
  coding-all:
    description: "All coding skills available"
    skills: [code-agent, verifier-code-agent, formatter, reflection-orchestrator]
```

---

## Invocation

Use OpenCode's native `skill()` tool:

```python
# For workflows - sequential execution
skill({ name: "code-agent" })      # 1. Execute
skill({ name: "verifier-code-agent" })  # 2. Sees result from #1
skill({ name: "formatter" })       # 3. Formats result

# For skills bulk - all at once
skill({ name: "code-agent" })
skill({ name: "verifier-code-agent" })
skill({ name: "formatter" })
skill({ name: "reflection-orchestrator" })
# Agent has ALL skills, picks what to use
```

---

## When to Use What

| Mode | Use Case | Example |
|------|----------|---------|
| **Single skill** | Routine tasks | Quick fix, simple change |
| **workflow** | Sequential needed | Implement → Verify → Format |
| **skills_bulk** | Agent decides | Complex, flexible tasks |

### Use workflow when:
- ✓ Task has clear stages
- ✓ Each stage depends on previous
- ✓ Verification is critical
- ✓ Fixed order matters

### Use skills_bulk when:
- ✓ Task is complex/unpredictable
- ✓ Agent should decide approach
- ✓ Flexibility is priority
- ✓ Multiple options might apply

---

## Cost Considerations

| Mode | Skills | Est. Latency | Best For |
|------|--------|--------------|----------|
| Single skill | 1 | 10-20s | Routine |
| workflow | 2-4 | 30-90s | Critical, multi-stage |
| skills_bulk | 2-6 | 20-60s | Flexible, complex |

---

## Research Basis

### Modular Beats Monolithic

**Research:** Agentic Proposing (arXiv:2602.03279)
- 4B proposer model + modular skills = 91.6% accuracy
- Modular beats monolithic

**Application:** Each skill in Tachikoma is focused and specialized. Workflows achieve better results than one giant skill.

### Verification Improves Quality

**Research:** Aletheia (arXiv:2602.10177)
- Generator-Verifier-Reviser: 90% accuracy vs. 67% base
- Verification catches issues generator missed

**Application:** `verifier-code-agent` and `reflection-orchestrator` skills implement verification patterns.

---

## Creating Custom Workflows

```yaml
workflows:
  my-custom-workflow:
    description: "Custom sequential workflow"
    skills: [skill-a, skill-b, skill-c]
    mode: sequential
    context_modules:
      - 00-core-contract
```

## Creating Custom Skills Bulk

```yaml
skills_bulk:
  my-custom-bulk:
    description: "Custom skill set"
    skills: [skill-a, skill-b, skill-c, skill-d]
```

---

## Debugging

If a workflow fails:
1. Check which skill failed
2. Review that skill's output
3. Consider adjusting context modules
4. Try simpler workflow or single skill

---

## See Also

- [Composite Intents](/capabilities/composite-intents) - Multi-intent workflows
- [Skill Execution](/capabilities/skill-execution) - Individual skill documentation
- [Intent Routing](/capabilities/intent-routing) - Configuration details
