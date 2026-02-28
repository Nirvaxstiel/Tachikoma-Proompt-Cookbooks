---
name: context
description: Retrieve and manage knowledge across codebases, documentation, and large contexts
keywords:
  - research
  - explore
  - find
  - search
  - investigate
  - analyze
  - understand
  - documentation
  - library
  - framework
  - api
  - patterns
  - best practices
  - memory
  - rlm
triggers:
  - research
  - explore
  - find
  - how does
  - understand
  - investigate
  - documentation for
  - best practices for
  - patterns for
  - learn about
  - context for
---

# Context Management

Retrieve, analyze, and manage knowledge across codebases, external documentation, and large-scale contexts.

## Core Capabilities

1. **Research**: Codebase exploration and web research
2. **Documentation**: External API and framework knowledge via Context7
3. **Memory**: Graph-based knowledge persistence (with meta skill)
4. **RLM**: Recursive processing for 10M+ token contexts

---

## 1. Research

### Research Process

1. **Clarify Question**
   - Understand what needs to be researched
   - Identify key terms and concepts
   - Determine scope (codebase only vs. web)

2. **Explore Sources**
   - Search codebase with glob/grep for relevant code
   - Look at documentation files
   - Check configuration files
   - Use websearch/webfetch for external info if needed

3. **Synthesize Findings**
   - Summarize what you found
   - Identify patterns
   - Note any gaps or uncertainties

4. **Present Results**

### Output Format
```markdown
## Research: [Topic]

### Summary
Brief overview of what was researched

### Findings
- Finding 1 with source
- Finding 2 with source
- Finding 3 with source

### Code References
- @file1.ts:line - relevant code
- @file2.ts:line - relevant code

### Gaps
- Unknown areas requiring clarification
- Areas not explored

### Recommendations
Suggested next steps based on findings
```

### Tips
- Be thorough but efficient
- Use glob to find files by pattern
- Use grep to search code content
- Read key files completely
- Take notes on sources
- Use @ mentions to reference files

---

## 2. Documentation (Context7)

Retrieve live, domain-specific knowledge from context7.com when you need library/framework patterns, API documentation, or best practices.

### When to Use
Activate when:
- User asks about a specific library or framework
- Need API documentation for a technology
- Looking for best practices or patterns
- Domain knowledge required for implementation
- "How do I..." questions about specific technologies

### Context7 API

**Base URL:** `https://context7.com/api/v2`

#### Search for Library
```bash
GET /libs/search?libraryName={name}&query={topic}
```
Returns library IDs and descriptions.

#### Fetch Documentation
```bash
GET /context?libraryId={id}&query={topic}&type=txt
```
Returns raw documentation text.

### Workflow

1. **Identify Domain**
   - Extract library/framework name from request
   - Identify specific topic (e.g., "authentication", "hooks", "routing")

2. **Search Library**
   - Use webfetch to query Context7 search API
   - Find correct library ID

3. **Fetch Documentation**
   - Use webfetch to get documentation for specific topic
   - Parse and extract relevant sections

4. **Present Findings**
   - Summarize key patterns/practices
   - Provide code examples if available
   - Link to full documentation if needed

### Output Format

Provide:
- **Summary**: Brief overview of patterns/practices
- **Key Concepts**: Main ideas from documentation
- **Code Examples**: Relevant snippets from retrieved docs
- **Best Practices**: Recommended approaches
- **References**: Link to full Context7 documentation if needed

---

## 3. Graph-Based Memory

Memory operations work with **meta** skill for knowledge persistence.

### Storing Knowledge

Store information when:
- A new code structure (class, function, module) is identified
- An architectural decision is made
- A user requirement is specified
- A bug or issue is discovered
- A solution pattern is found
- An API contract is defined

### Querying Memory

Query memory when:
- Understanding a new codebase area
- Looking for similar implementations
- Finding related functionality
- Understanding dependencies
- Locating configuration or setup code

### Memory Operations

- **`@memory-add-node`**: Add entities to knowledge graph
- **`@memory-add-edge`**: Add relationships between nodes
- **`@memory-query`**: Search by similarity, pattern, or traversal
- **`@memory-visualize`**: Generate Mermaid diagrams of knowledge graph

### Performance Benefits

- 3-5x more efficient retrieval than linear memory
- 30% context efficiency gain
- Supports complex knowledge representation
- Relationship awareness improves relevance

---

## 4. RLM (Recursive Language Models)

Process inputs up to two orders of magnitude beyond context windows through symbolic recursion.

### Key Innovations

1. **Symbolic Handle to Prompt**: Prompt lives in REPL (external to LLM)
2. **Symbolic Recursion**: LLM writes code that calls `sub_LLM()` in loops
3. **Output via Variables**: Results stored in REPL variables (`Final`)
4. **Metadata-Only History**: Only constant-size metadata in LLM context
5. **Sub-LLM Calls**: LLM calls itself via subagent

### How It Works

```python
# LLM generates this Python code
chunks = chunk_indices(size=50000)
results = []
for start, end in chunks:
    chunk = peek(start, end)
    result = sub_LLM("Analyze", chunk=chunk)  # RECURSION!
    if result["success"]:
        results.append(result["result"])
```

### When to Use RLM

**Use when**:
- Context exceeds 2000 tokens
- Processing entire codebases
- Analyzing large documentation sets
- Multi-file refactoring tasks
- 10M+ token contexts

**Skip when**:
- Context fits in single request
- Simple, localized changes
- Well-understood code sections

### Performance Results

| Metric | Result |
|--------|--------|
| Context scaling | 100x beyond context windows |
| Accuracy improvement | +28.3% over base model |
| Quality | Approaches GPT-5 on long-context tasks |
| Computation | Limited - scales efficiently |

### Tachikoma RLM Extensions

1. **Adaptive chunking**: Semantic boundary detection (JSON objects, Markdown headings, code functions)
2. **Parallel processing**: Process 5 chunks concurrently in waves
3. **Plugin system**: Native opencode integration for tool discovery
4. **Environment variables**: Testing and control

---

## Integration Guidelines

### Skill Combinations

| Task Type | Context Skill Combinations |
|------------|---------------------------|
| Codebase research | context (research only) |
| External docs | context (documentation only) |
| Large context analysis | context (RLM only) |
| Meta orchestration | context (research + memory) |
| Knowledge persistence | context + meta (memory) |

### Cost-Aware Routing

```
Low complexity:
  → Direct context retrieval (1-2s)

Medium complexity:
  → Research + documentation (5-15s)

High complexity:
  → RLM orchestration (15-45s)

Very high complexity:
  → RLM + memory (45-120s)
```

---

## Important

- Use webfetch tool for all Context7 API calls
- Cache retrieved documentation if session may need it again
- Summarize findings, don't dump entire response
- Focus on actionable patterns, not exhaustive documentation
- Memory requires meta skill for full functionality
- RLM uses adaptive chunking and parallel processing
