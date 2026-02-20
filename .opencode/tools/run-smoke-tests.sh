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

# Source the centralized path helper
source "$SCRIPT_DIR/path-helper.sh"

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

# Main execution
main() {
    print_header "Python/UV Detection"

    # Find Python using centralized helper
    if ! PYTHON=$(find_python); then
        echo -e "${RED}Error: Python not found in PATH or bundled locations${NC}"
        echo "Please install Python 3.10+ or place bundled Python in assets folder"
        exit 1
    fi
    
    echo -e "${GREEN}[INFO]${NC} Using Python: $PYTHON"

    # Find or download UV using centralized helper
    if ! UV=$(find_uv); then
        if download_uv; then
            echo -e "${YELLOW}[WARN]${NC} UV downloaded but not in PATH - some features may not work"
        else
            echo -e "${YELLOW}[WARN]${NC} UV not found - some features may not work"
        fi
    else
        echo -e "${GREEN}[INFO]${NC} Using UV: $UV"
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
