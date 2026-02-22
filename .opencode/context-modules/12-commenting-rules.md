---
module_id: commenting-rules
name: Commenting Culture & Rules
version: 3.0.0
description: Minimal commenting philosophy - presumption of silence. Default to NO comments.
priority: 12
type: context
depends_on:
  - core-contract
  - coding-standards
  - functional-thinking
  coupled_with: coding-standards  # MUST co-load with coding-standards
exports:
  - presumption_of_silence
  - prohibited_patterns
  - required_patterns
  - comment_test_questions
  - typescript_specific_rules
  - violation_response
---

# Commenting Culture & Rules

> **COUPLING RULE:** This module is **inseparable** from `10-coding-standards.md`.
> When coding-standards loads, commenting-rules **MUST** also load.
> They form a unified pair for all code-related tasks.
>
> **FOUNDATION:** `11-functional-thinking.md` — Minimal comments align with honesty principle and explicit intent.

## Core Philosophy

**Presumption of Silence: Default to NO comments.**

**Code explains "what"; comments explain "why"** - but **only** when "why" is not obvious.

> **Strict Rule:** Before adding any comment, you must prove it's necessary.
> If you cannot prove necessity, **do not add it.**

Comments are:
- **Technical debt** - every comment needs maintenance
- **Often wrong** - comments drift from code
- **Redundant** - good code explains itself

**The default answer is NO.** Add a comment only when:
1. Code **cannot** be made self-explanatory through naming/structure
2. The "why" is **not obvious** from context
3. Failing to explain would cause **harm** (security bugs, incorrect usage)

**If in doubt: DON'T COMMENT.**

---

## Prohibited Patterns (NEVER DO THESE)

### ❌ Loop Explanations
```pseudocode
# BAD: Explains what loop does (obvious from code)
# Loop through users
for user in users:
    process(user)

# GOOD: Just code
for user in users:
    process(user)
```

### ❌ Type/Function Explanations
```pseudocode
# BAD: Repeats what the code shows
# Parse timestamp
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
# Validates user input
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

### ❌ Explanatory Variable Comments
```pseudocode
# BAD: Explains what variable is (name should tell you)
const userId = data.id  // User ID
const isValid = check()  // Whether valid

# GOOD: Names are self-explanatory
const userId = data.id
const isValid = check()
```

### ❌ Standard Library Explanations
```pseudocode
# BAD: Documents standard behavior
// JSON.stringify converts object to string
const json = JSON.stringify(obj)

// Add 5 seconds delay
await sleep(5000)

# GOOD: Standard library is well-documented elsewhere
const json = JSON.stringify(obj)
await sleep(5000)
```

### ❌ Conditional Logic Explanations
```pseudocode
# BAD: Explains what condition does
# If user is logged in
if user.is_authenticated:
    show_dashboard()

# Check if error
if error:
    log(error)

# GOOD: Code is clear
if user.is_authenticated:
    show_dashboard()

if error:
    log(error)
```

### ❌ Return Statement Explanations
```pseudocode
# BAD: Explains return value
# Return success status
return True

# Return the filtered list
return filtered_items

# GOOD: Return is obvious
return True
return filtered_items
```

### ❌ Parameter Explanations
```pseudocode
# BAD: Explains parameters (names should tell you)
def process_data(data, options):
    # data: the data to process
    # options: processing options
    pass

# GOOD: Names are clear
def process_data(data, options):
    pass
```

### ❌ Section Separators
```pseudocode
# BAD: Visual noise
// ===== Initialization =====
// ===== Processing =====
// ===== Cleanup =====

# GOOD: Functions/files provide separation
function initialize() { }
function process() { }
function cleanup() { }
```

### ❌ Author/Date/Change Comments
```pseudocode
# BAD: Git tracks this
# Author: John Doe
# Date: 2024-01-15
# Changed: Added feature X

# GOOD: Use git history and commit messages
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

## Required Patterns (ONLY DO THESE WHEN UNAVOIDABLE)

> **Remember:** The presumption is NO comments. These are exceptions, not rules.

### ✅ License/Copyright Headers
**Only** if required by project policy or legal requirements.

### ✅ Public API Documentation
**Only** for non-trivial public interfaces that consumers will use directly.

**NOT needed for:**
- Simple getters/setters
- Obvious wrapper functions
- Internal helpers (not exported)

**Needed when:**
- API has complex parameters/return values
- Behavior is counterintuitive
- Breaking changes need warning

