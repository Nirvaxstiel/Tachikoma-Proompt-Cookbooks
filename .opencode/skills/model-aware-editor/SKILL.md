---
name: model-aware-editor
description: Model-specific edit format optimization. Selects optimal edit format per model to maximize success rates.
mode: skill
temperature: 0
permission:
  edit: allow
  read: allow
tools:
  read: true
  write: true
  edit: true
---

# Model-Aware Editor

> **Key Research**: "The Harness Problem" (Can.ac, Feb 2026) - Edit format can improve LLM coding success by up to **10x**
> **Notation**: `@skill-name` means "invoke that skill and wait for completion" - for skill chaining

## Core Concept

Different models work best with different edit formats. This skill selects the optimal format based on the detected model:

| Model Family | Best Format |
|-------------|-------------|
| Claude | `str_replace` (exact) |
| Gemini | `str_replace` + fuzzy whitespace |
| GPT | `apply_patch` (OpenAI diff) |
| Grok | `hashline` (content-based) |
| Others | Fallback + retry |

**Key Insight**: The "harness" (edit format) is often the bottleneck, not the model itself. A better edit format can outperform model upgrades.

## When to Use

This is a meta-skill that wraps edit operations. Use it when:
- Working with multiple model providers
- Experiencing high edit failure rates
- Need maximum reliability for critical changes

## Edit Format Reference

### Format 1: str_replace (Default)

```
Old string:
```
function hello() {
  return "world";
}
```

New string:
```
function hello() {
  return "Hello, World!";
}
```

**Best for**: Claude, Gemini (with fuzzy whitespace)

### Format 2: apply_patch (OpenAI-style)

```
<<<<<<<
function hello() {
  return "world";
}
=======
function hello() {
  return "Hello, World!";
}
>>>>>>>

**Best for**: GPT models, Codex

### Format 3: hashline (Content-based)

When reading files, lines are tagged with content hashes:
```
11:a3|function hello() {
22:f1|  return "world";
33:0e|}
```

Edits reference these hashes:
```
replace "2:f1" with "  return "Hello, World!";"
```

**Best for**: Models struggling with exact matches (Grok, smaller models)

## Workflow

### Step 1: Detect Model

Automatically detect from API context:
- Look for model identifier in request
- Check configuration for explicit model setting
- Default to `str_replace` if unknown

### Step 2: Select Format

```
IF model contains "claude" → str_replace (exact)
ELSE IF model contains "gemini" → str_replace + fuzzy
ELSE IF model contains "gpt" OR "openai" → apply_patch
ELSE IF model contains "grok" → hashline (if available) else str_replace
ELSE → str_replace with retry
```

### Step 3: Execute Edit

Attempt with selected format first.

### Step 4: Retry with Fallback

If edit fails:
1. Capture exact error
2. Try alternative format:
   - If using `str_replace`: try `apply_patch`
   - If using `apply_patch`: try `str_replace`
   - If all fail: try `hashline` format
3. Log which format succeeded for learning

### Step 5: Report

Include format used in completion report:
```
Edit format used: str_replace (fallback to apply_patch)
Total attempts: 2
```

## Implementation Details

### For Claude Models

Claude is already optimized for `str_replace`. Use exact match:
- Match whitespace exactly
- If fail: try with normalized whitespace
- If still fail: split into smaller edits

### For Gemini Models

Gemini has good whitespace handling but not perfect:
- Use `str_replace` with fuzzy whitespace matching
- Normalize whitespace in both old and new strings
- If fail: try exact match as fallback

### For GPT Models

GPT works best with OpenAI-style diffs:
- Use `apply_patch` format with `<<<<<<`, `=======`, `>>>>>>>`
- Include full context lines around changes
- If fail: try `str_replace`

### For Grok/xAI Models

Grok struggles with traditional formats:
- Prefer `hashline` format if available
- If not: use `str_replace` with very small, targeted edits
- Consider retry loops for larger changes

## Fallback Strategy

When primary format fails:

```
Primary failed: {error}

Trying format: {alternative_format}
- {explanation}

Result: SUCCESS/FAILED
```

## Integration

This skill can be invoked by other skills:
- @verifier-code-agent: Uses this for reliable edits
- @formatter: Uses this for format consistency
- @code-agent: Can delegate to this for complex edits

## Example

**Scenario**: Edit authentication function across multiple models

**With Claude**:
```
Using: str_replace (exact)
Edit: function authenticate(user) { ... }
Success: First attempt
```

**With Gemini**:
```
Using: str_replace + fuzzy whitespace
Edit: function authenticate(user) { ... }
Success: First attempt (with normalization)
```

**With GPT**:
```
Using: apply_patch
<<<<<<<
function authenticate(user) {
  return validate(user);
}
=======
function authenticate(user, context) {
  return validate(user, context);
}
>>>>>>>
Success: First attempt
```

**With Grok**:
```
Using: hashline
Read: file returns "22:a3|function authenticate(user) {"
Edit: replace "22:a3" with "function authenticate(user, context) {"
Success: After retry with hashline
```

---

**Note**: This skill is about harness optimization. The actual edit logic is the same - we're optimizing how we communicate edits to different models.
