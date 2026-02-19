# Capabilities

## Core

### [Intent Routing](./intent-routing.md)

Classifies requests and routes to the right specialist.

- 18 intents (debug, implement, review, research, git, etc.)
- Confidence-based classification
- Automatic escalation for uncertain requests

### [Context Management](./context-management.md)

Loads project-specific rules relevant to each task.

- 7 context modules
- Priority-based loading
- Automatic module coupling

### [Skill Execution](./skill-execution.md)

Specialized capabilities for specific tasks.

- 20 skills
- SKILL.md format
- Easy to extend

### [Workflows & Skills](./skill-chains.md)

Chain skills for complex tasks.

- **Workflows**: Sequential execution
- **Skills Bulk**: All at once, agent picks

### [Composite Intents](./composite-intents.md)

Multi-part requests handled automatically.

- `research-and-implement`
- `implement-and-test`
- `refactor-and-test`

## Research-Backed

### [Epistemic Mode](./epistemic-mode.md)

Confidence labeling for every claim.

- `established_fact` → `strong_consensus` → `emerging_view` → `speculation` → `unknown`

### [Position-Aware Loading](./position-aware-loading.md)

Optimizes context placement for transformer attention.

## Advanced

### [Subagents](./subagents.md)

Workers for large-context and parallel tasks.

- `explore`: Fast codebase search
- `general`: Multi-step parallel work
- `rlm-optimized`: Large context (>2000 tokens)

### [Tools](./tools.md)

Development utilities.

- Smoke Test Framework
- Hashline Processor
- Context Manager CLI

## Reference

### [Skills Specification](./skills-specification.md)

Agent Skills format specification.

### [Skill Templates](./skill-templates.md)

Ready-to-use templates.

## Customization

- [Add a Skill](./customization/add-skill.md)
- [Add an Agent](./customization/add-agent.md)
- [Add an Intent](./customization/add-intent.md)
- [Context Modules](./customization/context-modules.md)

## Quick Reference

| Task | Route |
|------|-------|
| Fix bug | `debug` → code-agent |
| Write code | `implement` → code-agent |
| Review code | `review` → analysis-agent |
| Large refactor | `complex` → rlm-optimized |
| Research APIs | `research` → research-agent |
| Git operations | `git` → git-commit |

| Complexity | Approach |
|------------|----------|
| Simple (< 1 file) | Single skill |
| Medium (1-5 files) | Skill + context |
| Complex (5+ files) | Workflow or skills_bulk |
| Very complex (> 2000 tokens) | Subagent |

## Research Foundation

- [Position Bias](../research/position-bias.md)
- [Verification Loops](../research/verification-loops.md)
- [Recursive Language Models](../research/rlm.md)
- [Cost-Aware Routing](../research/cost-aware-routing.md)
- [Modularity](../research/modularity.md)
