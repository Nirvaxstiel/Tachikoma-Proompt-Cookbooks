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

## Tech Stack: Rust + Ratatui

### Why Rust?

| Reason | Details |
|--------|---------|
| **Performance** | Fast TUI rendering, low memory |
| **ratatui** | Excellent TUI library, actively maintained |
| **rusqlite** | Easy SQLite access |
| **Single binary** | Easy distribution |
| **Type safety** | Catch errors at compile time |

### Dependencies (Cargo.toml)

```toml
[dependencies]
ratatui = "0.28"
rusqlite = { version = "0.32", features = ["bundled"] }
crossterm = "0.28"
clap = { version = "4.5", features = ["derive"] }
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
dirs = "5"
chrono = { version = "0.4", features = ["serde"] }
```

---

## Implementation (Rust)

### File Structure

```
.opencode/tools/dashboard/
├── Cargo.toml
├── src/
│   ├── main.rs           # CLI entry point
│   ├── db.rs            # OpenCode DB queries
│   ├── data.rs          # Data models
│   ├── panels.rs        # Panel renderers
│   ├── tui.rs           # Main TUI loop
│   └── commands.rs       # Keyboard handlers
└── build.sh             # Build script
```

### Database Query (db.rs)

```rust
use rusqlite::{Connection, params};
use std::path::PathBuf;

const DB_PATH: &str = ".local/share/opencode/opencode.db";

pub fn get_db_path() -> PathBuf {
    dirs::home_dir()
        .unwrap()
        .join(DB_PATH)
}

pub fn get_sessions(cwd: Option<&str>) -> Result<Vec<Session>, rusqlite::Error> {
    let conn = Connection::open(get_db_path())?;
    
    let mut query = String::from(
        "SELECT id, parent_id, project_id, title, directory, time_created, time_updated 
         FROM session WHERE 1=1"
    );
    
    if cwd.is_some() {
        query.push_str(" AND directory = ?");
    }
    query.push_str(" ORDER BY time_updated DESC");
    
    let mut stmt = conn.prepare(&query)?;
    
    let rows = if let Some(c) = cwd {
        stmt.query_map(params![c], |row| {
            Ok(Session {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                project_id: row.get(2)?,
                title: row.get(3)?,
                directory: row.get(4)?,
                time_created: row.get(5)?,
                time_updated: row.get(6)?,
            })
        })?
    } else {
        stmt.query_map([], |row| {
            Ok(Session {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                project_id: row.get(2)?,
                title: row.get(3)?,
                directory: row.get(4)?,
                time_created: row.get(5)?,
                time_updated: row.get(6)?,
            })
        })?
    };
    
    rows.collect()
}

pub fn get_todos(session_id: &str) -> Result<Vec<Todo>, rusqlite::Error> {
    let conn = Connection::open(get_db_path())?;
    let mut stmt = conn.prepare(
        "SELECT session_id, content, status, priority, position, time_created 
         FROM todo WHERE session_id = ?"
    )?;
    
    stmt.query_map(params![session_id], |row| {
        Ok(Todo {
            session_id: row.get(0)?,
            content: row.get(1)?,
            status: row.get(2)?,
            priority: row.get(3)?,
            position: row.get(4)?,
            time_created: row.get(5)?,
        })
    })?.collect()
}
```

### Data Models (data.rs)

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub parent_id: Option<String>,
    pub project_id: String,
    pub title: String,
    pub directory: String,
    pub time_created: i64,
    pub time_updated: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Todo {
    pub session_id: String,
    pub content: String,
    pub status: String,
    pub priority: String,
    pub position: i32,
    pub time_created: i64,
}

#[derive(Debug, Clone)]
pub struct SessionTree {
    pub session: Session,
    pub children: Vec<SessionTree>,
    pub status: SessionStatus,
}

#[derive(Debug, Clone, PartialEq)]
pub enum SessionStatus {
    Working,  // Currently active (< 30s since last update)
    Active,   // Has activity (< 5min)
    Idle,     // No recent activity
}
```

### TUI Main Loop (tui.rs)

```rust
use ratatui::{Frame, Terminal, backend::CrosstermBackend};
use crossterm::{event, execute};

pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    let stdout = io::stdout();
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;
    
    terminal.clear()?;
    
    loop {
        // 1. Poll data
        let sessions = db::get_sessions(cwd_filter)?;
        
        // 2. Render
        terminal.draw(|f| {
            let chunks = Layout::default()
                .direction(Direction::Vertical)
                .constraints([Constraint::Length(3), Constraint::Min(0)])
                .split(f.size());
            
            // Render panels
            render_session_tree(f, chunks[0], &sessions);
            render_details(f, chunks[1], &selected_session);
        })?;
        
        // 3. Handle input
        if event::poll(Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                match key.code {
                    KeyCode::Char('q') => break,
                    KeyCode::Down => selected_session.next(),
                    KeyCode::Up => selected_session.prev(),
                    KeyCode::Enter => selected_session.select(),
                    _ => {}
                }
            }
        }
        
        // 4. Refresh
        thread::sleep(Duration::from_millis(REFRESH_INTERVAL));
    }
    
    Ok(())
}
```

### Panel Renderers (panels.rs)

```rust
use ratatui::{Frame, widgets::{Block, Borders, List, ListItem}};

pub fn render_session_tree(f: &mut Frame, area: Rect, sessions: &[SessionTree]) {
    let items: Vec<ListItem> = sessions
        .iter()
        .map(|s| {
            let icon = match s.status {
                SessionStatus::Working => "●",
                SessionStatus::Active => "◐",
                SessionStatus::Idle => "○",
            };
            ListItem::new(format!("{} {} {}", icon, s.session.title, s.session.directory))
        })
        .collect();
    
    let list = List::new(items)
        .block(Block::default().title("SESSION TREE").borders(Borders::ALL));
    
    f.render_widget(list, area);
}

pub fn render_details(f: &mut Frame, area: Rect, session: &Option<Session>) {
    if let Some(s) = session {
        let text = Text::from(vec![
            Line::from(format!("Selected: {}", s.title)),
            Line::from(format!("CWD: {}", s.directory)),
            Line::from(format!("Duration: {}", duration(s.time_created))),
        ]);
        
        let paragraph = Paragraph::new(text)
            .block(Block::default().title("DETAILS").borders(Borders::ALL));
        
        f.render_widget(paragraph, area);
    }
}
```

---

## CLI (main.rs)

```rust
use clap::Parser;

#[derive(Parser, Debug)]
#[command(name = "tachikoma dashboard")]
#[command(about = "Real-time Tachikoma agent dashboard")]
struct Args {
    /// Refresh interval in milliseconds
    #[arg(long, default_value = "2000")]
    interval: u64,
    
    /// Filter by working directory
    #[arg(short, long)]
    cwd: Option<String>,
    
    /// Show all sessions (not just current cwd)
    #[arg(short, long)]
    all_sessions: bool,
    
    /// Include worktree panel
    #[arg(short, long)]
    worktrees: bool,
    
    /// Select specific session on start
    #[arg(long)]
    select: Option<String>,
    
    /// One-shot JSON output
    #[arg(long)]
    json: bool,
}

fn main() {
    let args = Args::parse();
    // ... run dashboard
}
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
# Start dashboard with defaults
tachikoma dashboard

# Custom refresh interval
tachikoma dashboard --interval 5000

# One-shot output (no TUI)
tachikoma dashboard --json

# Filter by directory (cwd)
tachikoma dashboard --cwd ~/projects/tachikoma

# Show all sessions (not just current cwd)
tachikoma dashboard --all-sessions

# Include worktrees (optional)
tachikoma dashboard --worktrees

# Select specific session on start
tachikoma dashboard --select session-id
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

---

## Next Steps

1. **Create tool directory**: `.opencode/tools/dashboard/`
2. **Implement DB queries**: Connect to OpenCode's SQLite
3. **Build panel renderers**: ANSI-based UI
4. **Add CLI entry point**: `tachikoma dashboard` command
5. **Test with real data**: Verify session queries work

---

*Last Updated: 2026-02-17*
*Sources: OpenCode source (temp-docs/opencode), Overstory dashboard (temp-docs/overstory)*
