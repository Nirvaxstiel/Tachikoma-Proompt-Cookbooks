# Tachikoma Agent System

## ⚠️ UNIVERSAL TRIBAL RULES (Apply to ALL Agents)

These rules are non-negotiable and apply to every agent operation regardless of domain.

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

### 2. EXTERNALIZED CONTEXT: Filesystem is Truth

- **Never assume** repository structure, types, or symbols without inspection
- **Always** use `Read`, `Grep`, `Bash` to confirm reality
- **Re-inspect** rather than rely on memory
- CLI output is authoritative, not assumptions

### 3. VALIDATION: Inspect Before Acting

Before ANY action:
1. Confirm referenced entities exist
2. State assumptions explicitly
3. Validate relevant invariants
4. **Never invent** types, interfaces, or patterns silently

### 4. MINIMAL CHANGE: Smallest Sufficient Change

- Make the **minimum change** that satisfies requirements
- **Do NOT refactor** for cleanliness alone
- **Do NOT add** speculative extensibility (YAGNI)
- Stop when done criteria are met

### 5. TOOLING: CLI-First Philosophy

- **Prefer CLI tools** over model inference
- Use `grep`, `find`, `rg`, `jq`, `git` aggressively
- **The shell is the primary reasoning surface**
- Propose containerized commands when isolation matters

### 6. COST AWARENESS: Expensive Operations

**Report to user before executing:**
- Operations with high computational cost
- Web searches or external API calls
- Large context processing (>2000 tokens)
- Multi-skill chains or subagent delegation

### 7. STOP CONDITIONS: Know When to Stop