```pseudocode
# BAD: Over-documenting obvious API
def get_user(user_id):
    """Get the user by ID.

    Args:
        user_id: The ID of the user to get.

    Returns:
        The user object.
    """
    return db.get(user_id)

# GOOD: Document only non-obvious aspects
def calculate_discount(base_price, user_tier):
    """
    Calculate user discount with tiered pricing.

    ⚠️ WARNING: Discounts are cumulative - apply after validation.

    Tier 1-2: No discount
    Tier 3: 10% (first $500 only, rest 5%)
    Tier 4: 15% (capped at $1000)

    Returns discount amount, not final price.
    """
    # ... implementation
```

### ✅ Business Rule Explanations
**Only** when business logic is **truly non-obvious** and **cannot** be named better.

**NOT needed for:**
- Obvious validation rules (e.g., "must be positive")
- Standard business practices

**Needed when:**
- Arbitrary constants with regulatory/legal backing
- Unexpected behavior that surprises users
- Domain-specific constraints not obvious to outsiders

```pseudocode
# BAD: Explains obvious validation
# Price must be positive
if price <= 0:
    raise ValueError("Invalid price")

# GOOD: Non-obvious constraint with justification
# Per EU regulation 2019/1234: discount cannot exceed 50%
# This is a hard legal requirement, not a business decision
discount = min(calculated_discount, 0.50)
```

### ✅ Non-Obvious Algorithm Explanations
**Only** for algorithms with **non-standard** implementations or **known pitfalls**.

**NOT needed for:**
- Standard algorithms (sort, hash, tree traversal)
- Well-known patterns (singleton, factory)
- Simple math/logic

**Needed when:**
- Algorithm is non-obvious from code
- There's a subtle bug/trap you're avoiding
- Performance characteristics are unusual

```pseudocode
# BAD: Explaining standard algorithm
# Use bubble sort
for i in range(n):
    for j in range(0, n-i-1):
        if arr[j] > arr[j+1]:
            swap(arr[j], arr[j+1])

# GOOD: Explaining non-standard approach with justification
# Fisher-Yates shuffle ensures O(n) uniform distribution
# ⚠️ DO NOT use naive random swap - it's biased!
# ⚠️ Iterate backwards to avoid self-swapping
for i in range(len(items) - 1, 0, -1):
    j = random.randint(0, i)
    items[i], items[j] = items[j], items[i]
```

### ✅ References to Specs/Tickets
**Only** when external context is **essential** to understand the code.

**NOT needed for:**
- Standard RFCs (assumed knowledge)
- Well-known protocols (HTTP, JSON, etc.)

**Needed when:**
- Non-standard implementation
- Specific clause/section being referenced
- Edge case handling that spec clarifies

```pseudocode
# BAD: Referencing standard spec
# Per RFC 3986, encode URL
encoded = urllib.parse.quote(url)

# GOOD: Referencing specific non-standard clause
# Per ISO 8601 section 4.4.2: timezone offset required for local times
# See: https://www.iso.org/standard/70907.html
if not timestamp.endswith(('Z', '+00:00')):
    raise ValueError("Local times must include timezone offset")
```

### ✅ Performance/Safety Critical Warnings
**Only** when mistake causes **actual harm** (data loss, security vuln, perf regression).

**NOT needed for:**
- General performance tips
- "Be careful" warnings
- Obvious safety checks

**Needed when:**
- Anti-pattern that looks correct but isn't
- Async/concurrency trap
- Resource leak risk

```pseudocode
# BAD: Generic warning
# Be careful with this function
async function process(items) { }

# GOOD: Specific safety-critical warning
# ⚠️ SECURITY: Do NOT use string concatenation for SQL
# ⚠️ Parameterized queries prevent SQL injection
async function get_user(id: string): Promise<User> {
    return db.query('SELECT * FROM users WHERE id = ?', [id])
}

# ⚠️ PERFORMANCE: O(n²) for large datasets
# ⚠️ Only use for < 1000 items
async function dedupe_slow(items: Item[]): Promise<Item[]> {
    return items.filter((a, i) => !items.slice(0, i).some(b => b.id === a.id))
}
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

**Before adding a comment, answer ALL these questions:**

### Question 1: Can I make code self-explanatory?

**You MUST try:**
1. Rename variables/functions to be clearer
2. Extract complex logic into named functions
3. Simplify expressions with intermediate variables
4. Use built-in methods instead of manual implementation

**Only after exhausting these, consider a comment.**

```
Bad:  process_data(data)  # Process user data
Good: process_user_data(user_data)

Bad:  if x > 0 and x < 100:  # Valid range
Good: const is_valid_range = (x > 0 && x < 100)
      if is_valid_range:
