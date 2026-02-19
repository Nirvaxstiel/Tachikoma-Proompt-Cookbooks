# Model Harness: Edit Format Selection

Research on optimal edit formats for different LLM models.

**Confidence:** Strong consensus (multiple benchmarks, 16+ models tested)

## Executive Summary

**Key Finding:** Edit format selection matters as much as model choice. Can Bouluk's "The Harness Problem" (Feb 2026) demonstrated that changing *only* the edit tool - without modifying the model or prompt - improved 15 different LLMs by **5-14 percentage points** on coding benchmarks. The weakest models gained up to **10x improvement**.

**Impact:**
- **Success rates:** Grok went from 6.7% -> 68.3% (10x improvement)
- **Token reduction:** ~20% fewer output tokens (no retry loops)
- **Reliability:** Whitespace-insensitive matching eliminates entire class of failures

## Edit Format Comparison

| Format | Description | Best For | Success Rate | Pros | Cons |
|--------|-------------|-----------|--------------|------|-------|
| **str_replace** | Exact string matching | Claude | 92-95% | Simple, intuitive | Fails on whitespace/tabs |
| **str_replace_fuzzy** | Whitespace-tolerant matching | Gemini | 93% | Handles formatting | Slightly more complex |
| **apply_patch** | OpenAI-style diff format | GPT | 91-94% | Optimized for GPT | 50%+ failure on non-GPT |
| **hashline** | Hash-based line addressing | Grok, GLM, weak models | 68-69% | Whitespace-insensitive | Requires hashline processor |
| **whole** | Rewrite entire file | Small files (<400 lines) | Simplest | Token-inefficient | Very slow for large files |
| **udiff** | Simplified unified diff | GPT-4 Turbo | 59% | Reduces lazy coding | Model-specific |
| **editblock** | Aider-style search/replace | Most models | 80-90% | Intuitive | Requires layered matching |

## Model-Specific Recommendations

### Claude Family (Anthropic)

Claude excels with str_replace. The model reliably reproduces exact text, and this is the format Claude Code uses natively.

**Success rate:** 92-95%

### GPT/OpenAI Family

GPT models are trained on patch format. OpenAI's apply_patch tool is optimized for GPT.

**Success rate:** 91-94%

### Gemini Family (Google)

Gemini struggles with exact string matching. Fuzzy whitespace matching improves reliability significantly.

**Success rate:** 93%

### Grok Family (xAI)

Grok shows catastrophic failure with patch (6.7% -> 68.3% = 10x improvement) with hashline.

**Success rates:**
- With patch: 6.7%
- With hashline: 68.3%

### GLM Family (Zhipu AI)

GLM shows +8-14% improvement with hashline over other formats.

**Success rates:**
- Best format: 54-64%
- Hashline improvement: ~10 percentage points

### Other Models (Open Source / Self-Hosted)

These models tend to benefit from hashline or layered fuzzy matching:

**Reasoning:**
- **CodeLlama/LLaMA:** Code-focused but may struggle with exact whitespace
- **Mistral/Mixtral:** Strong models that handle str_replace well
- **DeepSeek/Phi/Yi/Qwen:** Strong reasoning models, hashline helps with mechanical edit tasks
- **InternLM:** Large models, benefit from fuzzy matching
- **Command R/SOLAR:** Cohere models, str_replace works well

## Hashline: The Emerging Superior Format

### How It Works

Hashline editing tags each line with a content hash:

The model references lines by hash instead of reproducing text: "replace line 2:f1".

### Why Hashline Wins

1. **Whitespace-insensitive** - tabs vs spaces, reformatting, trailing whitespace no longer cause failures
2. **Integrity verification** - if file changed since last read, hash won't match and edit is rejected before corruption
3. **No old text reproduction** - model says "where" and "what" separately
4. **Graceful error recovery** - on hash mismatch, shows updated hashes with `>>>` markers

### Benchmarks

| Model | Patch Rate | Hashline Rate | Improvement |
|-------|------------|---------------|------------|
| Grok 4 Fast 1 | 6.7% | 68.3% | **10x** |
| Grok 4 | 50.7% | 69.2% | +37% |
| GLM-4.7 | 46.2% | 57.7% | +25% |
| GPT-4.1 | 46.9% | 55.3% | +18% |
| Claude Opus 4.6 | 65.0% | 66.7% | +3% |
| Claude Sonnet 4.5 | 60.0% | 65.0% | +8% |

**Source:** Can Bouluk, "The Harness Problem" (Feb 2026)

## Additional Edit Formats

### Whole File Rewrite

Best for files under ~400 lines.

### Unified Diff (udiff)

Modified/simplified unified diff format.

### EditBlock Format (Aider-style)

Search/replace blocks with delimiters.

## Layered Matching Strategy

For maximum robustness, implement tiered matching:

Improvement: 10-30% over exact match alone.

## Sources

### Primary Research

1. "The Harness Problem" - Can Bouluk (Feb 2026)
2. Aider Edit Format Benchmarks
3. "Code Surgery: How AI Assistants Make Precise Edits" - Fabian Hertwig
4. Claude Code Issue #25775
5. Hive Agents Issue #4752

## Recommendations for Tool Builders

1. Implement layered matching
2. Prioritize hashline
3. Design actionable error feedback
4. Whitespace resilience is crucial
5. Consider format choice

## Quick Reference

**Format Selection Priority:**
1. Hashline (for weak models/reliability)
2. Str_replace_fuzzy (for formatting inconsistencies)
3. Str_replace (for Claude/GPT)
4. Apply_patch (for GPT only)

**Model Family Mapping:**
- Claude/GPT -> Native format (str_replace/apply_patch)
- Gemini -> Fuzzy matching (str_replace_fuzzy)
- Grok/GLM/Weak models -> Hashline
- Strong models (Mistral, etc.) -> str_replace with layered fallback
- CodeLlama/LLaMA -> str_replace_fuzzy or hashline
