#!/usr/bin/env bash
#
# Tachikoma Bootstrap Script
# Usage: curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash -s -- [OPTIONS]
#

set -e

# Force immediate output (helps with terminal buffering issues)
export POSIXLY_CORRECT=1

BRANCH="master"
USE_GITLAB=false
TARGET_DIR=""
USE_PACKAGED=false

REPO_OWNER="Nirvaxstiel"
REPO_NAME="Tachikoma-Proompt-Cookbooks"

# Source shared shell utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/tools/shared/shell-utils.sh"

# Check if we're running interactively (stdin is a terminal)
is_interactive() {
    [ -t 0 ]
}

# Detect system Python - returns 0 (found) or 1 (not found) for shell compatibility
# Sets PYTHON_CMD and HAS_PYTHON (true/false)
check_python() {
    # Packaged Python flag takes precedence
    if [ "$USE_PACKAGED" = true ]; then
        PYTHON_CMD="$ASSETS_DIR/Python310/python"
        HAS_PYTHON=true
        return 0
    fi

    # Try UV's Python
    if command -v uv &> /dev/null; then
        PYTHON_CMD="uv run python"
        HAS_PYTHON=true
        return 0
    fi

    # Try python3
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
        HAS_PYTHON=true
        return 0
    fi

    # Try python
    if command -v python &> /dev/null; then
        PYTHON_CMD="python"
        HAS_PYTHON=true
        return 0
    fi

    # Nothing found
    PYTHON_CMD=""
    HAS_PYTHON=false
    return 1
}

# Ask user if they want to use packaged Python
# Returns: "true" or "false" (empty = no answer/default = true)
ask_use_packaged_python() {
    # Non-interactive mode: don't use packaged Python unless --include-packaged-python was passed
    ! is_interactive && {
        p ""
        return
    }

    p "\n"
    sh_print_highlight "━━━ PYTHON DETECTION ━━━"
    p "\n"
    sh_print_warning "No Python installation detected on your system."
    p "\n"
    p "A pre-packaged Python 3.10 is included in ${MAGENTA}.opencode/assets/Python310/${SH_NC}\n"
    p "\n"
    p "This allows Tachikoma to work out of the box without requiring\n"
    p "you to install Python separately.\n"
    p "\n"
    p "${WHITE}Would you like to use the pre-packaged Python?${SH_NC}\n"
    p "\n"
    p "  ${GREEN}Yes${SH_NC}/${GREEN}y${SH_NC}  - Yes, use pre-packaged Python (recommended)\n"
    p "  ${RED}No${SH_NC}/${RED}n${SH_NC}  - No, I'll handle Python myself\n"
    p "\n"
    p "  Choice:"
    # Prompt for choice
    read -r choice

    # Return true for yes, false for no (default: true)
    case "$choice" in
        [nN][oO]|[nN]) USE_PACKAGED=false ;;
        *)             USE_PACKAGED=true  ;;
    esac
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -C|--cwd)
            TARGET_DIR="$2"
            shift 2
            ;;
        --gitlab)
            USE_GITLAB=true
            shift
            ;;
        --include-prepackaged-python)
            USE_PACKAGED=true
            shift
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            sh_print_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Handle target directory argument
if [ -n "$TARGET_DIR" ]; then
    if [ ! -d "$TARGET_DIR" ]; then
        sh_print_error "Directory does not exist: $TARGET_DIR"
        exit 1
    fi
    cd "$TARGET_DIR"
fi

CURRENT_DIR="$(pwd)"
CURRENT_DIR_NAME="$(basename "$CURRENT_DIR")"

if [ "$CURRENT_DIR_NAME" = ".opencode" ]; then
    sh_print_info "Detected execution from within .opencode/, moving to parent directory"
    cd ..
elif [[ "$CURRENT_DIR" == */.opencode/* ]] || [[ "$CURRENT_DIR" == */.opencode ]]; then
    sh_print_info "Detected execution from within .opencode structure, moving to project root"
    while [ "$CURRENT_DIR_NAME" != ".opencode" ] && [ "$CURRENT_DIR" != "/" ]; do
        cd ..
        CURRENT_DIR="$(pwd)"
        CURRENT_DIR_NAME="$(basename "$CURRENT_DIR")"
    done
    if [ "$CURRENT_DIR_NAME" = ".opencode" ]; then
        cd ..
    fi
fi