```

### Question 2: Would removing the comment make the code wrong?

**If the answer is NO → Delete the comment.**

- Does the comment add behavior? NO → Delete
- Does the comment enforce a constraint? NO → Delete
- Does the comment prevent bugs? NO → Delete
- Does the comment explain how? NO → Delete

### Question 3: Will this comment be wrong in 6 months?

**If YES → Don't add it.**

Comments rot. Code changes. Comments don't.

If you're documenting something that might change:
- Make it a test instead
- Make it an invariant check
- Make it a type constraint
- Don't use a comment

### Question 4: Is there a better way?

**Instead of:**
```
// This is a workaround for the cache bug
// TODO: Remove when fixed
if (use_cache && has_bug):
    skip_cache()
```

**Do this:**
```pseudocode
// Prefer explicit handling over explanatory comments
interface CacheOptions {
  readonly enableCache: boolean;
  readonly disableIfHasBug: boolean;
}
```

### Question 5: Who is this for?

**If it's for you → Don't add it.**
- If you need a reminder, it's the wrong place
- Use git notes, personal scratchpad, or refactor

**If it's for others → Make it testable.**
- Can this be a test?
- Can this be a type?
- Can this be a named function?

**If you cannot make it testable → Still NO comment.**

---

## Hard Rules

1. **Default: NO** - Start from "no comment," not "add comment"
2. **Burden of proof** - You must prove the comment is necessary
3. **When in doubt → DON'T** - Missing a comment is better than a bad comment
4. **If you hesitate → DELETE** - Your hesitation means it's not essential

---

## The "Code Should Read Like Prose" Anti-Pattern

**Bad idea:** "Add comments so code reads like prose"

**Reality:**
- English is ambiguous
- Code is precise
- Mixing them makes both worse

**Better:** Make code precise, add minimal comments for non-obvious context

```pseudocode
# BAD: Trying to make code "readable" with prose
# First, we get the user from the database
user = db.get_user(user_id)
# Then, if the user exists and is active
if user and user.is_active:
    # We send them a welcome email
    send_email(user.email, "Welcome")

# GOOD: Code is precise, comment is minimal
user = db.get_user(user_id)
if user?.is_active:
    send_email(user.email, "Welcome")  # Welcome email only for active users
```

---

## Comment Placement Rules

### Where to Comment

**Good placement:**
- Before complex algorithms (explain approach)
- Before business logic (explain rule)
- After unusual decisions (explain "why")
- At module/file level (explain purpose)

**Bad placement:**
- Inline with every line
- After self-evident code
- Explaining standard library usage
- Restating variable names

---

## TypeScript/Type-Specific Rules

### ✅ Types are Comments

**TypeScript types ARE documentation. Don't duplicate them.**

```pseudocode
// BAD: Type comment + type annotation
const userId: string  // User ID
const isValid: boolean  // Whether valid

// BAD: Interface comment repeats types
interface User {
  // User ID field
  id: string
  // User's email address
  email: string
}

// GOOD: Types explain everything
const userId: string
const isValid: boolean

interface User {
  id: string
  email: string
}
```

### ✅ JSDoc is Overkill

**Only use JSDoc for public APIs that need documentation generation.**

**NOT for:**
- Internal functions
- Obvious parameters
- Simple return types

```pseudocode
// BAD: JSDoc for obvious internal function
/**
 * Adds two numbers together.
 * @param a The first number
 * @param b The second number
 * @returns The sum of a and b
 */
function add(a: number, b: number): number {
  return a + b
}

// GOOD: Types explain everything
function add(a: number, b: number): number {
  return a + b
}

// OK: JSDoc only for non-obvious behavior
/**
 * Parses duration string like "1h 30m" into milliseconds.
 *
 * @example "1h 30m" → 5400000
 * @throws {Error} If format is invalid or components missing
 */
function parseDuration(duration: string): number {
  // ...
}
```

### ✅ Type Guards are Better Than Comments

**Instead of commenting type assumptions, use type guards.**

```pseudocode
// BAD: Commenting type assumption
function process(item: unknown) {
  // Assume this is a User object
  if (item.id && item.email) {
    console.log(item.name)  // Property access may be unsafe
  }
}

// GOOD: Type guard ensures safety
function isUser(item: unknown): item is User {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'email' in item &&
    'name' in item
  )
}

function process(item: unknown) {
  if (isUser(item)) {
    console.log(item.name)  // Safe! TypeScript knows this is User
  }
}
```

### ✅ Enums/Constants Should Be Self-Documenting

**Don't comment enums. Names should explain themselves.**

```pseudocode
// BAD: Commenting enum values
enum UserStatus {
  ACTIVE = 'active',  // User is active
  INACTIVE = 'inactive',  // User is inactive
  SUSPENDED = 'suspended',  // User is suspended
}

