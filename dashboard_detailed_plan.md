# Dashboard Plan: Tachikoma Agent Dashboard

> Real-time monitoring dashboard combining OpenCode native capabilities with Tachikoma-specific insights

---

## Data Sources

### OpenCode Native Session Database

| Source | Location | What It Provides |
|--------|----------|-----------------|
| **Session Table** | `~/.local/share/opencode/opencode.db` | All sessions with hierarchy |
| **Message Table** | Same DB | Conversation history |
| **Project ID** | Same DB | Filter by project |

### Tachikoma-Specific

| Source | What It Provides |
|--------|-----------------|
| **Skills** | `.opencode/skills/` - Available capabilities |
| **Config** | `intent-routes.yaml` - Routing rules |
| **Context Modules** | `.opencode/context-modules/` - Loaded modules |

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                   DASHBOARD CLI                        │
│                  (Python/Bun)                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  Session   │  │  Context    │  │   Config     │  │
│  │  Poller    │  │  Tracker    │  │   Loader     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  │
│         │                │                 │           │
│         └────────────────┼─────────────────┘           │
│                          ▼                            │
│              ┌─────────────────────┐                  │
│              │    Data Store      │                  │
│              │   (In-Memory)      │                  │
│              └──────────┬──────────┘                  │
│                         ▼                             │
│              ┌─────────────────────┐                  │
│              │   ANSI Renderer    │                  │
│              │   (TUI Panel)     │                  │
│              └─────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

---

## UI Design

Inspired by Overstory's dashboard with Tachikoma-specific panels:

```
┌───────────────────────────────────────────────────────────────────────────┐
│  TACHIKOMA DASHBOARD                                            v0.1    │
│  Project: ~/projects/tachikoma                      Refresh: 2s        │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌───────────────────────────────────────────────────────┐               │
│  │ SESSION TREE (arrow keys to navigate, Enter to select)│               │
│  │                                                        │               │
│  │ ● tachikoma (root)           working ~/tachikoma      │               │
│  │   ├─ rlm-subcall             active  ~/tachikoma      │               │
│  │   └─ code-agent              active  ~/tachikoma      │               │
│  │                                                        │               │
│  │ ● tachikoma (root)           idle    ~/myapp          │               │
│  │   └─ research-agent          active  ~/myapp          │               │
│  │                                                        │               │
│  └───────────────────────────────────────────────────────┘               │
│                                                                           │
│  ┌─────────────────────────────┐ ┌───────────────────────────────────┐    │
│  │ SELECTED: rlm-subcall      │ │ LOADED SKILLS                    │    │
│  │                             │ │                                   │    │
│  │ Status:     active         │ │ ● rlm-optimized                   │    │
│  │ Duration:   2m 30s         │ │   (subagent - no skills loaded)  │    │
│  │ CWD:       ~/tachikoma    │ │                                   │    │
│  │ Tool Calls: 12             │ │                                   │    │
│  │ Messages:   8             │ │                                   │    │
│  │                             │ │                                   │    │
│  │ Last User: "Analyze the    │ │                                   │    │
│  │           codebase"        │ │                                   │    │
│  └─────────────────────────────┘ └───────────────────────────────────┘    │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ROOT AGGREGATION (tachikoma ~/tachikoma)                          │  │
│  │   Sessions: 2 running | Total Tool Calls: 24 | Messages: 15       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ↑↓ Navigate | Enter Select | Tab Filter cwd | q Quit                    │
└───────────────────────────────────────────────────────────────────────────┘
```

### Navigation Behavior

| Level | What Shows |
|-------|-----------|
| **Root (tachikoma)** | Aggregation of all children + own stats |
| **Child (subagent)** | That specific subagent's stats + loaded skills |

---

## Panel Definitions

### 1. Session Tree Panel (Main)

| Field | Source | Description |
|-------|--------|-------------|
| **Session** | `session.title` | Session name + type |
| **Status** | Derived | working/active/idle based on timestamps |
| **CWD** | `session.directory` | Working directory |
| **Children** | `session.parent_id` | Nested subagents |

