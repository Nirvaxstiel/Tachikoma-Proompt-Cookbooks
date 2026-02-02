---
module_id: agent-orchestration
name: Agent Orchestration & Handoffs
version: 2.0.0
description: Sequential agent workflows with handoffs, wrapper prompts for sub-agent invocation, dynamic parameters, and tool delegation ceilings.
priority: 45
type: context
depends_on:
  - core-contract
  - coding-standards
  - delegation-patterns
exports:
  - agent_handoffs_configuration
  - sub_agent_wrapper_pattern
  - dynamic_parameters_system
  - tool_delegation_management
---

# Agent Orchestration & Handoffs

Sequential agent workflows with guided transitions between specialized agents and tool-controlled delegation.

## Core Philosophy

**Agents talk to agents.** Handoffs enable guided multi-step workflows where each agent specializes in one phase.

---

## Agent Handoffs Configuration

### Purpose

Enable guided sequential workflows that transition seamlessly between custom agents. Useful for orchestrating multi-step development workflows where users can review and approve each step before moving to the next.

### Common Handoff Patterns

- **Planning → Implementation**: Generate a plan in a planning agent, then hand off to an implementation agent to start coding
- **Implementation → Review**: Complete implementation, then switch to a code review agent to check for quality and security issues
- **Write Failing Tests → Write Passing Tests**: Generate failing tests, then hand off to implement code that makes those tests pass
- **Research → Documentation**: Research a topic, then transition to a documentation agent to write guides

### Handoff Frontmatter Structure

Define handoffs in agent file's YAML frontmatter:

```yaml
---
description: 'Brief description of agent'
name: 'Agent Name'
tools: ['search', 'read']
handoffs:
  - label: Start Implementation
    agent: implementation
    prompt: 'Now implement the plan outlined above.'
    send: false
  - label: Code Review
    agent: code-review
    prompt: 'Please review the implementation for quality and security issues.'
    send: false
---
```

### Handoff Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | Yes | Display text shown on handoff button in chat interface |
| `agent` | string | Yes | Target agent identifier (name or filename without `.agent.md`) |
| `prompt` | string | No | Prompt text to pre-fill in target agent's chat input |
| `send` | boolean | No | If true, auto-submits; if false, user reviews first |

### Handoff Behavior

- **Button Display**: Handoff buttons appear as interactive suggestions after a chat response completes
- **Context Preservation**: When users select a handoff button, they switch to target agent with conversation context maintained
- **Pre-filled Prompt**: If a `prompt` is specified, it appears pre-filled in target agent's chat input
- **Manual vs Auto**:
  - When `send: false` - users must review and manually send
  - When `send: true` - prompt is automatically submitted

### Handoff Configuration Guidelines

#### When to Use Handoffs

- **Multi-step workflows**: Breaking down complex tasks across specialized agents
- **Quality gates**: Ensuring review steps between implementation phases
- **Guided processes**: Directing users through a structured development process
- **Skill transitions**: Moving from planning/design to implementation/testing specialists

#### Best Practices

- **Clear Labels**: Use action-oriented labels
  - ✅ Good: "Start Implementation", "Review for Security", "Write Tests"
  - ❌ Avoid: "Next", "Go to agent", "Do something"

- **Relevant Prompts**: Provide context-aware prompts
  - ✅ Good: `'Now implement the plan outlined above.'`
  - ❌ Avoid: Generic prompts without context

- **Selective Use**: Don't create handoffs to every possible agent
  - Limit to 2-3 most relevant next steps per agent
  - Only add handoffs for agents that naturally follow in workflow

- **Agent Dependencies**: Ensure target agents exist before creating handoffs
  - Handoffs to non-existent agents will be silently ignored
  - Test handoffs to verify they work as expected

- **Prompt Content**: Keep prompts concise and actionable
  - Refer to work from current agent without duplicating content
  - Provide any necessary context target agent might need

### Complete Workflow Example

Three agents with handoffs creating a complete workflow:

**Planning Agent** (`planner.agent.md`):
```yaml
---
description: 'Generate an implementation plan for new features or refactoring'
name: 'Planner'
tools: ['search', 'read']
handoffs:
  - label: Implement Plan
    agent: implementer
    prompt: 'Implement the plan outlined above.'
    send: false
---
# Planner Agent
You are a planning specialist. Your task is to:
1. Analyze requirements
2. Break down work into logical steps
3. Generate a detailed implementation plan
4. Identify testing requirements

Do not write any code - focus only on planning.
```

**Implementation Agent** (`implementer.agent.md`):
```yaml
---
description: 'Implement code based on a plan or specification'
name: 'Implementer'
tools: ['read', 'edit', 'search', 'execute']
handoffs:
  - label: Review Implementation
    agent: reviewer
    prompt: 'Please review this implementation for code quality, security, and adherence to best practices.'
    send: false
---
# Implementer Agent
You are an implementation specialist. Your task is to:
1. Follow provided plan or specification
2. Write clean, maintainable code
3. Include appropriate comments and documentation
4. Follow project coding standards

Implement the solution completely and thoroughly.
```

