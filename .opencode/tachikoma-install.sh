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

# Theme colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
MAGENTA='\033[38;5;197m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
DIM='\033[2m'
NO_COLOR='\033[0m'

# Printf with automatic flush - use p() for stdout, p_err() for stderr
p() {
    printf "$@" >&2
    sync
}
p_err() {
    printf "$@" >&2
    sync
}

log_info() {
    p "${CYAN}[TACHIKOMA]${NO_COLOR} %s\n" "$1"
}

log_success() {
    p "${GREEN}[OK]${NO_COLOR} %s\n" "$1"
}

log_highlight() {
    p_err "${MAGENTA}%s${NO_COLOR}\n" "$1"
}

log_warn() {
    p_err "${ORANGE}[WARN]${NO_COLOR} %s\n" "$1"
}

log_error() {
    p_err "${RED}[ERROR]${NO_COLOR} %s\n" "$1"
}

log_info() {
    printf "${CYAN}[TACHIKOMA]${NO_COLOR} %s\n" "$1"
    sync
}

log_success() {
    printf "${GREEN}[OK]${NO_COLOR} %s\n" "$1"
    sync
}

log_highlight() {
    printf "${MAGENTA}%s${NO_COLOR}\n" "$1" >&2
    sync
}

log_warn() {
    printf "${ORANGE}[WARN]${NO_COLOR} %s\n" "$1" >&2
    sync
}

log_error() {
    printf "${RED}[ERROR]${NO_COLOR} %s\n" "$1" >&2
    sync
}

# Detect system Python - returns 0 (found) or 1 (not found) for shell compatibility
# Sets PYTHON_CMD and HAS_PYTHON (true/false)
check_python() {
    command -v python3 &> /dev/null && PYTHON_CMD="python3" && HAS_PYTHON=true && return 0
    command -v python  &> /dev/null && PYTHON_CMD="python"  && HAS_PYTHON=true && return 0
    PYTHON_CMD=""
    HAS_PYTHON=false
    return 1
}

# Check if we're running interactively (stdin is a terminal)
is_interactive() {
    [ -t 0 ]
}