SCRIPT_PATH="$0"
if [ "$SCRIPT_PATH" != "bash" ] && [ -f "$SCRIPT_PATH" ]; then
    SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
    SCRIPT_DIR_NAME="$(basename "$SCRIPT_DIR")"

    if [ "$SCRIPT_DIR_NAME" = ".opencode" ]; then
        SCRIPT_PARENT="$(cd "$(dirname "$SCRIPT_PATH")/.." && pwd)"
        if [ -d "$SCRIPT_PARENT" ]; then
            sh_print_info "Detected script located in .opencode/, using parent as install target"
            cd "$SCRIPT_PARENT"
        fi
    fi
fi

if [ -d ".opencode/.opencode" ]; then
            sh_print_warning "Detected nested .opencode/.opencode - cleaning up"
    rm -rf ".opencode/.opencode"
fi

if [ "$USE_GITLAB" = true ]; then
    ARCHIVE_URL="https://gitlab.com/${REPO_OWNER}/${REPO_NAME}/-/archive/${BRANCH}/${REPO_NAME}-${BRANCH}.tar.gz"
    SOURCE_NAME="GitLab"
else
    ARCHIVE_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/${BRANCH}.tar.gz"
    SOURCE_NAME="GitHub"
fi

INSTALL_DIR="$(pwd)"

# Check for system Python (before download)
check_python [ "$HAS_PYTHON" = true ] && {
    sh_print_info "Found Python: ${SH_GREEN}$PYTHON_CMD${SH_NC}"
}

sh_print_info "Installing from ${SOURCE_NAME} (${BRANCH})"
sh_print_info "Target: ${INSTALL_DIR}"
sh_print_warn "Not in a git repo"

TEMP_DIR=$(mktemp -d)
# Note: We don't trap rm -rf here anymore - backup persists in .opencode-backup/

cd "$TEMP_DIR"

sh_print_info "Acquiring data..."

if ! curl -sSL "$ARCHIVE_URL" -o "repo.tar.gz"; then
    sh_print_error "Failed to acquire data. Branch '${BRANCH}' may not exist."
    exit 1
fi

if ! tar -tzf "repo.tar.gz" > /dev/null 2>&1; then
    sh_print_error "Failed to extract. Branch '${BRANCH}' may not exist."
    exit 1
fi

sh_print_info "Extracting..."

if ! tar -tzf "repo.tar.gz" > /dev/null 2>&1; then
    sh_print_error "Failed to extract. Branch '${BRANCH}' may not exist."
    exit 1
fi

cd "$EXTRACTED_DIR"

# Determine whether to use packaged Python
# Priority: 1) --include-prepackaged-python flag, 2) system Python, 3) ask user
# USE_PACKAGED: true = use packaged Python, false = don't use (default)

# Check flag first - must exist AND file exists
[ "$USE_PACKAGED" = true ] && [ -f ".opencode/assets/Python310/python.exe" ] && {
    sh_print_info "Pre-packaged Python enabled"
}

# No system Python? Ask user (only runs if USE_PACKAGED is still false)
{ [ "$HAS_PYTHON" = false ] && [ "$USE_PACKAGED" = false ]; } && {
    ask_use_packaged_python
}

p "\n"
sh_print_highlight "━━━ TACHIKOMA ━━━"

# AGENTS.md - Only copy if user doesn't have one (don't overwrite existing)
if [ -f "${INSTALL_DIR}/AGENTS.md" ]; then
    sh_print_info "AGENTS.md already exists in project - preserving"
elif [ -f "AGENTS.md" ]; then
    cp "AGENTS.md" "${INSTALL_DIR}/AGENTS.md"
    sh_print_success "AGENTS.md"
else
    sh_print_warning "AGENTS.md not found in source"
fi

# opencode.json - Only copy if user doesn't have one
if [ -f "${INSTALL_DIR}/opencode.json" ]; then
    sh_print_info "opencode.json already exists - preserving"
elif [ -f "opencode.json" ]; then
    cp "opencode.json" "${INSTALL_DIR}/opencode.json"
    sh_print_success "opencode.json"
else
    sh_print_warning "opencode.json not found in source"
fi

if [ -d ".opencode" ]; then
    BACKUP_DIR="${INSTALL_DIR}/.opencode-backup"
    CURRENT_OPENCODE="${INSTALL_DIR}/.opencode"
    NEW_OPENCODE="${PWD}/.opencode"

    # Check if this is an update (existing .opencode directory)
    if [ -d "$CURRENT_OPENCODE" ]; then
        sh_print_info "Existing installation detected - generating backup..."

        # Create backup directory with timestamp
        mkdir -p "$BACKUP_DIR"

        # Generate diff report
        DIFF_FILE="$BACKUP_DIR/diff.md"

        # Initialize diff report
        cat > "$DIFF_FILE" << EOF
# Tachikoma Update Diff Report

