# Smoke Test Documentation

## Overview

The smoke test framework validates that Tachikoma scripts (Python, Shell, etc.) remain functional after refactoring. This prevents silent breakages when modifying the codebase.

## Location

`.opencode/tools/smoke_test.py`

## Usage

### Basic Usage

```bash
# Run all smoke tests
python .opencode/tools/smoke_test.py

# Test Python scripts only
python .opencode/tools/smoke_test.py --type python

# Test Shell scripts only
python .opencode/tools/smoke_test.py --type shell

# Test a specific file
python .opencode/tools/smoke_test.py --file .opencode/core/skill-indexer.py

# Stop on first failure
python .opencode/tools/smoke_test.py --fail-fast

# Output JSON format
python .opencode/tools/smoke_test.py --json

# Verbose output
python .opencode/tools/smoke_test.py --verbose
```

### Integration with Git

Add a pre-commit or pre-push hook to run smoke tests automatically:

```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
python .opencode/tools/smoke_test.py --fail-fast
if [ $? -ne 0 ]; then
    echo "❌ Smoke tests failed. Fix issues before committing."
    exit 1
fi
```

## Test Coverage

### Python Scripts

- ✅ **Syntax check**: Validates Python syntax using `py_compile`
- ✅ **Import check**: Verifies all external imports are available
- ✅ **Shebang check**: Validates presence of shebang line
- ✅ **CLI interface check**: Detects `if __name__ == '__main__'` block
- ✅ **Execution check**: Tests basic script execution (with `--help` if available)

### Shell Scripts

- ✅ **Shebang check**: Validates presence of shebang line
- ✅ **Syntax check**: Uses `bash -n` for syntax validation
- ✅ **Executable check**: Verifies file is executable
- ✅ **Help command check**: Tests `help`, `-h`, or `--help` commands
- ✅ **Execution check**: Tests basic script execution

## Test Discovery

The framework automatically discovers scripts in `.opencode/` directory:

### Included Scripts

- All `.py` files (Python scripts)
- All `.sh` and `.bash` files (Shell scripts)

### Excluded Locations

- `node_modules/` - npm dependencies
- `__pycache__/` - Python cache
- `.git/` - Git metadata
- `venv/`, `env/`, `.venv/` - Virtual environments
- `dist/`, `build/` - Build artifacts

### Excluded Files

- `tachikoma-install.sh` - Rarely changed, manually tested

## Test Results

### Status Codes

- **PASS**: All checks passed
- **FAIL**: Critical checks failed (syntax, execution, etc.)
- **WARN**: Non-critical issues (missing shebang, optional features)
- **SKIP**: Test not applicable

### Example Output

```
============================================================
Testing: .opencode\skills\context-manager\router.sh
Type: shell
============================================================
[OK] shebang: Has shebang
[OK] syntax: Shell syntax is valid
[WARN] executable: Not executable (may not need to be)
[OK] help_command: Help command works
[OK] execution: Script runs without errors

============================================================
SMOKE TEST SUMMARY
============================================================
Total scripts tested: 4
Passed: 3
Failed: 0
Warnings: 1
Skipped: 0
Duration: 601.26ms
============================================================

[WARN] Scripts with warnings:
  - .opencode\skills\formatter\router.sh
      execution: Execution error (exit 1):
```

## Extending the Framework

### Adding New Tests

To add new test checks, modify the corresponding method:

```python
def _test_python_script(self, script_path: Path, result: ScriptTestResult):
    """Test Python script"""

    # ... existing tests ...

    # Add new test
    test_start = time.time()
    your_check_passed, message = self._your_custom_check(script_path)
    result.add_test(TestResult(
        name='your_check_name',
        status=TestStatus.PASS if your_check_passed else TestStatus.FAIL,
        message=message,
        duration_ms=(time.time() - test_start) * 1000
    ))
```

### Adding New Script Types

1. Add pattern to constructor:

```python
self.your_patterns = ['*.your_ext']
```

2. Update `_find_files()`:

```python
if script_type in (None, 'your_type'):
    scripts.extend(self._find_files(self.your_patterns))
```

3. Implement test method:

```python
def _test_your_script(self, script_path: Path, result: ScriptTestResult):
    """Test your script type"""
    # Your test logic here
```

4. Update `_get_script_type()`:

```python
elif suffix == '.your_ext':
    return 'your_type'
```

5. Update `_test_script()`:

```python
elif script_type == 'your_type':
    self._test_your_script(script_path, result)
```

### Custom Exclusions

Add files or directories to exclude:

```python
def __init__(self, ...):
    # Add to exclude_dirs
    self.exclude_dirs = {
        'your_directory',
        # ... existing entries
    }

    # Add to exclude_files
    self.exclude_files = {
        'your-file.sh',
        # ... existing entries
    }
```

## Troubleshooting

### Common Issues

#### "bash not found, skipping syntax check"

- **Cause**: `bash` is not in PATH
- **Solution**: Install Git Bash or WSL on Windows, or use Cygwin

#### "Missing imports: some-package"

- **Cause**: Python dependencies not installed
- **Solution**: Install missing packages:
  ```bash
  pip install some-package
  ```

#### "Syntax check timed out"

- **Cause**: Script takes too long to parse
- **Solution**: Increase timeout in `_test_shell_script()` or `_check_python_imports()`

#### "No scripts found to test!"

- **Cause**: No matching scripts found in `.opencode/` directory
- **Solution**: Verify scripts exist and aren't in excluded directories

## Best Practices

### When to Run Smoke Tests

- **Before committing**: Run locally to catch issues early
- **In CI/CD**: Add to automated pipelines
- **After refactoring**: Ensure scripts still work
- **Before releases**: Validate all scripts are functional

### Interpreting Results

- **Failures**: Must fix before proceeding
- **Warnings**: Review and fix if critical
- **Skipped**: Optional, may not apply to all scripts

### Maintenance

- Keep test timeouts reasonable (10-60 seconds)
- Update exclusions as the codebase evolves
- Add new tests for common failure patterns
- Monitor execution times and optimize slow tests

## Integration Examples

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
echo "🧪 Running smoke tests..."
python .opencode/tools/smoke_test.py --fail-fast
if [ $? -ne 0 ]; then
    echo "❌ Smoke tests failed. Fix issues before committing."
    exit 1
fi
echo "✅ Smoke tests passed!"
```

### GitHub Actions

```yaml
# .github/workflows/smoke-tests.yml
name: Smoke Tests

on: [push, pull_request]

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - name: Run smoke tests
        run: python .opencode/tools/smoke_test.py --fail-fast
```

### Makefile

```makefile
# Makefile
.PHONY: test smoke

smoke:
    python .opencode/tools/smoke_test.py

test: smoke
    # Run full test suite
```

## Contributing

When adding new scripts to the framework:

1. Ensure scripts follow conventions (shebang, CLI interface, etc.)
2. Add appropriate smoke tests for the script type
3. Document any special test requirements
4. Update this documentation if new test types are added

## License

Part of the Tachikoma Multi-Agent Framework
