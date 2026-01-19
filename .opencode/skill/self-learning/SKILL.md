---
name: self-learning
description: Meta-analysis and project context evolution skill. Reviews completed interactions to identify valid improvements to project knowledge and conventions, and proposes updates for approval.
license: MIT
compatibility:
  - opencode
  - claude-code
metadata:
  audience: developers, reviewers
  workflow: gather → analyze → verify → propose → confirm
---

## Purpose

Invoke this skill **after a task completes successfully** and the output is validated by the user.  
Its job is to *identify generalizable patterns, conventions, or rules* not yet captured in the project context (`AGENTS.md` or referenced files), verify them with evidence, and **propose safe, human-reviewable updates**.

This is a **meta-analysis skill**, not a task-execution skill.

---

## When to Use

Use this skill when all of the following are true:

1. A user request completed successfully.
2. The user indicates satisfaction (explicit signal).
3. There may be *repeatable patterns or project conventions* uncovered during the interaction.
4. The model can find evidence supporting a generalized rule.

If any condition is missing, **do not apply learning**.

---

## What This Skill Does

This skill performs the following steps:

### 1) History Ingestion

Collect:
- The input prompt or ticket
- The agent’s actions and outputs
- Relevant file changes
- User feedback or satisfaction signal
- Associated tests or validations

### 2) Pattern Extraction

Search for:
- Recurring directory structures
- Repeated search or inspection steps
- Verified code invariants
- Documentation or context references that were necessary
- Decisions made based on project specifics

### 3) Hypothesis Generation

For each candidate pattern,
generate:
- A concise description of the rule or convention
- A justification backed by evidence
- A potential location for insertion (e.g., `AGENTS.md` or a referenced architecture file)
  
Example proposed rule:

When a `docs/` directory contains an `architecture/` subfolder, the agent should load and summarize those files before search.

### 4) Verification

Confirm each hypothesis by extracting supporting facts:
- Confirm directory exists
- Confirm rule applies more than once
- Confirm no contradiction with existing contexts

If evidence is insufficient, drop the hypothesis.

### 5) Patch Drafting

Generate a **diff or patch** file suitable for inclusion in project context, for example:

```diff
--- AGENTS.md
+++ AGENTS.md
@@ -50,6 +50,12 @@
 ## Directory conventions
 ...
+## Auto-load architecture docs
+When a `docs/architecture/` directory exists,
+the agent should load those files before inspecting code
+to improve context quality.
+
+This was inferred from repeated inspection patterns in recent tasks.
````

### 6) Presentation for Approval

Create a summary that includes:

* Proposed patches
* Rationale
* Evidence list
* Risks or potential conflicts
* Confidence score or level

Present this summary to the user for **explicit approval** before applying.

---

## Safety Rules

This skill *must not*:

* Modify global agent law (`AGENTS` contract) without review.
* Change reusable skill behavior.
* Add speculative conventions without evidence.
* Apply changes without user confirmation.

---

## Output Format

When this skill runs it should produce:

1. **A human-readable proposal** summarizing each candidate update
2. **A patch in diff format** that can be applied to context files
3. **Evidence list** linking to inspected files, outputs, or tests
4. **Confidence labels** (high / medium / low)
5. **Reviewer guidance** (why approve? what to watch out for?)

Example output:

```
### Self-Learning Proposal

**Proposed update**: "Auto-load architecture docs rule"

**Rationale**: The agent consistently needed to load `docs/architecture/` before searching. Verified in 3 previous tasks.

**Evidence**:
- Task #345: `docs/architecture/network.md`
- Task #352: `docs/architecture/security.md`

**Patch**:
<diff format patch>

**Confidence**: High

Approve? (yes/no)
```

---

## Stop Conditions

Stop this skill early if:

* No valid hypotheses are found
* Evidence is contradictory
* Confidence is insufficient
* User feedback indicates this task should not seed context

---

## Contract

This skill enforces **disciplined contextual learning**.
It is **meta-reasoning only** and must always defer to human approval.

Violations include proposals with no evidence or silent application of patches.