Generated: $(date '+%Y-%m-%d %H:%M:%S')
Source: ${SOURCE_NAME} (${BRANCH})

## Summary

EOF

        # Count and categorize changes
        MODIFIED_COUNT=0
        ADDED_COUNT=0
        DELETED_COUNT=0

        # Load ignore patterns from current .gitignore for filtering
        # Also check new .gitignore to ensure we have patterns to work with
        IGNORE_PATTERNS=()
        GITIGNORE_SOURCE="$CURRENT_OPENCODE/.gitignore"

        # Use new .gitignore if current doesn't exist
        if [ ! -f "$GITIGNORE_SOURCE" ] && [ -f "$NEW_OPENCODE/.gitignore" ]; then
            GITIGNORE_SOURCE="$NEW_OPENCODE/.gitignore"
        fi

        # Load patterns from .gitignore
        if [ -f "$GITIGNORE_SOURCE" ]; then
            while IFS= read -r line || [[ -n "$line" ]]; do
                # Skip empty lines and comments
                [[ -z "$line" || "$line" =~ ^# ]] && continue
                # Strip carriage return (Windows line endings) and trailing slash
                line="${line//$'\r'/}"
                line="${line%/}"
                [[ -n "$line" ]] && IGNORE_PATTERNS+=("$line")
            done < <(tr -d '\r' < "$GITIGNORE_SOURCE")
            sh_print_info "Loaded ${#IGNORE_PATTERNS[@]} ignore patterns from .gitignore"
        fi

        # Helper to check if path matches any ignore pattern
        # Matches if path starts with pattern or contains pattern as directory component
        should_ignore() {
            local rel_path="$1"
            for pattern in "${IGNORE_PATTERNS[@]}"; do
                # Skip extension-only patterns (e.g., *.pyc) - NOT patterns starting with .
                [[ "$pattern" == *.* && "$pattern" != .* ]] && continue
                # Match: starts with pattern, OR contains pattern as directory component (with or without leading /)
                if [[ "$rel_path" == "$pattern"* ]] || [[ "$rel_path" == *"/$pattern"* ]] || [[ "$rel_path" == *"/$pattern" ]] || [[ "$rel_path" == *"$pattern" ]]; then
                    return 0
                fi
            done
            return 1
        }

        # Find all files in current installation (respecting .gitignore)
        while IFS= read -r -d '' file; do
            # Get relative path and check if ignored
            rel_path="${file#$CURRENT_OPENCODE/}"
            should_ignore "$rel_path" && continue

            new_file="$NEW_OPENCODE/$rel_path"

            if [ -f "$new_file" ]; then
                # File exists in both - check if different
                if ! diff -q "$file" "$new_file" > /dev/null 2>&1; then
                    # Files differ - backup old version
                    backup_subdir="$BACKUP_DIR/$(dirname "$rel_path")"
                    mkdir -p "$backup_subdir"
                    cp -p "$file" "$backup_subdir/"
                    MODIFIED_COUNT=$((MODIFIED_COUNT + 1))
                    printf -- "- **MODIFIED**: \`%s\`\n" "$rel_path" >> "$DIFF_FILE"
                    log_modified "$rel_path"
                fi
            else
                # File only exists in current (will be deleted)
                backup_subdir="$BACKUP_DIR/$(dirname "$rel_path")"
                mkdir -p "$backup_subdir"
                cp -p "$file" "$backup_subdir/"
                DELETED_COUNT=$((DELETED_COUNT + 1))
                printf -- "- **DELETED**: \`%s\`\n" "$rel_path" >> "$DIFF_FILE"
                log_deleted "$rel_path"
            fi
        done < <(find "$CURRENT_OPENCODE" -type f -print0 2>/dev/null)

        # Find new files (exist in new but not in current) - respect .gitignore from new version
        IGNORE_PATTERNS_NEW=()
        if [ -f "$NEW_OPENCODE/.gitignore" ]; then
            while IFS= read -r line; do
                [[ -z "$line" || "$line" =~ ^# ]] && continue
                IGNORE_PATTERNS_NEW+=("${line%/}")
            done < "$NEW_OPENCODE/.gitignore"
        fi

        should_ignore_new() {
            local rel_path="$1"
            for pattern in "${IGNORE_PATTERNS_NEW[@]}"; do
                [[ "$rel_path" == "$pattern"* ]] && return 0
            done
            return 1
        }

        while IFS= read -r -d '' file; do
            rel_path="${file#$NEW_OPENCODE/}"
            should_ignore_new "$rel_path" && continue

            current_file="$CURRENT_OPENCODE/$rel_path"

            if [ ! -f "$current_file" ]; then
                ADDED_COUNT=$((ADDED_COUNT + 1))
                printf -- "- **ADDED**: \`%s\`\n" "$rel_path" >> "$DIFF_FILE"
                log_added "$rel_path"
            fi
        done < <(find "$NEW_OPENCODE" -type f -print0 2>/dev/null)

        # Complete the summary
        cat >> "$DIFF_FILE" << EOF

- Modified: $MODIFIED_COUNT files
- Added: $ADDED_COUNT files
- Deleted: $DELETED_COUNT files

## Details

Files backed up to: \`.opencode-backup/\`

EOF

        if [ $MODIFIED_COUNT -gt 0 ]; then
            printf "\n### Modified Files\n\n" >> "$DIFF_FILE"
            printf "These files were overwritten. Previous versions backed up to \`.opencode-backup/\`\n\n" >> "$DIFF_FILE"
        fi

        if [ $DELETED_COUNT -gt 0 ]; then
            printf "\n### Deleted Files\n\n" >> "$DIFF_FILE"
            printf "These files were removed. Previous versions backed up to \`.opencode-backup/\`\n\n" >> "$DIFF_FILE"
        fi

        if [ $ADDED_COUNT -gt 0 ]; then
            printf "\n### Added Files\n\n" >> "$DIFF_FILE"
            printf "These files are new in this version:\n\n" >> "$DIFF_FILE"
        fi

        # Output styled summary
        [ "$MODIFIED_COUNT" -gt 0 ] && log_modified "$MODIFIED_COUNT files - Previous versions backed up to .opencode-backup/"
        [ "$ADDED_COUNT" -gt 0 ] && log_added "$ADDED_COUNT new files in this version"
        [ "$DELETED_COUNT" -gt 0 ] && log_deleted "$DELETED_COUNT files removed"
        [ "$MODIFIED_COUNT" -eq 0 ] && [ "$ADDED_COUNT" -eq 0 ] && [ "$DELETED_COUNT" -eq 0 ] && log_unchanged "No changes detected"
        sh_print_success "Backup created: .opencode-backup/"

        # Show backup location
        if [ "$MODIFIED_COUNT" -gt 0 ] || [ "$DELETED_COUNT" -gt 0 ]; then
            sh_print_info "Previous versions saved to: .opencode-backup/"
            sh_print_info "Diff report: .opencode-backup/diff.md"
        fi
    fi

    # Remove existing .opencode and copy new version
    rm -rf "$CURRENT_OPENCODE"
    cp -r "$NEW_OPENCODE" "$CURRENT_OPENCODE"

    CLEANUP_PATHS=(
        "${INSTALL_DIR}/.opencode/node_modules"
        "${INSTALL_DIR}/.opencode/package.json"
        "${INSTALL_DIR}/.opencode/bun.lock"
        "${INSTALL_DIR}/.opencode/.gitignore"
    )

    [ "$USE_PACKAGED" = false ] && {
        CLEANUP_PATHS+=(
            "${INSTALL_DIR}/.opencode/assets"
            "${INSTALL_DIR}/.opencode/plugins"
        )
        sh_print_info "Skipped assets/ and plugins/ (not using packaged Python)"
    } || {
        sh_print_success ".opencode/assets/"
        sh_print_success ".opencode/plugins/"
    }

    for path in "${CLEANUP_PATHS[@]}"; do
        rm -rf "$path" 2>/dev/null || true
    done

    sh_print_success ".opencode/"
else
    sh_print_warning ".opencode not found"
fi

# Create .gitignore if missing
if [ ! -f "${INSTALL_DIR}/.opencode/.gitignore" ]; then
    cat > "${INSTALL_DIR}/.opencode/.gitignore" << 'EOF'
# Dependencies
node_modules/
bun.lock

# Packaged runtime (Python, Node, etc.)
assets/
plugins/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
*.egg-info/
dist/
build/

# Virtual environments
venv/
.venv/
ENV/
env/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Runtime generated
cache/
rlm_state/

# Update backups (generated by tachikoma-install.sh)
.opencode-backup/
EOF
    sh_print_success ".opencode/.gitignore"
fi

if [ "$USE_GITLAB" = true ]; then
    RAW_BASE="https://gitlab.com/${REPO_OWNER}/${REPO_NAME}/-/raw/${BRANCH}"
    SOURCE_URL="https://gitlab.com/${REPO_OWNER}/${REPO_NAME}/-/raw/${BRANCH}/.opencode/tachikoma-install.sh"
else
    RAW_BASE="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}"
    SOURCE_URL="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/.opencode/tachikoma-install.sh"
fi

# Ensure we don't install into .opencode directory itself
INSTALL_DIR_NAME="$(basename "$INSTALL_DIR")"
if [ "$INSTALL_DIR_NAME" = ".opencode" ]; then
    sh_print_error "Cannot install into .opencode directory itself"
    sh_print_error "Please run this script from the project root, not from within .opencode/"
    exit 1
fi

# Update install script
if curl -sSL --fail --connect-timeout 10 "$SOURCE_URL" -o "${INSTALL_DIR}/.opencode/tachikoma-install.sh.new" 2>/dev/null; then
    mv "${INSTALL_DIR}/.opencode/tachikoma-install.sh.new" "${INSTALL_DIR}/.opencode/tachikoma-install.sh"
    chmod +x "${INSTALL_DIR}/.opencode/tachikoma-install.sh"
    sh_print_success ".opencode/tachikoma-install.sh"
elif [ -f "${INSTALL_DIR}/.opencode/tachikoma-install.sh" ]; then
    sh_print_info "Update script present (using local)"
elif [ -f "$0" ] && [ "$0" != "bash" ]; then
    cp "$0" "${INSTALL_DIR}/.opencode/tachikoma-install.sh"
    chmod +x "${INSTALL_DIR}/.opencode/tachikoma-install.sh"
    sh_print_success ".opencode/tachikoma-install.sh"
else
    sh_print_warning "Could not secure update mechanism"
fi

p "\n"
p "${MAGENTA}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${SH_NC}\n"
p "${MAGENTA}┃${SH_NC}   ${WHITE}Installation complete${SH_NC}          ${MAGENTA}┃${SH_NC}\n"
p "${MAGENTA}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${SH_NC}\n"
p "\n"

# Show warning if no Python found at all (not even via UV)
# This banner only shows if:
#   1. User chose not to use packaged Python
#   2. AND no system Python found
#   3. AND no UV found (UV implies Python availability)
[ "$USE_PACKAGED" = false ] && [ "$HAS_PYTHON" = false ] && {
    p "${ORANGE}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${SH_NC}\n"
    p "${ORANGE}┃${SH_NC}  ${WHITE}⚠  PYTHON SETUP REQUIRED  ⚠${SH_NC}     ${ORANGE}┃${SH_NC}\n"
    p "${ORANGE}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${SH_NC}\n"
    p "\n"
    p "${WHITE}You chose not to use the pre-packaged Python.${SH_NC}\n"
    p "\n"
    p "${RED}Please install Python and add it to your PATH before running Tachikoma.${SH_NC}\n"
    p "\n"
    p "${DIM}Verify installation:${SH_NC} ${CYAN}python --version${SH_NC}\n"
    p "${DIM}Download Python:${SH_NC} ${CYAN}https://python.org/downloads${SH_NC}\n"
    p "\n"
}

# Cleanup temp directory (backup is preserved in .opencode-backup/)
rm -rf "$TEMP_DIR" 2>/dev/null || true

p "Run ${MAGENTA}opencode${SH_NC} to start\n"
p "\n"

# Show backup info if this was an update
if [ -d "${INSTALL_DIR}/.opencode-backup" ]; then
    p "${WHITE}Backup available:${SH_NC}\n"
    p "  ${DIM}Previous versions:${SH_NC} ${CYAN}.opencode-backup/${SH_NC}\n"
    p "  ${DIM}Diff report:${SH_NC} ${CYAN}.opencode-backup/diff.md${SH_NC}\n"
    p "\n"
fi

p "${WHITE}To update:${SH_NC}\n"
p "\n"
p "${DIM}  # Option 1: Run the script directly${SH_NC}\n"
p "  ${CYAN}./${MAGENTA}.opencode/tachikoma-install.sh${SH_NC} -b ${BRANCH}\n"
p "\n"
p "${DIM}  # Option 2: Quick curl${SH_NC}\n"
p "  ${CYAN}curl${SH_NC} -sS ${SOURCE_URL} | bash -s -- -b ${BRANCH}\n"
p "\n"
p "${WHITE}Flags:${SH_NC}\n"
p "  ${CYAN}-b, --branch${SH_NC} <name>              Branch (default: ${BRANCH})\n"
p "  ${CYAN}--gitlab${SH_NC}                         Use GitLab\n"
p "  ${CYAN}--include-prepackaged-python${SH_NC}     Include pre-packaged Python\n"
p "\n"
p "${DIM}Check available branches:${SH_NC}\n"
p "  ${CYAN}git${SH_NC} ls-remote --heads https://github.com/${REPO_OWNER}/${REPO_NAME}.git\n"
p "\n"
