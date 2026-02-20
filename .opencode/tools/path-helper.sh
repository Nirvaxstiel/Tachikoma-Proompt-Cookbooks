#!/bin/bash
#
# Path Helper - Centralized Python/UV detection for Tachikoma
#
# Usage:
#   source /path/to/path-helper.sh
#   PYTHON=$(find_python)
#   UV=$(find_uv)
#
# Detection order:
#   1. Environment variables (PYTHON, UV) - set by opencode injection
#   2. System PATH (python, python3, uv)
#   3. Bundled assets (.opencode/assets/Python310, .opencode/assets/uv.exe)
#
# This file is sourced by other scripts, not executed directly.
#

# Get directories relative to this script's location
_PATH_HELPER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCODE_DIR="$(cd "$_PATH_HELPER_DIR/.." && pwd)"
ASSETS_DIR="$OPENCODE_DIR/assets"

# Colors for output (optional, only if terminal supports it)
if [ -t 1 ]; then
    _PH_RED='\033[0;31m'
    _PH_GREEN='\033[0;32m'
    _PH_YELLOW='\033[1;33m'
    _PH_DIM='\033[2m'
    _PH_NC='\033[0m'
else
    _PH_RED=''
    _PH_GREEN=''
    _PH_YELLOW=''
    _PH_DIM=''
    _PH_NC=''
fi

# ===========================================================================
# Python Detection
# ===========================================================================

# Find Python executable
# Returns: path to Python executable, or empty if not found
# Sets: PYTHON variable if found
find_python() {
    local python_path=""
    
    # 1. Environment variable (injected by opencode plugin)
    if [ -n "$PYTHON" ]; then
        echo "$PYTHON"
        return 0
    fi
    
    # 2. System PATH
    if command -v python &> /dev/null; then
        python_path="$(command -v python)"
        echo "$python_path"
        return 0
    fi
    
    if command -v python3 &> /dev/null; then
        python_path="$(command -v python3)"
        echo "$python_path"
        return 0
    fi
    
    # 3. Bundled Python (Windows and Unix paths)
    local bundled_locations=(
        "$ASSETS_DIR/Python310/python.exe"
        "$ASSETS_DIR/Python310/python"
        "$ASSETS_DIR/Python310/python3.exe"
        "$ASSETS_DIR/Python310/python3"
        "$ASSETS_DIR/Python/python.exe"
        "$ASSETS_DIR/Python/python"
        "$OPENCODE_DIR/Python310/python.exe"
        "$OPENCODE_DIR/Python310/python"
    )
    
    for loc in "${bundled_locations[@]}"; do
        if [ -x "$loc" ]; then
            echo "$loc"
            return 0
        fi
    done
    
    return 1
}

# Check if Python is available
# Returns: 0 if found, 1 if not
has_python() {
    find_python &> /dev/null
}

# Print Python info (for debugging)
print_python_info() {
    local python
    python=$(find_python 2>/dev/null)
    
    if [ -n "$python" ]; then
        echo -e "${_PH_GREEN}[INFO]${_PH_NC} Python: $python"
        if [ -n "$PYTHON" ]; then
            echo -e "${_PH_DIM}        (from environment variable)${_PH_NC}"
        fi
    else
        echo -e "${_PH_RED}[ERROR]${_PH_NC} Python not found"
        echo -e "${_PH_DIM}        Install Python or use bundled Python in assets/${_PH_NC}"
    fi
}

# ===========================================================================
# UV Detection
# ===========================================================================

# Find UV executable
# Returns: path to UV executable, or empty if not found
# Sets: UV variable if found
find_uv() {
    local uv_path=""
    
    # 1. Environment variable (injected by opencode plugin)
    if [ -n "$UV" ]; then
        echo "$UV"
        return 0
    fi
    
    # 2. System PATH
    if command -v uv &> /dev/null; then
        uv_path="$(command -v uv)"
        echo "$uv_path"
        return 0
    fi
    
    # 3. Bundled UV (Windows and Unix paths)
    local bundled_locations=(
        "$ASSETS_DIR/uv.exe"
        "$ASSETS_DIR/uv"
        "$OPENCODE_DIR/uv.exe"
        "$OPENCODE_DIR/uv"
    )
    
    for loc in "${bundled_locations[@]}"; do
        if [ -x "$loc" ]; then
            echo "$loc"
            return 0
        fi
    done
    
    return 1
}

# Check if UV is available
# Returns: 0 if found, 1 if not
has_uv() {
    find_uv &> /dev/null
}