# Ask user if they want to use packaged Python
# Returns: "true" or "false" (empty = no answer/default)
ask_use_packaged_python() {
    # Non-interactive mode: don't use packaged Python unless --include-prepackaged-python was passed
    ! is_interactive && {
        p ""
        return
    }

    p "\n"
    log_highlight "━━━ PYTHON DETECTION ━━━"
    p "\n"
    log_warn "No Python installation detected on your system."
    p "\n"
    p "A pre-packaged Python 3.10 is included in ${MAGENTA}.opencode/assets/Python310/${NO_COLOR}\n"
    p "\n"
    p "This allows Tachikoma to work out of the box without requiring\n"
    p "you to install Python separately.\n"
    p "\n"
    p "${WHITE}Would you like to use the pre-packaged Python?${NO_COLOR}\n"
    p "\n"
    p "  ${GREEN}Yes${NO_COLOR}/${GREEN}y${NO_COLOR}  - Yes, use pre-packaged Python (recommended)\n"
    p "  ${RED}No${NO_COLOR}/${RED}n${NO_COLOR}  - No, I'll handle Python myself\n"
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
            log_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Handle target directory argument
if [ -n "$TARGET_DIR" ]; then
    if [ ! -d "$TARGET_DIR" ]; then
        log_error "Directory does not exist: $TARGET_DIR"
        exit 1
    fi
    cd "$TARGET_DIR"
fi

CURRENT_DIR="$(pwd)"
CURRENT_DIR_NAME="$(basename "$CURRENT_DIR")"

if [ "$CURRENT_DIR_NAME" = ".opencode" ]; then
    log_info "Detected execution from within .opencode/, moving to parent directory"
    cd ..
elif [[ "$CURRENT_DIR" == */.opencode/* ]] || [[ "$CURRENT_DIR" == */.opencode ]]; then
    log_info "Detected execution from within .opencode structure, moving to project root"
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
            log_info "Detected script located in .opencode/, using parent as install target"
            cd "$SCRIPT_PARENT"
        fi
    fi
fi

if [ -d ".opencode/.opencode" ]; then
    log_warn "Detected nested .opencode/.opencode - cleaning up"
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
check_python [ "$HAS_PYTHON" = true ] && log_info "Found Python: ${GREEN}$PYTHON_CMD${NO_COLOR}"

log_info "Installing from ${SOURCE_NAME} (${BRANCH})"
log_info "Target: ${INSTALL_DIR}"

if [ ! -d ".git" ]; then
    log_warn "Not in a git repo"
fi

TEMP_DIR=$(mktemp -d)
# Note: We don't trap rm -rf here anymore - backup persists in .opencode-backup/

cd "$TEMP_DIR"

log_info "Acquiring data..."

if ! curl -sSL "$ARCHIVE_URL" -o "repo.tar.gz"; then
    log_error "Failed to acquire data. Branch '${BRANCH}' may not exist."
    exit 1
fi

if ! tar -tzf "repo.tar.gz" > /dev/null 2>&1; then
    log_error "Failed to extract. Branch '${BRANCH}' may not exist."
    exit 1
fi

log_info "Extracting..."

tar -xzf "repo.tar.gz"

EXTRACTED_DIR=$(ls -d */ 2>/dev/null | head -1)

if [ -z "$EXTRACTED_DIR" ]; then
    log_error "Failed to extract"
    exit 1
fi

cd "$EXTRACTED_DIR"

# Determine whether to use packaged Python
# Priority: 1) --include-prepackaged-python flag, 2) system Python, 3) ask user
# USE_PACKAGED: true = use packaged Python, false = don't use (default)

# Check flag first - must exist AND file exists
[ "$USE_PACKAGED" = true ] && [ -f ".opencode/assets/Python310/python.exe" ] && {
    log_info "Pre-packaged Python enabled"
}

# No system Python? Ask user (only runs if USE_PACKAGED is still false)
{ [ "$HAS_PYTHON" = false ] && [ "$USE_PACKAGED" = false ]; } && {
    ask_use_packaged_python
}

p "\n"
log_highlight "━━━ TACHIKOMA ━━━"

if [ -f "AGENTS.md" ]; then
    cp "AGENTS.md" "${INSTALL_DIR}/AGENTS.md"
    log_success "AGENTS.md"
else
    log_warn "AGENTS.md not found"
fi

if [ -f "opencode.json" ]; then
    cp "opencode.json" "${INSTALL_DIR}/opencode.json"
    log_success "opencode.json"
else
    log_warn "opencode.json not found"
fi

if [ -d ".opencode" ]; then
    BACKUP_DIR="${INSTALL_DIR}/.opencode-backup"
    CURRENT_OPENCODE="${INSTALL_DIR}/.opencode"
    NEW_OPENCODE="${PWD}/.opencode"

    # Check if this is an update (existing .opencode directory)
    if [ -d "$CURRENT_OPENCODE" ]; then
        log_info "Existing installation detected - generating backup..."

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

        # Find all files in current installation
        while IFS= read -r -d '' file; do
            # Get relative path from .opencode
            rel_path="${file#$CURRENT_OPENCODE/}"
            new_file="$NEW_OPENCODE/$rel_path"

            if [ -f "$new_file" ]; then
                # File exists in both - check if different
                if ! diff -q "$file" "$new_file" > /dev/null 2>&1; then
                    # Files differ - backup old version
                    backup_subdir="$BACKUP_DIR/$(dirname "$rel_path")"
                    mkdir -p "$backup_subdir"
                    cp -p "$file" "$backup_subdir/"
                    MODIFIED_COUNT=$((MODIFIED_COUNT + 1))
                    echo "- **MODIFIED**: %s\n" "$rel_path" >> "$DIFF_FILE"
                fi
            else
                # File only exists in current (will be deleted)
                backup_subdir="$BACKUP_DIR/$(dirname "$rel_path")"
                mkdir -p "$backup_subdir"
                cp -p "$file" "$backup_subdir/"
                DELETED_COUNT=$((DELETED_COUNT + 1))
                echo "- **DELETED**: %s\n" "$rel_path" >> "$DIFF_FILE"
            fi
        done < <(find "$CURRENT_OPENCODE" -type f -print0 2>/dev/null)

        # Find new files (exist in new but not in current)
        while IFS= read -r -d '' file; do
            rel_path="${file#$NEW_OPENCODE/}"
            current_file="$CURRENT_OPENCODE/$rel_path"

            if [ ! -f "$current_file" ]; then
                ADDED_COUNT=$((ADDED_COUNT + 1))
                echo "- **ADDED**: %s\n" "$rel_path" >> "$DIFF_FILE"
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
            p "" >> "$DIFF_FILE"
            p "### Modified Files" >> "$DIFF_FILE"
            p "" >> "$DIFF_FILE"
            p "These files were overwritten. Previous versions backed up to \`.opencode-backup/\`" >> "$DIFF_FILE"
            p "" >> "$DIFF_FILE"
        fi

        if [ $DELETED_COUNT -gt 0 ]; then
            p "" >> "$DIFF_FILE"
            p "### Deleted Files" >> "$DIFF_FILE"
            p "" >> "$DIFF_FILE"
            p "These files were removed. Previous versions backed up to \`.opencode-backup/\`" >> "$DIFF_FILE"
            p "" >> "$DIFF_FILE"
        fi

        if [ $ADDED_COUNT -gt 0 ]; then
            p "" >> "$DIFF_FILE"
            p "### Added Files" >> "$DIFF_FILE"
            p "" >> "$DIFF_FILE"
            p "These files are new in this version:" >> "$DIFF_FILE"
            p "" >> "$DIFF_FILE"
        fi

        log_success "Backup created: .opencode-backup/"
        log_info "Modified: $MODIFIED_COUNT | Added: $ADDED_COUNT | Deleted: $DELETED_COUNT"

        # Show backup location
        if [ $MODIFIED_COUNT -gt 0 ] || [ $DELETED_COUNT -gt 0 ]; then
            log_info "Previous versions saved to: .opencode-backup/"
            log_info "Diff report: .opencode-backup/diff.md"
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
        log_info "Skipped assets/ and plugins/ (not using packaged Python)"
    } || {
        log_success ".opencode/assets/"
        log_success ".opencode/plugins/"
    }

    for path in "${CLEANUP_PATHS[@]}"; do
        rm -rf "$path" 2>/dev/null || true
    done

    log_success ".opencode/"
