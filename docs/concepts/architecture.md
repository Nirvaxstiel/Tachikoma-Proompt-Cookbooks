# Architecture

Detailed technical architecture of Tachikoma.

## System Overview

Tachikoma is organized into several key systems:

```
┌─────────────────────────────────────────────────────────────┐
│                     Intent Router                           │
│                    (Intent Classification)                  │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Context Manager                          │
│              (Position-Aware Loading)                       │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     Skill System                            │
│            (Skill Discovery & Execution)                    │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Tool Layer                               │
│           (File, Bash, Search, Subagent)                    │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Quality Systems                           │
│              (PAUL + CARL)                                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Intent Router

**Purpose:** Classify and route user requests

**Responsibilities:**

- Extract intent keywords from user input
- Match against configured routes
- Evaluate confidence score
- Select optimal execution strategy

**Configuration:** `config/intent-routes.yaml`

```yaml
routes:
  debug:
    patterns: ["debug", "fix bug", "troubleshoot"]
    confidence_threshold: 0.7
    skill: code-agent
    strategy: direct
```

**Decision Logic:**

```
User Input
    ↓
Extract Keywords
    ↓
Match Routes
    ↓
Confidence > 0.7?
    ├── NO → Ask clarification
    ↓ YES
Context > 2000 tokens?
    ├── YES → RLM subagent
    ↓ NO
Task Complexity?
    ├── Simple → Direct response
    ├── Medium → Single skill
    ├── High → Skill chain
    └── Very High → RLM orchestration
```

### 2. Context Manager

**Purpose:** Load and manage project-specific context

**Responsibilities:**

- Load AGENTS.md (project rules)
- Load context modules
- Compress context when needed
- Optimize for position bias

**Discovery Order:**

1. Local: `cwd/.opencode/context-modules/`
2. Global: `~/.config/opencode/context-modules/`

**Position Optimization:**

```
[Critical Rules] ← 100% attention
    ↓
[Supporting Details] ← 75% attention
    ↓
[Context Details] ← 50% attention
    ↓
[Less Important] ← 50% attention
    ↓
[Critical Rules] ← 100% attention
```

**Compression:**

Triggered at 70-80% context utilization:

```markdown
## Files Changed (23 files)

### Core (8 files)

- src/core/router.ts
- src/core/middleware.ts
  ...

### Services (7 files)

- src/services/auth.service.ts
  ...

### Tests (8 files)

- tests/auth.test.ts
  ...
```

### 3. Skill System

**Purpose:** Discover and execute specialized skills

**Discovery:**

1. Local: `cwd/.opencode/skills/` (takes precedence)
2. Global: `~/.config/opencode/skills/` (fallback)

**Skill Structure:**

```
.opencode/skills/
├── code/SKILL.md
├── refactor/SKILL.md
├── verification/SKILL.md
├── paul/SKILL.md
└── carl/SKILL.md
```

**Execution Flow:**

```
Skill Selected
    ↓
Load SKILL.md
    ↓
Load Context Module
    ↓
Load Tools
    ↓
Execute Task
    ↓
[Optional] Verification Loop
    ↓
Reflect & Report
```

### 4. Tool Layer

**Purpose:** Provide file system and execution capabilities

**Core Tools:**

| Tool        | Purpose                 |
| ----------- | ----------------------- |
| `read`      | Read files              |
| `write`     | Write files             |
| `edit`      | Edit files              |
| `bash`      | Execute commands        |
| `glob`      | Find files by pattern   |
| `grep`      | Search file contents    |
| `task`      | Launch subagents        |
| `skill`     | Load specialized skills |
| `question`  | Ask user for input      |
| `todowrite` | Manage task lists       |

**Model-Aware Editing:**

Dynamic edit format selection:

```typescript
tachikoma.edit-format-selector with args="detect"
```

### 5. PAUL Framework

**Plan-Apply-Unify Loop** — Structured development

**Three Phases:**

1. **PLAN**
   - Define objectives (what and why)
   - Set acceptance criteria (Given/When/Then format)
   - List tasks with verification steps
   - Set boundaries (DO NOT CHANGE sections)

2. **APPLY**
   - Execute tasks sequentially
   - Verify each task against acceptance criteria
   - Log deviations

3. **UNIFY** ← Never skip!
   - Reconcile plan vs actual
   - Create SUMMARY.md
   - Update STATE.md
   - Record decisions

**Never skip UNIFY.** Every plan needs closure. This is the heartbeat that prevents drift.

### 6. CARL Quality Gates

**Context Augmentation & Reinforcement Layer** — Dynamic rule loading

**Components:**

1. **Context Augmentation**
   - Detect active domains (PAUL, Development, Projects)
   - Load relevant rules just-in-time
   - Context stays lean

2. **Quality Gates**
   - Define rules by priority (Critical, High, Medium, Low)
   - Check compliance
   - Block critical violations

3. **Reinforcement Layer**
   - Enforce rules with priority
   - Block on critical failures
   - Warn on high-priority violations

## Data Flow

### Request Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  User Request: "Create user authentication API"             │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Intent Router                                              │
│  - Pattern: "create", "api"                                 │
│  - Confidence: 0.85                                         │
│  - Strategy: Single skill (code-agent)                      │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Context Manager                                            │
│  - Load system prompt                                       │
│  - Load code skill                                          │
│  - Load AGENTS.md                                           │
│  - Load architecture context module                         │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Skill System                                               │
│  - Load code skill                                          │
│  - Select edit format (str_replace)                         │
│  - Prepare tools                                            │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  PAUL Framework                                             │
│                                                             │
│  PLAN:                                                      │
│  - Objective: Create auth API                               │
│  - Acceptance: Returns JWT, handles errors                  │
│  - Tasks: Handler, JWT gen, tests                           │
│                                                             │
│  APPLY:                                                     │
│  - Task 1: Create handler ✓                                 │
│  - Task 2: JWT generation ✓                                 │
│  - Task 3: Tests ✓                                          │
│                                                             │
│  UNIFY:                                                     │
│  - Summary: Auth API created                                │
│  - Tests: Passing                                           │
│  - Next: Deploy to staging                                  │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Reflect                                                    │
│  - Consider adding refresh tokens                           │
│  - Suggest rate limiting                                    │
│  - Flag potential issues                                    │
└─────────────────────────────────────────────────────────────┘
```

