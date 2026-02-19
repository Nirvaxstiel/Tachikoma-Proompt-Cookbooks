# Recursive Language Models (RLM)

Handling 10M+ token contexts through adaptive chunking.

## The Problem

Standard LLMs have fixed context windows (128K-200K tokens). How to handle:
- Entire codebases
- Large documentation sets
- Multi-file refactoring

## Research

### "Recursive Language Models" (arXiv:2512.24601)

**Finding:** Process inputs up to two orders of magnitude beyond context windows.

**Results:**
- Process inputs 100x beyond context windows
- RLM-Qwen3-8B outperforms base Qwen3-8B by 28.3% on average
- Approaches GPT-5 quality on long-context tasks

**Key Innovations:**

1. **Semantic Boundary Detection** — Split at natural divisions
2. **Adaptive Chunk Sizing** — Adjust by content type
3. **Parallel Processing** — Process chunks concurrently
4. **Context as Environment** — Treat chunks as world state

[arXiv](https://arxiv.org/abs/2512.24601)

## Tachikoma's Implementation

### RLM-Optimized Subagent

Coordinates RLM processing for large contexts.

**Adaptive Chunking:**
- Markdown: Split at `##` headings
- Code: Split at function/class boundaries
- JSON: Split at top-level objects
- Logs: Split at timestamps

### RLM-Subcall Subagent

Acts as sub-LLM for individual chunk processing.

After synthesis: Reflect on results, flag gaps, suggest deeper investigation.

## When to Use

**Use RLM when:**
- Context > 2000 tokens
- Entire codebase analysis
- Bulk refactoring
- Large documentation

**Use standard skills when:**
- Context < 2000 tokens
- Single file operations
- Quick turnaround

## Configuration

```yaml
routes:
  complex:
    subagent: rlm-optimized
    fallback_subagent: rlm-subcall
    confidence_threshold: 0.5
```

## See Also

- [Subagents](/capabilities/subagents)
- [Research Overview](./overview)