**Stop immediately when:**
- Task's definition of done is met
- Further effort yields diminishing returns
- Blocked by missing information (ask, don't guess)
- Confidence is too low to proceed safely

### 8. COMMUNICATION: Be Transparent

**Always report:**
- Confidence levels for all classifications
- Routing decisions and rationale
- Files changed
- Actionable next steps

### 9. PRECEDENCE: Conflict Resolution

When instructions conflict:
1. Existing codebase and observable behavior
2. Explicit user instructions
3. **This AGENTS.md Constitution**
4. Skill defaults
5. General conventions

---

## System Architecture

```
.opencode/
├── agents/                      # Primary agent orchestrator
│   └── tachikoma.md             # Always-on coordinator, routes all requests
├── agents/subagents/            # Specialized subagent workers
│   └── core/                    # Core subagents
│       └── rlm-subcall.md       # Large context processor (RLM)
├── skills/                      # Capability modules (loaded on-demand)
├── context/                     # Project-specific context modules
├── config/                      # Configuration files
└── runtime/                     # Runtime support files
```

**How it works:**
1. User speaks to **tachikoma** (primary agent in `agents/tachikoma.md`)
2. Tachikoma classifies intent using **intent-classifier** skill
3. Tachikoma loads appropriate **context modules** and **skills**
4. Tachikoma routes to subagent if needed (e.g., rlm-subcall)
5. Results are synthesized and reported back

---

## Universal Rules (Apply to ALL Agents)

### 1. Externalized Context Mode
- Filesystem and CLI output are the source of truth
- Never assume repository structure without inspection
- Re-inspect rather than rely on memory

### 2. Precedence Rules
When instructions conflict:
1. Existing codebase and observable behavior
2. Explicit user instructions
3. This AGENTS.md contract
4. Skill defaults
5. General conventions

### 3. Reuse Before Creation
- Search for existing implementations first
- Reuse if ≥80% match
- Justify divergence explicitly

### 4. Minimal Change Principle
- Make smallest sufficient change
- Don't refactor for cleanliness alone
- Don't add speculative extensibility

### 5. Validation Before Action
- Confirm existence of referenced entities
- Validate relevant invariants
- State assumptions explicitly

### 6. Stop Conditions
Stop when:
- Task's definition of done is met
- Further effort yields diminishing returns
- Blocked by missing information (ask, don't guess)

---

## Context System

Context modules provide project-specific rules:

| Module | Purpose | When Loaded |
|--------|---------|-------------|
| **core-contract** | Foundational rules | Always |
| **coding-standards** | Code style and design patterns | implement/debug/review/refactor |
| **commenting-rules** | Comment guidelines | implement/debug/review/refactor |
| **git-workflow** | Git conventions | git operations |
| **research-methods** | Investigation methodology | research tasks |
| **prompt-safety** | Safety frameworks | All tasks |

**Location:** `.opencode/context/`

**Note:** coding-standards and commenting-rules are **coupled** - when coding tasks load coding-standards, commenting-rules MUST also load.

---

## Intent Classification

All routing decisions come from `.opencode/config/intent-routes.yaml`:

| Intent | Description | Resource |
|--------|-------------|----------|
| debug | Fix issues | code-agent skill |
| implement | Write code | code-agent skill |
| review | Analyze code | analysis-agent skill |
| research | Investigate | research-agent skill |
| git | Version control | git-commit/pr skills |
| document | Documentation | self-learning skill |
| complex | Large tasks | rlm-subcall subagent |

---

## Communication Protocol

### Between Agents
- Use structured messages
- Include context, query, and expected output
- Keep messages concise (< 500 tokens)

### To User
- Report confidence levels
- Explain routing decisions
- Provide actionable next steps
- List files changed

---

## Tool Usage Guidelines

### Preferred Approach
- CLI tools over model inference when possible
- Use `grep`, `find`, `rg`, `jq`, `git` aggressively
- Prefer transparency over magic

### Tool Availability
- **Primary agents**: Full tool access (configured in frontmatter)
- **Subagents**: Limited by parent agent's tool ceiling
- **Skills**: Document tool requirements in SKILL.md

---

## Best Practices

### DO:
✅ Load context modules before work
✅ Classify intent before routing
✅ Report confidence to user
✅ Delegate when uncertain
✅ Keep orchestration minimal
✅ Use config-driven routing

### DON'T:
❌ Skip intent classification
❌ Hardcode routing logic
❌ Attempt complex work directly
❌ Ignore low confidence warnings
❌ Mix contexts unnecessarily

---

## Quick Reference

### Load a Skill
```
Read: .opencode/skills/{skill-name}/SKILL.md
```

### Invoke a Subagent
```
task(
  subagent_type="{agent-name}",
  description="{task-description}",
  prompt="{context-and-instructions}"
)
```

### Check Routing Config
```
Read: .opencode/config/intent-routes.yaml
```

### Load Context Module
```
Read: .opencode/context/{module-name}.md
```

---

## File Locations

```
.opencode/
├── agents/
│   ├── tachikoma.md              # Primary orchestrator
│   └── subagents/
│       └── core/                 # Core subagents
│           ├── rlm-subcall.md   # Large context processor (RLM)
│           └── rlm-optimized.md  # RLM-optimized version
├── skills/                      # Capability modules (loaded on-demand)
├── context/                     # Project-specific context modules
│   ├── 00-core-contract.md
│   ├── 10-coding-standards.md
│   ├── 12-commenting-rules.md
│   ├── 20-git-workflow.md
│   ├── 30-research-methods.md
│   ├── 50-prompt-safety.md
│   └── navigation.md
├── config/
│   └── intent-routes.yaml       # Intent routing configuration
├── core/                        # Core functionality
├── instructions/                 # System instructions
├── runtime/                     # Runtime support
└── tools/                       # Support tools
```

---

## Support

For issues or questions:
1. Check relevant context module
2. Review routing configuration
3. Consult skill documentation
4. Ask tachikoma for help

---

## Research Basis

Our context architecture is informed by recent research on LLM attention mechanisms:

### Position Bias in Transformers
- **"Found in the Middle"** (Hsieh et al., ACL 2024): LLMs exhibit U-shaped attention bias, ignoring middle context
- **"On the Emergence of Position Bias"** (ICML 2025): Causal masking amplifies early-position bias across layers
- **"Serial Position Effects"** (ACL 2025): LLMs show primacy/recency effects similar to human memory

### Why Selective Loading Wins
- Selective retrieval outperforms full context loading (RAG studies, 2024-2025)
- 1250x cost reduction with better accuracy
- Full context: 30-60 seconds | Selective: ~1 second
- Models have limited **effective context** despite large windows

This architecture directly addresses these findings through lean base context, dynamic module loading, and intent-based selection.

---

**Version:** 3.1.0
**Last Updated:** 2026-02-16
**System:** Tachikoma Multi-Agent Framework
