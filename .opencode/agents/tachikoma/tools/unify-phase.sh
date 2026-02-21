#!/usr/bin/env bash
# =============================================================================
# UNIFY Phase Helper
# Mandatory closure for tasks - reconciles plan vs. actual
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TACHIKOMA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OPENCODE_DIR="$(cd "$TACHIKOMA_DIR/../.." && pwd)"
SUMMARY_TEMPLATE="$TACHIKOMA_DIR/templates/SUMMARY.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo "Usage: unify-phase.sh <task-slug> <duration-minutes>"
    echo ""
    echo "Arguments:"
    echo "  task-slug       The task slug (from spec-setup.sh)"
    echo "  duration-minutes Task execution duration in minutes"
    echo ""
    echo "What UNIFY does:"
    echo "  1. Compare planned vs. actual (design.md vs. files)"
    echo "  2. Verify acceptance criteria (from SPEC.md)"
    echo "  3. Create SUMMARY.md"
    echo "  4. Update STATE.md"
    echo "  5. Update todo.md"
    echo ""
    echo "Example:"
    echo "  unify-phase.sh \"add-auth\" \"45\""
    echo ""
    exit 1
}

# Parse arguments
if [ $# -ne 2 ]; then
    usage
fi

TASK_SLUG="$1"
DURATION="$2"
SPEC_DIR="$TACHIKOMA_DIR/spec/$TASK_SLUG"
SPEC_FILE="$SPEC_DIR/SPEC.md"
DESIGN_FILE="$SPEC_DIR/design.md"
TASKS_FILE="$SPEC_DIR/tasks.md"
TODO_FILE="$SPEC_DIR/todo.md"
SUMMARY_FILE="$SPEC_DIR/SUMMARY.md"

# Validate files exist
if [ ! -f "$SPEC_FILE" ]; then
    echo -e "${RED}Error: SPEC.md not found at $SPEC_FILE${NC}"
    exit 1
fi

if [ ! -f "$DESIGN_FILE" ]; then
    echo -e "${YELLOW}Warning: design.md not found at $DESIGN_FILE${NC}"
    echo -e "${YELLOW}Will create SUMMARY.md without planned vs. actual comparison${NC}"
fi

if [ ! -f "$TASKS_FILE" ]; then
    echo -e "${YELLOW}Warning: tasks.md not found at $TASKS_FILE${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Phase 5: UNIFY - $TASK_SLUG${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Compare Planned vs. Actual
echo -e "${YELLOW}Step 1: Comparing planned vs. actual...${NC}"

if [ -f "$DESIGN_FILE" ]; then
    echo -e "${GREEN}✓ Reading design.md${NC}"
    echo ""
    echo "PLANNED (from design.md):"
    cat "$DESIGN_FILE" | head -20
    echo ""
    echo "---"
    echo ""
    echo "ACTUAL (files changed):"
    git status --short 2>/dev/null | grep -E "^(M|A)" || echo "No changes detected (task may not be committed)"
    echo ""
else
    echo -e "${YELLOW}⚠ design.md not found, skipping planned vs. actual comparison${NC}"
fi

echo ""
read -p "Any deviations from plan? (press Enter if none, or describe): " DEVIATIONS
echo ""

# Step 2: Verify Acceptance Criteria
echo -e "${YELLOW}Step 2: Verifying acceptance criteria...${NC}"
echo ""

# Check for tasks.md with verification steps
TASKS_FILE="$SPEC_DIR/tasks.md"
HAS_VERIFICATION=false

if [ -f "$TASKS_FILE" ]; then
    if grep -q "### Verification" "$TASKS_FILE"; then
        HAS_VERIFICATION=true
    fi
fi

if [ "$HAS_VERIFICATION" = true ]; then
    echo -e "${GREEN}Found verification steps in tasks.md${NC}"
    echo ""
    
    # Extract and display verification steps
    grep -A 10 "### Verification" "$TASKS_FILE" | grep -v "^--$" | head -30
    echo ""
    echo "---"
    echo ""
fi

if grep -q "## AC-" "$SPEC_FILE"; then
    echo "ACCEPTANCE CRITERIA (from SPEC.md):"
    grep -A 5 "## AC-" "$SPEC_FILE" | head -40
    echo ""
    echo "---"
    echo ""

    if [ "$HAS_VERIFICATION" = true ]; then
        echo "AC VERIFICATION (from tasks.md):"
        echo "Running verification steps defined in tasks.md..."
        echo ""
        
        # Extract and run verification commands (if executable)
        grep -A 5 "### Verification" "$TASKS_FILE" | grep "Test command:" | sed 's/- \[ \] Test command: //' | while read -r cmd; do
            if [ -n "$cmd" ]; then
                echo -e "${BLUE}Running: ${cmd}${NC}"
                eval "$cmd" 2>&1 | head -20 || echo "Command failed (may be manual verification)"
                echo ""
            fi
        done
        
        echo ""
        echo "Manual verification required for:"
        echo "- Expected output checks"
        echo "- Manual UI/functionality tests"
        echo ""
    fi

    echo "AC PASS/FAIL:"
    echo "Verify each AC and document results (Pass/Fail)"
    echo ""
    read -p "AC-1: Pass or Fail? (p/f): " AC1_STATUS
    read -p "AC-1 Notes: " AC1_NOTES
    echo ""

    read -p "AC-2: Pass or Fail? (p/f/skip): " AC2_STATUS
    if [ "$AC2_STATUS" != "skip" ]; then
        read -p "AC-2 Notes: " AC2_NOTES
    fi
    echo ""

    read -p "AC-3: Pass or Fail? (p/f/skip): " AC3_STATUS
    if [ "$AC3_STATUS" != "skip" ]; then
        read -p "AC-3 Notes: " AC3_NOTES
    fi
    echo ""

    # Check if all AC passed
    AC_PASSED=true
    if [ "$AC1_STATUS" = "f" ]; then
        AC_PASSED=false
    fi
    if [ "$AC2_STATUS" = "f" ]; then
        AC_PASSED=false
    fi
    if [ "$AC3_STATUS" = "f" ]; then
        AC_PASSED=false
    fi

    if [ "$AC_PASSED" = false ]; then
        echo -e "${RED}⚠ Some acceptance criteria FAILED${NC}"
        echo -e "${RED}Task cannot be marked as complete${NC}"
        read -p "Do you want to continue with partial completion? (y/n): " CONTINUE_PARTIAL
        if [ "$CONTINUE_PARTIAL" != "y" ]; then
            echo -e "${RED}UNIFY aborted. Fix issues and retry.${NC}"
            exit 1
        fi
        TASK_STATUS="Partial"
    else
        echo -e "${GREEN}✓ All acceptance criteria PASSED${NC}"
        TASK_STATUS="Complete"
    fi
else
    echo -e "${YELLOW}⚠ No acceptance criteria found in SPEC.md${NC}"
    TASK_STATUS="Complete"
fi

echo ""

# Step 3: Accomplishments
echo -e "${YELLOW}Step 3: Documenting accomplishments...${NC}"
echo ""
echo "What was accomplished? (one line summary, or multiple lines with -):"
read -r ACCOMPLISHMENTS
echo ""

# Step 4: Decisions
echo -e "${YELLOW}Step 4: Logging decisions...${NC}"
echo ""
echo "Any decisions made during execution? (press Enter if none, or list with -):"
read -r DECISIONS
echo ""

if [ -n "$DECISIONS" ]; then
    echo "Logging decisions to STATE.md..."
    # Parse decisions (each line starting with -)
    echo "$DECISIONS" | while read -r line; do
        if [[ $line == -* ]]; then
            decision="${line#- }"
            # Extract first sentence as impact
            impact="${decision%%.**}."
            if [ "$impact" = "$decision" ]; then
                impact="Affects current task"
            fi
            bash "$TACHIKOMA_DIR/tools/state-update.sh" add-decision "$TASK_SLUG" "$decision" "$impact"
        fi
    done
fi

# Step 5: Defered Issues
echo -e "${YELLOW}Step 5: Logging deferred issues...${NC}"
echo ""
echo "Any issues to address later? (press Enter if none, or list with -):"
read -r DEFERRED
echo ""

if [ -n "$DEFERRED" ]; then
    echo "Logging deferred issues to STATE.md..."
    # Parse deferred issues (format: - Description [effort] [revisit])
    echo "$DEFERRED" | while read -r line; do
        if [[ $line == -* ]]; then
            line="${line#- }"
            # Extract effort (S/M/L)
            effort="M"
            if [[ $line == *\[S\]* ]]; then
                effort="S"
            elif [[ $line == *\[L\]* ]]; then
                effort="L"
            fi
            # Extract revisit trigger
            revisit="After task stable"
            if [[ $line == *\[when:* ]]; then
                revisit="${line##*\[when: }"
                revisit="${revisit%%\]}"
            fi
            # Extract description (before [)
            desc="${line%% [*}"
            bash "$TACHIKOMA_DIR/tools/state-update.sh" add-deferred "$desc" "$TASK_SLUG" "$effort" "$revisit"
        fi
    done
fi

# Step 6: Create SUMMARY.md
echo -e "${YELLOW}Step 6: Creating SUMMARY.md...${NC}"
echo ""

if [ ! -f "$SUMMARY_TEMPLATE" ]; then
    echo -e "${RED}Error: SUMMARY.md template not found at $SUMMARY_TEMPLATE${NC}"
    exit 1
fi

STARTED=$(date '+%Y-%m-%dT%H:%M:%SZ')
COMPLETED=$(date '+%Y-%m-%dT%H:%M:%SZ')

# Count files modified
FILES_MODIFIED=$(git status --short 2>/dev/null | grep -cE "^(M|A)" || echo "0")

# Create SUMMARY.md
cp "$SUMMARY_TEMPLATE" "$SUMMARY_FILE"

# Replace placeholders
sed -i "s/{task-name}/$TASK_SLUG/g" "$SUMMARY_FILE"
sed -i "s/\[YYYY-MM-DD HH:MM\]/$(date '+%Y-%m-%d %H:%M')/g" "$SUMMARY_FILE"
sed -i "s/\[X] min/$DURATION/g" "$SUMMARY_FILE"
sed -i "s/\[time]/$DURATION minutes/g" "$SUMMARY_FILE"
sed -i "s/\[ISO timestamp\]/$STARTED/g" "$SUMMARY_FILE"
sed -i "s/\[status]/$TASK_STATUS/g" "$SUMMARY_FILE"

# Add AC results
if grep -q "## AC-" "$SPEC_FILE"; then
    AC_COUNT=$(grep -c "## AC-" "$SPEC_FILE")
    # This is simplified - in real use, would parse AC names
    for i in 1 2 3; do
        if [ $i -le $AC_COUNT ]; then
            # Read AC status from variables
            AC_VAR="AC${i}_STATUS"
            NOTES_VAR="AC${i}_NOTES"
            AC_STATUS=${!AC_VAR}
            AC_NOTES=${!NOTES_VAR}

            # Map to Pass/Fail
            case $AC_STATUS in
                p) AC_DISPLAY="Pass" ;;
                f) AC_DISPLAY="Fail" ;;
                skip|*) AC_DISPLAY="N/A" ;;
            esac

            # Replace placeholder
            sed -i "s/AC-$i: \[Name\]/AC-$i: Criterion $i/g" "$SUMMARY_FILE"
            sed -i "s/| AC-$i: \[Name\] |/\| AC-$i: Criterion $i |/g" "$SUMMARY_FILE"
            sed -i "s/\[Details if needed\]/$AC_NOTES/g" "$SUMMARY_FILE"
            sed -i "s/Pass \/ Fail \/ \[Details\]/$AC_DISPLAY \/ $AC_NOTES/g" "$SUMMARY_FILE"
        fi
    done
