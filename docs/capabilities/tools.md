# Tools

Development and maintenance tools for the Tachikoma framework.

## Overview

The `.opencode/tools/` directory contains scripts and utilities for developing, testing, and maintaining the Tachikoma framework. These tools help ensure code quality, catch issues early, and streamline development workflows.

## Available Tools

### Smoke Test Framework

#### Purpose

Validate that scripts (Python, Shell, etc.) remain functional after refactoring. Prevents silent breakages when modifying the codebase.

#### Benefits

- ✅ **Fast feedback** - ~2 seconds to test all scripts
- ✅ **Prevents breakages** - Catches issues before they reach production
- ✅ **Automated** - No manual testing needed
- ✅ **Cross-platform** - Works on Windows, macOS, Linux
- ✅ **Extensible** - Easy to add new test types

#### Installation

No installation required. The framework is a self-contained Python script:

```bash
.opencode/tools/smoke_test.py
```

#### Usage

**Basic Usage**

```bash
# Test all scripts (Python and Shell)
python .opencode/tools/smoke_test.py

# Use convenience wrappers
./.opencode/tools/run-smoke-tests.sh       # Unix/Linux/macOS
.\.opencode\tools\run-smoke-tests.bat     # Windows
```

**Filter by Type**

```bash
# Test Python scripts only
python .opencode/tools/smoke_test.py --type python

# Test Shell scripts only
python .opencode/tools/smoke_test.py --type shell
```

**Test Specific File**

```bash
python .opencode/tools/smoke_test.py --file .opencode/core/skill-indexer.py
```

**CI/CD Integration**

```bash
# Stop on first failure (fail-fast mode)
python .opencode/tools/smoke_test.py --fail-fast

# Output JSON for automated processing
python .opencode/tools/smoke_test.py --json
```

#### What Gets Tested

**Python Scripts:**
- ✅ Syntax check - Validates Python syntax
- ✅ Import check - Verifies external imports available
- ✅ Shebang check - Validates shebang line presence
- ✅ CLI interface check - Detects `if __name__ == '__main__'` block
- ✅ Execution check - Tests basic script execution

**Shell Scripts:**
- ✅ Shebang check - Validates shebang line presence
- ✅ Syntax check - Uses `bash -n` for validation
- ✅ Executable check - Verifies file is executable
- ✅ Help command check - Tests `help`, `-h`, `--help` commands
- ✅ Execution check - Tests basic script execution

#### Exclusions

The framework automatically excludes:
- `node_modules/` - npm dependencies
- `__pycache__/` - Python cache
- `.git/` - Git metadata
- venvs (venv/, env/, .venv/) - Virtual environments
- dist/, build/ - Build artifacts
- `tachikoma-install.sh` - Rarely changed, manually tested

#### Test Results

**Status Codes:**
- **PASS** - All checks passed
- **FAIL** - Critical checks failed (syntax, execution, etc.)
- **WARN** - Non-critical issues (missing shebang, optional features)
- **SKIP** - Test not applicable

**Example Output:**

```
============================================================
Testing: .opencode/core/skill-indexer.py
Type: python
============================================================
[OK] syntax: Python syntax is valid
[OK] imports: All imports available
[WARN] shebang: Missing shebang line
[OK] cli_interface: Has CLI interface
[OK] execution: Help command works

============================================================
SMOKE TEST SUMMARY
============================================================
Total scripts tested: 17
Passed: 6
Failed: 0
Warnings: 11
Skipped: 0
Duration: 1561.33ms
============================================================
```

#### Integration

**Pre-commit Hook**

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
python .opencode/tools/smoke_test.py --fail-fast
if [ $? -ne 0 ]; then
    echo "❌ Smoke tests failed. Fix issues before committing."
    exit 1
fi
```

**GitHub Actions**

Add to `.github/workflows/smoke-tests.yml`:

```yaml
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

**Makefile**

```makefile
.PHONY: smoke

smoke:
    python .opencode/tools/smoke_test.py
```

#### Troubleshooting

**"bash not found, skipping syntax check"**
- **Cause:** `bash` is not in PATH
- **Solution:** Install Git Bash or WSL on Windows

