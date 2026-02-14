#!/bin/bash
#
# Skill Composer Router
# Decomposes tasks and sequences skills optimally
# Usage: bash router.sh <operation> [args]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SKILLS_DIR=".opencode/skills"
COMPOSITION_LOG=".tmp/skill-compositions.log"

print_header() {
    echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Discover available skills
op_discover() {
    print_header "SKILL COMPOSER: Available Skills"
    
    if [ ! -d "$SKILLS_DIR" ]; then
        print_warning "Skills directory not found: $SKILLS_DIR"
        exit 1
    fi
    
    echo ""
    echo "Registered skills:"
    echo ""
    
    local count=0
    for skill_dir in "$SKILLS_DIR"/*/; do
        if [ -d "$skill_dir" ]; then
            local skill_name=$(basename "$skill_dir")
            local skill_file="${skill_dir}SKILL.md"
            
            if [ -f "$skill_file" ]; then
                # Extract description from frontmatter
                local desc=$(grep "^description:" "$skill_file" | head -1 | sed 's/description: *//' | sed 's/^"//; s/"$//')
                echo "  • ${skill_name}"
                [ -n "$desc" ] && echo "    ${desc}"
                count=$((count + 1))
            fi
        fi
    done
    
    echo ""
    print_success "Found $count skills"
    echo ""
    echo "These skills can be composed for complex tasks."
}

# Decompose a task into skill sequence
op_decompose() {
    local task="$1"
    
    print_header "SKILL COMPOSER: Task Decomposition"
    
    if [ -z "$task" ]; then
        print_warning "No task provided"
        echo "Usage: decompose '<task description>'"
        exit 1
    fi
    
    echo "Task: $task"
    echo ""
    
    # Simple rule-based decomposition
    # In production, this would use LLM to analyze task
    
    local skills_needed=""
    local sequence=""
    
    # Detect patterns
    if echo "$task" | grep -qi "research\|find\|look up\|investigate"; then
        skills_needed="${skills_needed}research-agent "
        sequence="${sequence}1:research-agent:Find information\n"
    fi
    
    if echo "$task" | grep -qi "implement\|code\|write\|create\|build"; then
        skills_needed="${skills_needed}code-agent "
        sequence="${sequence}2:code-agent:Write code\n"
    fi
    
    if echo "$task" | grep -qi "review\|audit\|check\|analyze.*code"; then
        skills_needed="${skills_needed}analysis-agent "
        sequence="${sequence}2:analysis-agent:Review code\n"
    fi
    
    if echo "$task" | grep -qi "document\|doc\|readme"; then
        skills_needed="${skills_needed}docs "
        sequence="${sequence}3:docs:Write documentation\n"
    fi
    
    if echo "$task" | grep -qi "format\|clean\|lint\|prettify"; then
        skills_needed="${skills_needed}formatter "
        sequence="${sequence}3:formatter:Clean up code\n"
    fi
    
    if echo "$task" | grep -qi "commit\|git"; then
        skills_needed="${skills_needed}git-commit "
        sequence="${sequence}4:git-commit:Commit changes\n"
    fi
    
    if echo "$task" | grep -qi "api\|library\|framework\|docs.*external"; then
        skills_needed="${skills_needed}context7 "
        # Insert context7 early if research is also needed
        if echo "$skills_needed" | grep -q "research-agent"; then
            sequence=$(echo "$sequence" | sed 's/1:research-agent/1:context7:Fetch live docs\n1:research-agent/')
        else
            sequence="${sequence}1:context7:Fetch live docs\n"
        fi
    fi
    
    # If no specific skills detected, suggest general composition
    if [ -z "$skills_needed" ]; then
        print_warning "Could not auto-detect skills for this task"
        echo ""
        echo "Suggested composition:"
        echo "  1. intent-classifier: Determine exact intent"
        echo "  2. research-agent: Gather information"
        echo "  3. code-agent: Implement solution"
        echo "  4. formatter: Clean up"
        return 0
    fi
    
    echo "Detected skill composition:"
    echo ""
    echo "$sequence" | sort -n | while IFS=: read -r order skill desc; do
        echo "  Step $order: $skill"
        echo "    Purpose: $desc"
        echo ""
    done
    
    echo ""
    print_success "Decomposition complete"
    echo ""
    echo "To execute this composition, Tachikoma will:"
    echo "  1. Load each skill in sequence"
    echo "  2. Pass state between skills"
    echo "  3. Synthesize final output"
}

# Show example compositions
op_examples() {
    print_header "SKILL COMPOSER: Example Compositions"
    
    echo ""
    echo "Example 1: Feature Implementation"
    echo "─────────────────────────────────────"
    echo "Task: 'Add OAuth2 authentication'"
    echo ""
    echo "Composition:"
    echo "  1. context7: Fetch OAuth2 spec"
    echo "  2. research-agent: Check project auth patterns"
    echo "  3. code-agent: Implement OAuth2 middleware"
    echo "  4. formatter: Clean up code"
    echo "  5. git-commit: Commit changes"
    echo ""
    
    echo "Example 2: Comprehensive Code Review"
    echo "─────────────────────────────────────"
    echo "Task: 'Review this PR thoroughly'"
    echo ""
    echo "Composition (parallel):"
    echo "  1. analysis-agent: Security audit"
    echo "  2. analysis-agent: Performance analysis"
    echo "  3. analysis-agent: Code quality check"
    echo "  4. [Synthesis]: Merge findings"
    echo "  5. pr: Create review comments"
    echo ""
    
    echo "Example 3: Documentation Sprint"
    echo "─────────────────────────────────────"
    echo "Task: 'Document the new API endpoints'"
    echo ""
    echo "Composition:"
    echo "  1. context-manager: Discover existing docs structure"
    echo "  2. research-agent: Analyze API code"
    echo "  3. code-agent: Generate OpenAPI spec"
    echo "  4. formatter: Format documentation"
    echo "  5. git-commit: Commit docs"
    echo ""
    
    print_success "Use 'decompose <task>' to see composition for your task"
}

# Log a composition
op_log() {
    local task="$1"
    local composition="$2"
    
    mkdir -p "$(dirname "$COMPOSITION_LOG")"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Task: $task" >> "$COMPOSITION_LOG"
    echo "Composition: $composition" >> "$COMPOSITION_LOG"
    echo "---" >> "$COMPOSITION_LOG"
    
    print_success "Composition logged"
}

# Show composition history
op_history() {
    print_header "SKILL COMPOSER: Composition History"
    
    if [ ! -f "$COMPOSITION_LOG" ]; then
        print_info "No composition history found"
        exit 0
    fi
    
    echo ""
    tail -50 "$COMPOSITION_LOG"
}

# Help
op_help() {
    echo "Skill Composer - Dynamically compose skills for complex tasks"
    echo ""
    echo "Usage: bash router.sh <operation> [args]"
    echo ""
    echo "Operations:"
    echo "  discover              List all available skills"
    echo "  decompose '<task>'    Decompose task into skill sequence"
    echo "  examples              Show example compositions"
    echo "  history               Show composition history"
    echo "  help                  Show this help"
    echo ""
    echo "Examples:"
    echo "  bash router.sh discover"
    echo "  bash router.sh decompose 'Research React 19 and implement demo'"
    echo "  bash router.sh examples"
}

# Main router
case "${1:-help}" in
    discover)
        op_discover
        ;;
    decompose)
        shift
        op_decompose "$@"
        ;;
    examples)
        op_examples
        ;;
    history)
        op_history
        ;;
    log)
        shift
        op_log "$@"
        ;;
    help|--help|-h)
        op_help
        ;;
    *)
        echo -e "${RED}Unknown operation: $1${NC}"
        echo "Run 'bash router.sh help' for usage"
        exit 1
        ;;
esac