**Multiple roots**: Shows all Tachikoma sessions across all directories
| **Parent ID** | `session.parent_id` | For tree hierarchy |
| **Directory** | `session.directory` | Current working directory |
| **Title** | `session.title` | Session name |
| **Time Created** | `session.time_created` | When started |
| **Time Updated** | `session.time_updated` | Last activity |
| **Project ID** | `session.project_id` | Filter by project |

**Derived:**
- **Duration:** `now - time_created`
- **Status:** Based on `time_updated` (active if < 30s old)
- **Parent:** Resolved from `parent_id`

### 2. Session Tree Panel

Recursive display of parent-child relationships:
```
tachikoma (primary)
├── rlm-subcall (subagent)
│   └── [children...]
└── code-agent (skill invoked)
```

### 3. Routing & Skills Panel

| Field | Source | Description |
|-------|--------|-------------|
| **Current Intent** | Last user message | Classified intent |
| **Route** | `intent-routes.yaml` | Where routed |
| **Confidence** | Classification score | 0-100% |

### 2. Session Details Panel (Selected)

Shows details for **selected session** in tree:

| Field | Source | Description |
|-------|--------|-------------|
| **Selected** | Current selection | Session name |
| **Status** | Derived | working/active/idle |
| **Duration** | `time_updated - time_created` | How long running |
| **CWD** | `session.directory` | Working directory |
| **Tool Calls** | `message` count | Total tools used |
| **Messages** | `message` count | Total interactions |
| **Last User** | Last user message | What user asked |

### 3. Loaded Skills Panel (Selected Session)

Shows **skills currently loaded** for selected session:

| Field | Source | Description |
|-------|--------|-------------|
| **Skill Name** | From `skill()` calls | What's loaded |
| **Type** | Subagent vs skill | How invoked |

### 4. Root Aggregation Panel

When at **root level** (tachikoma selected), shows aggregated stats:

| Field | Source | Description |
|-------|--------|-------------|
| **Sessions** | Child count | Total running sessions |
| **Total Tool Calls** | Sum of all children | Combined count |
| **Total Messages** | Sum of all children | Combined count |

### 5. Todo Panel (Optional)

From `todo` table - show for selected session:

| Field | Source | Description |
|-------|--------|-------------|
| **Content** | `todo.content` | Task description |
| **Status** | `todo.status` | pending/in_progress/completed |
| **Priority** | `todo.priority` | high/medium/low |

---

## Worktree Support

For users who want to play with git worktrees (like Overstory):

| Feature | Implementation | Notes |
|---------|----------------|-------|
| **List worktrees** | `git worktree list` | Show all worktrees |
| **Worktree status** | Parse output | Clean/dirty state |
| **Spawn in worktree** | `opencode --cwd <path>` | Start session there |

This is **optional** - the core dashboard works without worktrees.

---

## Tech Stack: Python + Textual

### Why Python?

| Reason | Details |
|--------|---------|
| **Portable Python** | Already distributed with OpenCode - no new runtime needed |
| **uv** | Fast Python package manager; runs scripts directly without installation |
| **Textual** | Excellent TUI library with modern async API, actively maintained |
| **sqlite3** | Built-in SQLite support (no external dependencies) |
| **Rich ecosystem** | Easy to extend with additional libraries |
| **Familiarity** | Easier for most users to read and modify |

### Why Python + Textual + uv?

- **Modern async API** - Built on asyncio, clean component model
- **Widget library** - Tree, DataTable, Static, Input built-in
- **CSS-like styling** - Declarative UI styling
- **Cross-platform** - Works on macOS, Linux, Windows
- **Active development** - Well-documented with many examples
- **uv for packaging** - Fast, modern Python package manager; can run scripts directly without installation

### Dependencies (pyproject.toml)

```toml
[project]
name = "tachikoma-dashboard"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "textual>=0.90.0",
    "rich>=13.0.0",
]

[project.optional-dependencies]
dev = [
    "ruff>=0.6.0",
    "mypy>=1.0.0",
]

[project.scripts]
tachikoma-dashboard = "tachikoma_dashboard.__main__:main"

[tool.uv]
dev-dependencies = [
    "ruff>=0.6.0",
    "mypy>=1.0.0",
]
```

