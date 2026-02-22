---
name: context-manager
description: Context management operations for discovering, extracting, and maintaining project context. Used by Tachikoma to efficiently manage context without LLM token costs.
version: 1.0.0
author: tachikoma
type: skill
category: development
tags:
  - context
  - management
  - discovery
  - cli
---

# Context Manager Skill

> **Purpose**: Agent-facing context management. Tachikoma uses these CLI tools to discover and extract context without burning tokens.

---

## How Tachikoma Uses This

Tachikoma invokes these operations automatically during routing:

### Example 1: User asks about standards
```
User: "What are our naming conventions?"

Tachikoma (internal):
  Intent: research (confidence: 0.9)
  Action: Extract naming conventions
  Command: bash router.sh extract coding-standards "naming conventions"
  Result: Instant answer, 0 tokens used
```

### Example 2: Before loading context
```
Tachikoma (internal):
  Intent: implement (confidence: 0.85)
  Action: Verify context files exist
  Command: bash router.sh discover
  Result: Knows which files to load
```

### Example 3: System health check
```
Tachikoma (internal):
  On startup: Check context system health
  Command: bash router.sh status
  Result: Reports context directory state
```

**Token savings**: ~300 tokens per extraction vs asking LLM to search.

---

## Operations

---

## Operations Reference

### 1. DISCOVER - Find Context Files

**Purpose**: List all context files with sizes

**Usage**:
```bash
bash router.sh discover
```

**Example Output**:
```
══════════════════════════════════════════════════════════
DISCOVER: Finding Context Files
══════════════════════════════════════════════════════════

Found 6 context files:

  00-core-contract.md (4.0K)
  10-coding-standards.md (6.0K)
  15-commenting-rules.md (3.0K)
  20-git-workflow.md (5.0K)
  30-research-methods.md (4.0K)
  50-prompt-safety.md (3.0K)

✓ Discovery complete
```

---

### 2. FETCH - External Documentation

**Purpose**: Guide for fetching live docs from libraries

**Usage**:
```bash
bash router.sh fetch "React" "hooks"
```

**Note**: This prints instructions for using Context7 API. For actual fetching, use the context7 skill.

---

### 3. HARVEST - Extract from Summaries

**Purpose**: Convert temporary analysis files into permanent context

**Usage**:
```bash
bash router.sh harvest ANALYSIS.md
```

**What it does**:
- Creates `.opencode/context-modules/40-{filename}.md`
- Extracts headers and key sections
- Adds metadata (source, date, dependencies)
- Ready to be added to intent-routes.yaml

---

### 4. EXTRACT - Pull Specific Info

**Purpose**: Find specific content in context files (grep with context)

**Usage**:
```bash
bash router.sh extract coding-standards "naming conventions"
bash router.sh extract 00-core-contract "stop conditions"
```

**Why use this**: Faster than asking LLM to search, zero tokens.

---

### 5. ORGANIZE - Restructure by Priority

**Purpose**: Analyze context file organization by priority numbers

**Usage**:
```bash
bash router.sh organize
```

**Shows**:
- Priority 0-9: Core files
- Priority 10-19: Standards
- Priority 20-29: Workflows
- Priority 30+: Methods & Custom

---

### 6. CLEANUP - Remove Stale Files

**Purpose**: Delete temporary files older than N days

**Usage**:
```bash
bash router.sh cleanup .tmp/ 7
bash router.sh cleanup .tmp/external-context/ 3
```

**Safety**: Asks for confirmation before deleting.

---

### 7. STATUS - Health Check

**Purpose**: Show overview of context system

**Usage**:
```bash
bash router.sh status
```

**Shows**:
- Context directory size and file count
- Temporary files that could be cleaned
- Navigation file status

---

## Agent Workflows

### Workflow 1: Intent Classification → Context Loading

```
User: "Fix the bug in authentication"

Tachikoma:
  1. Classify: intent=debug, confidence=0.92
  2. Discover context files: bash router.sh discover
  3. Load: core-contract + coding-standards
  4. Route to: code-agent skill
```

### Workflow 2: Quick Information Retrieval

```
User: "What are our testing standards?"

Tachikoma:
  1. Classify: intent=research, confidence=0.88
  2. Extract info: bash router.sh extract coding-standards "testing"
  3. Parse output (0 tokens)
  4. Present answer with source citation
```

### Workflow 3: Harvesting Research Results

```
User: "Save this analysis as context"

Tachikoma:
  1. Harvest: bash router.sh harvest ANALYSIS.md
  2. Creates: .opencode/context-modules/40-analysis.md
  3. Updates: intent-routes.yaml (if needed)
  4. Confirms: Context available for future use
```

---

## File Structure

```
.opencode/skills/context-manager/
├── SKILL.md              # This documentation
└── router.sh             # Bash router script (CLI)
```

**No dependencies**: Pure bash, works on any Unix-like system.

---

## Integration with Routing System

Tachikoma uses this skill during the routing phase (Step 3 of execution):

```
User Request
    ↓
[Intent Classification] → intent=debug, confidence=0.9
    ↓
[Load Context Modules] ← USES: context-manager skill
    ↓
    bash router.sh discover  # Verify files exist
    bash router.sh status    # Check health
    ↓
[Route to code-agent skill]
```

### When Context Manager is Invoked

1. **Before loading context** - `discover` verifies files exist
2. **During research** - `extract` answers specific questions
3. **After analysis** - `harvest` saves results to permanent context
4. **Maintenance** - `cleanup` keeps `.tmp/` under control

---

## Token Savings Summary

| Operation | Without CLI | With CLI | Savings |
|-----------|-------------|----------|---------|
| Discover files | 500 tokens | 0 tokens | 100% |
| Extract info | 300 tokens | 0 tokens | 100% |
| List files | 200 tokens | 0 tokens | 100% |
| **Per session** | ~1000 tokens | ~0 tokens | **1000+ tokens** |

---

## Integration with Production Patterns

### Structured Summarization (Anchored Iterative)

**Purpose:** Maintain persistent structured summaries with explicit sections that force preservation during context compression.

**Integration Point:** Use structured summarization when harvesting or organizing context to prevent silent information drift.

**Template:**
```markdown
## Session Intent
{intent}

## Files Modified
{files_modified}

## Files Read (Not Modified)
{files_read}

## Decisions Made
{decisions}

## Current State
{current_state}

## Next Steps
{next_steps}
```

**Benefits:**
- 2.2-2.5/5.0 artifact trail integrity (vs baseline 1.5/5.0)
- Explicit sections act as checklists
- Easier verification of what was preserved
- Reduces re-fetch costs

**Implementation:** See `.opencode/patterns/production-patterns.md` for details.

### Progressive Disclosure

**Purpose:** Load summaries first, details only on demand. Never load full content upfront.

**Benefits:** Up to 80% token savings for large document collections.

**Integration Point:** Apply progressive disclosure when dealing with large document sets or multi-step workflows.

### Probe-Based Evaluation

**Purpose:** Generate specific questions (probes) instead of generic summaries to test factual retention and artifact tracking.

**Integration Point:** Use probe-based evaluation to verify context quality after operations.

See: `.opencode/cli/compression-evaluator.ts` and `.opencode/skills/reflection-orchestrator/SKILL.md` for details.

---

**Context Manager Skill** - Zero-token context operations for Tachikoma 🚀
