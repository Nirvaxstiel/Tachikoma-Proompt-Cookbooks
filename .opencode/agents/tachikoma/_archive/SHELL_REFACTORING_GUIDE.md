# Shell Script Refactoring Guide

This document guides the migration of shell scripts to use shared utilities.

## New Shared Files Created

### 1. Shell Utilities
**File:** `.opencode/agents/tachikoma/tools/shared/shell-utils.sh`

**Purpose:** Centralized shell utilities for Tachikoma scripts

**Available Functions:**
- `sh_print_header "Title"` - Print styled header
- `sh_print_success "Message"` - Print success message
- `sh_print_error "Message"` - Print error message
- `sh_print_warning "Message"` - Print warning message
- `sh_print_info "Message"` - Print info message
- `sh_print_highlight "Message"` - Print highlighted message
- `sh_print_divider` - Print divider line
- `sh_print_section "Title"` - Print section header
- `sh_print_check "Message"` - Print checkmark success
- `sh_print_x "Message"` - Print X mark error
- `sh_print_info_icon "Message"` - Print info with icon
- `sh_print_warn_icon "Message"` - Print warning with icon
- `sh_print_script_start "Name"` - Print script start
- `sh_print_script_end "Code" "Name"` - Print script end
- `sh_print_step "Num" "Title"` - Print step header

**Usage:**
```bash
#!/bin/bash

# Source shared utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../tools/shared/shell-utils.sh"

# Now use shared functions
sh_print_header "Section Title"
sh_print_success "Operation completed"
sh_print_error "Something failed"
sh_print_warning "Be careful!"
sh_print_info "Processing..."

# Advanced usage
sh_print_script_start "My Script"
# ... do work ...
sh_print_script_end $? "My Script"
```

### 2. Batch Utilities
**File:** `.opencode/agents/tachikoma/tools/shared/batch-utils.bat`

**Purpose:** Centralized batch utilities for Tachikoma scripts

**Available Functions:**
- `call batch-utils.bat :print_header "Title"` - Print styled header
- `call batch-utils.bat :print_success "Message"` - Print success message
- `call batch-utils.bat :print_error "Message"` - Print error message
- `call batch-utils.bat :print_warning "Message"` - Print warning message
- `call batch-utils.bat :print_info "Message"` - Print info message
- `call batch-utils.bat :print_divider` - Print divider line
- `call batch-utils.bat :print_hr` - Print horizontal rule
- `call batch-utils.bat :print_section "Title"` - Print section header
- `call batch-utils.bat :print_check "Message"` - Print checkmark
- `call batch-utils.bat :print_x "Message"` - Print X mark
- `call batch-utils.bat :print_script_start "Name"` - Print script start
- `call batch-utils.bat :print_script_end "Code"` - Print script end

**Usage:**
```batch
@echo off

REM Source shared utilities
call "%~dp0shared\batch-utils.bat"

REM Now use shared functions
call "%~dp0shared\batch-utils.bat" :print_header "Section Title"
call "%~dp0shared\batch-utils.bat" :print_success "Operation completed"
call "%~dp0shared\batch-utils.bat" :print_error "Something failed"

REM Script start/end
call "%~dp0shared\batch-utils.bat" :print_script_start "My Script"
REM ... do work ...
call "%~dp0shared\batch-utils.bat" :print_script_end %errorlevel% "My Script"
```

## Migration Plan

### Phase 1: Update run-smoke-tests.sh

**Lines to Remove:**
- Lines 23-29: Color definitions (RED, GREEN, YELLOW, BLUE, CYAN, NC)
- Lines 32-36: print_header() function definition

**Lines to Add:**
```bash
# At line 23, after shebang and comments
# Source shared shell utilities
source "$(dirname "${BASH_SOURCE[0]}")/../tools/shared/shell-utils.sh"
```

**Changes:**
- Replace all `print_header` calls with `sh_print_header`
- Replace all `echo -e "${GREEN}[INFO]${NC}"` with `sh_print_info`
- Replace all `echo -e "${RED}[ERROR]${NC}"` with `sh_print_error`
- Replace all `echo -e "${YELLOW}[WARN]${NC}"` with `sh_print_warning`
- Replace all `echo -e "${GREEN}[OK]${NC}"` with `sh_print_success`

**Estimated Savings:** ~20 lines

---

### Phase 2: Update tachikoma-install.sh