**Note:** 
- Uses Python's built-in `sqlite3` - no external DB driver needed.
- `[project.scripts]` enables `pip install -e` and direct invocation
- `[tool.uv]` enables `uv run` with auto-dependency resolution

---

## Implementation (Python)

### File Structure

```
.opencode/tools/dashboard/
├── pyproject.toml
├── tachikoma_dashboard/
│   ├── __init__.py
│   ├── __main__.py           # CLI entry point (python -m)
│   ├── db.py                 # OpenCode DB queries
│   ├── models.py             # Data models
│   ├── widgets.py            # Panel widgets
│   ├── app.py                # Main TUI app
│   └── css.py                # Styles
└── build.sh                  # Build/deploy script
```

### Database Query (db.py)

```python
import sqlite3
import os
from pathlib import Path
from typing import Optional
from .models import Session, Todo

DB_PATH = ".local/share/opencode/opencode.db"

def get_db_path() -> Path:
    return Path(os.path.expanduser("~")) / DB_PATH

def get_sessions(cwd: Optional[str] = None) -> list[Session]:
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    
    query = """
        SELECT id, parent_id, project_id, title, directory, time_created, time_updated 
        FROM session WHERE 1=1
    """
    params = []
    
    if cwd:
        query += " AND directory = ?"
        params.append(cwd)
    
    query += " ORDER BY time_updated DESC"
    
    cursor = conn.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [Session(
        id=row["id"],
        parent_id=row["parent_id"],
        project_id=row["project_id"],
        title=row["title"],
        directory=row["directory"],
        time_created=row["time_created"],
        time_updated=row["time_updated"],
    ) for row in rows]

def get_todos(session_id: str) -> list[Todo]:
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    
    cursor = conn.execute(
        "SELECT session_id, content, status, priority, position, time_created 
         FROM todo WHERE session_id = ?",
        (session_id,)
    )
    
    rows = cursor.fetchall()
    conn.close()
    
    return [Todo(
        session_id=row["session_id"],
        content=row["content"],
        status=row["status"],
        priority=row["priority"],
        position=row["position"],
        time_created=row["time_created"],
    ) for row in rows]
```

### Data Models (models.py)

```python
from dataclasses import dataclass
from typing import Optional
from enum import Enum

class SessionStatus(Enum):
    WORKING = "working"   # Currently active (< 30s since last update)
    ACTIVE = "active"     # Has activity (< 5min)
    IDLE = "idle"         # No recent activity

@dataclass
class Session:
    id: str
    parent_id: Optional[str]
    project_id: str
    title: str
    directory: str
    time_created: int
    time_updated: int

@dataclass
class Todo:
    session_id: str
    content: str
    status: str
    priority: str
    position: int
    time_created: int

class SessionTree:
    def __init__(self, session: Session):
        self.session = session
        self.children: list[SessionTree] = []
        self.status: SessionStatus = SessionStatus.IDLE

    @property
    def duration(self) -> int:
        import time
        return int(time.time()) - self.session.time_created
```

### Main TUI App (app.py)

```python
from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.widgets import Header, Footer, Static, Tree
from textual import work
import time

class DashboardApp(App):
    CSS = """
    Screen {
        layout: grid;
        grid-size: 2 3;
    }
    
    #session-tree {
        width: 100%;
        height: 100%;
        border: solid green;
    }
    
    #details {
        width: 100%;
        height: 100%;
        border: solid blue;
    }
    
    #skills {
        width: 100%;
        height: 100%;
        border: solid yellow;
    }
    
    #aggregation {
        width: 100%;
        column-span: 2;
        border: solid white;
    }
    """
    
    BINDINGS = [
        ("q", "quit", "Quit"),
        ("enter", "select", "Select"),
    ]
    
    def __init__(self, interval: int = 2000, cwd: Optional[str] = None):
        super().__init__()
        self.interval = interval
        self.cwd_filter = cwd
        self.sessions: list[SessionTree] = []
        self.selected_session: Optional[Session] = None
        
    def compose(self) -> ComposeResult:
        yield Header()
        yield Static("SESSION TREE", id="session-tree")
        yield Static("DETAILS", id="details")
        yield Static("LOADED SKILLS", id="skills")
        yield Static("ROOT AGGREGATION", id="aggregation")
        yield Footer()
    
    def on_mount(self) -> None:
        self.refresh_sessions()
        self.set_interval(self.interval / 1000, self.refresh_sessions)
    
    @work
    async def refresh_sessions(self) -> None:
        sessions = db.get_sessions(self.cwd_filter)
        self.sessions = build_tree(sessions)
        self.query_one("#session-tree").update(render_tree(self.sessions))
    
    def action_select(self) -> None:
        # Show details for selected session
        pass
```

