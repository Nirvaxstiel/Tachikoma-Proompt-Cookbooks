---
module_id: commenting-rules
name: Commenting Culture & Rules
version: 2.2.0
description: Minimal commenting philosophy - code explains what, comments explain why. Strict enforcement.
priority: 12
type: context
depends_on:
  - core-contract
  - coding-standards
  - functional-thinking
coupled_with: coding-standards  # MUST co-load with coding-standards
exports:
  - comment_philosophy
  - prohibited_patterns
  - required_patterns
  - comment_placement_rules
  - the_comment_test
  - violation_response
---

# Commenting Culture & Rules

> **COUPLING RULE:** This module is **inseparable** from `10-coding-standards.md`.
> When coding-standards loads, commenting-rules **MUST** also load.
> They form a unified pair for all code-related tasks.
>
> **FOUNDATION:** `11-functional-thinking.md` — Minimal comments align with honesty principle and explicit intent.

## Core Philosophy

**Code explains "what"; comments explain "why"**

This is non-negotiable. Comments are expensive to maintain and often lie. Use them sparingly and strategically.

---

## Prohibited Patterns (NEVER DO THESE)

### ❌ Loop Explanations
```pseudocode
# BAD: Explains what the loop does (obvious from code)
# Loop through users
for user in users:
    process(user)

# GOOD: Just the code
for user in users:
    process(user)
```

### ❌ Type/Function Explanations
```pseudocode
# BAD: Repeats what the code shows
# Parse the timestamp
parse(unix_timestamp)

# Get user by ID
def get_user(user_id):
    return db.get(user_id)

# GOOD: No comment needed - names are clear
parse(unix_timestamp)

def get_user(user_id):
    return db.get(user_id)
```

### ❌ Function Summaries That Repeat the Name
```pseudocode
# BAD: Summary repeats function name
# Validates the user input
def validate_user_input(input):
    # ...
    
# GOOD: No comment, or explain WHY
# Validation required for legacy API compatibility
def validate_user_input(input):
    # ...
```

### ❌ TODO Comments in Committed Code
```pseudocode
# BAD: TODO in production code
# TODO: Fix this later
# FIXME: Handle edge case

# GOOD: Either fix it now or create an issue
# If it needs fixing, it's not ready for commit
```

### ❌ Commented-Out Code
```pseudocode
# BAD: Dead code in comments
# def old_function():
#     pass
#
# old_function()

# GOOD: Delete it - git has history
```

### ❌ Redundant Explanations
```pseudocode
# BAD: States the obvious
# Increment counter
counter += 1

# Check if valid
if is_valid(data):
    process(data)

# GOOD: Just the code
counter += 1

if is_valid(data):
    process(data)
```

---

## Required Patterns (ALWAYS DO THESE)

### ✅ License/Copyright Headers
If required by project policy or legal requirements.

### ✅ Public API Documentation
Document public interfaces for consumers:
```pseudocode
def calculate_interest(principal, rate, time):
    """
    Calculate compound interest.
    
    Args:
        principal: Initial amount (must be positive)
        rate: Annual rate as decimal (e.g., 0.05 for 5%)
        time: Duration in years
        
    Returns:
        Final amount after compounding
        
    Raises:
        ValueError: If principal is negative
    """
    if principal < 0:
        raise ValueError("Principal must be positive")
    return principal * (1 + rate) ** time
```

### ✅ Business Rule Explanations
When code implements non-obvious business logic:
```pseudocode
# Discount capped at 50% per EU regulation 2019/1234
discount = min(calculated_discount, 0.50)
```

### ✅ Non-Obvious Algorithm Explanations
When the implementation has subtleties:
```pseudocode
# Fisher-Yates shuffle ensures uniform distribution
# DO NOT use naive random swap - it's biased
for i in range(len(items) - 1, 0, -1):
    j = random.randint(0, i)
    items[i], items[j] = items[j], items[i]
```

### ✅ References to Specs/Tickets
Link to external context:
```pseudocode
# Per RFC 3986, reserved characters must be percent-encoded
# See: https://tools.ietf.org/html/rfc3986#section-2.2
encoded = urllib.parse.quote(url)
```

---

## The Comment Test

**Before adding a comment, ask yourself:**

1. **Can I rename this to make it self-explanatory?**
   - Bad: `process_data(data)  # Process the user data`
   - Good: `process_user_data(user_data)`

2. **Can I restructure the logic to be clearer?**
   - Extract functions
   - Use better variable names
   - Simplify expressions

3. **Is this explaining something non-obvious?**
   - Business rule?
   - Algorithm subtlety?
   - External reference?
   - **Yes → Add comment**
   - **No → Refactor instead**

**Golden Rule:**
> Try renaming or restructuring the logic to make the comment unnecessary.

---

## Comment Placement Rules

### Where to Comment

**Good placement:**
- Before complex algorithms (explain the approach)
- Before business logic (explain the rule)
- After unusual decisions (explain the "why")
- At module/file level (explain the purpose)

**Bad placement:**
- Inline with every line
- After self-evident code
- Explaining standard library usage
- Restating variable names

---

## Examples: Good vs Bad

### Example 1: Processing Loop

```pseudocode
# BAD: Excessive commenting
# Loop through users
for user in users:
    # Check if active
    if user.is_active:
        # Process payment
        process_payment(user)
        # Update status
        user.status = "processed"
        # Save to database
        user.save()

# GOOD: Minimal, meaningful comments
for user in users:
    if user.is_active:
        process_payment(user)  # Async queue - don't await
        user.mark_processed()  # Updates cache and DB
```

### Example 2: API Client

```pseudocode
# BAD: Comments state the obvious
class ApiClient:
    def __init__(self, base_url):
        self.base_url = base_url  # Store base URL
    
    def get(self, endpoint):
        # Make GET request
        return requests.get(self.base_url + endpoint)

# GOOD: Comments explain non-obvious details
class ApiClient:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')  # Normalize to no trailing slash
    
    def get(self, endpoint):
        # 3 retry attempts with exponential backoff (per API SLA)
        return self._request_with_retry('GET', endpoint)
```

---

## Violation Response

**If user says:**
- "Remember minimal comments"
- "Don't over-comment"
- "Check directives about commenting"
- "Don't yap"

**You must:**
1. **Re-read this module immediately** (use read tool)
2. **Confirm understanding:** "Applying minimal comment rules"
3. **Review your previous response** for violations
4. **Remove or refactor** any prohibited comments
5. **Apply strictest interpretation** going forward

**Remember:** The user reminding you is a signal that you violated this contract. Take it seriously.

---

## Module Contract

This module enforces minimal, high-value commenting.

**Violations include:**
- Adding comments that explain obvious code
- Including TODO/FIXME in committed code
- Leaving commented-out code
- Not refactoring when a comment could be eliminated

**When reminded about commenting:**
> Re-read this module immediately and apply strict enforcement.

---

**Version:** 2.1.0
**Updated:** 2026-02-16
**Priority:** 12 (tightly coupled with coding-standards)
**Status:** Active
