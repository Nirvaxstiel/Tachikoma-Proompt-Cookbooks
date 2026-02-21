#!/usr/bin/env bash
# =============================================================================
# Spec Session Setup
# Creates .opencode/spec/{task-slug}/ structure for the session
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCODE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SPEC_DIR="$OPENCODE_DIR/spec"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo "Usage: spec-setup.sh <task-name>"
    echo ""
    echo "Arguments:"
    echo "  task-name    The task/feature name (will be slugified)"
    echo ""
    echo "Examples:"
    echo "  spec-setup.sh \"fix auth bug\""
    echo "  spec-setup.sh \"add oauth login\""
    exit 1
}

# Parse arguments
if [ $# -eq 0 ]; then
    usage
fi

TASK_NAME="$1"

# Slugify: lowercase, alphanumeric only, max 5 words
slugify() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g' | tr -s ' ' | cut -d' ' -f1-5 | tr ' ' '-'
}

SLUG=$(slugify "$TASK_NAME")
SESSION_DIR="$SPEC_DIR/$SLUG"
REPORTS_DIR="$SESSION_DIR/reports"

# Create directory structure
mkdir -p "$REPORTS_DIR"

# Initialize STATE.md if it doesn't exist
STATE_FILE="$OPENCODE_DIR/STATE.md"
if [ ! -f "$STATE_FILE" ]; then
    cat > "$STATE_FILE" << EOF
# Project State

## Project Reference

**Current focus**: [Current task/milestone from projects/tasks]

---

## Current Position

**Task**: [task-slug] | **Phase**: [current phase] | **Status**: [Planning | Executing | Validating | Cleanup | Complete | Blocked]
**Last activity**: [YYYY-MM-DD HH:MM] — [What happened]

### Progress
- Task completion: [░░░░░░░░░░] 0%
- Current phase: [░░░░░░░░░░] 0%

---

## Loop Position

