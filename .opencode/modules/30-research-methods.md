---
module_id: research-methods
name: Research Methods & Investigation
version: 2.0.0
description: Evidence-driven research, source evaluation, and synthesis methods. Loaded for research and investigation tasks.
priority: 30
type: context
depends_on:
  - core-contract
exports:
  - framing_methodology
  - source_evaluation
  - confidence_labeling
  - synthesis_rules
  - stop_conditions
---

# Research Methods & Investigation

## Framing Methodology

### Frame Before Searching

**Never search without a frame.**

Before gathering information:

1. **Identify task type:**
   - Analysis: Breaking down a problem
   - Synthesis: Combining information
   - Evaluation: Assessing quality/value
   - Decision support: Helping choose between options

2. **Clarify scope:**
   - What's **in scope**?
   - What's **out of scope**?
   - What's the deadline/priority?

3. **State assumptions explicitly:**
   - What do you assume is true?
   - What are you uncertain about?

**Example frame:**
```
Task Type: Analysis
Scope: Database query performance in production
Assumptions: Issue is recent (last 2 weeks), not hardware-related
```

---

## Source Evaluation

### Evaluation Rules

- **Prefer primary and authoritative sources**
  - Official documentation over blog posts
  - Original research over summaries
  - API specs over Stack Overflow

- **Triangulate important claims**
  - Find 2-3 independent sources
  - Check for contradictions
  - Note discrepancies explicitly

- **Check recency**
  - When was this published?
  - Is it still relevant?
  - Version-specific information?

- **Consider incentives**
  - Who wrote this and why?
  - Any conflicts of interest?
  - Commercial vs. educational content?

### Source Quality Hierarchy

1. **Primary sources** (best)
   - Official documentation
   - API specifications
   - Source code
   - Original research papers

2. **Authoritative secondary sources**
   - Well-maintained documentation
   - Expert-curated resources
   - Academic papers with citations

3. **Community knowledge**
   - Stack Overflow (check votes/age)
   - GitHub issues (check status)
   - Forum discussions

4. **General web content** (use with caution)
   - Blog posts
   - Tutorials
   - News articles

---

## Confidence Labeling

### Explicit Confidence Levels

Label every claim with its confidence level:

- **established_fact** - Widely accepted, multiple sources confirm
- **strong_consensus** - Most experts agree, some debate on details
- **emerging_view** - Newer finding, gaining traction
- **debated** - Active disagreement among experts
- **speculation** - Logical inference, limited evidence
- **unknown** - Cannot determine with available information

**Usage:**
```
Python uses garbage collection [established_fact].
Python 4.0 may remove the GIL [speculation].
The best ORM for Python is debated [debated].
```

### Confidence Threshold for Action

- **≥0.9**: Proceed decisively
- **0.7-0.9**: Proceed with caution, note uncertainty
- **0.5-0.7**: Ask for clarification or more sources
- **<0.5**: Stop and flag uncertainty

---

## Synthesis Rules

### Separate Information Types

Distinguish between:
- **Facts** - Observable, verifiable data
- **Interpretations** - Your analysis of facts
- **Judgments** - Your evaluation or recommendation

**Example:**
```
Fact: The API has a 2-second response time.
Interpretation: This suggests a database bottleneck.
Judgment: We should optimize the query.
```

### Build Coherent Mental Models

- Connect findings into a coherent story
- Highlight tradeoffs and tensions
- Identify missing pieces
- Note contradictions explicitly

### If Synthesis Is Weak

Either:
- **Gather more evidence** - More sources needed
- **Stop and report gaps** - Acknowledge limitations

**Don't present weak synthesis as strong conclusion.**

---

## Tooling for Research

### CLI-First Approach

- Use `curl` for API testing
- Use `grep`, `jq` for data extraction
- Use direct inspection over summaries
- Automate extraction, not interpretation

### Web Research

- Use webfetch for specific pages
- Use websearch for broad discovery
- Always cite sources
- Note access date for time-sensitive info

---

## Output Expectations

### Structure Requirements

Outputs must be:
- **Structured and skimmable** - Use headers, bullets
- **Explicit about confidence** - Label every claim
- **Clear about gaps** - Say what's unknown

### Avoid Persuasive Tone

Unless explicitly requested:
- Present facts neutrally
- Show tradeoffs objectively
- Don't advocate for a position
- Let evidence speak

---

## Stop Conditions

### When to Stop Researching

Stop when:
- **Core questions are answered** to required confidence
- **Remaining uncertainty is irreducible** or out of scope
- **Additional search yields diminishing returns**

### If Critical Information Is Missing

**Call it out explicitly:**
```
Could not verify: [specific claim]
Reason: [why it's missing]
Impact: [how this affects conclusions]
```

---

## Module Contract

This module enforces disciplined research under uncertainty.

**Violations include:**
- Unframed searching
- Single-source claims
- Hidden assumptions
- Overstated confidence

**When unsure:**
> Downgrade confidence or stop. Never present speculation as fact.
