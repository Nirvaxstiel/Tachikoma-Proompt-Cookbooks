#!/usr/bin/env bash
# =============================================================================
# STATE.md Updater
# Helper script to update STATE.md with task information
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCODE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_FILE="$OPENCODE_DIR/STATE.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo "Usage: state-update.sh <action> [options]"
    echo ""
    echo "Actions:"
    echo "  start-task <task-name> <task-slug>  - Initialize task in STATE.md"
    echo "  complete-task <task-slug> <duration> - Mark task as complete"
    echo "  add-decision <task-slug> <decision> <impact> - Add decision log"
    echo "  add-blocker <description> <impact> <resolution> - Add blocker"
    echo "  add-deferred <issue> <task-slug> <effort> <revisit> - Add deferred issue"
    echo "  update-status <status> - Update current status"
    echo "  set-boundary <boundary> - Set active boundary"
    echo "  show - Display current STATE.md"
    echo ""
    echo "Examples:"
    echo "  state-update.sh start-task \"Add OAuth\" \"add-oauth\""
    echo "  state-update.sh complete-task \"add-oauth\" \"45\""
    echo "  state-update.sh add-decision \"add-oauth\" \"Use JWT\" \"Affects all auth endpoints\""
    echo ""
    exit 1
}

# Check if STATE.md exists
if [ ! -f "$STATE_FILE" ]; then
    echo -e "${RED}Error: STATE.md not found at $STATE_FILE${NC}"
    echo -e "${YELLOW}Run spec-setup.sh first to initialize STATE.md${NC}"
    exit 1
fi

# Action: start-task
start_task() {
    local task_name="$1"
    local task_slug="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M')

    # Create temporary file
    local tmp_file=$(mktemp)

    # Update Current Position
    awk -v slug="$task_slug" -v name="$task_name" -v ts="$timestamp" '
    /\*\*Task\*\*: \[task-slug\]/ {
        print "**Task**: " slug " | **Phase**: Planning | **Status**: Planning"
        print "**Last activity**: " ts " — Task \"" name "\" started"
        next
    }
    { print }
    ' "$STATE_FILE" > "$tmp_file"

    mv "$tmp_file" "$STATE_FILE"

    echo -e "${GREEN}✓ Task started in STATE.md${NC}"
    echo -e "  Task: ${BLUE}$task_name${NC}"
    echo -e "  Slug: ${BLUE}$task_slug${NC}"
    echo -e "  Time: ${BLUE}$timestamp${NC}"
}

# Action: complete-task
complete_task() {
    local task_slug="$1"
    local duration="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M')

    # Create temporary file
    local tmp_file=$(mktemp)

    # Update Status and Last Activity
    awk -v slug="$task_slug" -v ts="$timestamp" -v dur="$duration" '
    /\*\*Task\*\*: [a-z0-9-]+ \| \*\*Phase\*\*: [a-zA-Z]+ \| \*\*Status\*\*: [a-zA-Z]+/ {
        if ($0 ~ slug) {
            print "**Task**: " slug " | **Phase**: Complete | **Status**: Complete"
            print "**Last activity**: " ts " — Task completed (" dur " min)"
            next
        }
    }
    { print }
    ' "$STATE_FILE" > "$tmp_file"

    mv "$tmp_file" "$STATE_FILE"

    echo -e "${GREEN}✓ Task marked as complete in STATE.md${NC}"
    echo -e "  Slug: ${BLUE}$task_slug${NC}"
    echo -e "  Duration: ${BLUE}$duration${NC} min"
}

# Action: add-decision
add_decision() {
    local task_slug="$1"
    local decision="$2"
    local impact="$3"

    # Create temporary file
    local tmp_file=$(mktemp)

    # Add to Decisions table - simpler pattern matching
    awk -v slug="$task_slug" -v dec="$decision" -v imp="$impact" '
    # Replace template row in Decisions section
    /\| \[Decision summary\] \| \[task-slug\] \| \[Ongoing effect\] \|/ {
        print "| " dec " | " slug " | " imp " |"
        next
    }
    # Also replace "No decisions yet" row
    /\| \*No decisions yet\* \| - \| - \|/ {
        print "| " dec " | " slug " | " imp " |"
        next
    }
    { print }
    ' "$STATE_FILE" > "$tmp_file"

    mv "$tmp_file" "$STATE_FILE"

    echo -e "${GREEN}✓ Decision logged in STATE.md${NC}"
    echo -e "  Decision: ${BLUE}$decision${NC}"
    echo -e "  Impact: ${BLUE}$impact${NC}"
}

# Action: add-blocker
add_blocker() {
    local description="$1"
    local impact="$2"
    local resolution="$3"

    # Create temporary file
    local tmp_file=$(mktemp)

    # Add to Blockers table - simpler pattern matching
    awk -v desc="$description" -v imp="$impact" -v res="$resolution" '
    # Replace template row in Blockers section
    /\| \[Description\] \| \[What.s blocked\] \| \[How to resolve\] \|/ {
        print "| " desc " | " imp " | " res " |"
        next
    }
    # Also replace "No active blockers" row
    /\| \*No active blockers\* \| - \| - \|/ {
        print "| " desc " | " imp " | " res " |"
        next
    }
    { print }
    ' "$STATE_FILE" > "$tmp_file"

    mv "$tmp_file" "$STATE_FILE"

    echo -e "${GREEN}✓ Blocker logged in STATE.md${NC}"
    echo -e "  Blocker: ${YELLOW}$description${NC}"
    echo -e "  Impact: ${YELLOW}$impact${NC}"
}

