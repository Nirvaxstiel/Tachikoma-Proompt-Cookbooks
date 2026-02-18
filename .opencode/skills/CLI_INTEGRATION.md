# CLI Tools Integration Summary

How the context management CLI tools integrate with the Tachikoma orchestration system.

---

## Architecture

```
User Request
    ↓
Tachikoma (Primary Agent)
    ↓
Intent Classification (intent-classifier skill)
    ↓
Context Loading ← USES: context-manager skill
    ↓
[IF research intent] ← USES: context7 skill
    ↓
Route to specialist (skill/subagent)
    ↓
Execute with context
    ↓
Synthesize results
```

---

## Tools Overview

### 1. Context Manager (`.opencode/skills/context-manager/`)

**Purpose**: Zero-token context operations

**When Tachikoma uses it**:
- Before loading context → `discover` (verify files exist)
- Quick lookups → `extract` (0 tokens vs 300+ for LLM)
- System health → `status`
- Maintenance → `cleanup`

**Example invocation**:
```bash
# Before routing
tachikoma$ bash .opencode/skills/context-manager/router.sh discover

# During Q&A
tachikoma$ bash .opencode/skills/context-manager/router.sh extract coding-standards "naming"
```

---

### 2. Context7 (`.opencode/skills/context7/`)

**Purpose**: Live documentation for research intent

**When Tachikoma uses it**:
- Research intent detected (confidence > 0.8)
- Training data likely outdated (React, Next.js, etc.)
- User asks about library APIs

**Example invocation**:
```bash
# During research processing
tachikoma$ bash .opencode/skills/context7/router.sh quick "React" "hooks"

# Result: Current React 19 docs (not React 18 from training)
```

---

## Token Savings

| Operation | Without CLI | With CLI | Savings |
|-----------|-------------|----------|---------|
| Context discovery | 500 tokens | 0 tokens | 100% |
| Info extraction | 300 tokens | 0 tokens | 100% |
| Live docs fetch | 400 tokens | API call | Faster |
| **Per session** | ~1200 tokens | ~0 tokens | **1200+ tokens** |

---

## Routing Integration

### intent-routes.yaml

```yaml
routes:
  debug:
    confidence_threshold: 0.7
    context_modules:
      - core-contract
      - coding-standards
    skill: code-agent
    # Tachikoma runs: router.sh discover before loading

  research:
    confidence_threshold: 0.7
    context_modules:
      - core-contract
      - research-methods
    skill: research-agent
    # Tachikoma runs: router.sh quick "{lib}" "{topic}" for external docs
    tools:
      - Read
      - Bash  # For CLI tools
```

---

## Workflow Examples

### Example 1: Debug Intent

```
User: "Fix the typo in README"

Tachikoma:
  1. Classify: intent=debug, confidence=0.95
  2. Context Manager: discover
     → bash router.sh discover
     → Verifies context files exist
  3. Load: core-contract, coding-standards
  4. Route: code-agent skill
  5. Execute: Fix typo
  
Token cost: 0 (discovery via CLI)
```

### Example 2: Research Intent

```
User: "How do React Server Components work?"

Tachikoma:
  1. Classify: intent=research, confidence=0.91
  2. Context Manager: discover
     → Lists available context
  3. Context7: quick "React" "Server Components"
     → Fetches React 19 docs
     → Saves to .tmp/external-context/
  4. Load: core-contract, research-methods, + fetched docs
  5. Route: research-agent skill
  6. Execute: Explain with current examples
  
Token cost: 0 for discovery/fetch (CLI tools)
```

### Example 3: Harvesting

```
User: "Save this analysis"

Tachikoma:
  1. Context Manager: harvest ANALYSIS.md
     → Creates .opencode/context-modules/40-analysis.md
  2. Updates intent-routes.yaml (optional)
  3. Confirms: Available for future use
```

---

## File Structure

```
.opencode/
├── agents/
│   └── tachikoma.md          # Orchestrator (invokes CLI tools)
├── skills/
│   ├── context-manager/      # Context operations
│   │   ├── SKILL.md
│   │   └── router.sh
│   ├── context7/             # Live documentation
│   │   ├── SKILL.md
│   │   └── router.sh
│   └── intent-classifier/    # Routing decisions
├── context-modules/
│   └── *.md                  # Context modules (00-core-contract, etc.)
└── config/
    └── intent-routes.yaml    # Routing configuration
```

---

## Agent-Only Design

**No slash commands needed** - Tachikoma invokes these automatically:

- User asks natural questions
- Tachikoma classifies intent
- Tachikoma runs CLI tools internally
- Results presented seamlessly

**Why this works**:
- Zero cognitive load for users
- Consistent with OpenCode patterns
- Maximum token efficiency
- No maintenance of command wrappers

---

## Summary

The CLI tools are **agent-facing infrastructure**:

1. **Tachikoma discovers** context before loading (0 tokens)
2. **Tachikoma extracts** specific info when needed (0 tokens)
3. **Tachikoma fetches** live docs for research (current data)
4. **Tachikoma harvests** temporary files to permanent context

Users never run these directly - they just ask questions naturally, and Tachikoma uses the most efficient method automatically.
