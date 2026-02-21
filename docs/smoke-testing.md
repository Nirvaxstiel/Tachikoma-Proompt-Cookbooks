# Smoke Testing

The Tachikoma framework includes comprehensive smoke tests to validate that scripts, tools, and agents remain functional after changes.

## Quick Start

```bash
# Run all smoke tests (recommended)
uv run .opencode/tools/smoke_test.py

# Or use the wrapper scripts (auto-detects Python/UV)
.opencode/tools/run-smoke-tests.sh      # Unix/macOS
.opencode/tools/run-smoke-tests.bat     # Windows
```

> **Note**: The AI agent has Python injected into its environment (portable), so it can run scripts directly. For manual user-facing runs, use `uv run` for consistent dependency management.

## What Gets Tested

### Scripts

| Type   | Tests                                        |
| ------ | -------------------------------------------- |
| Python | Syntax, imports, shebang, CLI, execution     |
| Shell  | Shebang, syntax, executable, help, execution |

### Tools

| Tool       | Tests                                               |
| ---------- | --------------------------------------------------- |
| Dashboard  | Database connection, session queries, tree building |
| Unit Tests | 85+ pytest tests for models, widgets, rendering     |

## Test Commands

### Framework Tests

```bash
# All scripts
uv run .opencode/tools/smoke_test.py

# Python scripts only
uv run .opencode/tools/smoke_test.py --type python

# Shell scripts only
uv run .opencode/tools/smoke_test.py --type shell

# Specific file
uv run .opencode/tools/smoke_test.py --file path/to/script.py

# JSON output (for CI/CD)
uv run .opencode/tools/smoke_test.py --json

# Stop on first failure
uv run .opencode/tools/smoke_test.py --fail-fast
```

### Dashboard Tests

```bash
# Smoke tests (quick validation)
cd dashboard
uv run python test_smoke_no_rich.py

# Unit tests (comprehensive)
cd dashboard
uv run pytest tests/ -v
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
      - name: Install UV
        run: curl -LsSf https://astral.sh/uv/install.sh | sh
      - run: uv run .opencode/tools/smoke_test.py --fail-fast
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
uv run .opencode/tools/smoke_test.py --fail-fast || exit 1
```

## Test Results

| Status  | Meaning            |
| ------- | ------------------ |
| ✅ PASS | All checks passed  |
| ❌ FAIL | Critical failure   |
| ⚠️ WARN | Non-critical issue |
| ⏭️ SKIP | Not applicable     |

After running tests, reflect:
- Did I break anything?
- Are there edge cases to add?
- Should I update the tests?

## Adding Tests

For detailed information on adding tests, see:

- [Dashboard Testing](./dashboard/index.md#testing) - Dashboard-specific tests