### Widget Renderers (widgets.py)

```python
from textual.widget import Widget
from textual.widgets import Static
from .models import SessionTree, SessionStatus

def render_session_tree(trees: list[SessionTree]) -> str:
    lines = []
    for tree in trees:
        icon = {
            SessionStatus.WORKING: "●",
            SessionStatus.ACTIVE: "◐",
            SessionStatus.IDLE: "○",
        }[tree.status]
        lines.append(f"{icon} {tree.session.title}  {tree.session.directory}")
        
        # Render children with indentation
        for child in tree.children:
            lines.append(f"  ├─ {child.session.title}  {child.session.directory}")
    
    return "\n".join(lines)

def render_details(session: Session) -> str:
    if not session:
        return "No session selected"
    
    duration = int(time.time()) - session.time_created
    minutes, seconds = divmod(duration, 60)
    
    return f"""Selected: {session.title}
Status: {get_status(session)}
Duration: {minutes}m {seconds}s
CWD: {session.directory}
Tool Calls: --
Messages: --"""
```

---

## CLI (tachikoma_dashboard/__main__.py)

```python
import argparse
import sys
from tachikoma_dashboard.app import DashboardApp

def main():
    parser = argparse.ArgumentParser(
        prog="tachikoma dashboard",
        description="Real-time Tachikoma agent dashboard"
    )
    
    parser.add_argument(
        "--interval", "-i",
        type=int,
        default=2000,
        help="Refresh interval in milliseconds (default: 2000)"
    )
    
    parser.add_argument(
        "--cwd", "-c",
        type=str,
        default=None,
        help="Filter by working directory"
    )
    
    parser.add_argument(
        "--all-sessions", "-a",
        action="store_true",
        help="Show all sessions (not just current cwd)"
    )
    
    parser.add_argument(
        "--worktrees", "-w",
        action="store_true",
        help="Include worktree panel"
    )
    
    parser.add_argument(
        "--select", "-s",
        type=str,
        default=None,
        help="Select specific session on start"
    )
    
    parser.add_argument(
        "--json", "-j",
        action="store_true",
        help="One-shot JSON output (no TUI)"
    )
    
    args = parser.parse_args()
    
    if args.json:
        # One-shot JSON output
        from tachikoma_dashboard import db
        import json
        sessions = db.get_sessions(args.cwd)
        print(json.dumps([s.__dict__ for s in sessions], indent=2))
        return
    
    # Run TUI
    app = DashboardApp(
        interval=args.interval,
        cwd=args.cwd
    )
    app.run()

if __name__ == "__main__":
    main()
```

### Installation

```bash
# Install as local tool
pip install -e .opencode/tools/dashboard/

# Or run directly
python -m tachikoma_dashboard
```

---

## Configuration

### Refresh Interval

| Setting | Default | Range | Notes |
|---------|---------|-------|-------|
| `--interval` | 2000ms | 500-10000ms | Overstory uses 2000ms |

### Project Filter

| Setting | Default | Notes |
|---------|---------|-------|
| `--project` | auto-detect | Filter sessions by project_id |
| `--cwd` / `--directory` | all | Filter sessions by working directory |

### Colors

Using ANSI escape codes (like Overstory):

