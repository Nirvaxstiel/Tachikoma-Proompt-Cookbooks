# Smoke Testing

The Tachikoma framework includes comprehensive smoke tests to validate that scripts, tools, and agents remain functional after changes.

## Quick Start

```bash
# Run all smoke tests
python .opencode/tools/smoke_test.py

# Or use the wrapper scripts
.opencode/tools/run-smoke-tests.bat    # Windows
./.opencode/tools/run-smoke-tests.sh   # Unix/macOS
```

## What Gets Tested

### Scripts

| Type | Tests |
|------|-------|
| Python | Syntax, imports, shebang, CLI, execution |
| Shell | Shebang, syntax, executable, help, execution |

### Tools

| Tool | Tests |
|------|-------|
| Dashboard | Database connection, session queries, tree building |
| Unit Tests | 85+ pytest tests for models, widgets, rendering |

## Test Commands

### Framework Tests

```bash
# All scripts
python .opencode/tools/smoke_test.py

# Python scripts only
python .opencode/tools/smoke_test.py --type python

# Shell scripts only  
python .opencode/tools/smoke_test.py --type shell

# Specific file
python .opencode/tools/smoke_test.py --file path/to/script.py

# JSON output (for CI/CD)
python .opencode/tools/smoke_test.py --json

# Stop on first failure
python .opencode/tools/smoke_test.py --fail-fast
```

### Dashboard Tests

```bash
# Smoke tests (quick validation)
python .opencode/tools/dashboard/test_smoke_no_rich.py

# Unit tests (comprehensive)
cd .opencode/tools/dashboard
.venv/Scripts/python -m pytest tests/ -v
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Smoke Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: python .opencode/tools/smoke_test.py --fail-fast
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
python .opencode/tools/smoke_test.py --fail-fast || exit 1
```

## Test Results

| Status | Meaning |
|--------|---------|
| ✅ PASS | All checks passed |
| ❌ FAIL | Critical failure |
| ⚠️ WARN | Non-critical issue |
| ⏭️ SKIP | Not applicable |

## Adding Tests

For detailed information on adding tests, see:
- [SMOKE_TESTS.md](../.opencode/tools/SMOKE_TESTS.md) - Full documentation
- [Dashboard Testing](./dashboard/index.md#testing) - Dashboard-specific tests
