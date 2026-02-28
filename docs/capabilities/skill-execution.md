# Skill Execution

Specialized skills handle specific task types with optimal tool usage.

## Overview

Skills are specialized components that:

- Handle specific task domains (coding, testing, debugging, etc.)
- Have dedicated tool sets and workflows
- Follow structured methodologies (PAUL, CARL)
- Can be chained together for complex tasks
- Support verification loops for critical operations

## Built-in Skills

Tachikoma includes 20 specialized skills:

### Development Skills

| Skill          | Purpose                     | Complexity |
| -------------- | --------------------------- | ---------- |
| `code`         | Code implementation         | Medium     |
| `refactor`     | Code refactoring            | High       |
| `verification` | Code correctness validation | High       |
| `git-commit`   | Conventional git commits    | Low        |
| `planning`     | PAUL-style planning         | Medium     |
| `paul`         | PAUL methodology execution  | High       |
| `carl`         | Quality gate enforcement    | Medium     |

### Research Skills

| Skill       | Purpose                      | Complexity |
| ----------- | ---------------------------- | ---------- |
| `research`  | Codebase exploration         | High       |
| `reasoning` | Functional thinking          | Medium     |
| `context7`  | Live documentation retrieval | Low        |

### Knowledge Skills

| Skill      | Purpose                      | Complexity |
| ---------- | ---------------------------- | ---------- |
| `code`     | Execute implementation tasks | Variable   |
| `refactor` | Improve code structure       | Medium     |

## Skill Discovery

Skills are discovered from two locations:

1. **Local** — `cwd/.opencode/skills/` (takes precedence)
2. **Global** — `~/.config/opencode/skills/` (fallback)

```bash
# Local skills
.opencode/skills/
├── code/SKILL.md
├── refactor/SKILL.md
├── verification/SKILL.md
...

# Global skills
~/.config/opencode/skills/
├── code/SKILL.md
├── refactor/SKILL.md
...
```

## Skill Structure

Each skill is defined in a `SKILL.md` file:

```markdown
# Code Implementation Skill

## Purpose

Execute code implementation tasks with quality verification.

## Triggers

- create, implement, build, write code
- develop, add feature

## When to Use

Use this skill when:

- Implementing new features
- Writing code components
- Building functionality

## When NOT to Use

Skip this skill when:

- Pure information queries
- Explaining existing code
- Architecture discussions

## Methodology

Uses PAUL framework with verification:

1. **PLAN** — Define objectives, acceptance criteria, verification steps
2. **APPLY** — Execute implementation with verification loops
3. **UNIFY** — Close the loop, reconcile plan vs actual

## Verification

For critical implementations, use up to 3 iterations:

1. GENERATE — Initial solution
2. VERIFY — Check with explicit criteria
3. REVISE — Fix based on verification
4. REFLECT — Question approach, flag issues

## Context Module

References: architecture.md, coding-standards.md

## Tools

- Read, Write, Edit — File operations
- Bash — Command execution
- Glob, Grep — File search

## Example

User: "Create a REST API endpoint for user authentication"

PLAN:

- Objective: Create `/api/auth/login` endpoint
- Acceptance: Returns JWT token, handles errors
- Verify: Test endpoint, validate token format

APPLY:

- Implement authentication handler
- Add error handling
- Create tests

UNIFY:

- Summary: Endpoint created with tests
- Tests passing: Yes
- Next steps: Deploy to staging
```

## Skill Execution Flow

```
Intent Classification
    ↓
Select Skill
    ↓
Load Skill Instructions (SKILL.md)
    ↓
Load Context Module (if specified)
    ↓
Load AGENTS.md (project rules)
    ↓
Execute Task
    ↓
[Optional] Verification Loop
    ↓
Reflect & Report
```

## Verification Loops

For high-stakes or correctness-critical tasks, skills can use verification loops:

### When to Use Verification

**Use verification when:**

- Complex implementations
- High-stakes fixes
- First-time features
- Correctness is paramount

**Skip verification when:**

