---
module_id: delegation-patterns
name: Delegation Patterns & Subagent Usage
version: 2.0.0
description: When and how to invoke subagents via Task tool. Loaded for complex tasks or when delegation is appropriate.
priority: 25
type: context
depends_on:
  - core-contract
exports:
  - when_to_delegate
  - available_agents
  - delegation_rules
  - task_permissions
  - workflow_patterns
---

# Delegation Patterns & Subagent Usage

## When to Delegate

**Invoke subagents when:**

1. **Context exceeds 2000 tokens**
   - Large files or many files to process
   - Complex multi-step tasks
   - Risk of context window pressure

2. **Task requires specific expertise**
   - Security auditing
   - Performance analysis
   - Complex refactoring
   - Research and investigation

3. **Parallel work is possible**
   - Multiple independent files to review
   - Different aspects of a problem
   - Can split work into isolated chunks

4. **Focused context is needed**
   - Need to isolate from main conversation
   - Prevent context contamination
   - Specialized scope required

5. **Main agent confidence drops**
   - Uncertainty about approach
   - Complex domain knowledge needed
   - Need second opinion or review

---

## Available Agents

### Built-in Subagents

**General Agent**
- **Purpose:** Research complex questions, execute multi-step tasks
- **Tools:** Full access (except todo)
- **Use when:** Need deep investigation, multiple operations
- **Invoke via:** `@general` or Task tool

**Explore Agent**
- **Purpose:** Read-only codebase exploration
- **Tools:** Read, grep, find (no write/edit)
- **Use when:** Need to understand structure without changes
- **Invoke via:** `@explore` or Task tool

### Custom Subagents

**rlm-subcall**
- **Purpose:** Process large contexts using Recursive Language Model pattern
- **Use when:** Files >2000 lines, complex queries requiring chunked processing
- **Tools:** Python REPL, Read, Grep
- **Strategy:** rlm

**research-agent**
- **Purpose:** Evidence-driven investigation
- **Use when:** Finding information, evaluating sources
- **Tools:** Web search, Read, Grep
- **Approach:** Frame → Discover → Verify → Synthesize

**code-agent**
- **Purpose:** Disciplined code editing
- **Use when:** Implementation, refactoring, debugging
- **Tools:** Read, Write, Edit, Bash
- **Approach:** Inspect → Extract → Validate → Implement

**analysis-agent**
- **Purpose:** Evaluate options, reason about tradeoffs
- **Use when:** Decision support, code review, architecture evaluation
- **Tools:** Read, Grep, WebFetch
- **Approach:** Decompose → Evaluate → Decide

---

## Delegation Rules

### DO Delegate

✅ **Large context processing**
```
User: "Analyze this 500-line file"
→ Delegate to rlm-subcall for chunked processing
```

✅ **Parallel expert review**
```
User: "Add authentication and review security"
→ Delegate in parallel:
   - Coder: Implement auth
   - SecurityAuditor: Review design
```

✅ **Research tasks**
```
User: "Why is the API slow?"
→ Delegate to research-agent:
   - Find bottlenecks
   - Gather evidence
   - Synthesize findings
```

✅ **Complex implementation**
```
User: "Refactor the database layer"
→ Delegate to code-agent:
   - Inspect current structure
   - Plan changes
   - Implement safely
```

### DON'T Delegate

❌ **Simple, focused tasks**
```
User: "Fix the typo in README"
→ Don't delegate - just fix it
```

❌ **Quick checks**
```
User: "What files are in src/?"
→ Don't delegate - use ls/glob
```

❌ **When confidence is high**
```
Task is straightforward and clear
→ Don't delegate unnecessarily
```

---

## Task Permissions

### Permission Model

Control which subagents can invoke others:

```yaml
# In agent configuration
permission:
  task:
    "*": deny           # Default: deny all
    "orchestrator-*": allow  # Allow orchestrator subagents
    "code-reviewer": ask     # Ask before invoking
```

### Rules Evaluation

- Rules evaluated in order
- **Last matching rule wins**
- Example: `orchestrator-planner` matches both `*` (deny) and `orchestrator-*` (allow), but allow wins because it's last

### Hidden Agents