**Lines to Remove:**
- Lines 20-28: Color definitions (CYAN, GREEN, MAGENTA, ORANGE, RED, WHITE, DIM, NO_COLOR)
- Lines 40-78: Duplicate log functions (log_info, log_success, log_highlight, log_warn, log_error)

**Lines to Add:**
```bash
# At line 20, after shebang and comments
# Source shared shell utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/tools/shared/shell-utils.sh"
```

**Changes:**
- Remove duplicate log_info/log_success/log_error functions
- Use sh_print_info, sh_print_success, sh_print_error instead
- Update all echo statements to use shared functions

**Estimated Savings:** ~60 lines

---

### Phase 3: Update formatter/router.sh

**Lines to Remove:**
- Lines 9-14: Color definitions (RED, GREEN, YELLOW, BLUE, NC)
- Lines 16-36: All print function definitions

**Lines to Add:**
```bash
# At line 9, after shebang and comments
# Source shared shell utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../tools/shared/shell-utils.sh"
```

**Changes:**
- Replace print_header → sh_print_header
- Replace print_success → sh_print_success
- Replace print_warning → sh_print_warning
- Replace print_error → sh_print_error
- Replace print_info → sh_print_info

**Estimated Savings:** ~30 lines

---

### Phase 4: Update All Other router.sh Files

**Files:**
- `.opencode/skills/context-manager/router.sh`
- `.opencode/skills/context7/router.sh`
- `.opencode/skills/skill-composer/router.sh`

**Lines to Remove in each:**
- Color definitions (RED, GREEN, YELLOW, BLUE, NC) - ~5 lines
- Print functions (print_header, print_success, print_error, print_warn, print_info) - ~20 lines

**Lines to Add to each:**
```bash
# After shebang and comments
# Source shared shell utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd"
source "$SCRIPT_DIR/../../../tools/shared/shell-utils.sh"
```

**Estimated Savings per file:** ~25 lines
**Total savings:** ~75 lines (3 files)

---

### Phase 5: Update run-smoke-tests.bat

**Lines to Remove:**
- Lines 112-119: Manual echo formatting (with colors)
- Lines 134-140: Manual echo formatting (with colors)

**Lines to Add:**
```batch
REM At the beginning of the file, after comments
REM Source shared batch utilities
call "%~dp0shared\batch-utils.bat"
```

**Changes:**
- Replace manual echo formatting with call to batch-utils functions
- Remove hardcoded color codes

**Estimated Savings:** ~30 lines

---

### Phase 6: Update Other Batch Files

**Files:**
- `dashboard/tachikoma-dashboard.bat`
- `dashboard/dashboard-smoke-test.bat`

**Lines to Remove:** Manual echo formatting (~15 lines each)
**Lines to Add:** Source batch-utils.bat at top
**Estimated Savings per file:** ~15 lines
**Total savings:** ~30 lines

---

## Summary

### Files to Migrate

| File | Type | Lines to Remove | Est. Savings |
|------|------|-----------------|---------------|
| run-smoke-tests.sh | Shell | ~20 | 20 |
| tachikoma-install.sh | Shell | ~60 | 60 |
| formatter/router.sh | Shell | ~30 | 30 |
| context-manager/router.sh | Shell | ~25 | 25 |
| context7/router.sh | Shell | ~25 | 25 |
| skill-composer/router.sh | Shell | ~25 | 25 |
| run-smoke-tests.bat | Batch | ~30 | 30 |
| tachikoma-dashboard.bat | Batch | ~15 | 15 |
| dashboard-smoke-test.bat | Batch | ~15 | 15 |

**Total Files:** 9
**Total Lines Saved:** ~245 lines

### Impact

**Benefits:**
- Single source of truth for shell/batch utilities
- Consistent styling across all scripts
- Easier to maintain (change once, benefit everywhere)
- Better documentation in shared files

**Migration Effort:**
- Low: Shell scripts are straightforward to update
- Low: Batch files are straightforward to update
- Total time: ~30-60 minutes to migrate all files

---

## Migration Checklist

- [ ] Create shell-utils.sh ✅
- [ ] Create batch-utils.bat ✅
- [ ] Migrate run-smoke-tests.sh
- [ ] Migrate tachikoma-install.sh
- [ ] Migrate formatter/router.sh
- [ ] Migrate context-manager/router.sh
- [ ] Migrate context7/router.sh
- [ ] Migrate skill-composer/router.sh
- [ ] Migrate run-smoke-tests.bat
- [ ] Migrate tachikoma-dashboard.bat
- [ ] Migrate dashboard-smoke-test.bat
- [ ] Test all migrated scripts
