---
module_id: coding-standards
name: Coding Standards & Design Philosophy
version: 2.0.0
description: Design primitives, patterns, and code style guidelines. Loaded for all coding tasks.
priority: 10
type: context
depends_on:
  - core-contract
exports:
  - design_primitives
  - code_style_bias
  - tooling_philosophy
  - validation_expectations
  - testing_expectations
  - output_expectations
---

# Coding Standards & Design Philosophy

## Design Primitives

Apply these reasoning patterns when organizing code:

### 1. Locality of Concern
Place things near the direct operator, not the indirect beneficiary.

**The Rule:**
- What code directly reads/writes/calls this?
- That's where it belongs.

**Example:**
```python
# Good: Logic is where it's used
def process_user(user):
    validator = UserValidator()  # Created here, used here
    if validator.is_valid(user):
        save(user)

# Bad: Passing through unnecessarily
def process_user(user, validator):  # Why receive this?
    if validator.is_valid(user):    # Just passing through
        save(user)
```

### 2. Surface Area as Signal
Unused connections increase apparent complexity without adding capability.

**The Rule:**
- If I remove this, would anything break?
- No? It's noise. Remove it.

**Example:**
```python
# Bad: High surface area
class UserManager:
    def __init__(self, db, cache, logger, metrics, config):
        self.db = db
        self.cache = cache
        # ... 5 dependencies, but only uses 2
        
# Good: Minimal surface area  
class UserManager:
    def __init__(self, db, cache):
        self.db = db
        self.cache = cache
```

### 3. Minimize Transitive Knowledge
Components shouldn't know about things they don't directly use.

**The Rule:**
- Why does this component receive this dependency?
- If it's just passing it through, reconsider.

**Example:**
```python
# Bad: A knows about C, even though it only uses B
class A:
    def __init__(self, b, c):  # Why C?
        self.b = b
        
# Good: A only knows about B
class A:
    def __init__(self, b):
        self.b = b
        # B internally uses C if needed
```

---

## Code Style Bias

### Default Preferences

- ✅ **Immutable by default**
- ✅ **Functional / declarative over imperative**
- ✅ **Prefer expressions over statements**
- ✅ **Clarity over cleverness**
- ✅ **Minimal public API surface**

### Tooling Philosophy

- **Prefer CLI tools over model inference**
- Use `grep`, `find`, `rg`, `jq`, `git`, build tools, and test runners aggressively
- Propose containerized commands when isolation matters

**The shell is the primary reasoning surface.**

---

## Validation Expectations

### Before Writing Code

1. Inventory existing symbols and types
2. Confirm they exist (search if unsure)
3. Validate relevant invariants
4. Plan edits explicitly

**Never invent types, interfaces, or patterns silently.**

---

## Testing Expectations

### Test What Matters

**DO test:**
- Business rules
- Orchestration paths
- Validation behavior
- High-impact edge cases

**DO NOT test:**
- Framework internals
- Trivial accessors
- Auto-generated code

**Favor fewer, higher-value tests.**

---

## Output Expectations

### When Producing Results

- Keep changes localized
- Batch related edits
- Reference existing files instead of duplicating code

### When Summarizing Work

- 2–5 bullets of what changed
- Assumptions or risks surfaced

---

## Stop Condition for Coding

If:
- The requirement is satisfied
- Existing patterns and invariants are preserved
- No further edits materially improve correctness or alignment

**Stop.**

If blocked by missing information or conflicting constraints, **ask explicitly**.

---

## Module Contract

This module enforces disciplined code design and implementation.

**Violations include:**
- Assuming structure without inspection
- Creating abstractions prematurely
- Making improvements not required by the task
- Continuing after "done" criteria are met

**When in doubt: inspect again, then stop.**