fi

# Add accomplishments
sed -i "s/\[Most important outcome - specific, substantive\]/$ACCOMPLISHMENTS/g" "$SUMMARY_FILE"

# Add deviations
sed -i "s/\[What was planned\]/See design.md/g" "$SUMMARY_FILE"
sed -i "s/\[What happened\]/Actual implementation/g" "$SUMMARY_FILE"
sed -i "s/\[Why\]/$DEVIATIONS/g" "$SUMMARY_FILE"

echo -e "${GREEN}✓ SUMMARY.md created at $SUMMARY_FILE${NC}"
echo ""

# Step 7: Update STATE.md
echo -e "${YELLOW}Step 7: Updating STATE.md...${NC}"
echo ""

bash "$TACHIKOMA_DIR/tools/state-update.sh" complete-task "$TASK_SLUG" "$DURATION"

echo ""

# Step 8: Update todo.md
echo -e "${YELLOW}Step 8: Updating todo.md...${NC}"
echo ""

if [ -f "$TODO_FILE" ]; then
    # Mark all tasks as complete
    sed -i 's/- \[ \]/- [x]/g' "$TODO_FILE"
    # Add completion timestamp
    echo "" >> "$TODO_FILE"
    echo "---" >> "$TODO_FILE"
    echo "**Completed**: $(date '+%Y-%m-%d %H:%M')" >> "$TODO_FILE"
    echo "**Status**: $TASK_STATUS" >> "$TODO_FILE"
    echo -e "${GREEN}✓ todo.md updated${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}UNIFY Phase Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Task: ${GREEN}$TASK_SLUG${NC}"
echo -e "Status: ${GREEN}$TASK_STATUS${NC}"
echo -e "Duration: ${GREEN}$DURATION${NC} minutes"
echo ""
echo -e "Files created:"
echo -e "  ${GREEN}├── SUMMARY.md${NC}"
echo -e "  ${GREEN}├── STATE.md${NC} (updated)"
echo -e "  ${GREEN}└── todo.md${NC} (updated)"
echo ""
echo -e "${YELLOW}Review SUMMARY.md: $SUMMARY_FILE${NC}"
echo -e "${YELLOW}Review STATE.md: $OPENCODE_DIR/STATE.md${NC}"
echo ""