# Print UV info (for debugging)
print_uv_info() {
    local uv
    uv=$(find_uv 2>/dev/null)
    
    if [ -n "$uv" ]; then
        echo -e "${_PH_GREEN}[INFO]${_PH_NC} UV: $uv"
        if [ -n "$UV" ]; then
            echo -e "${_PH_DIM}       (from environment variable)${_PH_NC}"
        fi
    else
        echo -e "${_PH_YELLOW}[WARN]${_PH_NC} UV not found"
        echo -e "${_PH_DIM}       Some features may not work${_PH_NC}"
    fi
}

# ===========================================================================
# UV Download (fallback)
# ===========================================================================

# Download UV if not found
# Returns: 0 on success, 1 on failure
# Sets: UV variable if downloaded
download_uv() {
    echo -e "${_PH_YELLOW}[INFO]${_PH_NC} UV not found, downloading..."
    
    # Detect platform
    local os_type
    local uv_filename
    
    case "$(uname -s)" in
        Linux*)
            os_type="linux"
            uv_filename="uv-x86_64-unknown-linux-gnu"
            ;;
        Darwin*)
            os_type="darwin"
            uv_filename="uv-x86_64-apple-darwin"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            os_type="windows"
            uv_filename="uv-x86_64-pc-windows-msvc"
            ;;
        *)
            echo -e "${_PH_RED}[ERROR]${_PH_NC} Unsupported platform: $(uname -s)"
            return 1
            ;;
    esac
    
    local uv_url="https://astral.sh/uv/latest/${uv_filename}.tar.gz"
    local temp_dir
    temp_dir=$(mktemp -d)
    
    # Download
    if command -v curl &> /dev/null; then
        curl -Ls "$uv_url" -o "$temp_dir/uv.tar.gz"
    elif command -v wget &> /dev/null; then
        wget -q "$uv_url" -O "$temp_dir/uv.tar.gz"
    else
        echo -e "${_PH_RED}[ERROR]${_PH_NC} Neither curl nor wget available"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Extract
    if [ -f "$temp_dir/uv.tar.gz" ]; then
        mkdir -p "$ASSETS_DIR"
        tar -xzf "$temp_dir/uv.tar.gz" -C "$ASSETS_DIR" 2>/dev/null || \
            tar -xzf "$temp_dir/uv.tar.gz" -C "$temp_dir" 2>/dev/null
        
        # Find extracted UV
        if [ -x "$temp_dir/uv" ]; then
            UV="$temp_dir/uv"
            echo -e "${_PH_GREEN}[INFO]${_PH_NC} Downloaded UV: $UV"
        elif [ -x "$ASSETS_DIR/uv" ]; then
            UV="$ASSETS_DIR/uv"
            echo -e "${_PH_GREEN}[INFO]${_PH_NC} Downloaded UV: $UV"
        elif [ -x "$ASSETS_DIR/uv.exe" ]; then
            UV="$ASSETS_DIR/uv.exe"
            echo -e "${_PH_GREEN}[INFO]${_PH_NC} Downloaded UV: $UV"
        else
            echo -e "${_PH_RED}[ERROR]${_PH_NC} Failed to extract UV"
            rm -rf "$temp_dir"
            return 1
        fi
        
        rm -rf "$temp_dir"
        return 0
    fi
    
    rm -rf "$temp_dir"
    echo -e "${_PH_RED}[ERROR]${_PH_NC} Failed to download UV"
    return 1
}

# ===========================================================================
# Combined Detection
# ===========================================================================

# Detect both Python and UV
# Sets: PYTHON and UV variables
# Returns: 0 if Python found, 1 if not
detect_runtime() {
    # Find Python
    if ! PYTHON=$(find_python); then
        echo -e "${_PH_RED}[ERROR]${_PH_NC} Python not found in PATH or bundled locations"
        echo "Please install Python 3.10+ or place bundled Python in assets folder"
        return 1
    fi
    
    # Find UV (optional)
    if ! UV=$(find_uv); then
        echo -e "${_PH_YELLOW}[WARN]${_PH_NC} UV not found - some features may not work"
        UV=""
    fi
    
    # Export for subprocesses
    export PYTHON
    export UV
    
    return 0
}

# Print runtime info
print_runtime_info() {
    print_python_info
    print_uv_info
}

# ===========================================================================
# Asset Paths
# ===========================================================================

# Get assets directory path
get_assets_dir() {
    echo "$ASSETS_DIR"
}

# Get opencode directory path
get_opencode_dir() {
    echo "$OPENCODE_DIR"
}

# Get Python directory (parent of python executable)
get_python_dir() {
    local python
    python=$(find_python 2>/dev/null)
    if [ -n "$python" ]; then
        dirname "$python"
    fi
}

# Get UV cache directory
get_uv_cache_dir() {
    echo "$OPENCODE_DIR/cache/uv"
}