else
    log_warn ".opencode not found"
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

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
EOF
    log_success ".opencode/.gitignore"
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
    log_error "Cannot install into .opencode directory itself"
    log_error "Please run this script from the project root, not from within .opencode/"
    exit 1
fi

# Update install script
if curl -sSL --fail --connect-timeout 10 "$SOURCE_URL" -o "${INSTALL_DIR}/.opencode/tachikoma-install.sh.new" 2>/dev/null; then
    mv "${INSTALL_DIR}/.opencode/tachikoma-install.sh.new" "${INSTALL_DIR}/.opencode/tachikoma-install.sh"
    chmod +x "${INSTALL_DIR}/.opencode/tachikoma-install.sh"
    log_success ".opencode/tachikoma-install.sh"
elif [ -f "${INSTALL_DIR}/.opencode/tachikoma-install.sh" ]; then
    log_info "Update script present (using local)"
elif [ -f "$0" ] && [ "$0" != "bash" ]; then
    cp "$0" "${INSTALL_DIR}/.opencode/tachikoma-install.sh"
    chmod +x "${INSTALL_DIR}/.opencode/tachikoma-install.sh"
    log_success ".opencode/tachikoma-install.sh"
else
    log_warn "Could not secure update mechanism"
fi

p "\n"
p "${MAGENTA}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${NO_COLOR}\n"
p "${MAGENTA}┃${NO_COLOR}   ${WHITE}Installation complete${NO_COLOR}          ${MAGENTA}┃${NO_COLOR}\n"
p "${MAGENTA}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${NO_COLOR}\n"
p "\n"

[ "$USE_PACKAGED" = false ] && [ "$HAS_PYTHON" = false ] && {
    p "${ORANGE}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${NO_COLOR}\n"
    p "${ORANGE}┃${NO_COLOR}  ${WHITE}⚠  PYTHON SETUP REQUIRED  ⚠${NO_COLOR}     ${ORANGE}┃${NO_COLOR}\n"
    p "${ORANGE}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${NO_COLOR}\n"
    p "\n"
    p "${WHITE}You chose not to use the pre-packaged Python.${NO_COLOR}\n"
    p "\n"
    p "${RED}Please install Python and add it to your PATH before running Tachikoma.${NO_COLOR}\n"
    p "\n"
    p "${DIM}Verify installation:${NO_COLOR} ${CYAN}python --version${NO_COLOR}\n"
    p "${DIM}Download Python:${NO_COLOR} ${CYAN}https://python.org/downloads${NO_COLOR}\n"
    p "\n"
}

# Cleanup temp directory (backup is preserved in .opencode-backup/)
rm -rf "$TEMP_DIR" 2>/dev/null || true

p "Run ${MAGENTA}opencode${NO_COLOR} to start\n"
p "\n"

# Show backup info if this was an update
if [ -d "${INSTALL_DIR}/.opencode-backup" ]; then
    p "${WHITE}Backup available:${NO_COLOR}\n"
    p "  ${DIM}Previous versions:${NO_COLOR} ${CYAN}.opencode-backup/${NO_COLOR}\n"
    p "  ${DIM}Diff report:${NO_COLOR} ${CYAN}.opencode-backup/diff.md${NO_COLOR}\n"
    p "\n"
fi

p "${WHITE}To update:${NO_COLOR}\n"
p "\n"
p "${DIM}  # Option 1: Run the script directly${NO_COLOR}\n"
p "  ${CYAN}./${MAGENTA}.opencode/tachikoma-install.sh${NO_COLOR} -b ${BRANCH}\n"
p "\n"
p "${DIM}  # Option 2: Quick curl${NO_COLOR}\n"
p "  ${CYAN}curl${NO_COLOR} -sS ${SOURCE_URL} | bash -s -- -b ${BRANCH}\n"
p "\n"
p "${WHITE}Flags:${NO_COLOR}\n"
p "  ${CYAN}-b, --branch${NO_COLOR} <name>              Branch (default: ${BRANCH})\n"
p "  ${CYAN}--gitlab${NO_COLOR}                         Use GitLab\n"
p "  ${CYAN}--include-prepackaged-python${NO_COLOR}     Include pre-packaged Python\n"
p "\n"
p "${DIM}Check available branches:${NO_COLOR}\n"
p "  ${CYAN}git${NO_COLOR} ls-remote --heads https://github.com/${REPO_OWNER}/${REPO_NAME}.git\n"
p "\n"
