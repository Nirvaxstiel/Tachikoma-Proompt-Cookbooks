# Skills

Modular capabilities. Small, focused, composable.

## Core

| Skill | Use When | Description |
|-------|----------|-------------|
| code-agent | Write/fix code | General-purpose coding and debugging |
| analysis-agent | Review code | Code analysis and quality assessment |
| research-agent | Find info | Investigation and information gathering |

## Utility

| Skill | What | Description |
|-------|------|-------------|
| git-commit | Commits | Conventional commit message generation |
| pr | PR descriptions | Pull request title and description writing |
| intent-classifier | Classifies requests | Query classification and routing |
| context-manager | CLI context ops | Context discovery, extraction, management |
| context7 | Live docs | Live documentation via Context7 API |
| formatter | Code cleanup | Code quality cleanup and formatting |

## Workflow

| Skill | What | Description |
|-------|------|-------------|
| workflow-management | 7-phase workflow | Production-grade development workflow |
| task-tracking | Task management | Progressive tracking system |
| rlm | Recursive Language Model | Large context processing via adaptive chunking |
| self-learning | Self-improvement | Pattern recognition and system improvement |

## Advanced

| Skill | What | Description |
|-------|------|-------------|
| skill-composer | Combine skills | Dynamic skill composition for complex tasks |
| verifier-code-agent | Generate-Verify-Revise | High-reliability code with verification loops |
| reflection-orchestrator | Self-critique | Explicit self-verification and adversarial review |
| model-aware-editor | Edit optimization | Model-specific edit format selection |

## Specialized

| Skill | What | Description |
|-------|------|-------------|
| code-review | Structured review | Priority-based code review workflow |
| prompt-engineer | Safety/bias | Prompt engineering best practices |
| security-audit | OWASP scanning | Security audit workflow |

## Skill Details

### verifier-code-agent

**Purpose:** High-reliability code generation with verification loops

**Based on:** Aletheia (Google DeepMind, arXiv:2602.10177) - achieved 90% on IMO-ProofBench

**Pattern:**
```
Problem → Generator → Candidate → Verifier → [Pass | Revise | Restart]
```

**Use When:**
- Complex implementations
- Security-critical code
- High-stakes fixes
- When correctness is paramount

**Maximum Iterations:** 3 (then escalate)

### reflection-orchestrator

**Purpose:** Explicit self-verification through adversarial critique

**Based on:** Vibe-Proving (Google, arXiv:2602.03837) - balanced prompting prevents confirmation bias

**Pattern:**
```
1. Initial Output → 2. Self-Critique → 3. Revision → 4. Verification
```

**Key Techniques:**
- Balanced prompting (proof OR refutation)
- Adversarial questioning
- Explicit uncertainty labeling

**Use When:**
- Complex reasoning tasks
- High-stakes decisions
- After verifier-code-agent completes

### model-aware-editor

**Purpose:** Model-specific edit format optimization

**Based on:** The Harness Problem (Can.ac, Feb 2026) - edit format can improve success 10x

**Supported Formats:**
- `str_replace` (Claude, Gemini) - exact match
- `apply_patch` (GPT) - OpenAI-style diff
- `hashline` (Universal) - content-hash anchoring

**Performance Gains:**
- Grok: 6.7% → 68.3% (10x improvement)
- Gemini: +8% over baseline
- All models: Reduced retry loops

**Use When:**
- Working with multiple model providers
- High edit failure rates
- Critical changes requiring reliability

### rlm

**Purpose:** Recursive Language Model for large context

**Based on:** MIT RLM architecture (arXiv:2512.24601)

**Features:**
- Adaptive chunking
- Context as environment
- 2-5x efficiency gains
- Handles 10M+ tokens

**Use Case:** Via `complex` intent or skill chains

## Structure

```
skills/skill-name/
├── SKILL.md      # Definition
└── router.sh     # CLI (optional)
```

## SKILL.md

```yaml
---
name: my-skill
description: What it does
---

# My Skill

You are an expert at...

[instructions]
```

## Skill Chains

Skills can be chained together for complex workflows:

| Chain | Skills | Use Case |
|-------|--------|----------|
| implement-verify | code-agent → verifier → formatter | High-reliability implementation |
| research-implement | research → context7 → code-agent → formatter | Research then build |
| security-implement | context7 → code-agent → verifier → reflection | Security-critical code |
| deep-review | analysis-agent → reflection | Thorough code review |
| complex-research | research → context7 → reflection | Verified research |

See [Skill Chains](/explanation/skill-chains) for details.

## See Also

- [Intent Routing](/explanation/intent-routing)
- [Add Skill](/how-to/add-skill)
- [Skill Chains](/explanation/skill-chains)
- [Subagents](/reference/subagents)
