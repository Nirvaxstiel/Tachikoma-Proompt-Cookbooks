# What is Tachikoma?

Agent orchestration system — traffic controller for AI coding tasks.

Think of it as a dispatcher for your AI assistant. Instead of throwing every request at one general-purpose model, Tachikoma figures out what you need and routes it to the right specialist.

## At a Glance

1. **Classify** — What are you asking?
2. **Load** — Load project rules (context)
3. **Route** — Send to right skill/subagent
4. **Return** — Result + confidence score

## Core Concepts

### Intent Classification

Tachikoma figures out what you want before doing anything. This prevents the "do the thing" problem where AI has no idea what you're actually asking for.

**Core Intents:**
- `debug` — Fix issues
- `implement` — Write code
- `review` — Analyze code
- `research` — Find info
- `git` — Version control
- `document` — Docs
- `complex` — Large context

**Extended Intents:**
- `refactor` — Restructure code
- `skill-compose` — Dynamic skill composition
- `optimize` — Context/token optimization
- `verify` — High-reliability generation
- `reflect` — Self-critique and verification
- `edit-optimize` — Model-aware edit format
- `unclear` — Fallback for ambiguous requests

**Composite Intents:**
- `research-and-implement` — Research then build
- `implement-and-test` — Build then verify
- `refactor-and-test` — Refactor then verify

See [Composite Intents](/capabilities/composite-intents) for multi-step workflows.

### Context Modules

Project rules loaded by priority. This is how Tachikoma knows your project's conventions without you having to explain them every time.

- `core-contract` — Always first
- `coding-standards` — Code patterns
- `commenting-rules` — Comments
- `git-workflow` — Git conventions
- `research-methods` — Investigation
- `prompt-safety` — Safety

See [Context Management](/capabilities/context-management) for details.

### Skills vs Subagents

| Type | Use When |
|------|----------|
| Skill | Simple, fast tasks |
| Subagent | Complex tasks with large context |

Skills are like specialists — focused, fast, handle routine work. Subagents are like researchers — handle complex, multi-step problems that need more context.

## Research Basis

We're not making this up. These techniques come from real research:

| Paper/Source | Finding | Application |
|--------------|---------|-------------|
| Tool-Augmented LLMs | +20% accuracy, 40x latency | Cost-aware routing |
| Agentic Proposing | 91.6% accuracy with modular skills | skill-composer |
| MIT RLM | 2-5x efficiency on large context | rlm-optimized |
| Aletheia (arXiv:2602.10177) | 90% on IMO-ProofBench with verification loop | verifier-code-agent |
| Vibe-Proving (arXiv:2602.03837) | Balanced prompting prevents confirmation bias | reflection-orchestrator |
| Can.ac Harness Problem | Edit format matters as much as model | model-aware-editor |

See [Research](/research/overview) for details.

## Why Use It

- **Consistency** — Same rules for everyone
- **Transparency** — See confidence scores
- **Efficiency** — Match complexity to task
- **Extensibility** — Drop in new skills/intents

## Named After

Tachikoma — curious AI tanks from *Ghost in the Shell*. Always learning.
