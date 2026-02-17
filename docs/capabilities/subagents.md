# Subagents

Specialized workers for complex, large-context tasks.

## What This Is

Subagents tackle problems that exceed normal context limits or require sophisticated multi-step reasoning. They operate with their own context window and reasoning pipeline.

Think of skills as specialists (fast, focused, routine) and subagents as researchers (thorough, complex, deep).

## How It Works

1. **Intent is classified as complex** — Task requires large context or multi-step reasoning
2. **Route specifies subagent** — Intent routes delegate to rlm-optimized or rlm-subcall
3. **Subagent loads** — Subagent definition and rules
4. **Context is chunked** — Large context broken into manageable pieces
5. **Chunks process iteratively** — Each chunk analyzed and synthesized
6. **Results combined** — Final synthesis across all chunks

## Why Subagents Matter

Without subagents:
- **Context window limits** — Can't handle large codebases or documents
- **Lost in the middle** — Dumping everything causes AI to ignore important stuff
- **Sequential processing** — One massive context = slow and error-prone

With subagents:
- **Unlimited context** — Can handle 10M+ tokens via chunking
- **Semantic chunking** — Breaks at natural boundaries (functions, sections, etc.)
- **Iterative refinement** — Processes chunks and synthesizes findings
- **Parallel processing** — Multiple chunks processed concurrently (faster)

## Available Subagents

### rlm-optimized

**Purpose:** Large context processing using MIT-style Recursive Language Model approach

**Use When:**
- Analyzing entire codebases (>2000 tokens)
- Bulk refactoring operations
- Complex multi-file analysis
- Research across many documents

**How it works:**
The RLM (Recursive Language Model) approach treats context as an environment:

1. **Adaptive chunking** — Breaks large context into semantic units
2. **Semantic boundary detection** — Splits at natural divisions (headings, functions, etc.)
3. **Context as environment** — Each chunk becomes part of the "world state"
4. **Selective loading** — Only relevant chunks loaded into active context
5. **Parallel processing** — 3-5 chunks processed concurrently
6. **Iterative refinement** — Results synthesized across chunks

**Performance:**
- 2-5x efficiency improvement over naive full-context loading
- 91% accuracy on 10M token tasks (MIT RLM research)
- Handles 10M+ token contexts effectively

**Example:**
```
User: "Analyze my entire codebase for security issues"
→ Intent: complex
→ Subagent: rlm-optimized
→ Action: Chunks codebase, analyzes each chunk, synthesizes findings
```

### rlm-subcall

**Purpose:** Acts as RLM sub-LLM (llm_query) for chunk processing

**Use When:**
- rlm-optimized needs to process individual chunks
- Task requires specialized reasoning beyond standard RLM
- Parallel processing of multiple large contexts

**How it works:**
Receives a chunk of context and a query, extracts only what's relevant, and returns a compact structured result.

**Key difference:**
While `rlm-optimized` coordinates the entire RLM process (chunking, parallel processing, synthesis), `rlm-subcall` is the sub-LLM that processes each individual chunk.

## Subagent vs Skill

| Aspect | Skill | Subagent |
|--------|-------|----------|
| **Context size** | Normal (<2000 tokens) | Large (unlimited) |
| **Processing** | Single-pass | Multi-step, iterative |
| **Memory** | Within single context | Maintains state across chunks |
| **Use case** | Routine tasks | Complex, research-grade tasks |
| **Latency** | Seconds to minutes | Minutes to hours |

## Configuration

Subagents are configured in `.opencode/config/intent-routes.yaml`:

```yaml
routes:
  complex:
    subagent: rlm-optimized
    fallback_subagent: rlm-subcall
    confidence_threshold: 0.5
```

## Execution Flow

```
User Request → Classify Intent → Context > 2000 tokens?
    ↓
YES → Load Subagent → Chunk Context → Process Chunks
    ↓
Synthesize Results → Return Summary
```

## Research Basis

### MIT RLM Paper

This implementation is based on MIT CSAIL's January 2026 study on Recursive Language Models demonstrating 10M+ token context handling with 91.33% accuracy through:
- Semantic chunking (respecting content boundaries)
- Adaptive sizing (matching chunk size to content density)
- Parallel processing (concurrent sub-LLM invocation)
- Smart synthesis (confidence-weighted result merging)

**Key innovation:** Models achieve 10M+ token context handling without architecture changes.

### The "Lost in the Middle" Problem

Research shows LLMs exhibit U-shaped attention bias (Hsieh et al., ACL 2024):
- Tokens at **beginning** and **end** receive higher attention
- Middle context is often **ignored** regardless of relevance
- Performance drops 10-20% when key info is in the middle

**RLM solution:** Chunking + synthesis ensures important info is always at beginning of each chunk.

---

## Best Practices

1. **Don't overuse** — Subagents add latency. Use skills for routine tasks.
2. **Clear objectives** — Give subagents specific, measurable goals
3. **Review output** — Always review subagent findings before acting
4. **Fallback awareness** — Know that rlm-subcall kicks in if rlm-optimized fails

## When to Use What

```
Task complexity assessment:
├── Simple (1 file, <100 lines)     → skill: code-agent
├── Medium (1-5 files)              → skill: code-agent
├── Complex (5+ files, >2000 tokens) → subagent: rlm-optimized
└── Very Complex (entire codebase)    → subagent: rlm-optimized (with rlm-subcall processing)
```

## See Also

- [Skill Execution](/capabilities/skill-execution) - How skills work
- [Skill Chains](/capabilities/skill-chains) - Chain skills sequentially
- [Intent Routing](/capabilities/intent-routing) - Route configuration
- [Research Overview](/research/overview) - RLM technical background
