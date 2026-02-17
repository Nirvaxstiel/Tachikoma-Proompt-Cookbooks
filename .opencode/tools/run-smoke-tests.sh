#!/bin/bash
#
# Smoke Test Runner Wrapper
# Convenience wrapper for running smoke tests
#
# Usage:
#   ./run-smoke-tests.sh                  # Run all tests
#   ./run-smoke-tests.sh python           # Test Python scripts only
#   ./run-smoke-tests.sh shell            # Test Shell scripts only
#   ./run-smoke-tests.sh --fail-fast      # Stop on first failure
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Print header
print_header() {
    echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
}

# Check if Python is available
check_python() {
    if ! command -v python &> /dev/null; then
        if ! command -v python3 &> /dev/null; then
            echo -e "${RED}Error: Python not found in PATH${NC}"
            echo "Please install Python 3.6 or higher"
            exit 1
        else
            PYTHON_CMD="python3"
        fi
    else
        PYTHON_CMD="python"
    fi
}

# Run smoke tests
run_smoke_tests() {
    local args=("$@")

    print_header "Running Smoke Tests"

    echo "Python command: ${PYTHON_CMD}"
    echo "Arguments: ${args[*]}"
    echo ""

    # Run the actual smoke test script
    "${PYTHON_CMD}" "${SCRIPT_DIR}/smoke_test.py" "${args[@]}"

    local exit_code=$?

    echo ""

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓${NC} All smoke tests passed!"
    elif [ $exit_code -eq 1 ]; then
        echo -e "${RED}✗${NC} Some smoke tests failed!"
    else
        echo -e "${YELLOW}⚠${NC} Smoke tests exited with code $exit_code"
    fi

    return $exit_code
}

# Main execution
main() {
    check_python
    run_smoke_tests "$@"
}

# Run main function
main "$@"
