#!/usr/bin/env bash
#
# Tachikoma Bootstrap Script
# Usage: curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash -s -- [OPTIONS]
#

set -e

# Default values
BRANCH="master"
USE_GITLAB=false
TARGET_DIR=""

# Default repo (GitHub)
REPO_OWNER="Nirvaxstiel"
REPO_NAME="Tachikoma-Proompt-Cookbooks"

# Ghost in the Shell theme colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
MAGENTA='\033[38;5;197m'   # GITS crimson/pink
ORANGE='\033[0;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
DIM='\033[2m'
NC='\033[0m' # No Color

print_usage() {
    cat <<EOF
Tachikoma Bootstrap Installer

Usage:
    curl -sS https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/master/.opencode/tachikoma-install.sh | bash -s -- [OPTIONS]

    OR download and run:

    curl -sS -o tachikoma-install.sh https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/master/.opencode/tachikoma-install.sh
    chmod +x tachikoma-install.sh
    ./tachikoma-install.sh [OPTIONS]

Options:
    -b, --branch <name>    Branch to install from (default: master)
    -C, --cwd <dir>        Target directory (default: current directory)
    --gitlab               Use GitLab instead of GitHub
    -h, --help             Show this help message

Examples:
    # Install to current directory (GitHub master)
    curl -sS ... | bash -s --

    # Install to current directory, specific branch
    curl -sS ... | bash -s -- -b develop

    # Install to specific directory
    curl -sS ... | bash -s -- -C /path/to/myproject

    # Install from GitLab
    curl -sS ... | bash -s -- --gitlab

EOF
}

log_info() {
    echo -e "${CYAN}[TACHIKOMA]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_highlight() {
    echo -e "${MAGENTA}$1${NC}"
}

