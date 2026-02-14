#!/bin/bash
#
# Context7 Router - Fetch live documentation from libraries
# Usage: bash router.sh <operation> [args]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE="https://context7.com/api/v2"
OUTPUT_DIR=".tmp/external-context"

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

# Check dependencies
check_deps() {
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq is recommended for better JSON formatting"
    fi
}

# Search for library
op_search() {
    local library="$1"
    local query="${2:-general}"
    
    print_header "SEARCH: Finding Library"
    
    if [ -z "$library" ]; then
        print_error "Library name required"
        echo "Usage: search <library> [topic]"
        echo "Example: search 'React' 'hooks'"
        exit 1
    fi
    
    echo "Library: $library"
    echo "Query: $query"
    echo ""
    
    # URL encode spaces
    local encoded_lib=$(echo "$library" | sed 's/ /%20/g')
    local encoded_query=$(echo "$query" | sed 's/ /%20/g')
    
    echo "Searching Context7 API..."
    echo ""
    
    local response=$(curl -s "${API_BASE}/libs/search?libraryName=${encoded_lib}&query=${encoded_query}")
    
    # Check if we got results
    local count=$(echo "$response" | grep -o '"results":\[' | wc -l)
    
    if [ "$count" -eq 0 ] || [ -z "$response" ]; then
        print_warning "No libraries found matching '$library'"
        echo ""
        echo "Try:"
        echo "  - Using the exact library name"
        echo "  - Checking spelling"
        echo "  - Using a broader query"
        exit 0
    fi
    
    # Parse and display results
    echo "Top results:"
    echo ""
    
    if command -v jq &> /dev/null; then
        echo "$response" | jq -r '.results[0:3] | .[] | "  📚 \(.title)\n     ID: \(.id)\n     Description: \(.description)\n     Snippets: \(.totalSnippets)\n"' 2>/dev/null || {
            print_warning "Could not parse JSON response"
            echo "$response"
        }
    else
        # Fallback without jq
        echo "$response" | grep -o '"title":"[^"]*"' | head -3 | sed 's/"title":"/  📚 /' | sed 's/"//'
        echo ""
        echo "  (Install jq for better formatting)"
    fi
    
    echo ""
    print_success "Search complete"
    echo ""
    echo "Next: Use 'fetch' with the library ID to get documentation"
}

# Fetch documentation
op_fetch() {
    local library_id="$1"
    local query="${2:-general}"
    
    print_header "FETCH: Getting Documentation"
    
    if [ -z "$library_id" ]; then
        print_error "Library ID required"
        echo "Usage: fetch <library-id> [topic]"
        echo ""
        echo "Examples:"
        echo "  fetch '/websites/react_dev_reference' 'useState'"
        echo "  fetch '/fastapi/fastapi' 'dependencies'"
        exit 1
    fi
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    # Sanitize library ID for filename
    local safe_id=$(echo "$library_id" | sed 's/[^a-zA-Z0-9_-]/_/g')
    local output_file="${OUTPUT_DIR}/${safe_id}_${query}.txt"
    
    echo "Library ID: $library_id"
    echo "Topic: $query"
    echo "Output: $output_file"
    echo ""
    
    # URL encode query
    local encoded_query=$(echo "$query" | sed 's/ /%20/g')
    
    echo "Fetching from Context7..."
    
    # Fetch documentation
    curl -s "${API_BASE}/context?libraryId=${library_id}&query=${encoded_query}&type=txt" > "$output_file"
    
    # Check if file has content
    if [ ! -s "$output_file" ]; then
        print_error "No content returned (file is empty)"
        rm -f "$output_file"
        exit 1
    fi
    
    local size=$(du -h "$output_file" | cut -f1)
    
    echo ""
    print_success "Documentation saved"
    echo ""
    echo "File: $output_file"
    echo "Size: $size"
    echo ""
    echo "Preview (first 20 lines):"
    echo "---"
    head -20 "$output_file"
    echo "---"
    echo ""
    echo "Tip: Reference this file in your context or pass to subagents"
}

