# Model-Aware Editing

Optimizes edit format based on model provider to maximize success rates.

## What & Why

**Problem:** Different LLM providers require different edit formats. Using the wrong format causes failures and reduces success rates.

**Example:**
- Claude/Gemini: Use `str_replace` (exact string match)
- GPT/OpenAI: Use `apply_patch` (diff-based editing)
- Wrong format: 5-50%+ failure rate or "string not found" errors

**Solution:** **Model-aware editing** automatically selects the optimal edit format for each model.

## Research Basis

### The Harness Problem

**Paper:** "The Harness Problem: LLMs for Structured Editing and Knowledge Refinement" (Can.ac, Feb 2026)

**Key Findings:**

| Finding | Impact |
|---------|--------|
| **Edit format matters** | Choosing the right format can improve success by 10x |
| **Model-specific quirks** | Each model has preferred edit syntax |
| **Cross-model compatibility** | Universal formats work with all models |

### Supported Formats

| Format | Compatible Models | Description |
|---------|------------------|-------------|
| `str_replace` | Claude, Gemini | Exact string match and replace |
| `apply_patch` | GPT, OpenAI | OpenAI-style diff application |
| `hashline` | Universal | Content-hash anchoring (all models) |

## How It Works

### 1. Detect Model Provider

Automatically detect which model is being used:
- Check model name or API response
- Map to preferred edit format

**Detection Logic:**
```python
def detect_model(model_name: str) -> str:
    """Detect model provider from model name"""
    model_lower = model_name.lower()

    if 'claude' in model_lower:
        return 'anthropic'  # str_replace
    elif 'gpt' in model_lower or 'openai' in model_lower:
        return 'openai'  # apply_patch
    else:
        return 'hashline'  # Universal fallback
```

### 2. Select Optimal Format

Based on detected model:
- **Claude/Gemini:** Use `str_replace` format
- **GPT/OpenAI:** Use `apply_patch` format
- **Unknown/Fallback:** Use `hashline` format (universal)

### 3. Generate Edits

Format edits according to selected format:

**str_replace:**
```
[Edit: file.py]
[Old: def old_function():]
[New: def new_function():]
```

**apply_patch:**
```diff
--- a/file.py
+++ b/file.py
@@ -1,3 +1,3 @@
 def old_function():
-    return True
+    return False
```

**hashline:**
```
# abc123def456:42
def old_function():
    return True
---
# abc123def456:42
def new_function():
    return False
```

### 4. Execute Edit

Send formatted edit to model:
- Model applies the edit
- Verification that it was applied correctly
- Retry if format was wrong

## Performance Impact

### Dramatic Improvement for Grok

**Paper Finding:** Grok sees 10x improvement with proper format

| Model | Baseline | Optimized | Improvement |
|--------|----------|------------|-------------|
| **Grok** | 6.7% | 68.3% | **10x** |

### Improvement for Gemini

| Model | Baseline | Optimized | Improvement |
|--------|----------|------------|-------------|
| **Gemini** | Baseline | +8% | 1.08x |

### Universal Improvement

**All models:**
- Reduced retry loops (2-5x fewer failures)
- Better error messages
- Faster convergence to correct edit

## Implementation

### In Tachikoma Framework

**Location:** `.opencode/skills/model-aware-editor/`

**Key Scripts:**

1. **`edit_format_optimizer.py`** - Optimizes edit format per model
   ```python
   def get_optimal_format(model_name: str) -> str:
       """Select optimal edit format for model"""
       model_type = detect_model_type(model_name)

       if model_type == 'anthropic':
           return 'str_replace'
       elif model_type == 'openai':
           return 'apply_patch'
       else:
           return 'hashline'  # Universal fallback
   ```

2. **`hashline_generator.py`** - Generates hashline anchors
   ```python
   def generate_hashline(file_path: str, line_number: int) -> str:
       """Generate hashline anchor for edits"""
       content = read_file_lines(file_path)
       hash = compute_content_hash(content)
       return f"# {hash}:{line_number}"
   ```

