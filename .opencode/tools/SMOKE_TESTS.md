# Tachikoma Smoke Test Framework

## Overview

The smoke test framework validates that Tachikoma scripts and tools remain functional after changes. It includes:

- **Script validation** - Python and shell script syntax/execution tests
- **Tool-specific tests** - Dashboard unit tests, integration tests
- **Auto-discovery** - Automatically finds and runs all test suites

## Quick Start

```bash
# Run all smoke tests
python .opencode/tools/smoke_test.py

# Run dashboard unit tests
python .opencode/tools/dashboard/dashboard-smoke-test

# Or on Windows
.opencode\tools\dashboard\dashboard-smoke-test.bat
```

## Test Structure

```
.opencode/tools/
├── smoke_test.py              # Main smoke test framework
├── run-smoke-tests.bat        # Windows wrapper
├── run-smoke-tests.sh         # Unix wrapper
└── dashboard/
    ├── test_smoke.py          # Dashboard smoke tests (with Rich)
    ├── test_smoke_no_rich.py  # Dashboard smoke tests (no dependencies)
    └── tests/                 # Pytest unit tests
        ├── conftest.py        # Fixtures
        ├── test_models.py     # Model tests
        ├── test_widgets.py    # Widget tests
        └── test_tree_renderer.py  # Tree renderer tests
```

## Smoke Test Framework

### Location

`.opencode/tools/smoke_test.py`

### Usage

```bash
# Run all smoke tests
python .opencode/tools/smoke_test.py

# Test Python scripts only
python .opencode/tools/smoke_test.py --type python

# Test Shell scripts only
python .opencode/tools/smoke_test.py --type shell

# Test a specific file
python .opencode/tools/smoke_test.py --file .opencode/skills/formatter/router.sh

# Stop on first failure
python .opencode/tools/smoke_test.py --fail-fast

# Output JSON format (for CI/CD)
python .opencode/tools/smoke_test.py --json
```

### Test Coverage

#### Python Scripts

| Test          | Description                                 | Status |
| ------------- | ------------------------------------------- | ------ |
| Syntax        | Validates Python syntax using `py_compile`  | ✅     |
| Imports       | Verifies all external imports are available | ✅     |
| Shebang       | Validates presence of shebang line          | ✅     |
| CLI Interface | Detects `if __name__ == '__main__'` block   | ✅     |
| Execution     | Tests script execution with `--help`        | ✅     |

#### Shell Scripts

| Test         | Description                          | Status |
| ------------ | ------------------------------------ | ------ |
| Shebang      | Validates presence of shebang line   | ✅     |
| Syntax       | Uses `bash -n` for syntax validation | ✅     |
| Executable   | Verifies file is executable          | ✅     |
| Help Command | Tests `help`, `-h`, or `--help`      | ✅     |
| Execution    | Tests basic script execution         | ✅     |

### Script Discovery

**Included:**

- All `.py` files (Python scripts)
- All `.sh` and `.bash` files (Shell scripts)

**Excluded Locations:**

- `node_modules/` - npm dependencies
- `__pycache__/` - Python cache
- `.git/` - Git metadata
- `venv/`, `env/`, `.venv/` - Virtual environments
- `dist/`, `build/` - Build artifacts

**Excluded Files:**

- `tachikoma-install.sh` - Rarely changed, manually tested

## Dashboard Tests

### Smoke Tests

Quick validation that the dashboard can start and query data:

```bash
# With Rich (full TUI dependencies)
python .opencode/tools/dashboard/test_smoke.py

# Without Rich (minimal dependencies)
python .opencode/tools/dashboard/test_smoke_no_rich.py
```

### Unit Tests

Comprehensive pytest-based unit tests:

```bash
# Run all unit tests
cd .opencode/tools/dashboard
.venv/Scripts/python -m pytest tests/ -v

# Run specific test file
.venv/Scripts/python -m pytest tests/test_models.py -v

# Run with coverage
.venv/Scripts/python -m pytest tests/ -v --cov=tachikoma_dashboard
```

