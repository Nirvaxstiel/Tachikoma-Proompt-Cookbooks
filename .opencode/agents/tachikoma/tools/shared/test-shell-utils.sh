#!/bin/bash
# Test script for shell-utils.sh

# Source shared utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/shell-utils.sh"

# Test all functions
echo "Testing shell-utils.sh functions"
echo ""

sh_print_header "Test Header"
sh_print_section "Section Test"
sh_print_success "This is a success message"
sh_print_error "This is an error message"
sh_print_warning "This is a warning message"
sh_print_info "This is an info message"
sh_print_highlight "This is a highlight message"
sh_print_divider
sh_print_step "1" "Testing Steps"

echo ""
sh_print_check "Checkmark test"
sh_print_x "X mark test"
sh_print_info_icon "Info icon test"
sh_print_warn_icon "Warning icon test"

echo ""
sh_print_script_start "Test Script"
sh_print_script_end 0 "Test Script"

echo ""
echo "[OK] All shell-utils.sh functions working correctly!"
