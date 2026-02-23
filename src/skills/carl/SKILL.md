---
name: carl
description: CARL Layer - Context Augmentation & Reinforcement Layer with rule-based quality gates
keywords:
  - carl
  - rule
  - quality gate
  - enforcement
  - check
  - validation
triggers:
  - enforce rules
  - quality check
  - validation
  - verify compliance
  - quality gate
---

# CARL Layer

You are applying the CARL (Context Augmentation & Reinforcement Layer) system for rule-based quality enforcement.

## What is CARL?

CARL is a just-in-time rule loading system that:
- Detects which domains are active based on context
- Loads relevant rules for those domains
- Enforces rules with priority-based evaluation
- Blocks critical violations

## Active Domains

### 1. PAUL Domain

**Trigger**: When working directory contains `.paul` or when using PAUL methodology

**Rules**:

| Priority | Rule Name | Trigger | Enforcement |
|----------|-----------|----------|--------------|
| Critical | Loop Enforcement | always | loop_position must be PLAN, APPLY, or UNIFY |
| Critical | Boundary Protection | boundary mentioned | No boundary violations allowed |
| High | State Consistency Check | phase transition | State must be consistent |
| High | Verification Required | tasks defined | Every task must have verification |
| Medium | Skill Blocking | special flows mentioned | Skills must be loaded when needed |

### 2. Development Domain

**Trigger**: When code, features, or development tasks are mentioned

**Rules**:

| Priority | Rule Name | Trigger | Enforcement |
|----------|-----------|----------|--------------|
| High | Code Quality | code present | Quality score > 0.7 |
| High | Error Handling | error-prone operations | Error handling must be present |
| Medium | Testing Requirements | features added | Tests must be present |

### 3. Projects Domain

**Trigger**: When project-level tasks (release, deployment, docs) are mentioned

**Rules**:

| Priority | Rule Name | Trigger | Enforcement |
|----------|-----------|----------|--------------|
| Medium | Documentation | project tasks | Docs must be present |
| Low | Version Handling | release | Version must be present |

## Rule Enforcement Process

### 1. Context Detection

Analyze the current context to determine active domains:

```javascript
// Example context detection
if (workingDirectory.includes(".paul")) → Enable PAUL domain
if (hasCode || hasFeatures) → Enable Development domain
if (hasProject) → Enable Projects domain
```

### 2. Rule Loading

Load rules for active domains:

```javascript
// Load rules just-in-time
for (domain in activeDomains) {
  for (rule in domain.rules) {
    if (rule.condition(context)) {
      loadedRules.push(rule);
    }
  }
}
// Sort by priority: critical > high > medium > low
```

### 3. Rule Enforcement

Evaluate and enforce rules:

```javascript
for (rule in loadedRules) {
  if (!rule.enforce(context)) {
    log.error(`Rule failed: ${rule.name}`);
    if (rule.priority === "critical") {
      BLOCK_ACTION(); // Stop execution
    }
  }
}
```

## Priority Levels

- **Critical**: Must pass - blocks execution if violated
- **High**: Should pass - warns if violated
- **Medium**: Nice to have - notes if violated
- **Low**: Optional - informational

## Common Use Cases

### Before Making Changes

Check CARL rules for the relevant domain:

**For PAUL work**:
- ✅ Loop position is correct
- ✅ Acceptance criteria defined
- ✅ Boundaries specified
- ✅ Verification steps included

**For code changes**:
- ✅ Error handling present
- ✅ Code follows style guide
- ✅ Tests added/updated

**For releases**:
- ✅ Version incremented
- ✅ Changelog updated
- ✅ Documentation complete

### After Making Changes

Verify CARL rules still pass:

**For code**:
```bash
# Check code quality
bun run lint
bun run test
```

**For PAUL**:
- ✅ UNIFY phase completed
- ✅ STATE.md updated
- ✅ SUMMARY.md created

## Rule Examples

### PAUL Loop Enforcement

**Rule**: loop_position must be valid
**Condition**: Always active when in PAUL context
**Check**: `loop_position in ["PLAN", "APPLY", "UNIFY"]`
**Failure**: Block transition, correct state first

### Boundary Protection

**Rule**: No violations of defined boundaries
**Condition**: When boundaries are defined in PLAN
**Check**: All work stays within boundaries
**Failure**: Block out-of-scope work

### Verification Required

**Rule**: Every task must have verification
**Condition**: When tasks are defined
**Check**: Each task has `verify` field defined
**Failure**: Require verification step before marking done

### Code Quality

**Rule**: Code quality score > 0.7
**Condition**: When code is written or modified
**Check**: Pass linter with high score
**Failure**: Warn, suggest improvements

## Integration with OpenCode

Use CARL alongside other tools:

1. **Context Detection**: Use `read` to check for `.paul/STATE.md`, project structure
2. **Rule Checking**: Use `bash` to run lint, test commands
3. **Verification**: Use tool outputs to validate against rules
4. **Blocking**: On critical failures, stop and explain rule violation

## Configuration

CARL uses these settings:

```javascript
{
  dynamicLoading: true,      // Load rules just-in-time
  priorityEnforcement: true,  // Enforce priority ordering
  criticalBlocking: true,      // Block on critical violations
  domainDetection: "auto",    // Auto-detect active domains
  ruleAuditLogging: true       // Log rule evaluations
}
```

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

---

*CARL provides rule-based quality gates that adapt to context, enforcing standards without requiring manual configuration.*
