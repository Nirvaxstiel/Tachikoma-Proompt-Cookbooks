---
name: rlm
description: Run a Recursive Language Model-style loop for long-context tasks. Uses a persistent local Python REPL and an rlm-subcall subagent as the sub-LLM (llm_query).
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Todoread
  - Todowrite
compatibility:
  - opencode
  - claude-code
---

# rlm (Recursive Language Model workflow)

Use this Skill when:

- The user provides (or references) a very large context file (docs, logs, transcripts, scraped webpages) that won't fit comfortably in chat context.
- You need to iteratively inspect, search, chunk, and extract information from that context.
- You can invoke chunk-level analysis to a subagent.

## Mental model

- Main Claude Code conversation = the root LM.
- Persistent Python REPL (`rlm_repl.py`) = the external environment.
- Subagent `rlm-subcall` = the sub-LM used like `llm_query`.

## How to run

### Inputs

This Skill reads `$ARGUMENTS`. Accept these patterns:

- `context=<path>` (required): path to the file containing the large context.
- `query=<question>` (required): what the user wants.
- Optional: `chunk_chars=<int>` (default ~200000) and `overlap_chars=<int>` (default 0).

If the user didn't supply arguments, ask for:

1. the context file path, and
2. the query.

### Step-by-step procedure

1. Initialise the REPL state

   ```bash
   uv run python .opencode/skills/rlm/scripts/rlm_repl.py init <context_path>
   uv run python .opencode/skills/rlm/scripts/rlm_repl.py status
   ```

2. Scout the context quickly

   ```bash
   uv run python .opencode/skills/rlm/scripts/rlm_repl.py exec -c "print(peek(0, 3000))"
   uv run python .opencode/skills/rlm/scripts/rlm_repl.py exec -c "print(peek(len(content)-3000, len(content)))"
   ```

3. Choose a chunking strategy

   **Option A: Adaptive (recommended for most cases)** ⭐ PHASE 2.1

   ```python
   # Use semantic-aware chunking with boundary detection
   from .adaptive_chunker import AdaptiveChunker, get_adaptive_chunker

   # Initialize adaptive chunker
   chunker = get_adaptive_chunker()

   # Create adaptive chunks
   chunk_tuples = chunker.create_adaptive_chunks(content, max_chunks=10)
   chunks = [chunk for chunk, _ in chunk_tuples]

   # Or write to files
   paths = chunker.create_chunks_file(content, output_dir='.opencode/rlm_state/chunks')
   ```

    **Benefits of Adaptive Chunking**:
    - 28.3% improvement over base model (MIT research)
    - Respects semantic boundaries (functions, headings, JSON objects)
    - Auto-adjusts chunk size based on processing time
    - Content type detection (JSON, Markdown, Code, Logs, Text)

   **Supported Content Types**:
   - **JSON**: Splits at top-level objects
   - **Markdown**: Splits at ## and ### headings
   - **Code**: Splits at function/class boundaries
   - **Logs**: Splits at timestamps
   - **Text**: Splits at paragraphs

   **Performance Optimization**:
   ```python
   # Update chunk size based on processing performance
   chunker.adjust_chunk_size(processing_time_ms)

   # Get current statistics
   stats = chunker.get_stats()
   print(f"Current chunk size: {stats['current_chunk_size']}")
   print(f"Avg processing time: {stats['avg_processing_time']}ms")
   ```

   **Option B: Fixed-size (fallback)**

   - Prefer semantic chunking if format is clear (markdown headings, JSON objects, log timestamps).
   - Otherwise, chunk by characters (size around chunk_chars, optional overlap).

4. Materialise chunks as files (so subagents can read them)

   ```bash
   uv run python .opencode/skills/rlm/scripts/rlm_repl.py exec <<'PY'
   paths = write_chunks('.opencode/rlm_state/chunks', size=200000, overlap=0)
   print(len(paths))
   print(paths[:5])
   PY
   ```

 5. Subcall loop (invoke rlm-subcall agent)

    **Option A: Sequential (default for small contexts)**
    ```bash
    for chunk in chunks:
        result = invoke_subagent(chunk, query)
    ```

    **Option B: Parallel waves (for large contexts)** ⭐ NEW PARALLEL FEATURE
    ```python
    # Import parallel processor
    from .parallel_processor import ParallelWaveProcessor, get_parallel_processor

    # Initialize
    processor = get_parallel_processor(max_concurrent=5)

    # Process 5 chunks in parallel, repeat in waves
    results = processor.process_all_chunks(
        all_chunk_paths=chunks,
        query=query,
        subagent_callback=invoke_subagent
    )

    # Results include:
    # - total_waves: Number of waves processed
    # - processed_waves: Actual waves processed (early termination possible)
    # - early_termination: True if stopped early due to high confidence
    # - results: List of all chunk results
    ```

    **Impact**: 3-4x speedup for large context (>200K tokens)
    - Processes 5 chunks in parallel
    - Sequential waves, parallel chunks
    - Early termination on high-confidence answers

    **Implementation**: `.opencode/skills/rlm/parallel-processor.py`
    - Class: `ParallelWaveProcessor`
    - Methods: `process_all_chunks()`, `process_wave()`, `_has_confident_answer()`

    **When to use parallel**:
    - Large contexts (>200K tokens)
    - Time-sensitive queries
    - Need maximum throughput
    - Chunks are independent (no dependencies)

    **When to use sequential**:
    - Small contexts (<50K tokens)
    - Chunks have dependencies
    - Need strict ordering
    - Debugging parallel issues

    **For each chunk file**:
    - Invoke the rlm-subcall subagent with:
      - the user query,
      - the chunk file path,
      - and any specific extraction instructions.
    - Keep subagent outputs compact and structured (JSON preferred).
    - Append each subagent result to buffers (either manually in chat, or by pasting into a REPL add_buffer(...) call).

6. Synthesis
   - Once enough evidence is collected, synthesise the final answer in the main conversation.
   - Optionally ask rlm-subcall once more to merge the collected buffers into a coherent draft.

## Guardrails

- Do not paste large raw chunks into the main chat context.
- Use the REPL to locate exact excerpts; quote only what you need.
- Subagents cannot spawn other subagents. Any orchestration stays in the main conversation.
- Keep scratch/state files under .opencode/rlm_state/.
