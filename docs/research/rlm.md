# Recursive Language Models (RLM) - Research

> **Focus**: Original MIT paper research and algorithm
> **Tachikoma Implementation**: See `docs/capabilities/rlm.md`
> **Full Documentation**: See `docs/rlm.md`

---

## The Problem

Standard LLMs have fixed context windows (128K-200K tokens). How to handle:
- Entire codebases
- Large documentation sets
- Multi-file refactoring
- 10M+ token contexts

---

## MIT Paper: "Recursive Language Models"

**Paper**: "Recursive Language Models: Efficient Long-Context Processing with Limited Computation"
**arXiv**: https://arxiv.org/abs/2512.24601

### Key Findings

- Process inputs up to **two orders of magnitude** beyond context windows
- RLM-Qwen3-8B outperforms base Qwen3-8B by **28.3%** on average
- Approaches GPT-5 quality on long-context tasks

---

## Key Innovations

### 1. Symbolic Handle to Prompt

**Concept**: Prompt lives in REPL (external to LLM)

**How it works**:
- Large context stored externally (not in LLM context)
- LLM maintains symbolic reference to context
- Only metadata in LLM context (constant size)

### 2. Symbolic Recursion

**Concept**: LLM writes code that calls `sub_LLM()` in loops

**How it works**:
```
# LLM generates this Python code
chunks = chunk_indices(size=50000)
results = []
for start, end in chunks:
    chunk = peek(start, end)
    result = sub_LLM("Analyze", chunk=chunk)  # RECURSION!
    if result["success"]:
        results.append(result["result"])
```

**Why this is recursion**: LLM is calling itself through `sub_LLM()` function.

### 3. Output via Variables

**Concept**: Results stored in REPL variables (`Final`)

**How it works**:
- Intermediate results stored in REPL
- Final synthesis in variable `Final`
- LLM only sees variable names, not actual results

### 4. Metadata-Only History

**Concept**: Only constant-size metadata in LLM context

**How it works**:
- No actual context chunks in LLM history
- Only metadata: chunk IDs, processing status
- Context window stays fixed regardless of input size

### 5. Sub-LLM Calls

**Concept**: LLM calls itself via subagent

**How it works**:
- Subagent acts as "sub-LLM"
- Processes individual chunks
- Returns structured results
- Main LLM synthesizes from results

---

## Performance Results

| Metric | Result |
|--------|--------|
| **Context scaling** | 100x beyond context windows |
| **Accuracy improvement** | 28.3% over base model |
| **Quality** | Approaches GPT-5 on long-context tasks |
| **Computation** | Limited - scales efficiently |

---

## Limitations from Paper

1. **Sequential processing** - Chunks processed one at a time
2. **Manual chunking** - No semantic boundary detection
3. **Fixed chunk size** - No adaptive sizing based on content

---

## Related Research

- **Position Bias**: LLMs pay more attention to tokens at start and end of context
- **Tool-Augmented LLMs**: Tools add latency but improve accuracy
- **Modularity**: Smaller, focused components work better than large monolithic prompts
- **Verification Loops**: Reflection after execution improves quality

---

## Implementation Notes

Tachikoma's RLM implementation extends the MIT paper with:

1. **Adaptive chunking** - Semantic boundary detection (JSON objects, Markdown headings, code functions)
2. **Parallel processing** - Process 5 chunks concurrently in waves
3. **Plugin system** - Native opencode integration for tool discovery
4. **Environment variables** - Testing and control

**See**: `docs/capabilities/rlm.md` for Tachikoma implementation details

---

**Last Updated**: 2026-02-20
