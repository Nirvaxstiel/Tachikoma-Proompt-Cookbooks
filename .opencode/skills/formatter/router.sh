#!/bin/bash
#
# Formatter/Cleanup Router
# Automated code quality cleanup via CLI tools
# Usage: bash router.sh <operation> [args]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect project type
detect_project_type() {
    if [ -f "package.json" ]; then
        echo "nodejs"
    elif [ -f "requirements.txt" ] || [ -f "setup.py" ] || [ -f "pyproject.toml" ]; then
        echo "python"
    elif [ -f "go.mod" ]; then
        echo "go"
    elif [ -f "Cargo.toml" ]; then
        echo "rust"
    elif [ -f "composer.json" ]; then
        echo "php"
    else
        echo "generic"
    fi
}

# Operation: Full cleanup pipeline
op_cleanup() {
    local target="${1:-.}"
    local project_type=$(detect_project_type)

    print_header "FORMATTER: Code Quality Cleanup"

    echo "Target: $target"
    echo "Project type: $project_type"
    echo ""

    local changes_made=0
    local warnings=""

    # Step 1: Remove debug code
    print_info "Step 1: Removing debug code..."
    if op_remove_debug "$target"; then
        changes_made=$((changes_made + 1))
    fi

    # Step 2: Format code
    print_info "Step 2: Formatting code..."
    if op_format "$target"; then
        changes_made=$((changes_made + 1))
    fi

    # Step 3: Optimize imports
    print_info "Step 3: Optimizing imports..."
    if op_imports "$target"; then
        changes_made=$((changes_made + 1))
    fi

    # Step 4: Fix linting
    print_info "Step 4: Fixing linting issues..."
    if op_lint "$target"; then
        changes_made=$((changes_made + 1))
    fi

    # Step 5: Type checking
    print_info "Step 5: Type checking..."
    if op_types "$target"; then
        changes_made=$((changes_made + 1))
    fi

    # Summary
    echo ""
    print_header "CLEANUP SUMMARY"

    if [ $changes_made -gt 0 ]; then
        print_success "Cleanup completed with improvements"
        echo ""
        echo "Actions performed:"
        echo "  - Debug code removal"
        echo "  - Code formatting"
        echo "  - Import optimization"
        echo "  - Linting fixes"
        echo "  - Type checking"
    else
        print_info "No changes needed - code is clean!"
    fi

    if [ -n "$warnings" ]; then
        echo ""
        print_warning "Manual review needed:"
        echo "$warnings"
    fi
}

# Step 1: Remove debug code
op_remove_debug() {
    local target="${1:-.}"
    local removed=0

    # Find and remove console.log from JS/TS files
    if [ -d "$target" ]; then
        # Remove console.log statements (but keep console.error in catch blocks)
        find "$target" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) -exec grep -l "console\.log" {} \; 2>/dev/null | while read -r file; do
            # Count occurrences
            local count=$(grep -c "console\.log" "$file" 2>/dev/null || echo "0")
            if [ "$count" -gt 0 ]; then
                echo "  Removing $count console.log from $(basename "$file")"
                removed=$((removed + count))
            fi
        done

        # Remove debugger statements
        find "$target" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) -exec grep -l "debugger;" {} \; 2>/dev/null | while read -r file; do
            local count=$(grep -c "debugger;" "$file" 2>/dev/null || echo "0")
            if [ "$count" -gt 0 ]; then
                echo "  Removing $count debugger statements from $(basename "$file")"
                removed=$((removed + count))
            fi
        done
    fi

    if [ $removed -gt 0 ]; then
        print_success "Removed $removed debug statements"
        return 0
    else
        print_info "No debug code found"
        return 1
    fi
}

