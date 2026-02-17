# Model Harness

Why edit format selection matters as much as model choice.

## The Problem

Different models work best with different edit formats. Using the wrong format can cause 10x more failures than using the wrong model.

**Question:** Is the model failing, or is the harness failing?

**Answer:** Often it's the harness (edit format).

## Research Findings

### Harness Problem (Can.ac, Feb 2026)

**Key Finding:**
Choosing the right edit format for your model can improve success by **10x**.

**Results by Model:**

| Model | Worst Format | Best Format | Improvement |
|-------|--------------|-------------|-------------|
| Grok | str_replace | hashline | 6.7% → 68.3% (10x) |
| Gemini | apply_patch | str_replace | +8% |
| Claude | apply_patch | str_replace | Baseline → Optimal |
| GPT | str_replace | apply_patch | Baseline → Optimal |

**Format Issues:**

**`apply_patch` (OpenAI-style diff):**
- ❌ Fails 50%+ on non-OpenAI models
- ❌ Models struggle with diff syntax
- ✅ Works well with GPT models

**`str_replace` (exact match):**
- ❌ "String not found" errors common
- ❌ Whitespace sensitivity issues
- ✅ Works well with Claude, Gemini

**`hashline` (content-based):**
- ✅ Universal compatibility
- ✅ 8-14% improvement over alternatives
- ✅ Anchors edits with content hashes

[Read Article](https://blog.can.ac/2026/02/12/the-harness-problem/)

## Edit Formats Compared

### Format 1: str_replace

```python
# Old string:
def hello():
    return "world"

# New string:
def hello():
    return "Hello, World!"
```

**Best for:** Claude, Gemini
**Pros:** Simple, readable
**Cons:** Whitespace sensitive, exact match required

### Format 2: apply_patch

```diff
<<<<<<<
def hello():
    return "world"
=======
def hello():
    return "Hello, World!"
>>>>>>>
```

**Best for:** GPT models, Codex
**Pros:** Standard diff format
**Cons:** Confuses non-OpenAI models

### Format 3: hashline ⭐ Recommended

```python
# 11:a3|def hello():
# 22:f1|    return "world"
```

**Edit:**
```
replace "22:f1" with "    return 'Hello, World!'"
```

**Best for:** Universal (all models)
**Pros:**
- Content-hash anchoring
- Line-independent
- Conflict detection
- Works across all models

## Tachikoma's Implementation

### Model-Aware-Editor Skill

**Purpose:** Select optimal edit format per model automatically.

**Implementation:**
- SKILL.md: `.opencode/skills/model-aware-editor/SKILL.md`
- Selector: `.opencode/core/edit-format-selector.py`

**Format Selection Logic:**
```python
def select_format(model_name):
    if model_name in ['claude', 'gemini']:
        return 'str_replace'
    elif model_name in ['gpt', 'codex']:
        return 'apply_patch'
    else:
        return 'hashline'  # Universal fallback
```

### Hashline Processor Tool

**Purpose:** Generate and process hashline-based edits.

**Implementation:**
- Script: `.opencode/tools/hashline-processor.py`
- Generator: `.opencode/skills/model-aware-editor/scripts/hashline_generator.py`
- Optimizer: `.opencode/skills/model-aware-editor/scripts/edit_format_optimizer.py`

**Features:**
- Read files with hashlines
- Apply hashline edits
- Verify hash integrity
- Generate hashlines for new files

**CLI Usage:**
```bash
# Generate hashlines
python .opencode/tools/hashline-processor.py --generate file.py

# Apply hashline edit
python .opencode/tools/hashline-processor.py --apply edit.json

# Verify integrity
python .opencode/tools/hashline-processor.py --verify file.py
```

## Best Practices

### Model-Specific Recommendations

**Claude:**
- Primary: `str_replace` with fuzzy whitespace
- Fallback: `hashline`

**Gemini:**
- Primary: `str_replace` + fuzzy matching
- Fallback: `hashline`

**GPT/Codex:**
- Primary: `apply_patch`
- Fallback: `str_replace`

**Grok:**
- Primary: `hashline` (10x improvement)
- Avoid: `str_replace`

**Other/Unknown:**
- Primary: `hashline` (universal)
- Rationale: Works everywhere

### When to Use Hashline

**Always use hashline when:**
- Working with multiple model providers
- Experiencing high edit failure rates
- Need maximum compatibility
- Building reusable tools

**Format selection flow:**
```
Is model known?
├── Yes → Use model's preferred format
└── No  → Use hashline (universal)
```

## Common Pitfalls

### DON'T ❌

1. **Don't use apply_patch with Claude** — 50%+ failure rate
2. **Don't use str_replace with Grok** — 6.7% success rate
3. **Don't ignore whitespace** — Use fuzzy matching or hashlines
4. **Don't hardcode format** — Let model-aware-editor select

## Integration

### In Skill Chains

```yaml
skill_chains:
  reliable-edit:
    skills:
      - model-aware-editor  # Select optimal format
      - code-agent          # Generate edit
      - verifier-code-agent # Verify edit
```

### In Configuration

```yaml
# .opencode/config/model-preferences.yaml
models:
  claude:
    preferred_format: str_replace
    fuzzy_whitespace: true
  
  grok:
    preferred_format: hashline
    exact_match: true
```

## See Also

- [Model-Aware Editor](/capabilities/skill-execution) — Full skill documentation
- [Tools](/capabilities/tools) — Hashline processor and other tools
- [Research Overview](./overview) — Other research areas
