#!/bin/bash
#
# Context Manager Router
# Manages context discovery, organization, and maintenance
# Usage: bash router.sh <operation> [args]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directories
CONTEXT_DIR=".opencode/context-modules"
TMP_DIR=".tmp"

# Helper functions
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

# Operation: DISCOVER - Find context files
op_discover() {
    local target="${1:-all}"

    print_header "DISCOVER: Finding Context Files"

    if [ ! -d "$CONTEXT_DIR" ]; then
        print_error "Context directory not found: $CONTEXT_DIR"
        exit 1
    fi

    echo "Searching for context files..."
    echo ""

    # Find all markdown files in context directory
    local files=$(find "$CONTEXT_DIR" -name "*.md" -type f | sort)

    if [ -z "$files" ]; then
        print_warning "No context files found"
        exit 0
    fi

    # Count and display
    local count=$(echo "$files" | wc -l)
    echo "Found $count context files:"
    echo ""

    # Display with sizes
    while IFS= read -r file; do
        local size=$(du -h "$file" | cut -f1)
        local basename=$(basename "$file")
        echo "  $basename ($size)"
    done <<< "$files"

    echo ""
    print_success "Discovery complete"
    echo ""
    echo "Tip: Use 'organize' to restructure context by concern"
}

# Operation: FETCH - Get external documentation
op_fetch() {
    local library="$1"
    local topic="${2:-general}"

    print_header "FETCH: External Documentation"

    if [ -z "$library" ]; then
        print_error "Library name required"
        echo "Usage: fetch <library> [topic]"
        echo "Example: fetch 'React' 'hooks'"
        exit 1
    fi

    echo "Library: $library"
    echo "Topic: $topic"
    echo ""

    # Create external context directory
    local external_dir="$TMP_DIR/external-context"
    mkdir -p "$external_dir"

    # Note about Context7 API
    echo "To fetch live documentation:"
    echo ""
    echo "1. Search for library:"
    echo "   curl -s \"https://context7.com/api/v2/libs/search?libraryName=$library&query=$topic\" | jq '.results[0]'"
    echo ""
    echo "2. Fetch documentation:"
    echo "   curl -s \"https://context7.com/api/v2/context?libraryId=LIBRARY_ID&query=$topic&type=txt\""
    echo ""
    echo "3. Save to: $external_dir/"
    echo ""

    print_warning "External fetching requires Context7 skill (see .opencode/skills/context7/)"
}

# Operation: HARVEST - Extract from summary files
op_harvest() {
    local source_file="$1"

    print_header "HARVEST: Extracting Context from $source_file"

    if [ -z "$source_file" ]; then
        print_error "Source file required"
        echo "Usage: harvest <source-file>"
        echo "Example: harvest ANALYSIS.md"
        exit 1
    fi

    if [ ! -f "$source_file" ]; then
        print_error "File not found: $source_file"
        exit 1
    fi

    # Extract key sections (assuming markdown format)
    echo "Analyzing $source_file..."
    echo ""

    # Count sections
    local sections=$(grep -c "^##" "$source_file" 2>/dev/null || echo "0")
    echo "Found $sections sections"
    echo ""

    # Create harvested context file
    local basename=$(basename "$source_file" .md)
    local output="$CONTEXT_DIR/40-${basename,,}.md"

    echo "Creating context file: $output"

    cat > "$output" << EOF
---
module_id: ${basename,,}
name: ${basename} - Harvested Context
priority: 40
depends_on:
  - core-contract
---

# ${basename}

**Source:** $source_file
**Harvested:** $(date '+%Y-%m-%d %H:%M:%S')

## Key Points

EOF

    # Extract headers and content
    grep "^##" "$source_file" | head -10 >> "$output"

    echo "" >> "$output"
    echo "See source file for full details." >> "$output"

    print_success "Harvested to $output"
    echo ""
    echo "Next steps:"
    echo "  1. Review and edit the harvested context"
    echo "  2. Update navigation.md"
    echo "  3. Run 'organize' to restructure"
}

# Operation: EXTRACT - Pull specific info
op_extract() {
    local file="$1"
    local query="$2"

    print_header "EXTRACT: Finding '$query' in $file"

    if [ -z "$file" ] || [ -z "$query" ]; then
        print_error "File and query required"
        echo "Usage: extract <file> <query>"
        echo "Example: extract coding-standards.md 'naming conventions'"
        exit 1
    fi

    # Check if file exists
    local target="$CONTEXT_DIR/$file"
    if [ ! -f "$target" ]; then
        # Try without .md extension
        target="$CONTEXT_DIR/${file}.md"
        if [ ! -f "$target" ]; then
            print_error "File not found: $file"
            exit 1
        fi
    fi

    # Search for query
    echo "Searching in $target..."
    echo ""

    # Case-insensitive grep with context
    grep -i -C 3 "$query" "$target" || {
        print_warning "No matches found for '$query'"
        exit 0
    }

    echo ""
    print_success "Extraction complete"
}