**"Missing imports: some-package"**
- **Cause:** Python dependencies not installed
- **Solution:** Install missing packages: `pip install some-package`

**"No scripts found to test!"**
- **Cause:** No matching scripts in `.opencode/` directory
- **Solution:** Verify scripts exist and aren't in excluded directories

**Unicode Errors (Windows)**
- **Cause:** System encoding (cp1252) conflicts with output
- **Solution:** Framework automatically handles with UTF-8 encoding

#### Documentation

- **SMOKE_TEST_README.md** - Complete usage guide
- **SMOKE_TEST_IMPLEMENTATION.md** - Implementation details
- **performance_demo.py** - Performance comparison (FP refactoring)

### Hashline Processor

#### Purpose

Process and generate hashline-based editing format. Hashline editing provides universal model compatibility by anchoring edits with content hashes.

#### Benefits

- ✅ **Universal compatibility** - Works with Claude, GPT, Gemini, Grok, etc.
- ✅ **Error resilience** - Anchors prevent wrong-location edits
- ✅ **Conflict detection** - Hash mismatches indicate file changes
- ✅ **Performance** - 10x improvement over str_replace for Grok

#### Usage

```bash
# Process file with hashlines
python .opencode/tools/hashline-processor.py <input_file> <options>

# Generate hashlines for file
python .opencode/tools/hashline-processor.py --generate file.py

# Verify hashline integrity
python .opencode/tools/hashline-processor.py --verify file.py
```

#### Hashline Format

Hashlines use content hashes to anchor edits:

```python
# Hashline format: # <hash>:<line_number>
# Example:
# abc123def456:42
def some_function():
    return True

# Edit anchor: Use hashline to target specific line
# Edit operation:
- Replace line starting at # abc123def456:42
+ With new content
```

#### Integration

**With model-aware-editor skill:**

```yaml
---
name: model-aware-editor
description: Optimizes edit format per model
---

# Use hashline format when:
- Model supports it (all modern models)
- High edit failure rates
- Need universal compatibility

# Hashline is automatically selected when:
- Model is not in known format list
- User specifies hashline format
```

## Development Workflow

### Recommended Workflow

1. **Make Changes**
   - Edit scripts, skills, or tools
   - Add new features or fix bugs

2. **Run Smoke Tests**
   ```bash
   python .opencode/tools/smoke_test.py --type python
   ```

3. **Review Results**
   - Check for FAIL status (must fix before committing)
   - Review WARN status (fix if critical)

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Test Integration**
   - Run full test suite if available
   - Manual test critical paths

### Continuous Integration

Add smoke tests to CI/CD pipeline to catch issues automatically:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
      - name: Run smoke tests
        run: python .opencode/tools/smoke_test.py --fail-fast
      - name: Run other tests
        run: pytest tests/
```

## Best Practices

### When to Run Smoke Tests

- **Before committing** - Catch issues early
- **After refactoring** - Ensure scripts still work
- **In CI/CD** - Automated validation
- **Before releases** - Validate all scripts

### Interpreting Results

- **Failures** - Must fix before proceeding
- **Warnings** - Review and fix if critical
- **Skipped** - Optional, may not apply

### Maintaining Tools

- Keep test timeouts reasonable (10-60 seconds)
- Update exclusions as codebase evolves
- Add new tests for common failure patterns
- Monitor execution times and optimize slow tests

## Extending Tools

### Adding New Test Types

To add new test types to smoke test framework:

1. Add test method to `SmokeTestFramework` class
2. Update `_test_python_script()` or `_test_shell_script()`
3. Add `TestResult` for each check
4. Test with `--file <script>` option

### Adding New Tools

To add new tools:

1. Create script in `.opencode/tools/`
2. Add usage documentation
3. Update this tools documentation
4. Add smoke tests for the tool
5. Document integration patterns

## Related Documentation

- [Skill Execution](./skill-execution.md) - How skills use tools
- [Model-Aware Editor](./skill-execution.md#model-aware-editor) - Hashline integration
- [Customization](./customization/overview.md) - Adding custom tools
- [Troubleshooting](../troubleshooting.md) - Common issues
