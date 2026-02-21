#!/usr/bin/env bash
# =============================================================================
# Resume Handoff - Restore context from handoff document
# Reads HANDOFF-{date}.md and suggests ONE next action
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TACHIKOMA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OPENCODE_DIR="$(cd "$TACHIKOMA_DIR/../.." && pwd)"
HANDOFF_DIR="$TACHIKOMA_DIR/handoffs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo "Usage: resume-handoff.sh [handoff-file]"
    echo ""
    echo "Arguments:"
    echo "  handoff-file    Path to HANDOFF-{date}.md file (optional)"
    echo "                  If not provided, uses most recent handoff"
    echo ""
    echo "What this does:"
    echo "  1. Read and display handoff document"
    echo "  2. Read current STATE.md"
    echo "  3. Compare handoff vs. current state"
    echo "  4. Suggest ONE next action"
    echo ""
    echo "Output: Displays handoff context and suggests next action"
    echo ""
    exit 1
}

# Parse arguments
HANDOFF_FILE=""

if [ -n "$1" ]; then
    HANDOFF_FILE="$1"
fi

# Find most recent handoff if not provided
if [ -z "$HANDOFF_FILE" ]; then
    HANDOFF_FILE=$(ls -t "$HANDOFF_DIR"/HANDOFF-*.md 2>/dev/null | head -1)
    if [ -z "$HANDOFF_FILE" ]; then
        echo -e "${RED}Error: No handoff files found in $HANDOFF_DIR${NC}"
        echo -e "${YELLOW}Hint: Run pause-handoff.sh first to create a handoff${NC}"
        exit 1
    fi
fi

# Check if handoff file exists
if [ ! -f "$HANDOFF_FILE" ]; then
    echo -e "${RED}Error: Handoff file not found: $HANDOFF_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Resume from Handoff${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Handoff file: ${GREEN}$HANDOFF_FILE${NC}"
echo ""

# Display handoff document
echo -e "${YELLOW}Reading handoff...${NC}"
cat "$HANDOFF_FILE"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Current State Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check current STATE.md
STATE_FILE="$OPENCODE_DIR/STATE.md"
if [ ! -f "$STATE_FILE" ]; then
    echo -e "${YELLOW}Warning: STATE.md not found at $STATE_FILE${NC}"
    echo -e "${YELLOW}No state comparison possible${NC}"
else
    echo -e "${YELLOW}Reading STATE.md...${NC}"
    CURRENT_STATE=$(grep -A 5 "## Current Position" "$STATE_FILE")
    echo -e "${GREEN}Current STATE.md Position:${NC}"
    echo "$CURRENT_STATE"
    echo ""
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Suggested Next Action${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Suggest ONE next action based on handoff
NEXT_ACTION=$(grep "Next action:" "$HANDOFF_FILE" | head -1 | sed 's/Next action: //')

if [ -n "$NEXT_ACTION" ]; then
    echo -e "${GREEN}Next Action:${NC} $NEXT_ACTION"
else
    echo -e "${YELLOW}No next action found in handoff${NC}"
    echo -e "${YELLOW}Review handoff and determine next step${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Resume Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Ready to continue work${NC}"
echo ""
