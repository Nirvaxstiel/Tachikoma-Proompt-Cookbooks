# Tachikoma Agent System

This document describes how the agent system works.

## How It Works

```
User Query → Tachikoma → Route to Skill/Subagent → Result
```

1. User sends a request to Tachikoma
2. Tachikoma figures out what kind of task it is
3. Tachikoma loads relevant context and routes to the right skill
4. Result is returned to the user

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
| 12-commenting-rules.md | Comment guidelines |
| 20-git-workflow.md | Git conventions |
| 30-research-methods.md | How to investigate |
| 50-prompt-safety.md | Safety guidelines |

Location: `.opencode/context/`

When loading coding-standards, also load commenting-rules. They go together.

## How Tachikoma Routes Requests

### Step 1: Classify Intent

Tachikoma runs a quick classification:

```
bash python .opencode/skills/cli-router.py full "{query}" --json
```

This returns the intent, confidence level, and which skill to use.

If confidence is low, Tachikoma falls back to reasoning about the request directly.

### Step 2: Load Context

Based on the intent, Tachikoma loads the relevant context modules. It loads only what's needed, not everything.

### Step 3: Route to Skill or Subagent

- Simple tasks: Load the skill and execute
- Complex tasks: Delegate to a subagent like rlm-subcall

### Step 4: Return Result

Tachikoma reports what was done, confidence level, and any next steps.

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
├── context/                      # Project context
├── config/
│   └── intent-routes.yaml        # Route definitions
└── tools/                       # Helper tools
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

When confidence drops below 0.5, Tachikoma asks for clarification instead of guessing.

## Research Background

The system design is based on published research:

- **Position Bias**: LLMs pay more attention to tokens at the start and end of context. Loading only relevant context helps.
- **Tool-Augmented LLMs**: Tools add latency but improve accuracy. The system balances this by using tools for complex tasks.
- **Modularity**: Smaller, focused components work better than large monolithic prompts.

See `.opencode/docs/research/` for details.

---

**Version:** 3.2.0
**Last Updated:** 2026-02-17
