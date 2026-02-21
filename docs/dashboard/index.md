# Tachikoma Dashboard

A real-time TUI dashboard for monitoring OpenCode agent sessions.

## Overview

The Tachikoma Dashboard provides a visual interface for monitoring agent activity, sessions, skills, and tasks. Built with [Textual](https://textual.textualize.io/), it features a GITS (Ghost in the Shell) themed aesthetic with red accent highlights.

![Dashboard Preview](/assets/tachikoma-dashboard/alpha-preview-1.png)

## Features

- **Session Tree** - Visualize session hierarchy with parent/child relationships
- **Real-time Updates** - Auto-refreshing data from OpenCode database
- **Skill Tracking** - Monitor which skills are loaded and their usage
- **Todo Monitoring** - Track task progress with priority indicators
- **GITS Theme** - Cyberpunk aesthetic with neon green and red accents

## Quick Start

### Run the Dashboard

```bash
# Using the launcher script (recommended)
cd dashboard
./tachikoma-dashboard        # Unix/macOS
tachikoma-dashboard.bat      # Windows

# Or directly with Python
cd dashboard
uv run python -m tachikoma_dashboard
```

### Command Line Options

```bash
tachikoma-dashboard [OPTIONS]

Options:
  -i, --interval INT     Refresh interval in milliseconds (default: 2000)
  -c, --cwd PATH         Filter by working directory
  -a, --all-sessions     Show all sessions (not just current cwd)
  -j, --json             One-shot JSON output (no TUI)
  -s, --select ID        Select specific session on start
```

### Examples

```bash
# Default dashboard with 2-second refresh
tachikoma-dashboard

# Faster refresh (500ms)
tachikoma-dashboard --interval 500

# Filter to current directory
tachikoma-dashboard --cwd .

# JSON output for scripting
tachikoma-dashboard --json | jq '.[0].title'
```

## Interface

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                        Header                               │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│       SESSION TREE           │         DETAILS              │
│       (green border)         │         (cyan border)        │
│                              │                              │
│                              ├──────────────────────────────┤
│                              │                              │
│                              │         SKILLS               │
│                              │         (orange border)      │
│                              │                              │
│                              ├──────────────────────────────┤
│                              │                              │
│                              │         TODOS                │
│                              │         (red border)         │
│                              │                              │
├──────────────────────────────┴──────────────────────────────┤
│                    AGGREGATION BAR                          │
├─────────────────────────────────────────────────────────────┤
│                    Footer (Keybindings)                     │
└─────────────────────────────────────────────────────────────┘
```

### Panels

| Panel        | Border | Purpose                              |
| ------------ | ------ | ------------------------------------ |
| Session Tree | Green  | Hierarchical view of all sessions    |
| Details      | Cyan   | Selected session information         |
| Skills       | Orange | Loaded skills with invocation counts |
| Todos        | Red    | Active tasks with priority levels    |

### Status Indicators

| Icon | Status  | Color  | Meaning             |
| ---- | ------- | ------ | ------------------- |
| ●    | Working | Green  | Active < 30 seconds |
| ◐    | Active  | Orange | Active < 5 minutes  |
| ○    | Idle    | Muted  | No recent activity  |

## Keybindings

| Key     | Action                 |
| ------- | ---------------------- |
| `Enter` | Select focused session |
| `Tab`   | Toggle CWD filter      |
| `R`     | Refresh data           |
| `Q`     | Quit dashboard         |

## Theme

The dashboard uses the GITS (Ghost in the Shell) color theme:

### Primary Colors

| Name   | Hex       | Usage                                   |
| ------ | --------- | --------------------------------------- |
| Green  | `#00ff9f` | Primary accent, success, working status |
| Cyan   | `#26c6da` | Secondary accent, info, labels          |
| Red    | `#ff0066` | Highlights, high priority, focus states |
| Orange | `#ffa726` | Warnings, active status                 |

### Background Colors

| Name | Hex       | Usage              |
| ---- | --------- | ------------------ |
| BG0  | `#0a0e14` | Screen background  |
| BG1  | `#0d1117` | Panel background   |
| BG2  | `#13171f` | Element background |
| BG3  | `#1a2332` | Border color       |

### Customization

Theme colors are defined in `tachikoma_dashboard/theme.py`:

```python
from tachikoma_dashboard.theme import THEME

# Access theme colors
primary = THEME.green    # "#00ff9f"
accent = THEME.red       # "#ff0066"
bg = THEME.bg0           # "#0a0e14"
```

## Architecture

### Module Structure

```
tachikoma_dashboard/
├── __init__.py        # Package init, version
├── __main__.py        # CLI entry point
├── app.py             # Main Textual application
├── theme.py           # GITS theme colors
├── models.py          # Data models (immutable dataclasses)
├── widgets.py         # Rendering functions
├── tree_renderer.py   # Tree visualization
├── db.py              # Database queries
└── query.py           # Type-safe query builder
```

### Design Principles

1. **Immutable Models** - Dataclasses with `frozen=True`
2. **Pure Functions** - Rendering functions have no side effects
3. **Background Workers** - Database queries run asynchronously
4. **Reactive State** - Textual's reactive system for UI updates
5. **Iterative Rendering** - No recursion for tree traversal

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  OpenCode   │────▶│    DB       │────▶│   Models    │
│  Database   │     │  Queries    │     │ (Immutable) │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Textual  │◀────│   Widgets   │◀────│    Tree     │
│      App    │     │ (Pure Funcs)│     │  Renderer   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Testing

### Smoke Tests

Quick validation that the dashboard works:

```bash
# Full smoke tests (requires Rich)
cd dashboard
uv run python test_smoke.py

# Minimal smoke tests (no dependencies)
cd dashboard
uv run python test_smoke_no_rich.py
```

### Unit Tests

Comprehensive pytest-based tests:

```bash
cd dashboard

# Run all tests
uv run pytest tests/ -v

# Run specific test file
uv run pytest tests/test_models.py -v

# Run with coverage
uv run pytest tests/ --cov=tachikoma_dashboard
```

### Test Structure

```
tests/
├── conftest.py           # Fixtures and mocks
├── test_models.py        # Model unit tests (30+ tests)
├── test_widgets.py       # Widget rendering tests (25+ tests)
└── test_tree_renderer.py # Tree rendering tests (30+ tests)
```

## Development

### Setup

```bash
cd dashboard

# Create virtual environment
python -m venv .venv

# Activate
.venv/Scripts/activate  # Windows
source .venv/bin/activate  # Unix

# Install dependencies
uv sync
```

### Code Style

- **Linting**: ruff
- **Type checking**: mypy

### Running Linters

```bash
# Format check
ruff check tachikoma_dashboard/

# Type check
mypy tachikoma_dashboard/
```

### After Development

Run tests and verify the dashboard works correctly.

## Troubleshooting

### "Database not found"

The dashboard requires OpenCode to have been run at least once:

```bash
# Run OpenCode to create the database
opencode
```

### "No sessions found"

Sessions are created when using OpenCode:

```bash
# Start a session
opencode "Your query here"
```

### "Module not found: textual"

Install dependencies:

```bash
pip install textual rich
```

### Dashboard appears blank

Try running with JSON output to verify data:

```bash
tachikoma-dashboard --json
```

## Files

### Configuration Files

| File             | Purpose                        |
| ---------------- | ------------------------------ |
| `pyproject.toml` | Project metadata, dependencies |
| `FONTS.md`       | Font installation instructions |

### Test Files

| File                    | Purpose             |
| ----------------------- | ------------------- |
| `test_smoke.py`         | Full smoke tests    |
| `test_smoke_no_rich.py` | Minimal smoke tests |
| `tests/*.py`            | Pytest unit tests   |

## See Also

- [Smoke Testing](../smoke-testing.md) - Full smoke test documentation