// GOOD: Names are clear
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}
```

### ✅ Discriminated Unions Explain Themselves

**Don't comment discriminators. The pattern is the documentation.**

```pseudocode
// BAD: Commenting discriminator
type Result<T, E> =
  | { success: true; value: T }  // Success case
  | { success: false; error: E }  // Error case

// GOOD: Pattern is self-explanatory
type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E }

function handle<T, E>(result: Result<T, E>) {
  if (result.success) {
    // TypeScript knows this is { success: true; value: T }
    console.log(result.value)
  } else {
    // TypeScript knows this is { success: false; error: E }
    console.error(result.error)
  }
}
```

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

### Example 3: TypeScript Conversion

```pseudocode
// BAD: Over-commenting after Python → TypeScript conversion
/**
 * Creates a new user object.
 * @param name The user's name
 * @param email The user's email
 * @returns A user object
 */
function createUser(name: string, email: string): User {
  // Create user object with provided values
  const user: User = {
    // Set name property
    name: name,
    // Set email property
    email: email,
    // User is active by default
    isActive: true
  }
  // Return the user
  return user
}

// GOOD: Types explain everything
function createUser(name: string, email: string): User {
  return {
    name,
    email,
    isActive: true
  }
}
```

### Example 4: Complex Logic

```pseudocode
// BAD: Explaining the obvious
async function processPayment(userId: string, amount: number) {
  // Get the user from database
  const user = await db.getUser(userId)

  // Check if user has enough balance
  if (user.balance >= amount) {
    // Deduct the amount
    user.balance -= amount
    // Save the user
    await user.save()

    // Create transaction record
    const transaction = {
      userId,
      amount,
      type: 'payment',
      timestamp: Date.now()
    }
    // Save transaction
    await db.createTransaction(transaction)

    // Return success
    return { success: true }
  } else {
    // Return insufficient funds
    return { success: false, error: 'insufficient_funds' }
  }
}

// GOOD: Only comment what's non-obvious
async function processPayment(userId: string, amount: number): Promise<PaymentResult> {
  const user = await db.getUser(userId)

  if (user.balance >= amount) {
    user.balance -= amount
    await user.save()

    await db.createTransaction({
      userId,
      amount,
      type: 'payment',
      timestamp: Date.now()
    })

    return { success: true }
  }

  return {
    success: false,
    error: 'insufficient_funds',
    currentBalance: user.balance  // Include current balance for UI
  }
}
```

### Example 5: Algorithm with Subtle Bug

```pseudocode
// BAD: No explanation of anti-pattern
function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = 0; i < result.length; i++) {
    const j = Math.floor(Math.random() * result.length)
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

// GOOD: Explains the bug and correct approach
// ⚠️ CRITICAL: Naive swap is NOT uniformly distributed!
// Items at earlier positions get swapped more often.
// Use Fisher-Yates for O(n) unbiased shuffle.
function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  // Iterate backwards to avoid self-swapping
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
```

---

## Violation Response

**If user says:**
- "Remember minimal comments"
- "Don't over-comment"
- "Check directives about commenting"
- "Don't yap"
- "Too many comments"
- "Why are there comments here?"
- "This doesn't need comments"

**You must:**
1. **STOP immediately** - Do not continue generating code
2. **Re-read this module** (use Read tool on this exact file)
3. **Acknowledge the violation**: "I violated the minimal comment rules. Re-reading and applying stricter rules."
4. **Review your previous response** and identify ALL violations
5. **Remove every single comment** that fails the Comment Test
6. **Refactor code** to be self-explanatory (rename, extract, simplify)
7. **Re-generate** the code with ZERO unnecessary comments

**Remember:** The user reminding you is a **failure**. You violated the contract. Fix it immediately.

---

## Module Contract

This module enforces **minimal, high-value commenting**.

**The Default is NO COMMENTS.**

**Violations include:**
- Adding comments that explain obvious code
- Adding comments that duplicate type information
- Including TODO/FIXME in committed code
- Leaving commented-out code
- Not refactoring when a comment could be eliminated
- Using JSDoc for internal/obvious functions
- Adding section separator comments
- Adding author/date/change history comments

**When reminded about commenting:**
> Re-read this module immediately and apply STRICT enforcement.
> Delete all unnecessary comments. Refactor to be self-explanatory.

**The presumption of silence means:**
- If you're unsure whether to comment → DON'T
- If a comment feels optional → DELETE IT
- If you can make code clearer → DO THAT INSTEAD

---

**Version:** 3.0.0
**Updated:** 2026-02-22
**Priority:** 12 (tightly coupled with coding-standards)
**Status:** Active
**Change Log:**
- 3.0.0: Added "Presumption of Silence", TypeScript-specific rules, stricter enforcement
- 2.2.0: Initial version
