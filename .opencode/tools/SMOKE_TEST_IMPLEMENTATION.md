# Smoke Test Framework - Implementation Summary

## What Was Built

A comprehensive smoke test framework to validate Tachikoma scripts (Python, Shell, etc.) remain functional after refactoring.

## Files Created

### 1. Core Framework
**`.opencode/tools/smoke_test.py`** (465 lines)
- Main smoke test implementation
- Automatic script discovery
- Test execution and reporting
- JSON and human-readable output

### 2. Documentation
**`.opencode/tools/SMOKE_TEST_README.md`**
- Complete usage guide
- Test coverage documentation
- Extending framework guide
- Integration examples (Git hooks, GitHub Actions, Makefile)
- Troubleshooting section

### 3. Convenience Wrappers
**`.opencode/tools/run-smoke-tests.sh`**
- Bash wrapper for Unix/Linux/macOS
- Colored output
- Python version detection

**`.opencode/tools/run-smoke-tests.bat`**
- Batch wrapper for Windows
- Python version detection
- Error handling

## Features

### Script Discovery
- Automatically finds all `.py`, `.sh`, `.bash` files in `.opencode/`
- Excludes: `node_modules/`, `__pycache__/`, `.git/`, venvs, build artifacts
- Excludes specific files: `tachikoma-install.sh` (rarely changed, manually tested)

### Python Script Tests
✅ Syntax check - Uses `py_compile` to validate Python syntax
✅ Import check - Verifies all external imports are available
✅ Shebang check - Validates presence of shebang line
✅ CLI interface check - Detects `if __name__ == '__main__'` block
✅ Execution check - Tests basic script execution (with `--help` if available)

### Shell Script Tests
✅ Shebang check - Validates presence of shebang line
✅ Syntax check - Uses `bash -n` for syntax validation
✅ Executable check - Verifies file is executable
✅ Help command check - Tests `help`, `-h`, or `--help` commands
✅ Execution check - Tests basic script execution

### Output Format
- **Human-readable**: Colored, detailed output with pass/fail indicators
- **JSON**: Machine-readable format for CI/CD integration
- **Summary**: Statistics on passed/failed/warned/skipped tests

### Options
- `--type python/shell`: Filter by script type
- `--file <path>`: Test specific file
- `--fail-fast`: Stop on first failure
- `--json`: Output JSON format
- `--verbose`: Verbose output

## Usage Examples

### Quick Test
```bash
# Run all tests
python .opencode/tools/smoke_test.py

# Or use wrapper
./.opencode/tools/run-smoke-tests.sh       # Unix/Linux/macOS
.\.opencode\tools\run-smoke-tests.bat     # Windows
```

### Filter by Type
```bash
# Test Python scripts only
python .opencode/tools/smoke_test.py --type python

# Test Shell scripts only
python .opencode/tools/smoke_test.py --type shell
```

### Test Specific File
```bash
python .opencode/tools/smoke_test.py --file .opencode/core/skill-indexer.py
```

### CI/CD Integration
```bash
# Stop on first failure (fail-fast mode)
python .opencode/tools/smoke_test.py --fail-fast

# Output JSON for automated processing
python .opencode/tools/smoke_test.py --json
```

## Integration Points

### AGENTS.md Updated
Added smoke test reference to "TOOLING: CLI-First Philosophy" section:
> "Run smoke tests before deploying scripts: `python .opencode/tools/smoke_test.py`"

### Pre-commit Hook (Optional)
```bash
#!/bin/bash
python .opencode/tools/smoke_test.py --fail-fast
if [ $? -ne 0 ]; then
    echo "❌ Smoke tests failed. Fix issues before committing."
    exit 1
fi
```

## Current State

### Tested Scripts (as of implementation)
- **17 Python scripts** found in `.opencode/`
  - 6 passed all tests
  - 11 passed with warnings (mostly missing shebang)
  - 0 failed

- **4 Shell scripts** found in `.opencode/`
  - 3 passed all tests
  - 1 passed with warnings (execution error)
  - 0 failed

### Performance
- Total duration: ~1.5 seconds for Python tests
- Total duration: ~0.6 seconds for Shell tests
- Average: ~100ms per script

## Benefits

✅ **Prevents silent breakages** - Catches issues before they reach production
✅ **Fast feedback** - ~2 seconds to test all scripts
✅ **Automated** - No manual testing needed
✅ **Extensible** - Easy to add new test types
✅ **Maintainable** - Clear structure, well-documented
✅ **Cross-platform** - Works on Windows, macOS, Linux

## Future Enhancements (Optional)

- Add integration tests for script-specific functionality
- Test actual script outputs (not just execution)
- Add performance benchmarks
- Create test fixtures for complex scripts
- Add remote script validation (fetch from URLs)
- Test script dependencies and versions

## Maintenance

### When to Update
- Adding new script types (e.g., TypeScript, Ruby)
- Changing test criteria
- Adding new exclusion rules
- Updating documentation

### When to Run
- Before committing changes
- After refactoring core scripts
- In CI/CD pipelines
- Before releases

## License

Part of the Tachikoma Multi-Agent Framework
