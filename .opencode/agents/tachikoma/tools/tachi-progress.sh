#!/usr/bin/env bash
# =============================================================================
# Tachikoma Progress - Show current progress with ONE next action
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCODE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_FILE="$OPENCODE_DIR/STATE.md"
SPEC_DIR="$OPENCODE_DIR/spec"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo "Usage: /tachikoma:progress"
    echo ""
    echo "Shows current project progress and suggests ONE next action."
    echo ""
    echo "Options:"
    echo "  --help    Show this help message"
    echo "  --verbose Show detailed progress"
    echo ""
    echo "Following Paul's philosophy: Reduce decision fatigue by suggesting ONE next action."
    echo ""
    exit 0
}

# Parse arguments
VERBOSE=false

while [[ "$#" -gt 0 ]]; do
    case "$1" in
        --help|-h)
            usage
            exit 0
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --*)
            echo -e "${RED}Unknown option: $1${NC}"
            echo -e "${YELLOW}Use --help for usage${NC}"
            exit 1
            ;;
        *)
            break
            ;;
    esac
done

# Helper function to extract STATE.md sections
extract_state_section() {
    local section="$1"
    awk "/^## $section/,/^## [A-Z]/ {exit}" "$STATE_FILE" 2>/dev/null
}

# Get current task and status
CURRENT_TASK=$(grep "^\*\*Task\*\*:" "$STATE_FILE" | sed 's/.*: //' | tr -d ' ')
CURRENT_PHASE=$(grep "^\*\*Phase\*\*:" "$STATE_FILE" | sed 's/.*Phase: //' | tr -d ' ')
CURRENT_STATUS=$(grep "^\*\*Status\*\*:" "$STATE_FILE" | sed 's/.*Status: //' | head -1 | tr -d ' ')

# Get active boundaries
CURRENT_BOUNDARIES=$(extract_state_section "Boundaries (Active)")

# Get last activity
LAST_ACTIVITY=$(grep "Last activity:" "$STATE_FILE" | head -1)

# Determine ONE next action based on status
if [ "$CURRENT_STATUS" = "Complete" ] || [ "$CURRENT_STATUS" = "Blocked" ]; then
    # If complete or blocked, suggest checking next task or resolving blocker
    if [ -n "$CURRENT_TASK" ] && [ -d "$SPEC_DIR/$CURRENT_TASK" ]; then
        # Active task exists, suggest unifying
        NEXT_ACTION="Run: /tachikoma:unify $CURRENT_TASK <duration>"
    elif [ "$CURRENT_STATUS" = "Blocked" ]; then
        NEXT_ACTION="Check blockers in STATE.md and resolve them"
    else
        NEXT_ACTION="Continue with current task in $CURRENT_TASK/tasks.md"
    fi
else
    # If in progress, suggest next step based on phase
    NEXT_ACTION="Continue working on task in $CURRENT_TASK/tasks.md"
fi

# Show progress summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Tachikoma Progress${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}Current Position${NC}"
echo "Task: ${GREEN}$CURRENT_TASK${NC}"
echo "Phase: ${GREEN}$CURRENT_PHASE${NC}"
echo "Status: ${GREEN}$CURRENT_STATUS${NC}"
echo ""
echo "Last Activity:"
echo "$LAST_ACTIVITY"
echo ""

if [ "$VERBOSE" = true ] && [ -n "$CURRENT_BOUNDARIES" ]; then
    echo ""
    echo -e "${YELLOW}Active Boundaries:${NC}"
    echo "$CURRENT_BOUNDARIES"
    echo ""
fi

if [ "$VERBOSE" = true ]; then
    echo ""
    echo -e "${YELLOW}Performance Metrics:${NC}"
    METRICS=$(grep -A 15 "### Velocity" "$STATE_FILE" | head -20)
    echo "$METRICS"
    echo ""
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Recommended Next Action${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}$NEXT_ACTION${NC}"
echo ""
echo -e "${YELLOW}Use --verbose for detailed state${NC}"
echo ""
echo -e "${YELLOW}Related Commands:${NC}"
echo -e "  /tachikoma:help         Show all commands"
echo -e "  /tachikoma:progress         Show this progress"
echo -e "  state-update.sh --help         Manage STATE.md"
echo ""
