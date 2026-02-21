#!/bin/bash
#
# Shared Shell Utilities for Tachikoma
#
# This file provides common shell utilities for Tachikoma scripts,
# consolidating duplicate color definitions and print functions.
#
# Usage:
#   source /path/to/shell-utils.sh
#   Then use: sh_print_header "Title", sh_print_success "Done", etc.
#

# ===========================================================================
# Color Definitions
# ===========================================================================

# ANSI color codes for terminal output
# These are exported so they're available to sourcing scripts
export SH_RED='\033[0;31m'
export SH_GREEN='\033[0;32m'
export SH_YELLOW='\033[1;33m'
export SH_BLUE='\033[0;34m'
export SH_CYAN='\033[0;36m'
export SH_MAGENTA='\033[0;35m'
export SH_NC='\033[0m'  # No Color

# Additional colors for consistency
export SH_ORANGE='\033[0;33m'
export SH_WHITE='\033[1;37m'
export SH_DIM='\033[2m'
export SH_BOLD='\033[1m'

# ===========================================================================
# Print Functions
# ===========================================================================

# Print a styled header
sh_print_header() {
    local text="$1"
    echo -e "${SH_BLUE}════════════════════════════════════════════════════════${SH_NC}"
    echo -e "${SH_BLUE}${text}${SH_NC}"
    echo -e "${SH_BLUE}════════════════════════════════════════════════════════${SH_NC}"
}

# Print a success message
sh_print_success() {
    local message="$1"
    echo -e "${SH_GREEN}[OK]${SH_NC} ${message}"
}

# Print an error message
sh_print_error() {
    local message="$1"
    echo -e "${SH_RED}[ERROR]${SH_NC} ${message}"
}

# Print a warning message
sh_print_warning() {
    local message="$1"
    echo -e "${SH_YELLOW}[WARN]${SH_NC} ${message}"
}

# Print an info message
sh_print_info() {
    local message="$1"
    echo -e "${SH_CYAN}[INFO]${SH_NC} ${message}"
}

# Print a highlighted message (magenta)
sh_print_highlight() {
    local message="$1"
    echo -e "${SH_MAGENTA}[HIGHLIGHT]${SH_NC} ${message}"
}

# Print a divider line
sh_print_divider() {
    local char="${1:-=}"
    local width="${2:-60}"
    local line=""
    for ((i=0; i<width; i++)); do
        line+="${char}"
    done
    echo -e "${SH_DIM}${line}${SH_NC}"
}

# Print a horizontal rule with text
sh_print_section() {
    local title="$1"
    local char="${2:- }"
    echo ""
    echo -e "${SH_BOLD}${SH_CYAN}${title}${SH_NC}"
    sh_print_divider "-"
    echo ""
}

# Print a checkmark with message (success variant)
sh_print_check() {
    local message="$1"
    echo -e "${SH_GREEN}[✓]${SH_NC} ${message}"
}

# Print an X mark with message (error variant)
sh_print_x() {
    local message="$1"
    echo -e "${SH_RED}[✗]${SH_NC} ${message}"
}

# Print an info icon with message
sh_print_info_icon() {
    local message="$1"
    echo -e "${SH_CYAN}[ℹ]${SH_NC} ${message}"
}

# Print a warning icon with message
sh_print_warn_icon() {
    local message="$1"
    echo -e "${SH_YELLOW}[⚠]${SH_NC} ${message}"
}

# ===========================================================================
# Utility Functions
# ===========================================================================

# Check if running in a terminal that supports colors
sh_supports_color() {
    if [ -t 1 ]; then
        return 0
    else
        return 1
    fi
}

# Disable colors for non-terminal output
sh_disable_colors() {
    export SH_RED=''
    export SH_GREEN=''
    export SH_YELLOW=''
    export SH_BLUE=''
    export SH_CYAN=''
    export SH_MAGENTA=''
    export SH_NC=''
    export SH_ORANGE=''
    export SH_WHITE=''
    export SH_DIM=''
    export SH_BOLD=''
}

# Enable colors (reset to defaults)
sh_enable_colors() {
    export SH_RED='\033[0;31m'
    export SH_GREEN='\033[0;32m'
    export SH_YELLOW='\033[1;33m'
    export SH_BLUE='\033[0;34m'
    export SH_CYAN='\033[0;36m'
    export SH_MAGENTA='\033[0;35m'
    export SH_NC='\033[0m'
    export SH_ORANGE='\033[0;33m'
    export SH_WHITE='\033[1;37m'
    export SH_DIM='\033[2m'
    export SH_BOLD='\033[1m'
}

# Print script start header
sh_print_script_start() {
    local script_name="$1"
    sh_print_header "Running: ${script_name}"
    echo -e "${SH_CYAN}Script:${SH_NC} ${script_name}"
    echo -e "${SH_CYAN}Args:${SH_NC}   $@"
    echo ""
}

# Print script end summary
sh_print_script_end() {
    local exit_code="$1"
    local script_name="${2:-script}"

    echo ""
    if [ "${exit_code}" -eq 0 ]; then
        sh_print_success "${script_name} completed successfully"
    elif [ "${exit_code}" -eq 1 ]; then
        sh_print_error "${script_name} failed"
    else
        sh_print_warning "${script_name} exited with code ${exit_code}"
    fi
}

# Print a step header
sh_print_step() {
    local step_num="$1"
    local step_name="$2"
    echo -e "${SH_BOLD}${SH_CYAN}[${step_num}]${SH_NC} ${step_name}"
    sh_print_divider "-"
}

# Export all functions for sourcing scripts
export -f sh_print_header
export -f sh_print_success
export -f sh_print_error
export -f sh_print_warning
export -f sh_print_info
export -f sh_print_highlight
export -f sh_print_divider
export -f sh_print_section
export -f sh_print_check
export -f sh_print_x
export -f sh_print_info_icon
export -f sh_print_warn_icon
export -f sh_supports_color
export -f sh_disable_colors
export -f sh_enable_colors
export -f sh_print_script_start
export -f sh_print_script_end
export -f sh_print_step