- Simple tasks (<50 lines)
- Prototypes
- Well-understood patterns

### Verification Pattern

```
1. GENERATE
   Produce initial solution

2. VERIFY
   Check with explicit criteria:
   - Functionality correct?
   - Edge cases handled?
   - Code follows standards?
   - Tests passing?

3. REVISE
   Fix based on verification feedback

4. [Loop max 3 iterations]

5. REFLECT
   - Approach appropriate?
   - Alternative solutions?
   - Flag potential issues?
```

### Example: Verification Loop

```markdown
# Task: Implement user authentication

## GENERATE

Create authentication handler with JWT tokens.

## VERIFY

- [ ] Returns JWT token on success? Yes
- [ ] Handles invalid credentials? Yes
- [ ] Validates token format? No ← Issue found
- [ ] Tests passing? No ← Tests fail

## REVISE

Fix token validation and tests.

## VERIFY (Round 2)

- [ ] Returns JWT token on success? Yes
- [ ] Handles invalid credentials? Yes
- [ ] Validates token format? Yes
- [ ] Tests passing? Yes ✓

## REFLECT

- Token validation implemented correctly
- All tests passing
- Consider adding refresh token support (future enhancement)
```

## Model-Aware Editing

Skills can dynamically select the optimal edit format based on the model in use:

```typescript
// Skill can detect model and choose format
tachikoma.edit-format-selector with args="detect"

// Get recommendation
tachikoma.edit-format-selector with args="recommend"

// Add custom mapping
tachikoma.edit-format-selector with args="add claude-3.5 str_replace"
```

| Model           | Format              | Type             |
| --------------- | ------------------- | ---------------- |
| Claude, Mistral | `str_replace`       | Exact string     |
| Gemini          | `str_replace_fuzzy` | Fuzzy whitespace |
| GPT             | `apply_patch`       | Diff format      |
| Grok, GLM       | `hashline`          | Content-hash     |

[Learn more about model-aware editing →](./model-aware-editing.md)

## Tool Access

Skills have access to a set of tools based on their purpose:

### Core Tools

| Tool        | Purpose                               |
| ----------- | ------------------------------------- |
| `read`      | Read files                            |
| `write`     | Write files                           |
| `edit`      | Edit files (exact string replacement) |
| `bash`      | Execute commands                      |
| `glob`      | Find files by pattern                 |
| `grep`      | Search file contents                  |
| `task`      | Launch subagents                      |
| `skill`     | Load specialized skills               |
| `question`  | Ask user for clarification            |
| `todowrite` | Manage task lists                     |

### Skill-Specific Tools

Some skills have additional tools:

- `code` — Code generation tools
- `git-commit` — Git operations
- `research` — Exploration tools
- `verification` — Testing tools

## Custom Skills

Create custom skills for project-specific needs:

```bash
# Create a new skill
mkdir -p .opencode/skills/my-custom-skill
```

```markdown
# .opencode/skills/my-custom-skill/SKILL.md

# My Custom Skill

## Purpose

Handle [specific task] for [project].

## Triggers

- trigger1, trigger2, trigger3

## When to Use

- [Specific condition]
- [Specific condition]

## Methodology

[Describe your approach]

## Context Module

References: [module.md]

## Tools

- tool1, tool2, tool3
```

## Best Practices

### For Skill Authors

1. **Clear triggers** — Use specific keywords
2. **Explicit methodology** — Describe your approach
3. **Verification guidance** — When to verify
4. **Context references** — Link to relevant modules
5. **Examples** — Show usage patterns

### For Users

1. **Match skill to task** — Use the right skill for the job
2. **Provide context** — Help the skill understand requirements
3. **Review verification** — Check verification results
4. **Use skill chains** — Combine skills for complex tasks

## See Also

- [Skill Chains](./skill-chains.md) — Orchestrating multiple skills
- [PAUL Methodology](./paul-methodology.md) — Structured development
- [Model-Aware Editing](./model-aware-editing.md) — Model-specific operations
- [Verification Loops](../research/verification-loops.md) — Quality verification