Mark agents as hidden from autocomplete but still invokable:
```yaml
hidden: true
```

Useful for internal helpers that should only be invoked programmatically.

---

## Workflow Patterns

### Pattern 1: Simple Task (No Delegation)

```
User: "Fix the typo in README"

Orchestrator:
  ├─ Intent: edit, simple
  ├─ Skills: none needed
  ├─ Action: Read README, fix typo
  └─ Result: Done
```

### Pattern 2: Parallel Expert Delegation

```
User: "Add user authentication"

Orchestrator:
  ├─ Intent: implement, complex
  ├─ Load skills: [fastapi, auth, security]
  ├─ Spawn in parallel:
  │   ├─ [AuthExpert] Design auth flow
  │   ├─ [DbExpert] Design user schema
  │   └─ [SecurityAuditor] Define requirements
  ├─ Collect results
  ├─ Spawn [Coder] Implement based on designs
  ├─ Spawn [Tester] Write tests
  ├─ Validate
  └─ Deliver
```

### Pattern 3: Pipeline Processing

```
User: "Refactor the database layer"

Orchestrator:
  ├─ Intent: refactor, complex
  ├─ Stage 1: [Explorer] Find all DB code
  ├─ Stage 2: [Expert] Design new schema
  ├─ Stage 3: [Coder] Implement changes
  ├─ Stage 4: [Migrator] Create migrations
  ├─ Stage 5: [Tester] Test everything
  ├─ Stage 6: [Validator] Final validation
  └─ Deliver
```

### Pattern 4: Explore-Exploit Loop

```
User: "Why is this slow?"

Orchestrator:
  ├─ Intent: investigate
  ├─ Loop (max 3 iterations):
  │   ├─ [Explorer] Search for bottlenecks
  │   ├─ [Analyzer] Analyze findings
  │   ├─ If clear issue found:
  │   │   └─ [Fixer] Apply fix
  │   └─ If unclear:
  │       └─ [Explorer] Dig deeper
  ├─ [Validator] Verify fix
  └─ Deliver report
```

---

## Communication Protocol

### Sub-Agent Messages

**Query (max 500 tokens):**
```
FROM: {sender_agent_id}
TO: {receiver_agent_id}
TYPE: query
QUERY: {specific_question}
CONTEXT: {minimal_necessary_context}
```

**Response (max 1000 tokens):**
```
FROM: {sender_agent_id}
TO: {receiver_agent_id}
TYPE: response
ANSWER: {direct_answer}
FILES: [relevant_file_paths]
```

**Result (max 2000 tokens):**
```
FROM: {sender_agent_id}
TO: orchestrator
TYPE: result
SUMMARY: {what_was_done}
OUTPUT: {deliverable}
FILES_CHANGED: [paths]
ISSUES: [any_problems]
```

### Constraints

- No direct memory sharing
- All communication through messages
- Token limits enforced
- Files accessed only if in whitelist

---

## Best Practices

### DO:

✅ **Let the orchestrator decide**
- Don't specify sub-agents manually
- Trust the intent classification
- Allow dynamic agent loading

✅ **Keep sub-agents focused**
- One responsibility per agent
- Clear, limited scope
- Isolated contexts

✅ **Validate at boundaries**
- Check sub-agent outputs
- Run tests after changes
- Verify security constraints

✅ **Learn and adapt**
- Track successful patterns
- Update agents from experience
- Improve delegation over time

### DON'T:

❌ **Micromanage sub-agents**
- Don't tell them how to do their job
- Don't bypass the orchestrator
- Don't mix contexts

❌ **Ignore token limits**
- Don't load unnecessary context
- Don't pass full file trees
- Don't keep stale context

❌ **Skip validation**
- Don't trust sub-agent outputs blindly
- Don't skip tests
- Don't ignore security reviews

---

## Module Contract

This module guides intelligent subagent delegation.

**Violations include:**
- Delegating simple tasks unnecessarily
- Micromanaging subagents
- Skipping validation of subagent work
- Not using isolated contexts when appropriate

**When uncertain about delegation:**
> If context > 2000 tokens or task requires specific expertise → Delegate. Otherwise → Handle directly.
