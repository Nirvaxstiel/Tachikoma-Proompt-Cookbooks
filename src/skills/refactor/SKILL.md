---
name: refactor
description: Apply surgical code refactoring to improve maintainability without changing behavior
keywords:
  - refactor
  - clean
  - improve
  - maintain
  - restructure
triggers:
  - refactor
  - clean up
  - improve code
  - make it better
  - simplify
---

# Refactoring

Improve code structure and readability without changing external behavior. Refactoring is gradual evolution, not revolution.

## Golden Rules

1. **Behavior is preserved** - Refactoring doesn't change what code does, only how
2. **Small steps** - Make tiny changes, test after each
3. **Version control is your friend** - Commit before and after each safe state
4. **Tests are essential** - Without tests, you're not refactoring, you're editing
5. **One thing at a time** - Don't mix refactoring with feature changes
6. **Rational thinking** – Refactor with a clear purpose in mind. Always ask "why" before "how."
7. **Functional reasoning** – Ensure the changes align with the system's functionality and design principles, maintaining integrity throughout.

## Common Code Smells & Fixes

| Smell | Fix | Principle |
|--------|------|-----------|
| Long function (>50 lines) | Extract methods | One responsibility |
| Duplicated code | Extract common logic | DRY |
| Large class | Split by responsibility | Single responsibility |
| Long parameter list | Group into object | Encapsulation |
| Nested conditionals | Guard clauses / early returns | Readability |
| Magic numbers | Named constants | Clarity |
| Feature envy | Move logic to data owner | Encapsulation |
| Primitive obsession | Domain types | Type safety |

## Refactoring Steps

1. **Prepare** - Ensure tests exist, commit current state
2. **Identify** - Find code smell, understand what code does
3. **Refactor** - One small change, run tests, commit if passes
4. **Verify** - All tests pass, manual testing if needed
5. **Clean up** - Update comments/docs, final commit

## Key Patterns

### Extract Method
```diff
# Before
- function process(order) {
-   // 50 lines of validation
-   // 30 lines of calculation
-   // 20 lines of persistence
- }

# After
+ function process(order) {
+   validate(order);
+   const result = calculate(order);
+   return save(result);
+ }
```

### Guard Clauses
```diff
# Before
- function process(order) {
-   if (order) {
-     if (order.user) {
-       if (order.user.active) {
-         // actual work
-       }
-     }
-   }
- }

# After
+ function process(order) {
+   if (!order) return error('No order');
+   if (!order.user) return error('No user');
+   if (!order.user.active) return error('Inactive');
+   // actual work
+ }
```

### Named Constants
```diff
# Before
- if (status === 2) { /* ... */ }
- const discount = total * 0.15;

# After
+ const UserStatus = { ACTIVE: 1, INACTIVE: 2 };
+ const DISCOUNT_RATES = { STANDARD: 0.1, PREMIUM: 0.15 };
+ if (status === UserStatus.INACTIVE) { /* ... */ }
+ const discount = total * DISCOUNT_RATES.PREMIUM;
```

## When NOT to Refactor

- Code that works and won't change again ("if it ain't broke...")
- Critical production code without tests (add tests first)
- When you're under a tight deadline
- "Just because" - need a clear purpose

## Important

- Apply functional thinking and reasoning skills: prefer immutable patterns, pure functions, explicit dependencies
- Always have tests before refactoring
- Commit after each successful refactoring step
- Run tests after each change
