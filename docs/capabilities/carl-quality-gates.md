# CARL Quality Gates

**Context Augmentation & Reinforcement Layer** — Dynamic rule loading system for quality enforcement.

## Overview

CARL is a just-in-time rule loading system that:

- **Detects active domains** — Analyzes context to determine which rules apply
- **Loads relevant rules** — Only loads rules for current activity
- **Enforces with priority** — Critical blocks, high warns, medium notes
- **Adapts to context** — Rules activate when relevant, disappear when not

::: tip CARL ensures code meets standards without bloating your context.
:::

CARL works alongside PAUL to provide rule-based quality enforcement:

- **PAUL Domain** — Loop enforcement, boundary protection, state consistency
- **Development Domain** — Code quality, error handling, testing requirements
- **Projects Domain** — Documentation, version handling

## Core Concepts

### 1. Just-in-Time Rule Loading

CARL loads rules dynamically based on context:

```yaml
# Context Detection
if (workingDirectory.includes(".paul")) → Enable PAUL domain
if (hasCode || hasFeatures) → Enable Development domain
if (hasProject) → Enable Projects domain

# Load rules just-in-time
for (domain in activeDomains) {
  for (rule in domain.rules) {
    if (rule.condition(context)) {
      loadedRules.push(rule)
    }
  }
}
# Sort by priority: critical > high > medium > low
```

### 2. Active Domains

CARL manages three domains that activate based on context:

#### PAUL Domain

**Trigger**: When working directory contains `.paul` or when using PAUL methodology

| Priority | Rule Name               | Enforcement                                   |
| -------- | ----------------------- | --------------------------------------------- |
| Critical | Loop Enforcement        | loop_position must be PLAN, APPLY, or UNIFY   |
| Critical | Boundary Protection     | No boundary violations allowed                |
| High     | State Consistency Check | State must be consistent at phase transitions |
| High     | Verification Required   | Every task must have verification step        |
| Medium   | Skill Blocking          | Required skills must load before APPLY        |

**Example rules:**

- No implementation code without approved PLAN.md
- Every APPLY must be followed by UNIFY
- Respect PLAN.md "Boundaries" / "DO NOT CHANGE" sections

#### Development Domain

**Trigger**: When code, features, or development tasks are mentioned

| Priority | Rule Name            | Enforcement                             |
| -------- | -------------------- | --------------------------------------- |
| High     | Code Quality         | Quality score > 0.7                     |
| High     | Error Handling       | Error-prone operations require handling |
| Medium   | Testing Requirements | Features require tests                  |

**Example rules:**

- Code quality score must pass linter
- Async functions need try-catch or error handling
- New features require unit tests

#### Projects Domain

**Trigger**: When project-level tasks (release, deployment, docs) are mentioned

| Priority | Rule Name        | Enforcement                         |
| -------- | ---------------- | ----------------------------------- |
| Medium   | Documentation    | Project tasks require documentation |
| Low      | Version Handling | Releases require version updates    |

**Example rules:**

- Releases must update changelog
- Documentation must be present
- Version numbers must be incremented

### 3. Rule Enforcement Process

```text
1. Context Detection
   ↓
   Analyze current context
   ↓
2. Rule Loading
   ↓
   Load rules for active domains
   ↓
3. Priority Sorting
   ↓
   critical > high > medium > low
   ↓
4. Enforcement
   ↓
   For each rule:
     ├─ Check if condition met
     ├─ Critical violation → BLOCK execution
     ├─ High violation → WARN
     └─ Medium/Low violation → NOTE
```

## Priority Levels

| Level        | Action           | When to Use                      |
| ------------ | ---------------- | -------------------------------- |
| **Critical** | Block execution  | Must pass - blocks if violated   |
| **High**     | Warn and suggest | Should pass - warns if violated  |
| **Medium**   | Note             | Nice to have - notes if violated |
| **Low**      | Informational    | Optional - informational only    |

## CARL in Action

### Example 1: PAUL Domain Enforcement

**User:** "Start implementing authentication without a plan"

**CARL Check:**

