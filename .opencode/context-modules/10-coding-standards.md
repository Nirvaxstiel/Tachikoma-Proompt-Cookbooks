---
module_id: coding-standards
name: Coding Standards
version: 4.0.0
description: Concrete coding patterns and practices implementing functional thinking principles. Loaded for all coding tasks.
priority: 10
type: context
depends_on:
  - core-contract
  - functional-thinking
coupled_with: commenting-rules
exports:
  - first_principle
  - naming_conventions
  - code_organization
  - patterns
  - testing_standards
  - cleanup_rules
---

# Coding Standards

> **COUPLED WITH:** `12-commenting-rules.md` — Always load together.
> **FOUNDATION:** `11-functional-thinking.md` — This module provides concrete applications of the principles defined there.

---

## Philosophy to Practice Mapping

This module translates the philosophical principles from `11-functional-thinking.md` into concrete coding patterns:

| Principle                   | Section                | Application                           |
| --------------------------- | ---------------------- | ------------------------------------- |
| Immutable Mindset           | State Management       | Return new data instead of mutating   |
| Pure Reasoning              | Testing Standards      | Testable, isolated functions          |
| Composition Thinking        | Code Organization      | Small, composable pieces              |
| Pipeline Mental Model       | Async Patterns         | Transformations, not steps            |
| Explicit Dependencies       | Design Primitives      | Pass state explicitly                 |
| Totality Principle          | Result Types           | Handle all cases, especially errors   |
| Declarative Intent          | Patterns               | Express "what", not "how"             |
| Honesty Principle           | Null/Optional Handling | Truthful type signatures              |
| Expressions Over Statements | Code Style             | Prefer expressions that return values |
| Avoid Shared State          | State Management       | Local state, explicit passing         |
| Higher-Order Thinking       | Code Style             | Use `map`, `filter`, `reduce`         |
| Minimize Surface Area       | Design Primitives      | Minimal public APIs                   |

---

## First Principle

**Check the existing codebase first.**

Before writing any code:

1. Search for similar patterns in the project
2. Match existing style, naming, and organization
3. Only introduce new patterns if no precedent exists
4. If no precedent, prefer DDD (Domain-Driven Design)

**Violations:**

- Introducing patterns that contradict existing code
- Not searching before implementing
- Ignoring project conventions

---

## Naming Conventions

### Rule: Follow Language Defaults

Use the naming convention native to each language:

| Language              | Variables    | Functions               | Classes      | Constants     |
| --------------------- | ------------ | ----------------------- | ------------ | ------------- |
| Python                | `snake_case` | `snake_case`            | `PascalCase` | `UPPER_SNAKE` |
| JavaScript/TypeScript | `camelCase`  | `camelCase`             | `PascalCase` | `UPPER_SNAKE` |
| Go                    | `camelCase`  | `PascalCase` (exported) | `PascalCase` | `PascalCase`  |
| Rust                  | `snake_case` | `snake_case`            | `PascalCase` | `UPPER_SNAKE` |
| Java                  | `camelCase`  | `camelCase`             | `PascalCase` | `UPPER_SNAKE` |

### Use LSP and Formatters

Let tooling enforce naming. If the project has:

- ESLint, Prettier, Black, Ruff, etc. → Trust them
- Editorconfig → Follow it
- Existing naming in codebase → Match it

### Private Members

| Language   | Convention                                  |
| ---------- | ------------------------------------------- |
| Python     | `_leading_underscore`                       |
| JavaScript | `#private` or `_underscore` (match project) |
| TypeScript | `private` keyword or `#private`             |
| Go         | lowercase (unexported)                      |
| Rust       | no prefix (module privacy)                  |

---

## Code Organization

### Project Structure

**Check existing structure first.** If none:

```
# DDD-style (preferred for new projects)
src/
├── domain/           # Core business logic
│   ├── user/
│   ├── order/
│   └── payment/
├── application/      # Use cases
├── infrastructure/   # External services
└── presentation/     # API/UI
```

### File Organization

- One primary export per file (class, function, module)
- Group related functionality in directories
- Keep files focused on single responsibility

### Import Order

**Use formatter if available.** If not:

