# Architecture

How Tachikoma routes requests to the right specialist for optimal results.

## What and Why

Tachikoma uses an **orchestrator pattern**: it receives all requests, figures out what you want, loads the right context, and routes to the appropriate specialist.

**Why This Matters:**

**Without routing:**

- "Do thing" problem — model doesn't know what you mean
- Wrong tool usage — using a generalist for specialist tasks
- "Lost in the middle" — dumping all context causes AI to ignore important stuff

**With routing:**

- Intent classification — knows what you want before acting
- Selective context — only loads what's relevant, not everything
- Right specialist — uses the best tool for the job
- Cost-aware routing — doesn't waste time on simple tasks, doesn't cut corners on critical tasks

## Example Flow

```
User: "Analyze my entire codebase for security issues"
    ↓
Tachikoma:
  1. Classifies: complex intent (confidence: 92%)
  2. Loads: core-contract context
  3. Routes to: rlm-optimized subagent
  4. Returns: Comprehensive security report
```

## How It Works

1. **Receives request** — Your message
2. **Classifies intent** — What do you want to do?
3. **Loads context** — Project rules relevant to this intent
4. **Routes to specialist** — Skill, subagent, workflow, or skills_bulk
5. **Returns result** — What happened + confidence score

## Components

| Component             | Location                                      | What It Does                                   |
| --------------------- | --------------------------------------------- | ---------------------------------------------- |
| **Primary Agent**     | `.opencode/agents/tachikoma.md`               | Always-on orchestrator, coordinates everything |
| **Intent Classifier** | `.opencode/skills/intent-classifier/SKILL.md` | Classifies requests into intents               |
| **Intent Routes**     | `.opencode/config/intent-routes.yaml`         | Maps intents → skills/subagents                |
| **Confidence Routes** | `.opencode/config/intent-routes.yaml`         | Configures confidence-based escalation         |
| **Context Modules**   | `.opencode/context-modules/*.md`              | Project rules by priority                      |

## Request Flow

**Every request MUST go through all 5 phases. Skipping phases is a contract violation.**

```
User Request
     ↓
┌─────────────────────────────────────────┐
│ Phase 1: CLASSIFY (MANDATORY)           │
│   CLI router or LLM fallback            │
│   → Returns: intent, confidence, route  │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│ Phase 2: LOAD CONTEXT (MANDATORY)       │
│   Always: 00-core-contract              │
│   Then: intent-specific modules         │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│ Phase 3: LOAD SKILL (MANDATORY)         │
│   skill({ name: "code-agent" })         │
│   → Returns: skill instructions         │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│ Phase 4: EXECUTE (Follow Skill)         │
│   Use tools directly per skill guidance │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│ Phase 5: REPORT                         │
│   What done, files changed, confidence  │
└─────────────────────────────────────────┘
```

**At any point**, Tachikoma can:

- **Ask for clarification** (if intent is unclear)
- **Delegate to subagent** (if context is too large)
- **Use a workflow** (sequential: implement → verify → format)
- **Use skills_bulk** (all at once, agent decides)

## Cost-Aware Routing

We don't use a sledgehammer to crack nuts. Match strategy to task complexity:

| Complexity    | Strategy           | Estimated Latency |
| ------------- | ------------------ | ----------------- |
| **Low**       | Direct response    | 1-2s              |
| **Medium**    | Single skill       | 5-15s             |
| **High**      | Multi-skill        | 15-45s            |
| **Very High** | Full orchestration | 45-120s           |

**Research backing:** Tool use improves accuracy by +20% but adds 40x latency. Using tools for simple tasks wastes time. Using direct responses for complex tasks causes hallucinations. We pick the right tool for the job.

## Context Loading Strategy

### The Problem: "Lost in the Middle"

Research shows LLMs have U-shaped attention bias:

- Tokens at **beginning** and **end** get high attention
- Tokens in **middle** get ignored regardless of relevance
- Performance drops 10-20% when key info is in the middle

### Our Solution: Selective Loading

1. **AGENTS.md** — Universal constitution (primacy position)
2. **Classify intent FIRST** — Determine what context is needed
3. **Load ONLY relevant modules** — Avoid lost-in-middle dilution
4. **Co-load coupled modules** — coding-standards + commenting-rules together
5. **Delegate large context** — Use rlm-subcall for >2000 tokens

**Never:** Load all context modules at once
**Always:** Load based on classified intent

See [Context Management](../capabilities/context-management.md) for details.

## Execution Standard

All skills follow this standard:

1. **ANALYSIS** — What's the task?
2. **ASSUMPTIONS** — What do we know? (STOP if unclear)
3. **BUILD** — Execute
4. **VERIFY** — Did we invent anything?

**Priority order:** Accuracy → Determinism → Completeness → Speed

Notice speed is last. We prefer correct over fast, consistent over clever.

## Key Files

| File                                  | Purpose                                     |
| ------------------------------------- | ------------------------------------------- |
| `.opencode/config/intent-routes.yaml` | Route definitions (intent → skill/subagent) |
| `.opencode/config/intent-routes.yaml` | Route definitions (intent → skill/subagent) |
| `.opencode/agents/tachikoma.md`       | Orchestrator definition                     |

See [File Locations](../getting-started.md#file-locations) for full structure.

## Decision Flow

```
User Request
    ↓
Is intent clear?
    ↓ YES
Is context large (>2000 tokens)?
    ↓ YES → Use Subagent
    ↓ NO → Use Skill
    ↓
Is confidence high enough?
    ↓ YES → Execute
    ↓ NO → Add Verification or Ask User
```

## Research Basis

Tachikoma's architecture is informed by research on LLM attention mechanisms:

- **"Found in the Middle"** (Hsieh et al., ACL 2024) — U-shaped attention bias
- **"On the Emergence of Position Bias"** (ICML 2025) — Early-position bias amplifies
- **"Serial Position Effects"** (ACL 2025) — LLMs show primacy/recency effects

This architecture directly addresses these findings through lean base context, dynamic module loading, and intent-based selection.

See [Research Overview](../research/overview.md) for details.

## See Also

- [Intent Routing](../capabilities/intent-routing.md) - How routing works in detail
- [Context Management](../capabilities/context-management.md) - Project rules system
- [Skill Execution](../capabilities/skill-execution.md) - How skills work
- [Subagents](../capabilities/subagents.md) - Large context handling
- [Research](../research/overview.md) - Why this architecture works

## Next Steps

- [Getting Started](../getting-started.md) - Install and setup
- [Overview](overview.md) - System overview
- [Skills Specification](../capabilities/skills-specification.md) - How skills are structured
- [Create Custom Skill](../capabilities/customization/add-skill.md) - Add your own capabilities