```markdown
## PAUL Domain Rules

### Rule: No implementation code without approved PLAN.md (Critical)

❌ FAILED: No PLAN.md found

**Action:** BLOCK execution
**Reason:** PAUL requires approved plan before implementation
**Fix:** Run `/paul:plan` to create an executable plan first

### Rule: Loop Enforcement (Critical)

❌ FAILED: loop_position not in ["PLAN", "APPLY", "UNIFY"]

**Action:** BLOCK execution
**Reason:** Invalid loop position
**Fix:** Start with `/paul:plan` to set proper loop state
```

### Example 2: Development Domain Enforcement

**User:** "Create a user login function"

**Generated Code:**

```typescript
async function login(username, password) {
  const user = await db.findUser(username);
  console.log("User login attempt", username);
  return user.password === password;
}
```

**CARL Check:**

````markdown
## Development Domain Rules

### Rule: Code Quality (High)

⚠️ WARNING: Missing type annotations

**Fix:**

```typescript
async function login(username: string, password: string): Promise<boolean>;
```
````

### Rule: Error Handling (High)

❌ FAILED: No error handling for database query

**Action:** WARN
**Fix:**

```typescript
try {
  const user = await db.findUser(username);
  return user.password === password;
} catch (error) {
  throw new AuthError("Invalid credentials");
}
```

### Rule: Code Style (Medium)

ℹ️ NOTE: Console log in production code

**Fix:** Remove `console.log` statement

````text

### Example 3: Boundary Protection

**PLAN.md includes:**
```markdown
## Boundaries
### DO NOT CHANGE
- database/migrations/*
- src/lib/auth.ts
````

**User:** "Update src/lib/auth.ts for new feature"

**CARL Check:**

```markdown
## PAUL Domain Rules

### Rule: Boundary Protection (Critical)

❌ FAILED: Attempting to modify protected file: src/lib/auth.ts

**Action:** BLOCK execution
**Reason:** File in DO NOT CHANGE section
**Options:**

1. Remove from boundaries if change is intentional
2. Create separate plan for this change
3. Get explicit confirmation to modify
```

## Rule Examples

### PAUL Loop Enforcement

**Rule**: loop_position must be valid

- **Condition**: Always active when in PAUL context
- **Check**: `loop_position in ["PLAN", "APPLY", "UNIFY"]`
- **Failure**: Block transition, correct state first

### Boundary Protection

**Rule**: No violations of defined boundaries

- **Condition**: When boundaries are defined in PLAN
- **Check**: All work stays within boundaries
- **Failure**: Block out-of-scope work

### Verification Required

**Rule**: Every task must have verification

- **Condition**: When tasks are defined
- **Check**: Each task has `verify` field defined
- **Failure**: Require verification step before marking done

### Code Quality

**Rule**: Code quality score > 0.7

- **Condition**: When code is written or modified
- **Check**: Pass linter with high score
- **Failure**: Warn, suggest improvements

## Best Practices

### 1. Rule-First Thinking

Before taking action, ask: "What CARL rules apply here?"

### 2. Early Validation

Check rules early, not after the fact:

- Before writing code → Check Development rules
- Before starting PLAN → Check PAUL rules
- Before releasing → Check Projects rules

### 3. Continuous Enforcement

Re-evaluate rules after each change:

- Code modified? Re-check Development rules
- PAUL phase changed? Re-check PAUL rules
- Context changed? Detect new domains

### 4. Clear Communication

When a rule fails:

1. Identify which rule and priority
2. Explain why it failed
3. Suggest how to fix
4. If critical, block until fixed

## Integration with PAUL

CARL is the companion to PAUL:

| PAUL               | CARL                    |
| ------------------ | ----------------------- |
| Provides structure | Enforces rules          |
| Defines workflow   | Loads rules dynamically |
| Manages state      | Checks consistency      |
| Plans work         | Validates quality       |

**Without CARL:** You'd need massive static prompts in every session.

**With CARL:** Rules activate when relevant, disappear when not. Your context stays lean.

## Configuration

```javascript
{
  dynamicLoading: true,      // Load rules just-in-time
  priorityEnforcement: true,  // Enforce priority ordering
  criticalBlocking: true,      // Block on critical violations
  domainDetection: "auto",    // Auto-detect active domains
  ruleAuditLogging: true       // Log rule evaluations
}
```

## See Also

- [PAUL Methodology](./paul-methodology.md) — Structured development
- [Skill Execution](./skill-execution.md) — Using CARL in skills
- [Verification Loops](../research/verification-loops.md) — Quality verification
