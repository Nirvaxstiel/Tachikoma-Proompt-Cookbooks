#!/usr/bin/env bash
# =============================================================================
# Pause Handoff - Comprehensive context for zero-context resumption
# Creates HANDOFF-{date}.md with full context for next session
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TACHIKOMA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OPENCODE_DIR="$(cd "$TACHIKOMA_DIR/../.." && pwd)"
STATE_FILE="$OPENCODE_DIR/STATE.md"
HANDOFF_DIR="$TACHIKOMA_DIR/handoffs"
mkdir -p "$HANDOFF_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo "Usage: pause-handoff.sh [--reason \"<reason>\"]"
    echo ""
    echo "Creates a comprehensive handoff document for zero-context resumption."
    echo ""
    echo "Arguments:"
    echo "  --reason    Optional reason for pause (e.g., 'end of day', 'context limit')"
    echo ""
    echo "What this does:"
    echo "  1. Read current STATE.md"
    echo "  2. Read current task's spec (SPEC.md, tasks.md, design.md)"
    echo "  3. Create HANDOFF-{date}.md with:"
    echo "     - What was accomplished this session"
    echo "     - What's in progress"
    echo "     - Key decisions made"
    echo "     - Current blockers"
    echo "     - Exact next action"
    echo "     - Loop position (PLAN/APPLY/UNIFY markers)"
    echo "  4. Update STATE.md Session Continuity"
    echo ""
    echo "Output: .opencode/agents/tachikoma/handoffs/HANDOFF-{YYYYMMDD-HHMM}.md"
    echo ""
    exit 1
}

# Parse arguments
REASON="session pause"

while [[ "$#" -gt 0 ]]; do
    case "$1" in
        --reason)
            REASON="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Check if STATE.md exists
if [ ! -f "$STATE_FILE" ]; then
    echo -e "${RED}Error: STATE.md not found at $STATE_FILE${NC}"
    echo -e "${YELLOW}Hint: Run spec-setup.sh first to initialize STATE.md${NC}"
    exit 1
fi

# Get current task slug from STATE.md
TASK_SLUG=$(grep "^\*\*Task\*\*:" "$STATE_FILE" | sed 's/.*: //' | tr -d ' ')
if [ -z "$TASK_SLUG" ]; then
    echo -e "${YELLOW}Warning: No active task found in STATE.md${NC}"
    TASK_SLUG="none"
fi

# Create handoff filename
TIMESTAMP=$(date '+%Y%m%d-%H%M')
HANDOFF_FILE="$HANDOFF_DIR/HANDOFF-$TIMESTAMP.md"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Creating Handoff Document${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Reason: ${GREEN}$REASON${NC}"
echo -e "Task slug: ${GREEN}$TASK_SLUG${NC}"
echo ""

# Read STATE.md to get current position
echo -e "${YELLOW}Reading STATE.md...${NC}"
CURRENT_POSITION=$(grep -A 2 "## Current Position" "$STATE_FILE")
LOOP_POSITION=$(grep -A 3 "## Loop Position" "$STATE_FILE")
PERFORMANCE=$(grep -A 10 "## Performance Metrics" "$STATE_FILE")
ACCUMULATED=$(grep -A 20 "## Accumulated Context" "$STATE_FILE")
SESSION_CONTINUITY=$(grep -A 3 "## Session Continuity" "$STATE_FILE")

echo -e "${GREEN}✓ STATE.md read${NC}"
echo ""

# Read task spec if exists
SPEC_FILE="$TACHIKOMA_DIR/spec/$TASK_SLUG/SPEC.md"
TASKS_FILE="$TACHIKOMA_DIR/spec/$TASK_SLUG/tasks.md"
DESIGN_FILE="$TACHIKOMA_DIR/spec/$TASK_SLUG/design.md"

# Create handoff document
cat > "$HANDOFF_FILE" << HANDOFF_EOF
# Handoff: $(date '+%Y-%m-%d %H:%M')

**Reason**: $REASON
**Task slug**: $TASK_SLUG

---

## Session Summary

### What Was Accomplished

$CURRENT_POSITION

---

### What's In Progress

Tasks currently being worked on:

HANDOFF_EOF

# Add tasks in progress
if [ -f "$TASKS_FILE" ]; then
    echo "Current tasks (from tasks.md):" >> "$HANDOFF_FILE"
    grep -A 100 "## Task List" "$TASKS_FILE" | head -50 >> "$HANDOFF_FILE"
else
    echo "No tasks.md found for task: $TASK_SLUG" >> "$HANDOFF_FILE"
fi

cat >> "$HANDOFF_FILE" << HANDOFF_EOF

---

## Key Decisions Made

$ACCUMULATED

### Decisions

Decisions logged during this session that affect ongoing or future work:

HANDOFF_EOF

# Extract recent decisions from STATE.md
grep -A 10 "| Decision | Task | Impact |" "$STATE_FILE" >> "$HANDOFF_FILE"

cat >> "$HANDOFF_FILE" << HANDOFF_EOF

### Blockers/Concerns

Active blockers that need attention:

HANDOFF_EOF

# Extract blockers from STATE.md
grep -A 10 "| Blocker | Impact | Resolution Path |" "$STATE_FILE" >> "$HANDOFF_FILE"

cat >> "$HANDOFF_FILE" << HANDOFF_EOF

---

## Loop Position

$LOOP_POSITION

**Current state**: [Planning | Applying | Unifying | Complete]

---

## Current Boundaries

Protected elements from boundaries.md:

HANDOFF_EOF

# Read boundaries if exists
BOUNDARIES_FILE="$TACHIKOMA_DIR/spec/$TASK_SLUG/boundaries.md"
if [ -f "$BOUNDARIES_FILE" ]; then
    cat >> "$HANDOFF_FILE" << BOUNDARIES_EOF
### Active Boundaries

$(cat "$BOUNDARIES_FILE")
BOUNDARIES_EOF
else
    echo "No boundaries.md found" >> "$HANDOFF_FILE"
fi

cat >> "$HANDOFF_FILE" << HANDOFF_EOF

---

## Performance Metrics

$PERFORMANCE

---

## Session Continuity

$SESSION_CONTINUITY

**Last session**: $(date '+%Y-%m-%d %H:%M')

**Stopped at**: $(grep "Last activity:" "$STATE_FILE" | head -1 | sed 's/Last activity: //')

**Next action**: $(grep "Next action:" "$STATE_FILE" | head -1 | sed 's/Next action: //')

**Resume context**: Key information needed to continue
- Current task: $TASK_SLUG
- Current position: $(grep "Status:" "$STATE_FILE" | head -1 | sed 's/.*Status: //' | awk '{print $2}')
- Handoff file: HANDOFF-$TIMESTAMP.md

---

## Technical Notes

Additional technical context for next session:

- Context remaining: [Estimated from recent work]
- Pending issues: [From STATE.md Deferred Issues]
- Dependencies: [From tasks.md Dependencies section]

---

## Files Modified in This Session

Use \`git status\` or \`git diff --stat\` to see what changed.

HANDOFF_EOF

echo -e "${GREEN}✓ Handoff created${NC}"
echo ""
echo -e "Handoff file: ${GREEN}$HANDOFF_FILE${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Handoff Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}To resume from this handoff:${NC}"
echo -e "${YELLOW}  bash .opencode/agents/tachikoma/tools/resume-handoff.sh HANDOFF-$TIMESTAMP.md${NC}"
echo ""