### Skill Chain Data Flow

```
Skill 1: Research
    ↓
[Output: research-results.json]
    ↓
Skill 2: Planning
    [Input: research-results.json]
    ↓
[Output: plan.json]
    ↓
Skill 3: Implementation
    [Input: plan.json]
    ↓
[Output: implementation.json]
    ↓
Skill 4: Verification
    [Input: implementation.json]
    ↓
[Output: verification-report.json]
    ↓
Skill 5: Reporting
    [Input: All previous outputs]
    ↓
[Output: final-summary.json]
```

## File System Layout

### Local Installation

```
project/
├── AGENTS.md                  # Project-specific rules
└── .opencode/
    ├── agents/                # Primary agent + subagents
    ├── skills/                # Local skills
    ├── context-modules/       # Local context modules
    ├── cli/                   # TypeScript CLI tools
    ├── assets/                # Bundled Python + UV
    └── config/
        ├── intent-routes.yaml # Intent routing config
        ├── skill-chains.yaml  # Skill chain definitions
        └── edit-formats.yaml  # Model-specific edit formats
```

### Global Installation

```
~/.config/opencode/
├── agents/                    # Global agents
├── skills/                    # Shared skills
├── context-modules/           # Shared context modules
└── config/                    # Global config
```

## Configuration

### Intent Routes

```yaml
# config/intent-routes.yaml
routes:
  debug:
    patterns: ["debug", "fix", "troubleshoot"]
    confidence_threshold: 0.7
    skill: code-agent
    strategy: direct

  implement:
    patterns: ["implement", "create", "add"]
    confidence_threshold: 0.7
    skill_chain: feature-implementation
    strategy: sequential

  complex:
    patterns: ["refactor", "migrate", "optimize"]
    confidence_threshold: 0.5
    subagent: rlm-optimized
    strategy: rlm
```

### Skill Chains

```yaml
# config/skill-chains.yaml
feature-implementation:
  skills:
    - research
    - planning
    - code
    - verification
    - tests

  state:
    - task-list
    - plan-file
    - results-file

  error_handling:
    continue_on_error: true
    collect_errors: true
```

### Edit Formats

```yaml
# config/edit-formats.yaml
models:
  claude-3.5:
    format: str_replace
    confidence: 0.95

  gpt-4:
    format: apply_patch
    confidence: 0.90

  gemini:
    format: str_replace_fuzzy
    confidence: 0.85
```

## State Management

### Task List

Managed via `todowrite` tool:

```python
todowrite({
  "todos": [
    {"content": "Task 1", "status": "in_progress"},
    {"content": "Task 2", "status": "pending"},
    {"content": "Task 3", "status": "pending"}
  ]
})
```

### Plan Files

Save and load plan state:

```python
# Save
plan.save_state("plan_state.json")

# Load
plan = Plan.load_state("plan_state.json")
```

### Results Files

Pass data between skills:

```python
# Write results
file.write("results.json", results)

# Read results
results = file.read("results.json")
```

## Performance Considerations

### Token Efficiency

- Reference context modules (~15% savings)
- Compress context at 70-80% utilization
- Use structured summaries
- Write large outputs to files

### Latency

| Strategy          | Latency | When to Use          |
| ----------------- | ------- | -------------------- |
| Direct response   | 1-2s    | Simple queries       |
| Single skill      | 5-15s   | Focused tasks        |
| Skill chain       | 15-45s  | Multi-step workflows |
| RLM orchestration | 45-120s | Large contexts       |

### Context Limits

| Metric              | Threshold     | Action            |
| ------------------- | ------------- | ----------------- |
| Context utilization | > 80%         | Compress          |
| History length      | > 5000 tokens | Summarize         |
| File count          | > 20 files    | Group by category |

## Security

### Input Validation

- All user input treated as potentially malicious
- Validate external data before use
- Sanitize generated code

### Code Safety

- Warn before destructive operations
- No secrets in generated code
- Parameterized queries
- Auth checks included

### Tool Safety

- Warn on `rm -rf`, `DROP`, etc.
- Careful with network exposure
- Validate file access

## See Also

- [Internals](../internals/) — Implementation details
- [Capabilities](../capabilities/index.md) — Feature documentation
- [Research](../research/overview.md) — Research backing