### Test Categories

| Category      | File                    | Tests                                             |
| ------------- | ----------------------- | ------------------------------------------------- |
| Models        | `test_models.py`        | 30+ tests for dataclasses, caching, tree building |
| Widgets       | `test_widgets.py`       | 25+ tests for rendering functions                 |
| Tree Renderer | `test_tree_renderer.py` | 30+ tests for tree rendering                      |

## Adding New Tests

### Register a New Smoke Test

1. **For scripts** - Tests are auto-discovered by `smoke_test.py`

2. **For dashboard tools** - Add a new test file following the pattern:

```python
# .opencode/tools/your-tool/test_smoke.py
def test_your_feature() -> bool:
    """Test description."""
    print("Testing your feature...")
    # Your test logic
    return True

def main():
    results = [
        ("Your Feature", test_your_feature()),
    ]
    # Print results...
```

3. **For pytest unit tests** - Add to `tests/` directory:

```python
# .opencode/tools/dashboard/tests/test_your_feature.py
import pytest

def test_something():
    """Test description."""
    assert True
```

### Adding Functional Test Arguments

For scripts that need specific arguments to test functionality:

```python
# In smoke_test.py, add to script_test_args:
self.script_test_args = {
    "your_script.py": [
        (["--test", "arg"], "test mode"),
        (["--help"], "show help"),
    ],
}
```

## CI/CD Integration

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
          python-version: "3.10"
      - name: Run smoke tests
        run: python .opencode/tools/smoke_test.py --fail-fast
      - name: Run dashboard tests
        run: |
          cd .opencode/tools/dashboard
          pip install textual rich pytest
          python -m pytest tests/ -v
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
echo "Running smoke tests..."
python .opencode/tools/smoke_test.py --fail-fast
if [ $? -ne 0 ]; then
    echo "Smoke tests failed. Fix issues before committing."
    exit 1
fi
echo "Smoke tests passed!"
```

## Status Codes

| Status | Meaning                |
| ------ | ---------------------- |
| PASS   | All checks passed      |
| FAIL   | Critical checks failed |
| WARN   | Non-critical issues    |
| SKIP   | Test not applicable    |

## Troubleshooting

### "bash not found, skipping syntax check"

- **Cause**: `bash` is not in PATH
- **Solution**: Install Git Bash or WSL on Windows

### "Missing imports: some-package"

- **Cause**: Python dependencies not installed
- **Solution**: `pip install some-package`

### "No scripts found to test"

- **Cause**: No matching scripts in `.opencode/`
- **Solution**: Verify scripts exist and aren't in excluded directories

### Dashboard tests fail with "Module not found"

- **Cause**: Dependencies not installed in venv
- **Solution**: `pip install textual rich pytest`

## Implementation Details

### Files Created

| File                       | Purpose                   |
| -------------------------- | ------------------------- |
| `smoke_test.py`            | Main smoke test framework |
| `run-smoke-tests.bat`      | Windows wrapper           |
| `run-smoke-tests.sh`       | Unix wrapper              |
| `dashboard/test_smoke*.py` | Dashboard-specific tests  |
| `dashboard/tests/`         | Pytest unit tests         |

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Smoke Test Framework                │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │ Script      │  │ Functional  │  │ Tool-Spec  │  │
│  │ Discovery   │  │ Tests       │  │ ific Tests │  │
│  └─────────────┘  └─────────────┘  └────────────┘  │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │              Test Executors                  │   │
│  │  • Python (syntax, imports, execution)      │   │
│  │  • Shell (syntax, help, execution)          │   │
│  │  • pytest (unit tests)                      │   │
│  └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │              Reporters                       │   │
│  │  • Human-readable (GITS themed)             │   │
│  │  • JSON (for CI/CD)                         │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## License

Part of the Tachikoma Multi-Agent Framework
