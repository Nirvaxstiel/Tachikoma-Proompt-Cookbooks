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

### Format 3: hashline (Content-based) ⭐ NEW IMPLEMENTATION

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

**Implementation**: `.opencode/tools/hashline-processor.py`
- Class: `HashlineProcessor`
- Methods: `read_file_with_hashlines()`, `apply_hashline_edit()`, `find_hash_line()`

**CLI Usage**:
```bash
# Read file with hashlines
python3 .opencode/tools/hashline-processor.py read /path/to/file.py

# Find line by content
python3 .opencode/tools/hashline-processor.py find /path/to/file.py "return"

# Edit using hashline
python3 .opencode/tools/hashline-processor.py edit /path/to/file.py "2:f1" "new content"

# Verify integrity
python3 .opencode/tools/hashline-processor.py verify /path/to/file.py
```

**Python Usage**:
```python
from .opencode.tools.hashline-processor import HashlineProcessor

processor = HashlineProcessor()

# Read with hashlines
hashlines = processor.read_file_with_hashlines('file.py')

# Find hash by content
hash_ref = processor.find_hash_line('file.py', 'return "world"')
# Returns: "22:f1|"

# Edit using hash
processor.apply_hashline_edit('file.py', '22:f1', 'return "Hello, World!"')
```

**Impact**: +8-61% edit success rate, -20-61% output tokens
- Grok: 6.7% → 68.3% (10x improvement)
- GLM: 46-50% → 54-64% (+8-14%)
- Claude/GPT: Already high, minor improvements

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
ELSE IF model contains "grok" → hashline (PRIORITY: weak models benefit most)
ELSE IF model contains "glm" → hashline (PRIORITY: +8-14% improvement)
ELSE → hashline if available, else str_replace with retry
```

**Priority Order** (for weak models):
1. Hashline (content-based) - Best for Grok, GLM, smaller models
2. str_replace - Good for Claude, Gemini
3. apply_patch - Good for GPT, OpenAI

### Step 3: Execute Edit

Attempt with selected format first.

### Step 4: Retry with Fallback

If edit fails:
1. Capture exact error
2. Try alternative format:
    - If using `hashline`: try `str_replace`
    - If using `str_replace`: try `apply_patch`
    - If using `apply_patch`: try `str_replace`
    - If all fail: try next format in chain
3. Log which format succeeded for learning

**Fallback Chain** (by model):
- Grok: hashline → str_replace → apply_patch
- GLM: hashline → str_replace → apply_patch
- Claude: str_replace → hashline → apply_patch
- Gemini: str_replace_fuzzy → str_replace → hashline → apply_patch
- GPT: apply_patch → str_replace → hashline
- Unknown: hashline → str_replace → apply_patch

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

### Edit Format Auto-Selection Integration ⭐ NEW

The edit format selector is now available for intelligent format selection:

```python
from .opencode.core.edit-format-selector import EditFormatSelector, get_edit_selector

# Get selector instance (with optional telemetry callback)
selector = get_edit_selector()

# Auto-detect model
model = selector.detect_model()
# Returns: 'glm-4.7', 'claude-opus-4', etc.

# Select optimal format
format_type, confidence, reason = selector.select_format(model)
# Returns: (EditFormat.HASHLINE, 0.85, "Model 'glm-4.7' contains 'glm' -> hashline")

# Get full recommendation
recommendation = selector.get_model_recommendation(model)
# Returns dictionary with format, confidence, reason, fallback_chain, notes

# Execute edit with automatic retry
result = selector.execute_with_retry(
    filepath='file.py',
    edit_op={'hash': '22:f1', 'content': 'new line content'},
    max_attempts=3
)
# Returns: {'success': True, 'format_used': 'hashline', 'attempts': 1, ...}
```

**Model Recommendations** (auto-detected):
- **Grok**: hashline (50% confidence) - 10x improvement
- **GLM**: hashline (85% confidence) - +8-14% improvement
- **Claude**: str_replace (95% confidence) - 92-95% success rate
- **Gemini**: str_replace_fuzzy (85% confidence) - 93% success rate
- **GPT**: apply_patch (85% confidence) - 91-94% success rate

### Hashline Integration

The hashline processor is also available as a tool:
```python
from .opencode.tools.hashline-processor import HashlineProcessor

processor = HashlineProcessor()
hashlines = processor.read_file_with_hashlines(filepath)
hash_ref = processor.find_hash_line(filepath, search_text)
processor.apply_hashline_edit(filepath, hash_ref, new_content)
```

**When to use hashline**:
- Working with weak models (Grok, GLM, small models)
- Experiencing high edit failure rates with traditional formats
- Need maximum reliability for critical edits
- Large files where exact matching is difficult

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

## Telemetry Integration ⭐ PHASE 1

The model-aware-editor skill now logs metrics for intelligent format selection:

```python
from .opencode.core.telemetry-logger import get_telemetry
from .opencode.core.edit-format-selector import get_edit_selector

# Get instances
telemetry = get_telemetry()
selector = get_edit_selector(telemetry_callback=telemetry.get_edit_success_rate)

# Auto-detect model
model = selector.detect_model()

# Execute edit with auto-selection and retry
result = selector.execute_with_retry(
    filepath='file.py',
    edit_op={'hash': '22:f1', 'content': 'new content'},
    max_attempts=3,
    model=model
)

# Log results
telemetry.log_edit_attempt(
    model=model,
    format_type=result['format_used'],
    success=result['success'],
    attempts=result['attempts'],
    tokens_used=token_count,
    duration_ms=duration
)
```

**Auto-Selection Flow**:
1. **Detect model** from environment (LLM_MODEL, MODEL_NAME, etc.)
2. **Check telemetry** for historical success rates
3. **Select format**:
   - Telemetry-based (if available)
   - Heuristic-based (model-specific recommendations)
4. **Execute with retry**:
   - Try primary format
   - Fall back through chain (hashline → str_replace → apply_patch)
5. **Log results** for learning

**Benefits**:
- Automatic optimization: Learns which formats work best for each model
- Reduced failures: Fallback chain prevents single-format failures
- Data-driven decisions: Telemetry informs format selection
- Performance tracking: Monitor edit success rates over time

**Telemetry Dashboard**:
```bash
# View edit format performance
python .opencode/core/telemetry-logger.py stats --model glm-4.7

# View overall summary
python .opencode/core/telemetry-logger.py stats --summary
```

**Research Validation**:
Your telemetry should confirm research findings:
- **GLM-4.7**: Hashline ~89% success (vs 72% str_replace)
- **Grok**: Hashline ~68% success (vs 25% str_replace) - 10x improvement
- **Claude**: str_replace ~95% success (hashline minor improvement)
- **GPT**: apply_patch ~94% success

---

## Edit Format Selector CLI

Test format selection recommendations:

```bash
# Get recommendation for auto-detected model
python .opencode/core/edit-format-selector.py recommend

# Get recommendation for specific model
python .opencode/core/edit-format-selector.py recommend --model glm-4.7

# Auto-detect model from environment
python .opencode/core/edit-format-selector.py detect
```

---

**Note**: This skill is about harness optimization. The actual edit logic is the same - we're optimizing how we communicate edits to different models.