# Operation: ORGANIZE - Restructure context
op_organize() {
    local target="${1:-$CONTEXT_DIR}"

    print_header "ORGANIZE: Restructuring Context"

    echo "Target: $target"
    echo ""

    # Check current structure
    echo "Current structure:"
    ls -la "$target"/*.md 2>/dev/null | awk '{print "  " $9, "(" $5 " bytes)"}' || echo "  No .md files found"

    echo ""
    echo "Organization by priority:"
    echo ""

    # Group by priority ranges
    echo "Priority 0-9 (Core):"
    ls "$target"/0*.md 2>/dev/null | xargs -n1 basename 2>/dev/null | sed 's/^/  - /' || echo "  None"

    echo ""
    echo "Priority 10-19 (Standards):"
    ls "$target"/1*.md 2>/dev/null | xargs -n1 basename 2>/dev/null | sed 's/^/  - /' || echo "  None"

    echo ""
    echo "Priority 20-29 (Workflows):"
    ls "$target"/2*.md 2>/dev/null | xargs -n1 basename 2>/dev/null | sed 's/^/  - /' || echo "  None"

    echo ""
    echo "Priority 30+ (Methods & Custom):"
    ls "$target"/[3-9]*.md 2>/dev/null | xargs -n1 basename 2>/dev/null | sed 's/^/  - /' || echo "  None"

    echo ""
    print_success "Organization analysis complete"
    echo ""
    echo "Tip: Use consistent naming: ##-descriptive-name.md"
}

# Operation: CLEANUP - Remove stale files
op_cleanup() {
    local target="${1:-$TMP_DIR}"
    local days="${2:-7}"

    print_header "CLEANUP: Removing Stale Files"

    echo "Target: $target"
    echo "Remove files older than: $days days"
    echo ""

    if [ ! -d "$target" ]; then
        print_warning "Directory not found: $target"
        exit 0
    fi

    # Find old files
    local old_files=$(find "$target" -type f -mtime +$days 2>/dev/null | head -20)

    if [ -z "$old_files" ]; then
        print_success "No stale files found"
        exit 0
    fi

    echo "Files to remove:"
    echo "$old_files" | while read -r file; do
        local size=$(du -h "$file" 2>/dev/null | cut -f1)
        local age=$(( ($(date +%s) - $(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file")) / 86400 ))
        echo "  $file ($size, ${age} days old)"
    done

    echo ""
    read -p "Remove these files? (y/N): " confirm

    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo "$old_files" | xargs rm -f
        print_success "Cleanup complete"
    else
        print_warning "Cleanup cancelled"
    fi
}

# Operation: STATUS - Show context status
op_status() {
    print_header "CONTEXT STATUS"

    # Context directory
    if [ -d "$CONTEXT_DIR" ]; then
        local context_count=$(find "$CONTEXT_DIR" -name "*.md" -type f | wc -l)
        local context_size=$(du -sh "$CONTEXT_DIR" 2>/dev/null | cut -f1)
        print_success "Context directory: $context_count files ($context_size)"
    else
        print_error "Context directory not found"
    fi

    # Temporary files
    if [ -d "$TMP_DIR" ]; then
        local tmp_count=$(find "$TMP_DIR" -type f 2>/dev/null | wc -l)
        local tmp_size=$(du -sh "$TMP_DIR" 2>/dev/null | cut -f1)
        if [ "$tmp_count" -gt 0 ]; then
            print_warning "Temporary files: $tmp_count files ($tmp_size)"
            echo "  Run 'cleanup' to remove old files"
        else
            print_success "No temporary files"
        fi
    fi

    # Navigation file
    if [ -f "$CONTEXT_DIR/navigation.md" ]; then
        print_success "Navigation file exists"
    else
        print_warning "Navigation file missing - run this skill from project root"
    fi

    echo ""
    echo "Operations available:"
    echo "  discover, fetch, harvest, extract, organize, cleanup, status"
}

# Main router
case "${1:-status}" in
    discover)
        shift
        op_discover "$@"
        ;;
    fetch)
        shift
        op_fetch "$@"
        ;;
    harvest)
        shift
        op_harvest "$@"
        ;;
    extract)
        shift
        op_extract "$@"
        ;;
    organize)
        shift
        op_organize "$@"
        ;;
    cleanup)
        shift
        op_cleanup "$@"
        ;;
    status)
        op_status
        ;;
    help|--help|-h)
        echo "Context Manager - Manage project context files"
        echo ""
        echo "Usage: bash router.sh <operation> [args]"
        echo ""
        echo "Operations:"
        echo "  discover [target]       Find context files"
        echo "  fetch <lib> [topic]     Get external documentation"
        echo "  harvest <file>          Extract from summary file"
        echo "  extract <file> <query>  Pull specific information"
        echo "  organize [dir]          Restructure context"
        echo "  cleanup [dir] [days]    Remove stale files"
        echo "  status                  Show context status"
        echo ""
        echo "Examples:"
        echo "  bash router.sh discover"
        echo "  bash router.sh harvest ANALYSIS.md"
        echo "  bash router.sh extract coding-standards 'naming conventions'"
        echo "  bash router.sh cleanup .tmp/ 7"
        ;;
    *)
        print_error "Unknown operation: $1"
        echo "Run 'bash router.sh help' for usage"
        exit 1
        ;;
esac
