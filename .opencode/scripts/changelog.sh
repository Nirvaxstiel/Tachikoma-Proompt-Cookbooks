#!/usr/bin/env bash
# Changelog management script for Tachikoma
# Usage: ./changelog.sh <command> [args]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DRAFT_FILE="$PROJECT_ROOT/CHANGELOG.draft.md"
CHANGELOG_FILE="$PROJECT_ROOT/CHANGELOG.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Detect category from first character
get_category() {
    local first="$1"
    case "$first" in
        +) echo "Added" ;;
        '~') echo "Changed" ;;
        -) echo "Fixed" ;;
        '>') echo "Removed" ;;
        '#') echo "Refactored" ;;
        '!') echo "Chores" ;;
        *) echo "Added" ;;
    esac
}

# Initialize changelog files
cmd_init() {
    log_info "Initializing changelog files..."
    
    cat > "$DRAFT_FILE" << 'EOF'
# Changelog Draft

**For dev use only** - This file tracks ongoing work.

---

## [DEV] - Current

### Added

### Changed

### Fixed

### Removed

### Refactored

### Chores

---

## How to Use

1. Add: `.opencode/scripts/changelog.sh add "+ Added new feature"`
2. Show: `.opencode/scripts/changelog.sh show`
3. Release: `.opencode/scripts/changelog.sh release v0.2.0`
EOF
    log_success "Created $DRAFT_FILE"
}

# Add entry to draft
cmd_add() {
    local entry="$*"
    
    if [[ -z "$entry" ]]; then
        log_error "Usage: $0 add <entry>"
        exit 1
    fi
    
    if [[ ! -f "$DRAFT_FILE" ]]; then
        cmd_init
    fi
    
    # Get first char and category
    local first="${entry:0:1}"
    local category
    category=$(get_category "$first")
    
    # Strip first character and space
    local clean_entry="${entry:1}"
    clean_entry="${clean_entry# }"
    
    local timestamp
    timestamp=$(date '+%Y-%m-%d')
    
    # Simple sed approach - add entry after section header
    local section_pat="### $category"
    sed -i "/^$section_pat$/a- $clean_entry ($timestamp)" "$DRAFT_FILE"
    
    log_success "Added: $clean_entry"
    log_info "Category: $category"
}

# Show current draft
cmd_show() {
    if [[ ! -f "$DRAFT_FILE" ]]; then
        log_error "Draft file not found"
        exit 1
    fi
    echo ""
    cat "$DRAFT_FILE"
    echo ""
}

# Release - promote draft to CHANGELOG.md
cmd_release() {
    local version="${1:-}"
    
    if [[ -z "$version" ]]; then
        log_error "Usage: $0 release <version>"
        exit 1
    fi
    
    if [[ ! -f "$DRAFT_FILE" || ! -f "$CHANGELOG_FILE" ]]; then
        log_error "Missing changelog files"
        exit 1
    fi
    
    local timestamp
    timestamp=$(date '+%Y-%m-%d')
    
    # Extract content from each section (between ### header and next ### or ---)
    local added changed fixed removed refactored chores
    
    added=$(sed -n '/^### Added$/,/^###/p' "$DRAFT_FILE" | sed '1d;/^###/d' | grep -v '^$')
    changed=$(sed -n '/^### Changed$/,/^###/p' "$DRAFT_FILE" | sed '1d;/^###/d' | grep -v '^$')
    fixed=$(sed -n '/^### Fixed$/,/^###/p' "$DRAFT_FILE" | sed '1d;/^###/d' | grep -v '^$')
    removed=$(sed -n '/^### Removed$/,/^###/p' "$DRAFT_FILE" | sed '1d;/^###/d' | grep -v '^$')
    refactored=$(sed -n '/^### Refactored$/,/^###/p' "$DRAFT_FILE" | sed '1d;/^###/d' | grep -v '^$')
    chores=$(sed -n '/^### Chores$/,/^---$/p' "$DRAFT_FILE" | sed '1d;/^---$/d' | grep -v '^$')
    
    # Build release section
    local release_section="## [$version] - $timestamp"
    
    [[ -n "$added" ]] && release_section+=$'\n\n### Added\n'"$added"
    [[ -n "$changed" ]] && release_section+=$'\n\n### Changed\n'"$changed"
    [[ -n "$fixed" ]] && release_section+=$'\n\n### Fixed\n'"$fixed"
    [[ -n "$removed" ]] && release_section+=$'\n\n### Removed\n'"$removed"
    [[ -n "$refactored" ]] && release_section+=$'\n\n### Refactored\n'"$refactored"
    [[ -n "$chores" ]] && release_section+=$'\n\n### Chores\n'"$chores"
    
    release_section+=$'\n\n---\n'
    
    # Insert after ## [Unreleased] with proper newline
    awk -v release="$release_section" '
    /^## \[Unreleased\]$/ { print; print ""; print release; next }
    { print }
    ' "$CHANGELOG_FILE" > "$CHANGELOG_FILE.tmp" && mv "$CHANGELOG_FILE.tmp" "$CHANGELOG_FILE"
    
    # Reset draft
    cmd_init
    
    log_success "Released $version!"
}

# Main
case "${1:-}" in
    add) shift; cmd_add "$@" ;;
    show) cmd_show ;;
    release) shift; cmd_release "$@" ;;
    init) cmd_init ;;
    -h|--help) echo "Usage: $0 <add|show|release|init> [args]" ;;
    *) cmd_show ;;
esac
