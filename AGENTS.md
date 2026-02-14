# Tachikoma Agent System

Universal context and guidelines for all agents in the Tachikoma multi-agent system.

---

## System Architecture

```
Tachikoma Multi-Agent System
├── Primary Agent (tachikoma)
│   └── Always-on orchestrator, routes all requests
├── Subagents (specialized workers)
│   └── rlm-subcall (large context processing)
└── Skills (capabilities)
    ├── intent-classifier
    ├── code-agent
    ├── analysis-agent
    ├── research-agent
    ├── git-commit
    ├── pr
    ├── workflow-management
    └── task-tracking
```

**How it works:**
1. User speaks to **tachikoma** (primary agent)
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
| **coding-standards** | Code style, patterns | implement/debug/review |
| **commenting-rules** | Comment guidelines | implement/document |
| **git-workflow** | Git conventions | git operations |
| **research-methods** | Investigation methodology | research tasks |
| **prompt-safety** | Safety frameworks | All tasks |

**Location:** `.opencode/context/`

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
│   └── tachikoma.md              # Primary orchestrator
├── agents/subagents/
│   └── core/
│       └── rlm-subcall.md        # Large context processor
├── skills/
│   ├── intent-classifier/
│   ├── code-agent/
│   ├── analysis-agent/
│   ├── research-agent/
│   ├── git-commit/
│   ├── pr/
│   ├── workflow-management/
│   └── task-tracking/
├── context/
│   ├── 00-core-contract.md
│   ├── 10-coding-standards.md
│   ├── 15-commenting-rules.md
│   ├── 20-git-workflow.md
│   ├── 30-research-methods.md
│   └── 50-prompt-safety.md
└── config/
    └── intent-routes.yaml
```

---

## Support

For issues or questions:
1. Check relevant context module
2. Review routing configuration
3. Consult skill documentation
4. Ask tachikoma for help

---

**Version:** 3.0.0  
**Last Updated:** 2026-02-14  
**System:** Tachikoma Multi-Agent Framework
