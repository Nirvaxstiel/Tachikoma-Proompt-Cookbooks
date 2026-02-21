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
    echo "Usage: spec-setup.sh <task-name> [--simple]"
    echo ""
    echo "Arguments:"
    echo "  task-name    The task/feature name (will be slugified)"
    echo "  --simple     Create simple todo only (no full spec)"
    echo ""
    echo "Examples:"
    echo "  spec-setup.sh \"fix auth bug\""
    echo "  spec-setup.sh \"add oauth login\" --simple"
    exit 1
}

# Parse arguments
if [ $# -eq 0 ]; then
    usage
fi

TASK_NAME="$1"
SIMPLE=false

if [ "$2" = "--simple" ]; then
    SIMPLE=true
fi

# Slugify: lowercase, alphanumeric only, max 5 words
slugify() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g' | tr -s ' ' | cut -d' ' -f1-5 | tr ' ' '-'
}

SLUG=$(slugify "$TASK_NAME")
SESSION_DIR="$SPEC_DIR/$SLUG"
REPORTS_DIR="$SESSION_DIR/reports"

# Create directory structure
mkdir -p "$REPORTS_DIR"

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

# Create SPEC.md only if not simple mode
if [ "$SIMPLE" = false ]; then
    cat > "$SESSION_DIR/SPEC.md" << EOF
# SPEC - $TASK_NAME

## Overview
[Fill in: What are we building?]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2

## Approach
[Fill in: How will we implement this?]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
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

## Task List
- [ ] Task 1: Description
- [ ] Task 2: Description
- [ ] Task 3: Description

## Dependencies
- Task 1 → Task 2
- Task 2 → Task 3
EOF
fi

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
if [ "$SIMPLE" = false ]; then
    echo -e "  ${GREEN}├── SPEC.md${NC}"
    echo -e "  ${GREEN}├── design.md${NC}"
    echo -e "  ${GREEN}└── tasks.md${NC}"
else
    echo -e "  ${GREEN}(simple mode - no spec files)${NC}"
fi
echo ""
echo -e "${YELLOW}Remember: Save artifacts to .opencode/spec/$SLUG/reports/${NC}"
echo ""