```
1. Standard library
2. Third-party packages
3. Local imports (absolute)
4. Local imports (relative)
```

### Line Length

**No hard limit.** But:

- Readability matters
- Break long lines at natural points
- Don't go overboard

---

## Patterns

### Early Returns

**Prefer early returns over nested conditionals:**

```pseudocode
# Good: Early returns
def process(user):
    if not user:
        return None
    if not user.is_active:
        return None
    return do_work(user)

# Bad: Nested conditionals
def process(user):
    if user:
        if user.is_active:
            return do_work(user)
    return None
```

### Result Types vs Exceptions

**Prefer Result types for expected failures, throw for unexpected (Principle: Totality, Honesty)**

**Principle:** Handle all cases, especially errors. Make error cases part of function signature.

```pseudocode
# Good: Result type for expected failure
function parse_config(path) -> Result<Config, ParseError>:
    try:
        return Ok(parse_file(path))
    catch ParseError as e:
        return Err(e)

# Good: Throw for unexpected/critical errors
function connect_db(config):
    if not config.connection_string:
        raise ValueError("Missing connection string")  # Programmer error
    return Database.connect(config)
```

**When to use Result types:**

- Expected failures (file not found, invalid input, network timeout)
- Business logic errors (user not found, insufficient permissions)
- When you want to force the caller to handle errors

**When to throw exceptions:**

- Programmer errors (null where not expected, invalid state)
- Critical failures (out of memory, corrupted data)
- When you want to bubble up and handle at a higher level

### Async Patterns

**Prefer `.then()` chains if language supports it:**

```javascript
// Good: Then chain
fetch(url)
  .then((res) => res.json())
  .then((data) => process(data))
  .catch((err) => handle(err));

// Also acceptable: async/await when needed
async function fetchData() {
  const res = await fetch(url);
  return res.json();
}
```

### State Management

**Immutable first (Principle: Immutable Mindset, Avoid Shared State)**

**Principle:** Create new data structures instead of modifying existing ones. Keep data local to functions that need it.

```pseudocode
# Good: Immutable - returns new list
function add_item(cart, item):
    return cart + [item]

# Bad: Mutable - modifies input
function add_item(cart, item):
    cart.append(item)  # Mutates argument
    return cart
```

**Why immutable?**

- No side effects - caller's data isn't changed
- Easier to reason about - no hidden state changes
- Safer in concurrent environments
- Enables time-travel debugging and undo/redo

### Null/Optional Handling

**Design away nulls when possible (Principle: Honesty)**

**Principle:** Interfaces shouldn't lie. If a value might be absent, encode that in the type.

```pseudocode
# Good: No null possible - explicit alternative
function find_user(id) -> User | NotFound:
    user = db.get(id)
    if user:
        return user
    return NotFound()

# Acceptable: Optional when null is unavoidable
function find_user(id) -> User | None:
    return db.get(id)

# Bad: Null without type indication
function find_user(id):  # Could return None, User, or raise?
    return db.get(id)
```

**Strategies:**

- **Option/Maybe types:** Encode absence in the type system
- **Union types:** Use `User | NotFound` instead of `User | null`
- **Default values:** Return sensible defaults instead of null
- **Early returns:** Handle null cases early, don't propagate

---

## Comments

### Rule: Only for Non-Obvious

**Comments explain WHY, never WHAT.**

```pseudocode
# Good: Explains why
# Using exponential backoff to avoid thundering herd
def retry_with_backoff(fn, max_retries=3):
    ...

# Bad: Explains what (code already shows this)
# This function retries with backoff
def retry_with_backoff(fn, max_retries=3):
    ...
```

### Comment Smell

**If you need a comment, consider refactoring:**

```pseudocode
# Bad: Comment explains confusing code
# Check if user is admin or moderator
if user.role in [1, 2, 3]:
    ...

# Good: Code is self-explanatory
if user.is_admin or user.is_moderator:
    ...
```

### JSDoc/TSDoc

**Language dependent.** Use when:

- Public API documentation is needed
- IDE support benefits from it
- Project already uses it

Don't use when:

- Internal implementation
- Self-explanatory functions
- No documentation requirement

### TODOs