### Caching

- **Pattern caching:** Compiled regex patterns cached
- **Model detection:** Cached for current session
- **Format decisions:** Reused for repeated edits

## Hashline Format (Universal)

### What It Is

Hashline editing provides **universal model compatibility** by anchoring edits with content hashes.

### Format

```
# <content_hash>:<line_number>
<content to edit>
```

### Example

**Original Code:**
```python
def calculate_total(items):
    total = 0
    for item in items:
        total += item.price
    return total
```

**Hashline-Anchored Edit:**
```python
# abc123def456:3
def calculate_total(items):
    total = 0
    for item in items:
        total += item.price
    return total

---
# abc123def456:7
def calculate_total(items):
    total = sum(item.price for item in items)
    return total
```

### How It Works

1. **Anchor:** Use hashline to target specific line
2. **Edit:** Replace anchored content
3. **Verify:** Check hash matches (conflict detection)

### Benefits

✅ **Universal compatibility** - Works with ALL models
✅ **Conflict detection** - Hash mismatch means file changed
✅ **Error resilience** - Handles wrong-location edits
✅ **Precise targeting** - Can target exact line numbers

## When to Use Model-Aware Editing

**Use When:**
- Working with multiple model providers
- High edit failure rates
- Critical changes requiring reliability
- Model-specific formats available

**Don't Need When:**
- Single model provider
- Low edit failure rates
- Simple edits (1-2 line changes)

## Best Practices

### DO ✅

1. **Detect Model First**
   - Always check model name/ID
   - Select format before generating edits

2. **Use Universal Fallback**
   - `hashline` format works with all models
   - Safer than guessing wrong format

3. **Cache Format Decisions**
   - Reuse format for same model in session
   - Reduces overhead

4. **Verify Edits**
   - Check if edit was applied correctly
   - Retry with different format if it failed

### DON'T ❌

1. **Don't Assume Format**
   - Don't hardcode `str_replace` everywhere
   - Different models need different formats

2. **Don't Use Wrong Format**
   - Claude with `apply_patch` = fails
   - GPT with `str_replace` = often fails

3. **Don't Ignore Model Errors**
   - "String not found" = wrong format
   - Try alternative format

4. **Don't Over-Rely on Hashlines**
   - Use native format when model supports it
   - Hashline is fallback, not primary

## Configuration

### Skill Configuration

Model-aware editing is automatically used by:
- **code-agent** - For all code edits
- **verifier-code-agent** - For verification
- **model-aware-editor** - Direct usage

**Can Configure:**
```yaml
# .opencode/config/model-formats.yaml
preferred_formats:
  claude-3-opus: str_replace
  claude-3-5-sonnet: str_replace
  gpt-4: apply_patch
  gpt-3.5-turbo: apply_patch
  fallback: hashline  # Universal format
```

## Related Research

### Complete Paper

**"The Harness Problem: LLMs for Structured Editing and Knowledge Refinement"**
- **Authors:** Can.ac
- **Date:** February 2026
- **Link:** https://blog.can.ac/2026/02/the-harness-problem/
- **Key Findings:**
  - Edit format choice impacts success rate 10x
  - Model-specific optimizations crucial
  - Universal formats provide cross-model compatibility

## Tools & Skills

### Related Tools
- **hashline-processor** - Generate and verify hashline format
- **model-aware-editor/scripts/edit_format_optimizer.py** - Format optimization
- **model-aware-editor/scripts/hashline_generator.py** - Hashline generation

### Related Skills
- **code-agent** - Uses model-aware editing for all code changes
- **verifier-code-agent** - Verifies edits were applied correctly
- **model-aware-editor** - Core skill for format optimization

## See Also

- [Research Overview](../research/overview.md) - All research-backed techniques
- [Position-Aware Loading](./position-aware-loading.md) - Attention optimization
- [Verification & Reflection](#verification-reflection) - Ensuring reliability