Current loop state:
\`\`\`
ANALYZE ──▶ DESIGN ──▶ IMPLEMENT ──▶ VALIDATE ──▶ CLEANUP
  ✓        ✓         ◉               ○                ○    [Implementing]
\`\`\`

---

## Performance Metrics

### Velocity
- **Total tasks completed**: 0
- **Average duration**: 0 min
- **Total execution time**: 0.0 hours

### By Task Type

| Type | Tasks | Total Time | Avg/Task |
|------|-------|------------|----------|
| implement | 0/0 | - | - |
| refactor | 0/0 | - | - |
| debug | 0/0 | - | - |
| research | 0/0 | - | - |

### Recent Trend
- Last 5 tasks: -
- Trend: Stable

*Updated after each task completion*

---

## Accumulated Context

### Decisions

Decisions logged during task execution. Recent decisions affecting current work:

| Decision | Task | Impact |
|----------|------|--------|
| *No decisions yet* | - | - |

*Full logs in spec/{task-slug}/SUMMARY.md*

---

### Deferred Issues

Issues logged but not yet addressed:

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| *No deferred issues* | - | - | - |

---

### Blockers/Concerns

Active blockers affecting progress:

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| *No active blockers* | - | - |

---

## Boundaries (Active)

Protected elements for current task (from spec/{task-slug}/boundaries.md):

*No active boundaries*

---

## Session Continuity

**Last session**: $(date '+%Y-%m-%d %H:%M')
**Stopped at**: Task "$TASK_NAME" created
**Next action**: Fill in SPEC.md requirements and approach
**Resume context**: New task "$SLUG" initialized, ready for planning

---

## RLM State (if applicable)

**Active**: No
**Last context path**: -
**Last chunk processed**: -
**Pending results**: -

---

---

*STATE.md — Updated after every significant action*
*Size target: <100 lines (digest, not archive)*
EOF
    echo -e "${BLUE}STATE.md initialized${NC}"
else
    echo -e "${BLUE}STATE.md already exists, will update${NC}"
fi

# Create todo.md
cat > "$SESSION_DIR/todo.md" << EOF
# TODO - $TASK_NAME
**Started**: $(date '+%Y-%m-%d %H:%M') | **Status**: IN PROGRESS

## Task
$TASK_NAME

## Progress
- [ ] Task in progress...

## Notes
- Session slug: $SLUG
- Created: $(date '+%Y-%m-%d %H:%M')

---

*Artifacts should be saved to: .opencode/spec/$SLUG/reports/*
EOF

# Create SPEC.md (always)
cat > "$SESSION_DIR/SPEC.md" << EOF
# SPEC - $TASK_NAME

## Overview
[Fill in: What are we building?]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2

## Approach
[Fill in: How will we implement this?]

## Acceptance Criteria (BDD Format)

## AC-1: [Criterion Name]
\`\`\`gherkin
Given [precondition]
When [action]
Then [outcome]
\`\`\`

## AC-2: [Criterion Name]
\`\`\`gherkin
Given [precondition]
When [action]
Then [outcome]
\`\`\`
EOF

# Create design.md
cat > "$SESSION_DIR/design.md" << EOF
# Design - $TASK_NAME

## Architecture
[Fill in: High-level design]

## Data Flow
[Fill in: How data flows through the system]

## Interfaces
[Fill in: API/functions to implement]

## Error Handling
[Fill in: How errors are handled]
EOF

# Create tasks.md
cat > "$SESSION_DIR/tasks.md" << EOF
# Tasks - $TASK_NAME

## Context Estimate

**Target**: Use ~50% of available context
**Tasks**: 2-3 maximum (split large work into multiple plans)
**Current bracket**: [FRESH >70% | MODERATE 40-70% | DEEP 20-40% | CRITICAL <20%]

---

## Task List

### Task 1.1: [Task Name]

### Objective
[What this task accomplishes]

### Requirements
- [Requirement 1]: [Details]
- [Requirement 2]: [Details]

### Acceptance Criteria
- [ ] AC-1: [criterion this satisfies]
- [ ] AC-2: [criterion this satisfies]

### Implementation Details
- [Files to modify]: [List]
- [New files to create]: [List]
- [Dependencies]: [Other tasks or components]
- [Complexity estimate]: [Low/Medium/High]

### Verification
- [ ] Test command: [how to verify]
- [ ] Expected output: [what success looks like]

### Done Criteria
- [ ] Code implemented
- [ ] Verification passes
- [ ] AC-1 satisfied
- [ ] AC-2 satisfied

---

### Task 1.2: [Task Name]

### Objective
[What this task accomplishes]

### Requirements
- [Requirement 1]: [Details]

### Acceptance Criteria
- [ ] AC-3: [criterion this satisfies]

### Implementation Details
- [Files to modify]: [List]
- [New files to create]: [List]

### Verification
- [ ] Test command: [how to verify]
- [ ] Expected output: [what success looks like]

### Done Criteria
- [ ] Code implemented
- [ ] Verification passes
- [ ] AC-3 satisfied

---

## Dependencies
- Task 1.1 → Task 1.2
- Task 1.2 → [next task]

## Notes
[Additional notes, blockers, or considerations]
EOF

# Create boundaries.md
cat > "$SESSION_DIR/boundaries.md" << EOF
# Boundaries - $TASK_NAME

## DO NOT CHANGE
- [Protected file/pattern]
- [Another protected element]

## SAFE TO MODIFY
- [Allowed file/pattern]
- [Another allowed element]

## PROTECTED PATTERNS
- [Pattern to avoid]
EOF

# Output for user
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Spec Session Created${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Task: ${GREEN}$TASK_NAME${NC}"
echo -e "Slug: ${GREEN}$SLUG${NC}"
echo -e "Folder: ${GREEN}$SESSION_DIR${NC}"
echo ""
echo -e "Files created:"
echo -e "  ${GREEN}├── todo.md${NC}"
echo -e "  ${GREEN}├── SPEC.md${NC} (with BDD acceptance criteria)"
echo -e "  ${GREEN}├── design.md${NC}"
echo -e "  ${GREEN}├── tasks.md${NC}"
echo -e "  ${GREEN}└── boundaries.md${NC} (protected files/patterns)"
echo ""
echo -e "${YELLOW}Remember: Save artifacts to .opencode/spec/$SLUG/reports/${NC}"
echo -e "${YELLOW}Update .opencode/STATE.md when task starts/completes${NC}"
echo ""
