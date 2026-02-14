---
name: skill-composer
description: Dynamically compose existing skills for novel tasks. Treats skills as modular components to synthesize new capabilities through intelligent sequencing and state passing.
version: 1.0.0
author: tachikoma
type: skill
category: orchestration
tags:
  - composition
  - orchestration
  - synthesis
  - skills
---

# Skill Composer

> **Purpose**: Compositional Skill Synthesis - Dynamically compose your existing skills to handle complex, multi-step tasks that no single skill can solve alone.

---

## What This Skill Does

When you face a complex task that spans multiple domains, Skill Composer:

1. **Decomposes** the task into sub-tasks
2. **Maps** each sub-task to the best skill(s)
3. **Sequences** skills in optimal order (respecting dependencies)
4. **Executes** with state passing between skills
5. **Synthesizes** final coherent output

---

## Available Skills Registry

Skill Composer auto-detects from `.opencode/skills/`:

| Skill | Strengths | Best For |
|-------|-----------|----------|
| **intent-classifier** | Fast classification | Initial intent detection |
| **code-agent** | Implementation | Writing/modifying code |
| **analysis-agent** | Review & audit | Code review, security analysis |
| **research-agent** | Investigation | Finding information, docs |
| **context-manager** | Discovery | Context file operations |
| **context7** | Live docs | Current library documentation |
| **formatter** | Quality | Code cleanup, formatting |
| **git-commit** | Version control | Git operations |
| **pr** | Collaboration | Pull request creation |
| **workflow-management** | Process | Multi-phase development |
| **task-tracking** | Organization | Task management |

---

## Task Decomposition Patterns

### Pattern 1: Research → Implement → Document

```
User: "Add authentication to our API"

Decomposition:
1. research-agent: Research auth best practices
2. code-agent: Implement auth middleware  
3. git-commit: Commit the changes
4. formatter: Clean up the code

Sequence: Sequential (each depends on previous)
```

### Pattern 2: Parallel Analysis → Synthesis

```
User: "Review this codebase for issues"

Decomposition:
1. analysis-agent: Security audit (parallel)
2. analysis-agent: Performance review (parallel)
3. analysis-agent: Code quality check (parallel)
4. Synthesis: Merge findings into unified report

Sequence: Parallel → Synthesis
```

### Pattern 3: Research → Prototype → Validate

```
User: "Evaluate using Redis for caching"

Decomposition:
1. context7: Fetch current Redis docs
2. research-agent: Analyze caching patterns
3. code-agent: Implement prototype
4. analysis-agent: Review implementation

Sequence: Sequential with feedback loops
```

---

## Usage

### Automatic Composition (Recommended)

Skill Composer automatically activates for complex queries:

```
User: "Research React 19 features and create a demo app"

Tachikoma detects complexity > 0.7
→ Invokes skill-composer automatically
→ Decomposes and executes skill sequence
```

### Manual Composition

For explicit control:

```
User: "Compose skills: research React 19, then implement demo"

Tachikoma:
  1. Plan composition
  2. Show execution plan
  3. Execute with user confirmation
```

---

## State Passing Between Skills

Skills share context through a global state buffer:

```
Skill 1 (research-agent):
  Output: { findings: [...], sources: [...] }
  → Added to state buffer

Skill 2 (code-agent):
  Input: Accesses state.findings
  Output: { files_created: [...] }
  → Added to state buffer

Skill 3 (formatter):
  Input: Accesses state.files_created
  Output: { formatted_files: [...] }
```

**State Buffer Format**:
```json
{
  "execution_id": "uuid",
  "skills_executed": [
    {
      "skill": "research-agent",
      "output": { ... },
      "timestamp": "..."
    }
  ],
  "current_context": { ... }
}
```

---

## Composition Rules

### Dependency Resolution

Skills have implicit dependencies:

```
formatter → Must run AFTER code-agent (needs files to format)
git-commit → Must run AFTER formatter (clean code to commit)
pr → Must run AFTER git-commit (needs commits to PR)
```

### Parallelization

Independent skills run in parallel:

```
Parallel Group 1:
  - context7 (fetch docs)
  - context-manager (discover context)
  
Parallel Group 2 (after Group 1):
  - research-agent (analyze findings)
```

### Error Handling

If a skill fails:

1. **Retry**: Attempt skill again with adjusted parameters
2. **Fallback**: Switch to alternative skill
3. **Escalate**: Pause and ask user for guidance
4. **Continue**: Skip failed skill, proceed with warning

---

## Integration with Tachikoma

### Routing Logic

```yaml
# intent-routes.yaml
routes:
  complex:
    description: Multi-step tasks requiring skill composition
    confidence_threshold: 0.6
    skill: skill-composer
    strategy: compose
    
  research-and-implement:
    description: Research followed by implementation
    confidence_threshold: 0.7
    skill: skill-composer
    composition: [research-agent, code-agent, formatter]
```

### Complexity Detection

Skill Composer activates when:

- Intent confidence < 0.8 (ambiguous, needs multiple approaches)
- Query contains multiple verbs ("research AND implement")
- Task spans multiple domains ("code + docs + git")
- Explicit user request ("use multiple skills")

---

## Example Compositions

### Example 1: Feature Implementation

```
User: "Add OAuth2 authentication"

Composition:
  1. context7: Fetch OAuth2 spec
  2. research-agent: Check project auth patterns
  3. code-agent: Implement OAuth2 middleware
  4. formatter: Clean up code
  5. git-commit: Commit changes
  6. task-tracking: Log completion

Result: Production-ready OAuth2 implementation
```

### Example 2: Code Review

```
User: "Review this PR thoroughly"

Composition:
  1. analysis-agent: Security audit (parallel)
  2. analysis-agent: Performance analysis (parallel)
  3. analysis-agent: Code quality check (parallel)
  4. Synthesis: Merge findings
  5. pr: Create review comments

Result: Comprehensive PR review with multiple perspectives
```

### Example 3: Documentation Sprint

```
User: "Document the new API endpoints"

Composition:
  1. context-manager: Discover existing docs structure
  2. research-agent: Analyze API code
  3. code-agent: Generate OpenAPI spec
  4. formatter: Format documentation
  5. git-commit: Commit docs

Result: Complete API documentation
```

---

## Best Practices

### DO:

✅ **Let it compose automatically** for complex tasks
✅ **Review the execution plan** before long compositions
✅ **Use parallel groups** when skills are independent
✅ **Check state buffer** for intermediate outputs
✅ **Allow retries** for flaky skills

### DON'T:

❌ **Force composition** for simple tasks (overhead)
❌ **Skip the synthesis step** (incoherent output)
❌ **Run too many parallel skills** (context window limits)
❌ **Ignore dependency order** (skills fail)

---

## Troubleshooting

### "Circular dependency detected"

Skills depend on each other. Solution:
- Break into smaller sub-tasks
- Identify the shared dependency
- Execute shared dependency first

### "State buffer too large"

Too much context accumulated. Solution:
- Summarize intermediate outputs
- Clear buffer between major phases
- Use references instead of full content

### "Skill composition timeout"

Too many skills in sequence. Solution:
- Parallelize independent skills
- Break into smaller compositions
- Increase timeout threshold

---

**Skill Composer** - Your skills, supercharged! ⚡