log_warn() {
    echo -e "${ORANGE}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
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

# Determine target directory
if [ -n "$TARGET_DIR" ]; then
    if [ ! -d "$TARGET_DIR" ]; then
        log_error "Directory does not exist: $TARGET_DIR"
        exit 1
    fi
    cd "$TARGET_DIR"
fi

# Guard: Check if we're running from inside .opencode/ and navigate to parent
CURRENT_DIR="$(pwd)"
CURRENT_DIR_NAME="$(basename "$CURRENT_DIR")"

if [ "$CURRENT_DIR_NAME" = ".opencode" ]; then
    log_info "Detected execution from within .opencode/, moving to parent directory"
    cd ..
elif [[ "$CURRENT_DIR" == */.opencode/* ]] || [[ "$CURRENT_DIR" == */.opencode ]]; then
    # We're somewhere inside a .opencode directory structure
    # Navigate to the parent of the .opencode folder
    log_info "Detected execution from within .opencode structure, moving to project root"
    # Find the parent of .opencode by removing the .opencode part and everything after
    while [ "$CURRENT_DIR_NAME" != ".opencode" ] && [ "$CURRENT_DIR" != "/" ]; do
        cd ..
        CURRENT_DIR="$(pwd)"
        CURRENT_DIR_NAME="$(basename "$CURRENT_DIR")"
    done
    # Now we're at the .opencode folder, move up one more level
    if [ "$CURRENT_DIR_NAME" = ".opencode" ]; then
        cd ..
    fi
fi

# Guard: Detect if script path contains .opencode (for: bash A/B/.opencode/script.sh)
# Try to determine the script's actual directory
SCRIPT_PATH="$0"
if [ "$SCRIPT_PATH" != "bash" ] && [ -f "$SCRIPT_PATH" ]; then
    SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
    SCRIPT_DIR_NAME="$(basename "$SCRIPT_DIR")"

    if [ "$SCRIPT_DIR_NAME" = ".opencode" ]; then
        # Script is in a .opencode directory, navigate to its parent
        SCRIPT_PARENT="$(cd "$(dirname "$SCRIPT_PATH")/.." && pwd)"
        if [ -d "$SCRIPT_PARENT" ]; then
            log_info "Detected script located in .opencode/, using parent as install target"
            cd "$SCRIPT_PARENT"
        fi
    fi
fi

# Guard: Validate we're not about to create nested .opencode/.opencode
if [ -d ".opencode/.opencode" ]; then
    log_warn "Detected nested .opencode/.opencode - cleaning up"
    rm -rf ".opencode/.opencode"
fi

# Determine archive URL
if [ "$USE_GITLAB" = true ]; then
    ARCHIVE_URL="https://gitlab.com/${REPO_OWNER}/${REPO_NAME}/-/archive/${BRANCH}/${REPO_NAME}-${BRANCH}.tar.gz"
    SOURCE_NAME="GitLab"
else
    # GitHub format: works for both branches and tags
    ARCHIVE_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/${BRANCH}.tar.gz"
    SOURCE_NAME="GitHub"
fi

# Save the actual target directory (after potential cd)
INSTALL_DIR="$(pwd)"

log_info "Installing from ${SOURCE_NAME} (${BRANCH})"
log_info "Target: ${INSTALL_DIR}"

# Check if running in a git repository
if [ ! -d ".git" ]; then
    log_warn "Not in a git repo"
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

cd "$TEMP_DIR"

log_info "Acquiring data..."

# Download the archive
if ! curl -sSL "$ARCHIVE_URL" -o "repo.tar.gz"; then
    log_error "Failed to acquire data. Branch '${BRANCH}' may not exist."
    exit 1
fi

# Check if the downloaded file is actually a tarball (not a 404 page)
if ! tar -tzf "repo.tar.gz" > /dev/null 2>&1; then
    log_error "Failed to extract. Branch '${BRANCH}' may not exist."
    exit 1
fi

log_info "Extracting..."

# Extract tarball
tar -xzf "repo.tar.gz"

# Find the extracted directory
EXTRACTED_DIR=$(ls -d */ 2>/dev/null | head -1)

if [ -z "$EXTRACTED_DIR" ]; then
    log_error "Failed to extract"
    exit 1
fi

cd "$EXTRACTED_DIR"

echo ""
log_highlight "━━━ TACHIKOMA ━━━"

# Copy AGENTS.md
if [ -f "AGENTS.md" ]; then
    cp "AGENTS.md" "${INSTALL_DIR}/AGENTS.md"
    log_success "AGENTS.md"
else
    log_warn "AGENTS.md not found"
fi

# Copy .opencode directory
if [ -d ".opencode" ]; then
    # Remove existing .opencode first (Windows-safe: move to temp, then remove)
    if [ -d "${INSTALL_DIR}/.opencode" ]; then
        # Move to temp location first to avoid "device busy" on Windows
        OLD_OPENCODE_BACKUP="${TEMP_DIR}/.opencode.old.$$"
        mv "${INSTALL_DIR}/.opencode" "$OLD_OPENCODE_BACKUP" 2>/dev/null || true
        rm -rf "$OLD_OPENCODE_BACKUP" 2>/dev/null || true
    fi

    # Copy .opencode
    cp -r ".opencode" "${INSTALL_DIR}/"

    # Remove files we don't need
    rm -rf "${INSTALL_DIR}/.opencode/node_modules" 2>/dev/null || true
    rm -f "${INSTALL_DIR}/.opencode/package.json" 2>/dev/null || true
    rm -f "${INSTALL_DIR}/.opencode/bun.lock" 2>/dev/null || true
    rm -f "${INSTALL_DIR}/.opencode/.gitignore" 2>/dev/null || true

    log_success ".opencode/"
else
    log_warn ".opencode not found"
fi

# Create .gitignore for .opencode if it doesn't exist
if [ ! -f "${INSTALL_DIR}/.opencode/.gitignore" ]; then
    cat > "${INSTALL_DIR}/.opencode/.gitignore" << 'EOF'
# Dependencies
node_modules/
bun.lock

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
EOF
    log_success ".opencode/.gitignore"
fi

# Generate raw URL for update command
if [ "$USE_GITLAB" = true ]; then
    RAW_BASE="https://gitlab.com/${REPO_OWNER}/${REPO_NAME}/-/raw/${BRANCH}"
    SOURCE_URL="https://gitlab.com/${REPO_OWNER}/${REPO_NAME}/-/raw/${BRANCH}/.opencode/tachikoma-install.sh"
else
    RAW_BASE="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}"
    SOURCE_URL="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/.opencode/tachikoma-install.sh"
fi

# Final validation: Ensure INSTALL_DIR doesn't end with /.opencode
INSTALL_DIR_NAME="$(basename "$INSTALL_DIR")"
if [ "$INSTALL_DIR_NAME" = ".opencode" ]; then
    log_error "Cannot install into .opencode directory itself"
    log_error "Please run this script from the project root, not from within .opencode/"
    exit 1
fi

# Copy the install script to the .opencode directory for easier updates
# Always try to get latest version, fallback to existing if download fails
if curl -sSL --fail --connect-timeout 10 "$SOURCE_URL" -o "${INSTALL_DIR}/.opencode/tachikoma-install.sh.new" 2>/dev/null; then
    # Download succeeded - replace old version
    mv "${INSTALL_DIR}/.opencode/tachikoma-install.sh.new" "${INSTALL_DIR}/.opencode/tachikoma-install.sh"
    chmod +x "${INSTALL_DIR}/.opencode/tachikoma-install.sh"
    log_success ".opencode/tachikoma-install.sh"
elif [ -f "${INSTALL_DIR}/.opencode/tachikoma-install.sh" ]; then
    # Download failed but we have existing version - keep it
    log_info "Update script present (using local)"
elif [ -f "$0" ] && [ "$0" != "bash" ]; then
    # No existing, try local $0
    cp "$0" "${INSTALL_DIR}/.opencode/tachikoma-install.sh"
    chmod +x "${INSTALL_DIR}/.opencode/tachikoma-install.sh"
    log_success ".opencode/tachikoma-install.sh"
else
    log_warn "Could not secure update mechanism"
fi

echo ""
echo -e "${MAGENTA}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${NC}"
echo -e "${MAGENTA}┃${NC}   ${WHITE}Installation complete${NC}          ${MAGENTA}┃${NC}"
echo -e "${MAGENTA}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${NC}"
echo ""
echo -e "Run ${MAGENTA}opencode${NC} to start"
echo ""
echo -e "${WHITE}To update:${NC}"
echo ""
echo -e "${DIM}  # Option 1: Run the script directly${NC}"
echo -e "  ${CYAN}./${MAGENTA}.opencode/tachikoma-install.sh${NC} -b ${BRANCH}"
echo ""
echo -e "${DIM}  # Option 2: Quick curl${NC}"
echo -e "  ${CYAN}curl${NC} -sS ${SOURCE_URL} | bash -s -- -b ${BRANCH}"
echo ""
echo -e "${WHITE}Flags:${NC}"
echo -e "  ${CYAN}-b, --branch${NC} <name>    Branch (default: ${BRANCH})"
echo -e "  ${CYAN}--gitlab${NC}               Use GitLab"
echo ""
echo -e "${DIM}Check available branches:${NC}"
echo -e "  ${CYAN}git${NC} ls-remote --heads https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
echo ""