**Check with user before leaving TODOs.**

TODOs are acceptable:

- During active development
- When blocked on missing information
- As temporary markers

TODOs must include:

- What needs to be done
- Why it's not done yet
- Who/when will resolve

---

## Testing Standards

### Style: AAA (Arrange-Act-Assert)

```pseudocode
def test_user_creation():
    # Arrange
    user_data = {"name": "Alice"}

    # Act
    user = create_user(user_data)

    # Assert
    assert user.name == "Alice"
```

### What to Test

**Prefer black-box functional tests:**

```pseudocode
# Good: Tests behavior, multiple paths
@pytest.mark.parametrize("input,expected", [
    ({"name": "Alice"}, User(name="Alice")),
    ({}, ValidationError),
    ({"name": ""}, ValidationError),
])
def test_create_user(input, expected):
    result = create_user(input)
    assert result == expected

# Less preferred: Tests implementation details
def test_create_user_calls_validator():
    mock_validator = Mock()
    create_user({"name": "Alice"}, validator=mock_validator)
    mock_validator.validate.assert_called_once()
```

### Test Location

**Separate `tests/` directory:**

```
project/
├── src/
│   └── user.py
└── tests/
    ├── test_user.py
    └── test_user_integration.py
```

---

## Cleanup Rules

### Before Committing

**Always clean up:**

| Issue               | Action                          |
| ------------------- | ------------------------------- |
| Trailing whitespace | Run formatter (should auto-fix) |
| Unused imports      | Remove                          |
| Inconsistent naming | Fix or suggest better naming    |
| Debug prints        | Remove                          |
| Commented code      | Remove                          |

### Naming Inconsistencies

When found:

1. Check if there's a pattern in the codebase
2. If yes, match it
3. If no, suggest a consistent naming scheme
4. Apply consistently across the change

---

## Design Primitives

### 1. Locality of Concern

Place code near what directly uses it.

```pseudocode
# Good
def process(user):
    validator = Validator()  # Created where used
    if validator.is_valid(user):
        save(user)

# Bad
def process(user, validator):  # Why pass through?
    if validator.is_valid(user):
        save(user)
```

### 2. Surface Area as Signal

Remove unused connections.

```pseudocode
# Bad: High surface area
class Manager:
    def __init__(self, db, cache, logger, metrics, config):
        # Only uses db and cache
        ...

# Good: Minimal surface
class Manager:
    def __init__(self, db, cache):
        ...
```

### 3. Minimize Transitive Knowledge

Components shouldn't know about things they don't directly use.

---

## Validation Before Writing

1. Inventory existing symbols and types
2. Confirm they exist (search if unsure)
3. Validate relevant invariants
4. Plan edits explicitly

**Never invent types, interfaces, or patterns silently.**

---

## Stop Conditions

Stop when:

- Requirement is satisfied
- Existing patterns preserved
- No further edits improve correctness

If blocked: Ask explicitly.

---

## Violations

- Not checking existing codebase first
- Introducing patterns that contradict project style
- Leaving cleanup items (unused imports, trailing whitespace)
- Writing comments that explain WHAT
- Not cleaning up before commit
- Inventing types without searching

---

## Connection to Functional Thinking

This module implements the principles from `11-functional-thinking.md`:

| Practice             | Principle             | Benefit                  |
| -------------------- | --------------------- | ------------------------ |
| Immutable state      | Immutable Mindset     | No hidden side effects   |
| Early returns        | Composition Thinking  | Clearer control flow     |
| Result types         | Totality Principle    | Forced error handling    |
| Pure functions       | Pure Reasoning        | Predictable, testable    |
| Pipeline transforms  | Pipeline Mental Model | Declarative data flow    |
| Dependency injection | Explicit Dependencies | Transparent requirements |
| Null-free types      | Honesty Principle     | Truthful interfaces      |
| Small functions      | Composition Thinking  | Reusable, focused        |

**For deeper understanding:** See `11-functional-thinking.md` for the philosophical foundation behind these patterns.

---

**Version:** 4.0.0
**Updated:** 2026-02-21
**Priority:** 10
**Dependencies:** core-contract, functional-thinking
**Coupled With:** commenting-rules
