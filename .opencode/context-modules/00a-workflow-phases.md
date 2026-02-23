---
module_id: workflow-phases
name: Workflow Phases & Checkpoints
version: 2.4.0
description: Workflow phases, checkpoints, and mandatory phases. Extended from 00-core-contract-base.md
priority: 0
type: core
depends_on:
  - core-contract
exports:
  - workflow_phases
  - checkpoints
  - context_reloading
---

# Workflow Phases & Checkpoints

> **Extended from**: 00-core-contract-base.md
> **Purpose**: Defines the mandatory workflow phases and checkpoint system

---

## ⚠️ MANDATORY PHASES

**You MUST follow these phases in order. Skipping phases is a contract violation.**

---

### Phase 0: SPEC FOLDER SETUP (for non-trivial tasks)

For tasks that will produce artifacts:

```bash
bun run .opencode/cli/spec-setup.ts "<task-name>"
```

Creates: `todo.md` + `SPEC.md` + `design.md` + `tasks.md` + `boundaries.md`

**Task Slug Format**: Lowercase, alphanumeric, max 5 words, hyphens between.

- "fix auth bug" → `fix-auth-bug`
- "Add OAuth login to app" → `add-oauth-login-to`

**Artifacts Location**: `.opencode/agents/tachikoma/spec/{slug}/reports/`

---

### Phase 0.5: STATE.md Update (REQUIRED)

**Before starting**:

1. Read `.opencode/STATE.md` to understand current position
2. Check for active blockers or boundaries
3. Update Current Position with new task, Last Activity, Status = "Planning"

**After completing**:

1. Update Status (Complete/Partial/Blocked)
2. Log decisions in Accumulated Context
3. Update Session Continuity section

---

### Phase 1: Intent Classification (REQUIRED)

Run at every user message. Re-classify when intent changes (research → implement, etc.)

```bash
bun run .opencode/cli/router.ts full "{user_query}" --json
```

If CLI fails or confidence < 0.5: `skill({ name: "intent-classifier" })`

---

### Phase 2: Context Loading (REQUIRED)

Let router determine what to load:

1. Classify intent: `bun run .opencode/cli/router.ts full "{user_query}" --json`
2. Router returns route (intent, context_modules, skill, loading_method)
3. Load context modules based on router's output
4. Load skill using router's `load_instruction`

---

### Phase 3: Skill/Subagent Loading (REQUIRED)

Load skills using router's `load_instruction`:

```bash
skill({ name: "<skill_name>" })
```

---

**Subagent vs Skill**:

- **Skill**: Load and follow instructions yourself

  ```pseudocode example
  skill({ name: "code-agent" })
  # Then execute: Read, Edit, Bash directly
  ```

- **Subagent**: Delegate and wait for result

  ```pseudocode example
  task(subagent_type='rlm-subcall',
       description='Analyze large diff',
       prompt='Extract changelog entries from /tmp/diff.txt')
  # Wait for subagent to return result
  ```

- **Hybrid**: Use tools to prepare data, delegate analysis, apply results
  ```bash
  # Step 1: Generate data with tools
  git diff master...dev > /tmp/diff.txt
  # Step 2: Delegate analysis
  task(subagent_type='rlm-subcall', prompt='Analyze /tmp/diff.txt')
  # Step 3: Apply results
  Edit CHANGELOG.draft.md
  ```

---

### Phase 3.5: Output Protocol (RECOMMENDED for Research/Analysis Tasks)

For research/analysis/planning/specification tasks: **Present findings → Confirm → Delegate writing**

1. **Present**: Summarize findings (1-2K tokens), ask "Should I write full spec/report?"
2. **Wait**: For explicit "yes"/"proceed"/"looks good"
3. **Delegate**: `task(subagent_type='specification-writer', prompt='Write spec at spec/{slug}/report.md')`

**Avoid for**: Quick code edits, simple clarifications, or when user says "Write it now"

---

### Phase 4: Execute (REQUIRED)

Follow the skill's instructions. The skill defines:

- Operating constraints
- Definition of done
- Validation requirements

**For research/analysis tasks**: Apply Phase 3.5 Output Protocol above.

---

### Phase 5: UNIFY (MANDATORY)

After execution completes, you MUST run the UNIFY phase:

1. **Compare Planned vs. Actual**
   - Read `spec/{slug}/design.md` and `spec/{slug}/changes.md`
   - Document any deviations and reasons

2. **Verify Acceptance Criteria**
   - Read `spec/{slug}/SPEC.md` for BDD acceptance criteria
   - For each AC (AC-1, AC-2, AC-3...):
     - Run verification steps
     - Document Pass/Fail in SUMMARY.md
   - If any AC fails: Do not mark task complete

3. **Create SUMMARY.md**

   ```bash
   bun run .opencode/cli/unify.ts <slug> <duration>
   ```

4. **Update STATE.md**

   ```bash
   bun run .opencode/cli/state-update.ts complete-task "{slug}" "{duration}"
   ```

5. **Update todo.md**
   - Mark all tasks complete
   - Add completion timestamp

**UNIFY Checklist**:

- [ ] Compared planned vs. actual
- [ ] Verified all acceptance criteria
- [ ] Created SUMMARY.md
- [ ] Updated STATE.md
- [ ] Logged decisions
- [ ] Updated todo.md

---

### Phase 6: SESSION SUMMARY (REQUIRED)

```
## Session Summary

**Task**: {task-name}
**Spec Folder**: .opencode/agents/tachikoma/spec/{slug}/
**Status**: COMPLETED / PARTIAL

### What was done
- [Key actions]

### Artifacts created
- .opencode/agents/tachikoma/spec/{slug}/SUMMARY.md
- .opencode/STATE.md (updated)

### UNIFY Results
- [X/Y] Acceptance criteria passed

---
To review: .opencode/agents/tachikoma/spec/{slug}/
---
```

**Reflection:** See `00d-reflection-phase.md` for reflection guidelines.

---

## Context Re-loading

**When to re-load**: Checkpoint reached, user signals change ("Looks good, proceed"), or intent changes

**How to re-load** (OLD → NEW intent):

1. Re-classify: `bun run .opencode/cli/router.ts full "{user_message}" --json`
2. Load: `00-core-contract-base.md` + context modules for NEW intent
3. Load skill for NEW intent
4. Continue with NEW context (NOT old)

**Example (research → implement)**:

- Keep: `00-core-contract-base.md`
- Unload: `30-research-methods.md`
- Load: `10-coding-standards.md`, `12-commenting-rules.md`

---

## Checkpoints

**Purpose**: Decision points to re-evaluate intent and re-load context

**Types**:

- **Initial** (before any work): Classify, load context ✅
- **Milestone** (after major phase): Re-classify, re-load if changed ✅
- **Context Switch** (user signals change): "Looks good, proceed", "Implement this" → re-classify ✅
- **Final** (before completion): Verify, create summary ✅

**Signals**: "Actually implement", "Looks good, proceed", "Wait, fix this first"

**Mandatory**: Initial, Milestone, Final

**State tracking**: `.opencode/cli/workflow-state.ts`

---

## Hybrid Execution Model

**Pattern**: Tools to prepare → Subagent to analyze → Apply results

**Example (git-diff-analysis)**:

```bash
# Step 1: Generate data
git diff master...dev > /tmp/diff.txt

# Step 2: Delegate analysis
task(subagent_type='rlm-subcall', description='Analyze diff', prompt='Extract changelog from /tmp/diff.txt')

# Step 3: Apply results
Edit CHANGELOG.draft.md
```