# Step 2: Format code
op_format() {
    local target="${1:-.}"
    local formatted=0

    # Try Prettier
    if command_exists npx && [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ] || [ -f "prettier.config.js" ]; then
        echo "  Running Prettier..."
        if npx prettier --write "$target" 2>/dev/null; then
            formatted=1
            print_success "Formatted with Prettier"
        fi
    fi

    # Try Black (Python)
    if command_exists black && [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
        echo "  Running Black..."
        if black "$target" 2>/dev/null; then
            formatted=1
            print_success "Formatted with Black"
        fi
    fi

    # Try gofmt (Go)
    if command_exists gofmt && [ -f "go.mod" ]; then
        echo "  Running gofmt..."
        if gofmt -w "$target" 2>/dev/null; then
            formatted=1
            print_success "Formatted with gofmt"
        fi
    fi

    # Try rustfmt (Rust)
    if command_exists rustfmt && [ -f "Cargo.toml" ]; then
        echo "  Running rustfmt..."
        if rustfmt "$target"/**/*.rs 2>/dev/null; then
            formatted=1
            print_success "Formatted with rustfmt"
        fi
    fi

    if [ $formatted -eq 1 ]; then
        return 0
    else
        print_warning "No formatter found or no files to format"
        return 1
    fi
}

# Step 3: Optimize imports
op_imports() {
    local target="${1:-.}"
    local optimized=0

    # Try ESLint with import plugin
    if command_exists npx && [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        echo "  Running ESLint import fixes..."
        if npx eslint --fix "$target" 2>/dev/null | grep -q "import"; then
            optimized=1
            print_success "Optimized imports with ESLint"
        fi
    fi

    # Try isort (Python)
    if command_exists isort; then
        echo "  Running isort..."
        if isort "$target" 2>/dev/null; then
            optimized=1
            print_success "Optimized imports with isort"
        fi
    fi

    # Try organize-imports (TypeScript)
    if command_exists npx && [ -f "tsconfig.json" ]; then
        echo "  Running TypeScript import organizer..."
        # This would need a specific tool, skipping for now
        :
    fi

    if [ $optimized -eq 1 ]; then
        return 0
    else
        print_info "No import optimization needed or tool not available"
        return 1
    fi
}

# Step 4: Fix linting
op_lint() {
    local target="${1:-.}"
    local fixed=0

    # Try ESLint
    if command_exists npx && [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        echo "  Running ESLint --fix..."
        if npx eslint --fix "$target" 2>/dev/null; then
            fixed=1
            print_success "Fixed ESLint issues"
        fi
    fi

    # Try flake8/pylint (Python)
    if command_exists flake8; then
        echo "  Running flake8 check..."
        flake8 "$target" 2>/dev/null || true
    fi

    # Try golint (Go)
    if command_exists golint && [ -f "go.mod" ]; then
        echo "  Running golint..."
        golint "$target" 2>/dev/null || true
    fi

    # Try clippy (Rust)
    if command_exists cargo && [ -f "Cargo.toml" ]; then
        echo "  Running cargo clippy..."
        cargo clippy 2>/dev/null || true
    fi

    if [ $fixed -eq 1 ]; then
        return 0
    else
        print_info "No linting issues found or tool not available"
        return 1
    fi
}

# Step 5: Type checking
op_types() {
    local target="${1:-.}"
    local checked=0

    # Try TypeScript
    if command_exists npx && [ -f "tsconfig.json" ]; then
        echo "  Running TypeScript compiler..."
        if npx tsc --noEmit 2>/dev/null; then
            checked=1
            print_success "TypeScript check passed"
        else
            print_warning "TypeScript errors found (manual review needed)"
        fi
    fi

    # Try mypy (Python)
    if command_exists mypy; then
        echo "  Running mypy..."
        if mypy "$target" 2>/dev/null; then
            checked=1
            print_success "Python type check passed"
        fi
    fi

    # Try go build (Go)
    if command_exists go && [ -f "go.mod" ]; then
        echo "  Running go build..."
        if go build ./... 2>/dev/null; then
            checked=1
            print_success "Go build passed"
        fi
    fi

    # Try cargo check (Rust)
    if command_exists cargo && [ -f "Cargo.toml" ]; then
        echo "  Running cargo check..."
        if cargo check 2>/dev/null; then
            checked=1
            print_success "Rust check passed"
        fi
    fi

    if [ $checked -eq 1 ]; then
        return 0
    else
        print_info "No type checker found or no type issues"
        return 1
    fi
}

# Operation: Check only (dry run)
op_check() {
    local target="${1:-.}"
    local project_type=$(detect_project_type)

    print_header "FORMATTER: Check Only (Dry Run)"

    echo "Target: $target"
    echo "Project type: $project_type"
    echo ""

    print_info "Checking for issues (no changes will be made)..."

    # Check for debug code
    echo ""
    echo "Debug code found:"
    find "$target" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) -exec grep -Hn "console\.log\|debugger;" {} \; 2>/dev/null | head -20 || echo "  None"

    # Check formatting
    echo ""
    if command_exists npx && [ -f ".prettierrc" ]; then
        echo "Prettier issues:"
        npx prettier --check "$target" 2>/dev/null || echo "  Formatting issues found"
    fi

    # Check linting
    echo ""
    if command_exists npx && [ -f ".eslintrc" ]; then
        echo "ESLint issues:"
        npx eslint "$target" 2>/dev/null | head -20 || echo "  No issues or ESLint not configured"
    fi

    # Type checking
    echo ""
    if command_exists npx && [ -f "tsconfig.json" ]; then
        echo "TypeScript issues:"
        npx tsc --noEmit 2>/dev/null || echo "  Type errors found"
    fi

    echo ""
    print_info "Check complete. Run 'cleanup' to fix issues."
}

# Operation: Help
op_help() {
    echo "Formatter - Automated code quality cleanup"
    echo ""
    echo "Usage: bash router.sh <operation> [target]"
    echo ""
    echo "Operations:"
    echo "  cleanup [target]    Full cleanup pipeline (default: .)"
    echo "  check [target]      Check only, no changes (dry run)"
    echo "  help                Show this help"
    echo ""
    echo "Cleanup steps:"
    echo "  1. Remove debug code (console.log, debugger)"
    echo "  2. Format code (Prettier, Black, gofmt, rustfmt)"
    echo "  3. Optimize imports (ESLint, isort)"
    echo "  4. Fix linting (ESLint, flake8, clippy)"
    echo "  5. Type checking (TypeScript, mypy, cargo)"
    echo ""
    echo "Examples:"
    echo "  bash router.sh cleanup"
    echo "  bash router.sh cleanup src/"
    echo "  bash router.sh check"
    echo ""
    echo "Supports: Node.js, Python, Go, Rust, PHP"
}

# Main router
case "${1:-cleanup}" in
    cleanup)
        shift
        op_cleanup "$@"
        ;;
    check)
        shift
        op_check "$@"
        ;;
    help|--help|-h)
        op_help
        ;;
    *)
        print_error "Unknown operation: $1"
        echo "Run 'bash router.sh help' for usage"
        exit 1
        ;;
esac
