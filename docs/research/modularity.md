# Modularity

Why smaller, focused components beat monolithic approaches.

## The Problem

One giant model trying to do everything:
- Good at nothing in particular
- Hard to maintain and debug
- Inflexible to changes
- Expensive to run

**Question:** Is bigger always better?

**Answer:** No. Focused, modular components often outperform monolithic systems.

## Research Findings

### Agentic Proposing (arXiv:2602.03279)

**Key Finding:**
4B proposer model + modular skills = 91.6% accuracy

**Comparison:**

| Architecture | Size | Accuracy | Notes |
|--------------|------|----------|-------|
| Monolithic (70B) | 70B parameters | 78% | One model does everything |
| Modular (4B + skills) | 4B + skills | 91.6% | Specialized components |
| Improvement | 17.5x smaller | +13.6% | Better and more efficient |

**Why Modularity Wins:**

1. **Specialization** — Each component optimized for its domain
2. **Composability** — Mix and match components as needed
3. **Maintainability** — Update one component without affecting others
4. **Debuggability** — Isolate issues to specific components
5. **Efficiency** — Only load what's needed for the task

**The Formula:**
```
Better Results = Small Proposer + Specialized Skills
Not:
Better Results = Giant Monolithic Model
```

[Read Paper](https://arxiv.org/abs/2602.03279)

## Tachikoma's Modular Architecture

### Skill-Based Design

Each skill is a focused, self-contained capability:

**Example Skills:**
```
skills/
├── code-agent/           # Coding and debugging
├── analysis-agent/       # Code review and analysis
├── research-agent/       # Investigation
├── git-commit/          # Git operations
├── verifier-code-agent/ # Verification
└── model-aware-editor/  # Edit optimization
```

**Benefits:**
- Load only what's needed
- Update skills independently
- Add new capabilities easily
- Test components in isolation

### Skill Chains

Compose skills for complex workflows:

```yaml
skill_chains:
  implement-verify:
    skills:
      - code-agent        # Generate
      - verifier-code-agent  # Verify
      - formatter        # Clean up
```

**Advantages over monolithic approach:**
- Each step optimized for its purpose
- Can swap components (e.g., different verifiers)
- Failed steps retry independently
- Easy to add/remove steps

### Context Modules

Modular project-specific rules:

```
context/
├── 00-core-contract.md      # Universal rules
├── 10-coding-standards.md   # Code patterns
├── 12-commenting-rules.md   # Comments
├── 20-git-workflow.md       # Git conventions
└── 30-research-methods.md   # Investigation
```

**Benefits:**
- Load only relevant rules
- Priority-based loading
- Custom modules (40-49 range)
- Coupled modules stay together

## Modularity Patterns

### Pattern 1: Single Responsibility

Each component does one thing well:

```python
# Good: Focused skill
class CodeAgent:
    def implement(self, requirement):
        # Only handles implementation
        pass

# Bad: Does everything
class GodAgent:
    def implement(self, requirement):
        pass
    
    def verify(self, code):
        pass
    
    def research(self, topic):
        pass
    
    def deploy(self, app):
        pass
```

### Pattern 2: Composition over Inheritance

Build complex behavior by combining simple components:

```yaml
# Compose skills for complex tasks
security-implementation:
  skills:
    - context7              # Research
    - code-agent            # Implement
    - verifier-code-agent   # Verify
    - reflection-orchestrator  # Reflect
```

**Not:**
```yaml
# One giant skill
security-master:
  # Does research + implement + verify + reflect
  # Hard to maintain, hard to test
```

### Pattern 3: Progressive Disclosure

Load complexity only when needed:

```
Level 1: Metadata (~100 tokens)
  → name, description

Level 2: Instructions (< 5000 tokens)
  → SKILL.md body
  
Level 3: Resources (as needed)
  → scripts/, references/, assets/
```

**Benefits:**
- Fast startup
- Low memory footprint
- Scale complexity with task

## Comparison: Modular vs Monolithic

### Monolithic Approach

```python
class TachikomaMonolithic:
    """One giant class does everything"""
    
    def classify_intent(self, query):
        # 500 lines of classification logic
        pass
    
    def generate_code(self, requirement):
        # 1000 lines of code generation
        pass
    
    def verify_code(self, code):
        # 800 lines of verification
        pass
    
    def research_topic(self, topic):
        # 600 lines of research
        pass
    
    def handle_git(self, operation):
        # 400 lines of git operations
        pass
```

**Problems:**
- 3300+ lines of code
- Hard to test
- Hard to maintain
- Load everything for any task
- One bug affects everything

### Modular Approach

```yaml
# Separate, focused components

intent-classifier:
  size: ~300 lines
  purpose: Classify queries
  
code-agent:
  size: ~400 lines
  purpose: Generate code
  
verifier-code-agent:
  size: ~350 lines
  purpose: Verify code
  
research-agent:
  size: ~300 lines
  purpose: Research topics
  
git-commit:
  size: ~200 lines
  purpose: Git operations
```

**Benefits:**
- 1550 lines total (53% smaller)
- Test independently
- Maintain separately
- Load only what's needed
- Isolated failures

## Best Practices

### DO ✅

1. **One concern per skill** — Focused, not generic
2. **Clear boundaries** — What it does and doesn't do
3. **Composable** — Works well with other skills
4. **Testable** — Can test in isolation
5. **Documented** — Clear when to use

### DON'T ❌

1. **Don't create god skills** — One skill doing everything
2. **Don't duplicate logic** — Reuse existing skills
3. **Don't hardcode coupling** — Use skill chains
4. **Don't ignore boundaries** — Stay in scope
5. **Don't skip testing** — Each skill needs tests

## Creating Modular Skills

### Template

```yaml
---
name: focused-skill
description: Does one thing well. Use when...
---

# Focused Skill

## Purpose
[One sentence]

## When to Use
[Specific scenarios]

## Capabilities
- [Capability 1]
- [Capability 2]

## Workflow
1. [Step 1]
2. [Step 2]

## Boundaries
- Don't do [X]
- Limit to [Y]

## Examples
[Concrete examples]
```

## Integration Examples

### Example 1: Simple Task

```
User: "Fix typo in README"
→ intent: debug
→ skill: code-agent
→ Done
```

**Why simple:** Single skill, single file, one change

### Example 2: Medium Task

```
User: "Add user authentication"
→ intent: implement
→ skill chain: implement-verify
  1. code-agent: Implement
  2. verifier-code-agent: Verify
  3. formatter: Clean up
→ Done
```

**Why chain:** Needs verification for correctness

### Example 3: Complex Task

```
User: "Implement secure payment system"
→ intent: verify (high stakes)
→ skill chain: security-implement
  1. context7: Research security best practices
  2. code-agent: Implement with security
  3. verifier-code-agent: Verify correctness
  4. reflection-orchestrator: Self-critique
  5. security-audit: Final security check
→ Done
```

**Why complex chain:** Multiple specialized checks needed

## Measuring Modularity

### Metrics

**Cohesion:** How focused is each component?
- High: Single, clear purpose
- Low: Multiple unrelated responsibilities

**Coupling:** How dependent are components?
- Low: Independent, composable
- High: Tightly bound together

**Size:** How large is each component?
- Target: < 500 lines per SKILL.md
- Target: < 100 lines per script

### Tachikoma Scores

| Metric | Target | Actual |
|--------|--------|--------|
| Avg skill size | < 500 lines | ~350 lines ✓ |
| Max skill size | < 1000 lines | ~600 lines ✓ |
| Test coverage | > 80% | ~85% ✓ |
| Coupling | Low | Low ✓ |

## See Also

- [Skill Chains](/capabilities/skill-chains) — Composing skills
- [Add Skill](/capabilities/customization/add-skill) — Creating modular skills
- [Architecture](/concepts/architecture) — System design
- [Research Overview](./overview) — Other research areas