**Review Agent** (`reviewer.agent.md`):
```yaml
---
description: 'Review code for quality, security, and best practices'
name: 'Reviewer'
tools: ['read', 'search']
handoffs:
  - label: Back to Planning
    agent: planner
    prompt: 'Review the feedback above and determine if a new plan is needed.'
    send: false
---
# Code Review Agent
You are a code review specialist. Your task is to:
1. Check code quality and maintainability
2. Identify security issues and vulnerabilities
3. Verify adherence to project standards
4. Suggest improvements

Provide constructive feedback on the implementation.
```

**This workflow allows:**
1. Start with Planner agent to create a detailed plan
2. Hand off to Implementer agent to write code based on plan
3. Hand off to Reviewer agent to check implementation
4. Optionally hand off back to planning if significant issues are found

---

## Sub-Agent Orchestration

Agents can invoke other agents using the agent tool to orchestrate multi-step workflows.

### How It Works

1. Enable agent invocation by including `agent` in orchestrator's tools list
2. For each step, invoke a sub-agent by providing:
   - Agent name (the identifier users select/invoke)
   - Agent spec path (the `.agent.md` file to read and follow)
   - Minimal shared context (e.g., `basePath`, `projectName`, `logFile`)

### Wrapper Prompt Pattern (Recommended)

Use consistent wrapper prompt for every step:

```text
This phase must be performed as agent "<AGENT_NAME>" defined in "<AGENT_SPEC_PATH>".

IMPORTANT:
- Read and apply the entire .agent.md spec (tools, constraints, quality standards)
- Work on "<WORK_UNIT_NAME>" with base path: "<BASE_PATH>"
- Perform necessary reads/writes under this base path
- Return a clear summary (actions taken + files produced/modified + issues)
```

### Optional: Structured Wrapper

For traceability, embed a small JSON block (still human-readable and tool-agnostic):

```text
{
  "step": "<STEP_ID>",
  "agent": "<AGENT_NAME>",
  "spec": "<AGENT_SPEC_PATH>",
  "basePath": "<BASE_PATH>"
}
```

### Orchestrator Structure

For maintainable orchestrators, document these structural elements:

- **Dynamic parameters**: Values extracted from user (e.g., `projectName`, `fileName`, `basePath`)
- **Sub-agent registry**: List/table mapping each step to `agentName` + `agentSpecPath`
- **Step ordering**: Explicit sequence (Step 1 → Step N)
- **Trigger conditions**: Define when a step runs vs is skipped
- **Logging strategy**: Single log/report file updated after each step

### Multi-Step Processing Example

```text
Step 1: Transform raw input data
Agent: data-processor
Spec: .github/agents/data-processor.agent.md
Context: projectName=${projectName}, basePath=${basePath}
Input: ${basePath}/raw/
Output: ${basePath}/processed/
Expected: write ${basePath}/processed/summary.md

Step 2: Analyze processed data (depends on Step 1 output)
Agent: data-analyst
Spec: .github/agents/data-analyst.agent.md
Context: projectName=${projectName}, basePath=${basePath}
Input: ${basePath}/processed/
Output: ${basePath}/analysis/
Expected: write ${basePath}/analysis/report.md
```

### Key Points

- **Pass variables in prompts**: Use `${variableName}` for all dynamic values
- **Keep prompts focused**: Clear, specific tasks for each sub-agent
- **Return summaries**: Each sub-agent should report what it accomplished
- **Sequential execution**: Run steps in order when dependencies exist between outputs/inputs
- **Error handling**: Check results before proceeding to dependent steps

---

## Tool Delegation Management

### Tool Availability Requirement (Critical)

**If a sub-agent requires specific tools, the orchestrator must include those tools in its own `tools` list.**

Sub-agents cannot access tools that aren't available to their parent orchestrator.

### Example

```yaml
# If your sub-agents need to edit files, execute commands, or search code
tools: ['read', 'edit', 'search', 'execute', 'agent']
```

The orchestrator's tool permissions act as a ceiling for all invoked sub-agents.

---

## Limitations

**Sub-agent orchestration is NOT suitable for:**

- Processing hundreds or thousands of files
- Handling large datasets
- Performing bulk transformations on big codebases
- Orchestrating more than 5-10 sequential steps

Each sub-agent invocation adds latency and context overhead. For high-volume processing, implement logic directly in a single agent instead.

---

## When to Use This Module

Load this module when:

- Orchestrating multi-agent workflows
- Creating agent handoff configurations
- Implementing sequential development processes
- Projects requiring specialized agent coordination

---

## Stop Conditions

**Do not apply this module when:**

- Single-agent tasks
- Quick one-off queries
- When tool delegation is not required
- Simple refactoring without orchestration

---

## Integration with Existing Modules

This module extends:

- **delegation-patterns**: Provides when-to-delegate guidance (this adds handoff-specific patterns)
- **coding-standards**: Ensures coordinated agents follow consistent code standards
- **git-workflow**: Manages agent versioning and deployment
