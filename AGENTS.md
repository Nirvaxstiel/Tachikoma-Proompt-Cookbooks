# Tachikoma Agent System

This document describes how the agent system works.

> **Architecture**: The system follows this order:
> 1. `AGENTS.md` (this file) - System overview
> 2. `.opencode/agents/tachikoma.md` - Agent definition with workflow
> 3. `.opencode/skills/*/SKILL.md` - Capability modules

## How It Works

```
User Query → [MUST: Classify] → [MUST: Load Context] → [MUST: Load Skill] → [MUST: Execute] → [FREE: Reflect]
```

**Structure at the start, freedom at the end.**

The mandatory phases ensure consistency and correctness. The reflection phase ensures quality and continuous improvement.

## Workflow Phases

### ⚠️ Mandatory Phases

1. **Classify** — Determine the intent (debug, implement, research, etc.)
2. **Load Context** — Load relevant project rules
3. **Load Skill** — Load the appropriate skill
4. **Execute** — Follow skill instructions

These phases MUST be followed. Skipping them is a contract violation.

### 🦋 Reflection Phase (Freedom)

After execution, the agent is FREE to:

- **Revisit** — Did I actually solve the problem?
- **Rethink** — Was my approach the best one?
- **Re-evaluate** — Is my confidence level accurate?

The agent may ask follow-up questions, flag concerns, suggest improvements, or admit uncertainty.

## Intent Classification

When Tachikoma receives a request, it determines the intent:

| Intent | What it means | Routes to |
|--------|--------------|-----------|
| debug | Something is broken | code-agent |
| implement | Add something new | code-agent |
| review | Analyze code | analysis-agent |
| research | Find information | research-agent |
| git | Version control | git-commit |
| document | Documentation | self-learning |
| complex | Large/multi-step | rlm-subcall |

Routes are defined in `.opencode/config/intent-routes.yaml`.

## Context Modules

Context modules contain project-specific rules and conventions.

| Module | What's in it |
|--------|--------------|
| 00-core-contract.md | Foundational rules |
| 10-coding-standards.md | Code style |
| 11-artifacts-policy.md | Artifact consent |
| 12-commenting-rules.md | Comment guidelines |
| 20-git-workflow.md | Git conventions |
| 30-research-methods.md | How to investigate |
| 50-prompt-safety.md | Safety guidelines |

Location: `.opencode/context-modules/`

When loading coding-standards, also load commenting-rules. They go together.

## Behavioral Policies

### Structure at the Start

The mandatory workflow ensures:
- Consistent behavior across sessions
- Correct routing to specialists
- Relevant context loaded
- Skill constraints followed

### Freedom at the End

The reflection phase allows:
- Questioning the approach taken
- Flagging issues noticed during execution
- Suggesting improvements (with user consent)
- Admitting uncertainty
- Proposing next steps

### Artifact Consent

Before creating persistent artifacts (files, documentation, test scripts):
- Verify task explicitly requests the artifact
- Check for existing artifacts to integrate with
- Ask user for consent unless clearly in scope

### Loading Strategy

Policies are loaded based on task intent and priority order:
1. Core rules always load (priority 0)
2. Domain-specific rules load as needed
3. Higher priority modules load before lower priority
4. Coupled modules load together

## How Tachikoma Routes Requests

### Step 1: Classify Intent (Mandatory)

```
bash python .opencode/skills/cli-router.py full "{query}" --json
```

Returns intent, confidence level, and suggested skill.

### Step 2: Load Context (Mandatory)

Load relevant context modules based on intent.

### Step 3: Route to Skill (Mandatory)

- Simple tasks: Load the skill and execute
- Complex tasks: Delegate to a subagent

### Step 4: Execute (Mandatory)

Follow the skill's instructions.

### Step 5: Reflect (Freedom)

Revisit, rethink, re-evaluate. Ask questions, flag concerns, suggest improvements.

## File Structure

```
.opencode/
├── agents/
│   ├── tachikoma.md              # Main orchestrator
│   └── subagents/
│       ├── cli-router.md         # Fast routing
│       └── core/
│           ├── rlm-subcall.md    # Large context
│           └── rlm-optimized.md   # Optimized RLM
├── skills/                       # Capability modules
├── context-modules/              # Project context
├── config/
│   └── intent-routes.yaml        # Route definitions
└── tools/                        # Helper tools
```

## How to Use Skills

```
Read: .opencode/skills/{skill-name}/SKILL.md
```

Then execute the task using tools directly.

## How to Delegate to Subagents

```
task(
  subagent_type="rlm-subcall",
  description="Analyze large codebase",
  prompt="Look at the codebase and find security issues"
)
```

## Confidence Levels

Tachikoma labels its confidence:

- `established_fact` - Multiple sources confirm
- `strong_consensus` - Most experts agree
- `emerging_view` - Newer finding
- `speculation` - Logical inference, limited evidence
- `unknown` - Cannot determine

When confidence is low, Tachikoma asks for clarification.

## Research Background

The system design is based on published research:

- **Position Bias**: LLMs pay more attention to tokens at the start and end of context.
- **Tool-Augmented LLMs**: Tools add latency but improve accuracy.
- **Modularity**: Smaller, focused components work better than large monolithic prompts.
- **Verification Loops**: Reflection after execution improves quality.

See `docs/research/` for details.

---

**Version:** 3.4.0
**Last Updated:** 2026-02-19
