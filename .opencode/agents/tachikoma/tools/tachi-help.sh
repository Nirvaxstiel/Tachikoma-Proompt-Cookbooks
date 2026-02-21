#!/usr/bin/env bash
# =============================================================================
# Tachikoma Help - Show all available commands
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TACHIKOMA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OPENCODE_DIR="$(cd "$TACHIKOMA_DIR/../.." && pwd)"
DOC_DIR="$TACHIKOMA_DIR/docs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo "Usage: tachi-help"
    echo ""
    echo "Shows all Tachikoma commands and their purpose."
    echo ""
    exit 0
}

# Commands organized by category
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Tachikoma Commands${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Core Workflow
echo -e "${GREEN}Core Workflow${NC}"
echo -e "  ${YELLOW}spec-setup <task-name>${NC}            Create task spec (STATE.md initialized)"
echo -e "  ${YELLOW}state-update.sh <command> [args]${NC}       Manage project state (8 commands)"
echo -e "  ${YELLOW}unify-phase.sh <task-slug> <duration>${NC}   Mandatory loop closure (UNIFY)"
echo -e "  ${YELLOW}pause-handoff.sh [--reason <reason>]${NC}   Create handoff for break"
echo -e "  ${YELLOW}resume-handoff.sh [handoff-file]${NC}        Resume from handoff (next action)"
echo ""

# Helper Commands
echo -e "${GREEN}Helper Commands${NC}"
echo -e "  ${YELLOW}/tachikoma:progress${NC}                         Show progress with ONE next action"
echo ""

echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}For detailed usage, see:${NC}"
echo -e "  ${GREEN}/tachikoma:progress --help${NC}"
echo -e "  ${GREEN}state-update.sh --help${NC}"
echo -e "  ${GREEN}See docs/STATE-MD-QUICK-START.md for complete guides${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