# Quick fetch (search + fetch in one)
op_quick() {
    local library="$1"
    local query="${2:-general}"
    
    print_header "QUICK: Search & Fetch"
    
    if [ -z "$library" ]; then
        print_error "Library name required"
        echo "Usage: quick <library> [topic]"
        exit 1
    fi
    
    # Search
    local encoded_lib=$(echo "$library" | sed 's/ /%20/g')
    local encoded_query=$(echo "$query" | sed 's/ /%20/g')
    
    echo "Step 1: Searching for '$library'..."
    local response=$(curl -s "${API_BASE}/libs/search?libraryName=${encoded_lib}&query=${encoded_query}")
    
    # Extract library ID
    local library_id=""
    if command -v jq &> /dev/null; then
        library_id=$(echo "$response" | jq -r '.results[0].id // empty')
    else
        library_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    fi
    
    if [ -z "$library_id" ]; then
        print_error "Could not find library: $library"
        exit 1
    fi
    
    echo "Found: $library_id"
    echo ""
    
    # Fetch
    op_fetch "$library_id" "$query"
}

# List cached docs
op_list() {
    print_header "CACHED DOCUMENTATION"
    
    if [ ! -d "$OUTPUT_DIR" ]; then
        print_warning "No cached documentation found"
        echo ""
        echo "Use 'search' or 'fetch' to get documentation"
        exit 0
    fi
    
    local files=$(find "$OUTPUT_DIR" -name "*.txt" -type f 2>/dev/null | sort)
    
    if [ -z "$files" ]; then
        print_warning "No cached documentation found"
        exit 0
    fi
    
    echo "Cached files:"
    echo ""
    
    while IFS= read -r file; do
        local size=$(du -h "$file" | cut -f1)
        local age=$(( ($(date +%s) - $(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file")) / 86400 ))
        local basename=$(basename "$file")
        echo "  $basename ($size, ${age} days old)"
    done <<< "$files"
    
    echo ""
    print_success "Found $(echo "$files" | wc -l) cached files"
    echo ""
    echo "Tip: Use 'cleanup' to remove old files"
}

# Cleanup old cached docs
op_cleanup() {
    local days="${1:-7}"
    
    print_header "CLEANUP: Remove Old Documentation"
    
    if [ ! -d "$OUTPUT_DIR" ]; then
        print_warning "No cache directory found"
        exit 0
    fi
    
    echo "Remove files older than: $days days"
    echo ""
    
    local old_files=$(find "$OUTPUT_DIR" -name "*.txt" -type f -mtime +$days 2>/dev/null)
    
    if [ -z "$old_files" ]; then
        print_success "No old files to remove"
        exit 0
    fi
    
    echo "Files to remove:"
    echo "$old_files" | while read -r file; do
        local size=$(du -h "$file" | cut -f1)
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

# Main
check_deps

case "${1:-help}" in
    search)
        shift
        op_search "$@"
        ;;
    fetch)
        shift
        op_fetch "$@"
        ;;
    quick)
        shift
        op_quick "$@"
        ;;
    list)
        op_list
        ;;
    cleanup)
        shift
        op_cleanup "$@"
        ;;
    help|--help|-h)
        echo "Context7 - Fetch live documentation from libraries"
        echo ""
        echo "Usage: bash router.sh <operation> [args]"
        echo ""
        echo "Operations:"
        echo "  search <lib> [topic]    Search for library ID"
        echo "  fetch <id> [topic]      Fetch documentation"
        echo "  quick <lib> [topic]     Search + fetch in one"
        echo "  list                    Show cached docs"
        echo "  cleanup [days]          Remove old docs"
        echo ""
        echo "Examples:"
        echo "  bash router.sh search 'React' 'hooks'"
        echo "  bash router.sh fetch '/websites/react_dev_reference' 'useState'"
        echo "  bash router.sh quick 'Next.js' 'app router'"
        echo "  bash router.sh cleanup 7"
        echo ""
        echo "Note: Requires curl. jq recommended for better formatting."
        ;;
    *)
        print_error "Unknown operation: $1"
        echo "Run 'bash router.sh help' for usage"
        exit 1
        ;;
esac