```python
COLORS = {
    'header': '\x1b[36m',    # Cyan
    'active': '\x1b[32m',    # Green
    'idle': '\x1b[33m',      # Yellow
    'error': '\x1b[31m',     # Red
    'reset': '\x1b[0m',      # Reset
}
```

---

## Command Line Interface

```bash
# Install and run with uv (recommended - no manual pip install needed)
uv run --with textual --with rich -m tachikoma_dashboard

# Or run directly with uv (auto-installs dependencies)
uv run .opencode/tools/dashboard/

# Install as local tool (if you want 'tachikoma dashboard' command)
pip install -e .opencode/tools/dashboard/
tachikoma dashboard

# Or run directly with Python
python -m tachikoma_dashboard

# Custom refresh interval
uv run --with textual --with rich -m tachikoma_dashboard -- --interval 5000

# One-shot output (no TUI)
uv run --with textual --with rich -m tachikoma_dashboard -- --json

# Filter by directory (cwd)
uv run --with textual --with rich -m tachikoma_dashboard -- --cwd ~/projects/tachikoma

# Show all sessions (not just current cwd)
uv run --with textual --with rich -m tachikoma_dashboard -- --all-sessions

# Include worktrees (optional)
uv run --with textual --with rich -m tachikoma_dashboard -- --worktrees

# Select specific session on start
uv run --with textual --with rich -m tachikoma_dashboard -- --select session-id
```

### Keyboard Controls

| Key | Action |
|-----|--------|
| ↑↓ | Navigate sessions in tree |
| Enter | Select session (show details) |
| Tab | Filter by current cwd |
| w | Toggle worktree panel |
| q | Quit |

---

## Comparison: Overstory vs Tachikoma Dashboard

| Feature | Overstory | Tachikoma |
|---------|-----------|-----------|
| **Agent Spawning** | tmux + Claude Code | Native task() |
| **Isolation** | Git worktree | Same process |
| **Agent State** | booting→working→stalled→zombie→completed | Active/Idle |
| **Mail System** | SQLite mail.db | Parent-child sessions |
| **Merge Queue** | Yes | No |
| **Session Tracking** | Custom sessions.db | OpenCode native |
| **Worktrees** | Built-in | Optional (--worktrees flag) |

---

## Key Differences from Design Discussion

| Decision | Rationale |
|----------|-----------|
| **Session Tree as main** | Shows hierarchy + cwd + status at a glance |
| **Skills panel per selection** | Shows what's loaded for that specific session |
| **Root = aggregation** | tachikoma shows combined stats of all children |
| **Multiple roots** | Support multiple TUI sessions across directories |
| **Skills Today removed** | Move to statistics TUI if needed later |
| **Python + Textual instead of Rust** | Portable Python already distributed with OpenCode; Textual provides modern async TUI with rich widget library |
| **Built-in sqlite3** | No external dependencies needed, Python stdlib has SQLite support |
| **uv for packaging** | Fast dependency resolution, can run scripts directly without `pip install` |

---

## Next Steps

1. **Create tool directory**: `.opencode/tools/dashboard/`
2. **Set up pyproject.toml**: Configure Python package with textual dependency
3. **Implement DB queries**: Connect to OpenCode's SQLite using built-in sqlite3
4. **Build Textual widgets**: Create panel widgets using Textual's widget system
5. **Create main app**: Implement the TUI app with async refresh
6. **Add CLI entry point**: Set up `__main__.py` for `python -m` invocation
7. **Test with real data**: Verify session queries work against OpenCode DB
8. **Style with CSS**: Apply Textual CSS for the dashboard look

### Why This Approach Works

- **uv for packaging** - Fast dependency resolution, can run directly without installation
- **Portable Python** - Already available in OpenCode distribution  
- **Textual's async** - Built-in support for polling and refresh
- **SQLite in stdlib** - No additional dependencies
- **Familiar syntax** - Python is widely known and easy to modify

---

*Last Updated: 2026-02-18*
*Sources: 
- OpenCode source (temp-docs/opencode)
- Overstory dashboard (temp-docs/overstory) 
- Agent Skills format (temp-docs/agentskills)
- Textual TUI library (temp-docs/textual)*
