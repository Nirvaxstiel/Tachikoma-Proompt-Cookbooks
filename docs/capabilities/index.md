# Capabilities

Tachikoma's capabilities enable intelligent task routing, context-aware execution, and research-backed AI assistance.

## Core Capabilities

These are the foundational features that make Tachikoma work:

### [Intent Routing](./intent-routing.md)

Classifies your requests and routes them to the right specialist. The system figures out what you want to do before doing anything.

**Key features:**
- 12+ predefined intents (debug, implement, review, research, git, etc.)
- Confidence-based classification
- Automatic escalation for uncertain requests
- Custom intent support

### [Context Management](./context-management.md)

Loads project-specific rules and conventions relevant to each task. Think of it as `.gitignore` but for AI behavior.

**Key features:**
- 7 built-in context modules
- Priority-based loading (important rules first)
- Automatic module coupling (coding-standards + commenting-rules)
- Artifact consent policy (prevents workspace clutter)
- Custom module support (priority range 40-49)

### [Skill Execution](./skill-execution.md)

Specialized capabilities for specific tasks. Each skill is an expert in its domain.

**Key features:**
- 20+ built-in skills
- SKILL.md format for self-documenting capabilities
- Progressive disclosure (load only what's needed)
- Easy to extend with custom skills

### [Workflows & Skills](/capabilities/skill-chains.md)

Link multiple skills together for complex workflows using:
- **Workflows** (sequential): Each skill sees the result of the previous
- **Skills Bulk** (all at once): Agent decides which to use

**Built-in workflows:**
- `implement-verify`: Code generation with verification
- `research-implement`: Research then build
- `security-implement`: Security-critical code with maximum verification
- `deep-review`: Thorough code review with self-verification
- `complex-research`: Multi-source research with verification

**Skills bulk:**
- `coding-all`: All coding skills available
- `research-all`: All research skills available

### [Composite Intents](./composite-intents.md)

Handles multi-part requests automatically. Detects when you want to do multiple things.

**Built-in composites:**
- `research-and-implement`: Investigate then build
- `implement-and-test`: Write code and verify it works
- `refactor-and-test`: Refactor with verification

## Research-Backed Capabilities

Features grounded in peer-reviewed research:

### [Epistemic Mode](./epistemic-mode.md)

Confidence labeling system that helps agents know what they don't know. Every claim includes a confidence level.

**Confidence levels:**
- `established_fact`: Multiple sources confirm
- `strong_consensus`: Most experts agree
- `emerging_view`: Newer finding, gaining traction
- `speculation`: Logical inference, limited evidence
- `unknown`: Cannot determine (STOP)

### [Position-Aware Loading](./position-aware-loading.md)

Optimizes context placement to mitigate U-shaped attention bias in transformers.

**Research basis:**
- "Found in the Middle" (Hsieh et al., ACL 2024)
- "On the Emergence of Position Bias" (ICML 2025)
- "Serial Position Effects" (ACL 2025)

**Impact:** +25-30% accuracy for large context tasks

## Advanced Capabilities

For complex tasks and large contexts:

### [Subagents](./subagents.md)

Specialized workers for tasks exceeding normal context limits. Handle 10M+ tokens via chunking.

**Available subagents:**
- `rlm-optimized`: MIT-style Recursive Language Model (adaptive chunking, parallel processing)
- `rlm-subcall`: Sub-LLM for individual chunk processing

### [Tools](./tools.md)

Development and maintenance utilities for the framework.

**Available tools:**
- **Smoke Test Framework**: Validate scripts remain functional
- **Hashline Processor**: Content-hash anchored editing format
- **Context Manager**: CLI for context operations

## Communication & Protocol

### [Communication Protocol](./communication-protocol.md)

Structured communication patterns for agent coordination and user interaction.

**Features:**
- Standardized agent-to-agent message format
- User response templates
- Error handling protocols
- Progress updates for long-running tasks

## Reference

### [Skills Specification](./skills-specification.md)

Complete format specification for Agent Skills based on the [agentskills.io](https://agentskills.io) standard.

**Covers:**
- SKILL.md format (YAML frontmatter + Markdown)
- Directory structure
- File references
- Validation
- Best practices

### [Skill Templates](./skill-templates.md)

Ready-to-use templates and examples for creating Agent Skills.

**Includes:**
- Quick start template
- API documentation fetcher example
- Dependency updater example
- Deployment workflow example
- Common skill patterns

## Customization

Extend Tachikoma for your specific needs:

### [Customization Overview](./customization/overview.md)

Overview of how to extend the system with custom capabilities.

### [Add a Skill](./customization/add-skill.md)

Create custom skills for your specific tasks.

### [Add an Agent](./customization/add-agent.md)

Create specialized subagents for complex tasks.

### [Add an Intent](./customization/add-intent.md)

Define custom routing logic for your domain.

### [Context Modules](./customization/context-modules.md)

Create project-specific rules and conventions.

## Quick Reference

### By Task Type

| Task | Capability |
|------|------------|
| Fix a bug | [Intent Routing](./intent-routing.md) → `debug` intent |
| Write code | [Skill Execution](./skill-execution.md) → `code-agent` |
| Review code | [Workflows](./skill-chains.md) → `deep-review` |
| Large refactoring | [Subagents](./subagents.md) → `rlm-optimized` |
| Research APIs | [Skill Execution](./skill-execution.md) → `research-agent` |
| Git operations | [Intent Routing](./intent-routing.md) → `git` intent |

### By Complexity

| Complexity | Recommended Approach |
|------------|---------------------|
| Simple (< 1 file) | Single skill |
| Medium (1-5 files) | Skill with context |
| Complex (5+ files) | [Workflows](./skill-chains.md) or skills_bulk |
| Very Complex (> 2000 tokens) | [Subagents](./subagents.md) |

## Research Foundation

Every capability in Tachikoma is grounded in peer-reviewed research:

- **[Position Bias](../research/position-bias.md)** — U-shaped attention in transformers (ACL 2024, ICML 2025)
- **[Verification Loops](../research/verification-loops.md)** — Aletheia and Vibe-Proving patterns (arXiv:2602.10177, arXiv:2602.03837)
- **[Model Harness](../research/model-harness.md)** — Edit format optimization (Can.ac 2026)
- **[Recursive Language Models](../research/rlm.md)** — Large context handling (MIT, arXiv:2512.24601)
- **[Cost-Aware Routing](../research/cost-aware-routing.md)** — Speed/accuracy tradeoffs (arXiv:2601.02663)
- **[Modularity](../research/modularity.md)** — Why skills beat monolithic models (arXiv:2602.03279)

See [Research Overview](../research/overview.md) for the complete research directory.

## See Also

- [System Overview](../concepts/overview.md) - What is Tachikoma?
- [Architecture](../concepts/architecture.md) - How it works
- [Research](../research/overview.md) - Scientific foundation
- [Getting Started](../getting-started.md) - Installation and setup
- [Troubleshooting](../troubleshooting.md) - Common issues
