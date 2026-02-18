#!/bin/bash
#
# Smoke Test Runner Wrapper
# - Uses injected Python or bundled Python
# - Downloads uv if not present
# - Sets environment variables for the session
#
# Usage:
#   ./run-smoke-tests.sh                  # Run all tests
#   ./run-smoke-tests.sh python           # Test Python scripts only
#   ./run-smoke-tests.sh shell            # Test Shell scripts only
#   ./run-smoke-tests.sh --fail-fast      # Stop on first failure
#

set -e

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCODE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ASSETS_DIR="$OPENCODE_DIR/assets"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print header
print_header() {
    echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
}

# ===========================================================================
# Python Detection: PATH -> Bundled Python
# ===========================================================================
find_python() {
    # Try to find Python from PATH first (injected by opencode)
    if command -v python &> /dev/null; then
        PYTHON="$(command -v python)"
        echo -e "${GREEN}[INFO]${NC} Using Python from PATH: $PYTHON"
        return 0
    fi

    if command -v python3 &> /dev/null; then
        PYTHON="$(command -v python3)"
        echo -e "${GREEN}[INFO]${NC} Using Python3 from PATH: $PYTHON"
        return 0
    fi

    # Try bundled Python in common locations
    local bundled_locations=(
        "$ASSETS_DIR/Python310/python"
        "$ASSETS_DIR/Python310/python3"
        "$ASSETS_DIR/Python/python"
        "$ASSETS_DIR/Python/python3"
        "$OPENCODE_DIR/Python310/python"
        "$OPENCODE_DIR/Python310/python3"
    )

    for loc in "${bundled_locations[@]}"; do
        if [ -x "$loc" ]; then
            PYTHON="$loc"
            echo -e "${GREEN}[INFO]${NC} Using bundled Python: $PYTHON"
            return 0
        fi
    done

    # Try .exe on Windows compatibility
    if [ -x "$ASSETS_DIR/Python310/python.exe" ]; then
        PYTHON="$ASSETS_DIR/Python310/python.exe"
        echo -e "${GREEN}[INFO]${NC} Using bundled Python: $PYTHON"
        return 0
    fi

    return 1
}

# ===========================================================================
# UV Detection: PATH -> Bundled UV -> Download
# ===========================================================================
find_uv() {
    # Try to find uv from PATH first
    if command -v uv &> /dev/null; then
        UV="$(command -v uv)"
        echo -e "${GREEN}[INFO]${NC} Using UV from PATH: $UV"
        return 0
    fi

    # Try bundled uv
    local uv_locations=(
        "$ASSETS_DIR/uv"
        "$OPENCODE_DIR/uv"
        "$ASSETS_DIR/uv.exe"
        "$OPENCODE_DIR/uv.exe"
    )

    for loc in "${uv_locations[@]}"; do
        if [ -x "$loc" ]; then
            UV="$loc"
            echo -e "${GREEN}[INFO]${NC} Using bundled UV: $UV"
            return 0
        fi
    done

    return 1
}

download_uv() {
    echo -e "${YELLOW}[INFO]${NC} UV not found, downloading..."

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
            echo -e "${RED}[ERROR]${NC} Unsupported platform"
            return 1
            ;;
    esac

    local uv_url="https://astral.sh/uv/latest/${uv_filename}.tar.gz"
    local temp_dir=$(mktemp -d)

    if command -v curl &> /dev/null; then
        curl -Ls "$uv_url" -o "$temp_dir/uv.tar.gz"
    elif command -v wget &> /dev/null; then
        wget -q "$uv_url" -O "$temp_dir/uv.tar.gz"
    else
        echo -e "${RED}[ERROR]${NC} Neither curl nor wget available"
        return 1
    fi

    if [ -f "$temp_dir/uv.tar.gz" ]; then
        tar -xzf "$temp_dir/uv.tar.gz" -C "$ASSETS_DIR" 2>/dev/null || \
            tar -xzf "$temp_dir/uv.tar.gz" -C "$temp_dir" 2>/dev/null

        # Check if uv binary is in the extracted folder
        if [ -x "$temp_dir/uv" ]; then
            UV="$temp_dir/uv"
            echo -e "${GREEN}[INFO]${NC} Downloaded UV: $UV"
        elif [ -x "$ASSETS_DIR/uv" ]; then
            UV="$ASSETS_DIR/uv"
            echo -e "${GREEN}[INFO]${NC} Downloaded UV: $UV"
        else
            echo -e "${RED}[ERROR]${NC} Failed to extract UV"
            rm -rf "$temp_dir"
            return 1
        fi
        rm -rf "$temp_dir"
        return 0
    fi

    rm -rf "$temp_dir"
    echo -e "${RED}[ERROR]${NC} Failed to download UV"
    return 1
}

# Main execution
main() {
    print_header "Python/UV Detection"

    # Find Python
    if ! find_python; then
        echo -e "${RED}Error: Python not found in PATH or bundled locations${NC}"
        echo "Please install Python 3.10+ or place bundled Python in assets folder"
        exit 1
    fi

    # Find or download UV
    if ! find_uv; then
        if download_uv; then
            echo -e "${YELLOW}[WARN]${NC} UV downloaded but not in PATH - some features may not work"
        else
            echo -e "${YELLOW}[WARN]${NC} UV not found - some features may not work"
        fi
    fi

    echo ""
    print_header "Running Smoke Tests"

    echo "Python: ${PYTHON:-not found}"
    echo "UV: ${UV:-not found}"
    echo "Arguments: $@"
    echo ""

    # Run the actual smoke test script
    if [ -n "$UV" ]; then
        export UV="$UV"
    fi
    export PYTHON="$PYTHON"

    "$PYTHON" "$SCRIPT_DIR/smoke_test.py" "$@"

    local exit_code=$?

    echo ""

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}[OK]${NC} All smoke tests passed!"
    elif [ $exit_code -eq 1 ]; then
        echo -e "${RED}[FAIL]${NC} Some smoke tests failed!"
    else
        echo -e "${YELLOW}[WARN]${NC} Smoke tests exited with code $exit_code"
    fi

    return $exit_code
}

# Run main function
main "$@"