# Action: add-deferred
add_deferred() {
    local issue="$1"
    local task_slug="$2"
    local effort="$3"
    local revisit="$4"

    # Create temporary file
    local tmp_file=$(mktemp)

    # Add to Deferred Issues table - simpler pattern matching
    awk -v iss="$issue" -v slug="$task_slug" -v eff="$effort" -v rev="$revisit" '
    # Replace template row in Deferred Issues section
    /\| \[Brief description\] \| \[task-slug\] \| \[S/M/L\] \| \[When to reconsider\] \|/ {
        print "| " iss " | " slug " | " eff " | " rev " |"
        next
    }
    # Also replace "No deferred issues" row
    /\| \*No deferred issues\* \| - \| - \| - \|/ {
        print "| " iss " | " slug " | " eff " | " rev " |"
        next
    }
    { print }
    ' "$STATE_FILE" > "$tmp_file"

    mv "$tmp_file" "$STATE_FILE"

    echo -e "${GREEN}✓ Deferred issue logged in STATE.md${NC}"
    echo -e "  Issue: ${YELLOW}$issue${NC}"
    echo -e "  Revisit: ${YELLOW}$revisit${NC}"
}

# Action: update-status
update_status() {
    local status="$1"

    # Create temporary file
    local tmp_file=$(mktemp)

    # Update Status field
    awk -v status="$status" '
    /\*\*Status\*\*: \[Planning \| Executing \| Validating \| Cleanup \| Complete \| Blocked\]/ {
        sub(/\*\*Status\*\*: .*/, "**Status**: " status)
    }
    { print }
    ' "$STATE_FILE" > "$tmp_file"

    mv "$tmp_file" "$STATE_FILE"

    echo -e "${GREEN}✓ Status updated in STATE.md${NC}"
    echo -e "  New status: ${BLUE}$status${NC}"
}

# Action: set-boundary
set_boundary() {
    local boundary="$1"

    # Create temporary file
    local tmp_file=$(mktemp)

    # Add to Boundaries section - simpler pattern matching
    awk -v bound="$boundary" '
    # Replace "No active boundaries" text
    /\*\*No active boundaries\*\*/ {
        print "- [Protected file/pattern]"
        print "- " bound
        next
    }
    # Or replace the bullet placeholder
    /^\- \[Protected file\/pattern\]$/ {
        print "- [Protected file/pattern]"
        print "- " bound
        next
    }
    { print }
    ' "$STATE_FILE" > "$tmp_file"

    mv "$tmp_file" "$STATE_FILE"

    echo -e "${GREEN}✓ Boundary added to STATE.md${NC}"
    echo -e "  Boundary: ${BLUE}$boundary${NC}"
}

# Action: show
show_state() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Current STATE.md${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    cat "$STATE_FILE"
}

# Parse arguments
if [ $# -eq 0 ]; then
    usage
fi

ACTION="$1"
shift

case "$ACTION" in
    start-task)
        if [ $# -ne 2 ]; then
            echo -e "${RED}Error: start-task requires <task-name> <task-slug>${NC}"
            exit 1
        fi
        start_task "$1" "$2"
        ;;
    complete-task)
        if [ $# -ne 2 ]; then
            echo -e "${RED}Error: complete-task requires <task-slug> <duration>${NC}"
            exit 1
        fi
        complete_task "$1" "$2"
        ;;
    add-decision)
        if [ $# -ne 3 ]; then
            echo -e "${RED}Error: add-decision requires <task-slug> <decision> <impact>${NC}"
            exit 1
        fi
        add_decision "$1" "$2" "$3"
        ;;
    add-blocker)
        if [ $# -ne 3 ]; then
            echo -e "${RED}Error: add-blocker requires <description> <impact> <resolution>${NC}"
            exit 1
        fi
        add_blocker "$1" "$2" "$3"
        ;;
    add-deferred)
        if [ $# -ne 4 ]; then
            echo -e "${RED}Error: add-deferred requires <issue> <task-slug> <effort> <revisit>${NC}"
            exit 1
        fi
        add_deferred "$1" "$2" "$3" "$4"
        ;;
    update-status)
        if [ $# -ne 1 ]; then
            echo -e "${RED}Error: update-status requires <status>${NC}"
            exit 1
        fi
        update_status "$1"
        ;;
    set-boundary)
        if [ $# -ne 1 ]; then
            echo -e "${RED}Error: set-boundary requires <boundary>${NC}"
            exit 1
        fi
        set_boundary "$1"
        ;;
    show)
        show_state
        ;;
    *)
        echo -e "${RED}Error: Unknown action '$ACTION'${NC}"
        usage
        ;;
esac
