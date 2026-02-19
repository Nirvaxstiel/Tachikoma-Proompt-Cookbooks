# Production Patterns for Agent Systems

Consolidated collection of production-ready patterns extracted from skill references and scripts.

## Context Engineering Patterns

### 1.1 Structured Summarization (Anchored Iterative)

**Pattern:** Maintain persistent structured summaries with explicit sections that force preservation.

**Implementation:**

```python
SECTIONS = {
    "intent": "",
    "files_modified": [],
    "files_read": [],
    "decisions": [],
    "current_state": "",
    "next_steps": []
}

new_info = extract_from_new_span()
merge_sections(new_info)
```

**Key Insight:** Explicit sections act as checklists that prevent silent information drift.

---

### 1.2 Progressive Disclosure

**Pattern:** Load summaries first, details only on demand. Never load full content upfront.

**Implementation:**

```python
def get_contextual_info(reference):
    summary_path = reference.get("summary_path")
    detail_path = reference.get("detail_path")
    need_detail = reference.get("need_detail", False)

    if need_detail and detail_path:
        return load_detail(detail_path)
    elif summary_path:
        return load_summary(summary_path)
```

**Benefits:** Up to 80% token savings

---

## Evaluation & Quality Patterns

### 2.1 Probe-Based Evaluation

**Pattern:** Generate specific questions (probes) instead of generic summaries.

**Probe Types:**

- RECALL: Factual retention
- ARTIFACT: File tracking
- CONTINUATION: Work continuity
- DECISION: Reasoning retention

**Scoring Rubric:**

- accuracy_factual (0.6 weight)
- completeness (0.25 weight)
- tool_efficiency (0.20 weight)

**Benefits:** 10-30% better than summary evaluation

---

### 2.2 Production Monitoring

**Pattern:** Sample production interactions, track metrics, generate alerts.

**Alerting:**

- Critical: Pass rate < 70%
- Warning: Pass rate < 85%
- Quality alert: Average score < 0.6

**Benefits:** Early detection of regressions

---

## Tool Design Patterns

### 3.1 The Consolidation Principle

**Pattern:** If a human engineer cannot definitively say which tool to use, an agent cannot be expected to do better.

**Example:**

```python
# BAD: Three separate tools
def list_users(): ...
def list_events(): ...
def create_event(): ...

# GOOD: One comprehensive tool
def schedule_event(availability_check=True, **event_details):
    """Schedule event after checking availability."""
```

---

### 3.2 Answer Four Fundamental Questions

**Pattern:** Every tool description must clearly answer:

1. What does the tool do?
2. When should it be used?
3. What inputs does it accept?
4. What does it return?

---

## Memory & Persistence Patterns

### 4.1 Temporal Knowledge Graphs

**Pattern:** Track both when events occurred AND when they were ingested.

**Benefits:** Maintains temporal validity, supports "when was this learned?" queries

---

## Multi-Agent Patterns

### 5.1 Context Isolation

**Pattern:** Each sub-agent has its own context window. Primary purpose is isolation, not role simulation.

**Key Insight:** Sub-agents exist primarily to partition context.

**Benefits:** Each agent operates in clean context, no single context bears full burden
