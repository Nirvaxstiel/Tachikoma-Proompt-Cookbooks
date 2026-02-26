# Model-Aware Editing

Dynamic edit format selection optimized for specific LLM models.

## Overview

Different LLM models have different capabilities for editing code. Model-Aware Editing (MAE) automatically selects the optimal edit format based on the model in use.

**Why it matters:** Edit format selection is as important as model choice. Using the wrong format leads to failed edits and wasted tokens.

## Supported Edit Formats

| Format | Models | Type | Description |
|--------|--------|------|-------------|
| `str_replace` | Claude, Mistral | Exact string | Precise string matching |
| `str_replace_fuzzy` | Gemini | Fuzzy whitespace | Handles whitespace differences |
| `apply_patch` | GPT-4, GPT-4o | Diff format | Standard patch syntax |
| `hashline` | Grok, GLM, others | Content-hash | Anchored by content hash |

## Tachikoma Edit Format Selector

The `tachikoma.edit-format-selector` tool provides model-aware editing:

```bash
# Detect current model
tachikoma.edit-format-selector with args="detect"

# Get recommended format
tachikoma.edit-format-selector with args="recommend"

# Add custom model mapping
tachikoma.edit-format-selector with args="add <model> <format>"

# List all formats
tachikoma.edit-format-selector with args="list"
```

## Format Details

### 1. str_replace (Exact String Matching)

**Best for:** Claude, Mistral, models with precise tokenization

**How it works:**
```typescript
// Edit tool call
edit({
  filePath: "src/app.ts",
  oldString: "const oldFunction = () => { ... }",
  newString: "const newFunction = () => { ... }"
})
```

**Pros:**
- Precise, no ambiguity
- Fast execution
- Works well with exact tokenization

**Cons:**
- Fails on whitespace differences
- Requires exact match
- Can be brittle with large blocks

**Example:**

```python
# Before
def hello_world():
    print("Hello, World!")

# Edit
edit(
    filePath="main.py",
    oldString='def hello_world():\n    print("Hello, World!")',
    newString='def hello_world():\n    print("Hello, Tachikoma!")'
)

# After
def hello_world():
    print("Hello, Tachikoma!")
```

### 2. str_replace_fuzzy (Fuzzy Whitespace)

**Best for:** Gemini, models with flexible whitespace handling

**How it works:**
```typescript
// Edit tool call with fuzzy matching
edit({
  filePath: "src/app.ts",
  oldString: "const oldFunction = () => { ... }",
  newString: "const newFunction = () => { ... }",
  fuzzy: true  // Allow whitespace differences
})
```

**Pros:**
- Handles whitespace variations
- More flexible than exact match
- Works with inconsistent formatting

**Cons:**
- Slightly slower
- Can match unintended content
- Less precise than exact match

**Example:**

```python
# Original (inconsistent spacing)
def  hello_world()  :
        print("Hello, World!")

# Edit with fuzzy matching
edit(
    filePath="main.py",
    oldString='def hello_world():\n    print("Hello, World!")',
    newString='def hello_world():\n    print("Hello, Tachikoma!")',
    fuzzy=True
)

# Works despite different whitespace!
def  hello_world()  :
        print("Hello, Tachikoma!")
```

### 3. apply_patch (Diff Format)

**Best for:** GPT-4, GPT-4o, models trained on patches

**How it works:**
```typescript
// Edit tool call with patch format
edit({
  filePath: "src/app.ts",
  patch: `
    --- a/src/app.ts
    +++ b/src/app.ts
    @@ -10,7 +10,7 @@
     -const oldFunction = () => {
    +const newFunction = () => {
     ```
})
```

**Pros:**
- Standard diff format
- Handles large changes well
- Familiar to developers

**Cons:**
- Verbose
- Can be confusing
- Requires diff syntax knowledge

**Example:**

```python
# Patch format
edit(
    filePath="main.py",
    patch="""
--- a/main.py
+++ b/main.py
@@ -1,3 +1,3 @@
-def hello_world():
-    print("Hello, World!")
+def hello_tachikoma():
+    print("Hello, Tachikoma!")
"""
)

# Result
def hello_tachikoma():
    print("Hello, Tachikoma!")
```

### 4. hashline (Content-Hash Anchoring)

**Best for:** Grok, GLM, other models with unique tokenization

**How it works:**
```typescript
// Edit tool call with hash anchors
edit({
  filePath: "src/app.ts",
  hashLine: "abc123def456",  // Content hash
  newString: "const newFunction = () => { ... }"
})
```

**Pros:**
- Works with any model
- Robust to whitespace changes
- Unique identification

**Cons:**
- Requires pre-computation
- Can be complex to use
- Less common

## Model-Specific Recommendations

### Claude (Claude 3, Claude 3.5)

**Recommended format:** `str_replace`

```yaml
claude:
  format: str_replace
  reasoning: Exact matching works well with Claude's tokenization
  tips:
    - Use exact indentation
    - Match whitespace precisely
    - Keep oldString concise
```

### GPT-4 / GPT-4o

**Recommended format:** `apply_patch`

```yaml
gpt4:
  format: apply_patch
  reasoning: Trained on patches, understands diff syntax
  tips:
    - Use standard diff format
    - Include context lines
    - Be explicit with file paths
```

### Gemini

**Recommended format:** `str_replace_fuzzy`

```yaml
gemini:
  format: str_replace_fuzzy
  reasoning: Flexible whitespace handling
  tips:
    - Can ignore spacing differences
    - Good for inconsistent formatting
    - Set fuzzy: true parameter
```

### Mistral

**Recommended format:** `str_replace`

```yaml
mistral:
  format: str_replace
  reasoning: Similar to Claude, exact matching works well
  tips:
    - Use precise string matching
    - Match indentation exactly
    - Keep edits focused
```

### Grok / GLM

**Recommended format:** `hashline`

```yaml
grok:
  format: hashline
  reasoning: Content-hash anchoring is most reliable
  tips:
    - Compute content hash first
    - Use hash to anchor edit
    - Works with any formatting
```

## Configuration

Edit formats are configured in YAML:

```yaml
# config/edit-formats.yaml
models:
  claude-3.5:
    format: str_replace
    confidence: 0.95

  gpt-4:
    format: apply_patch
    confidence: 0.90

  gemini:
    format: str_replace_fuzzy
    confidence: 0.85

  grok:
    format: hashline
    confidence: 0.80

# Add custom model
my-custom-model:
  format: str_replace
  confidence: 0.75
```

## Best Practices

### For Users

1. **Let Tachikoma choose** — Use `detect` to auto-select
2. **Provide good context** — More context = better edits
3. **Review changes** — Always verify edits
4. **Use edit history** — Rollback if needed

### For Skill Authors

1. **Use model-aware tools** — Don't hardcode formats
2. **Add fallback formats** — If one fails, try another
3. **Provide guidance** - Explain format choice to user

## Research

This feature is based on research from:

- **Model Harness** — "The Harness Problem" (Can Bouluk, Feb 2026)
  - Finding: Edit format selection matters as much as model choice
  - Implication: Match format to model capabilities

[Learn more about model harness →](../research/model-harness.md)

## See Also

- [Skill Execution](./skill-execution.md) — Using model-aware editing in skills
- [Intent Routing](./intent-routing.md) — How models are selected
- [Context Management](./context-management.md) — Providing context for edits
