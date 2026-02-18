"""Main TUI application for the Tachikoma dashboard with smart caching."""

import hashlib

from rich.text import Text
from textual import work
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.widgets import DataTable, Header, Static

from . import db
from .models import Session, SessionStats, SessionStatus, SessionTree, build_session_tree
from .widgets import (
    render_aggregation,
    render_empty_state,
    render_skills,
    render_todos,
)

# Theme colors
BG = "#0a0e14"
BG1 = "#0d1117"
GREEN = "#00ff9f"
CYAN = "#26c6da"
RED = "#ff0066"
ORANGE = "#ffa726"
MUTED = "#4a5f6d"


def _data_hash(data: dict | list) -> str:
    """Create hash of data for comparison."""
    import json

    try:
        return hashlib.md5(json.dumps(data, sort_keys=True, default=str).encode()).hexdigest()
    except (TypeError, ValueError):
        return str(id(data))  # Fallback to object id


class DashboardApp(App):
    """Main dashboard application with smart caching."""

    CSS = f"""
    Screen {{ background: {BG}; }}

    #main-grid {{ layout: grid; grid-size: 2; grid-gutter: 1; height: 1fr; }}

    #session-table {{ width: 100%; height: 100%; border: solid {GREEN}; background: {BG1}; }}
    #right-panel {{ width: 100%; height: 100%; layout: vertical; }}
    #model-panel {{ width: 100%; height: 1fr; border: solid {CYAN}; padding: 1; background: {BG1}; overflow: auto; }}
    #todos-panel {{ width: 100%; height: 1fr; border: solid {RED}; padding: 1; background: {BG1}; overflow: auto; }}
    #skills-panel {{ width: 100%; height: 1fr; border: solid {ORANGE}; padding: 1; background: {BG1}; overflow: auto; }}
    #aggregation {{ width: 100%; height: auto; border: solid {MUTED}; padding: 1; }}

    DataTable {{ background: {BG1}; }}
    DataTable > .datatable--cursor {{ background: {RED} 30%; }}
    DataTable > .datatable--hover {{ background: {CYAN} 20%; }}
    Header {{ background: {BG}; color: {GREEN}; }}
    #footer-bar {{ background: {BG}; color: {MUTED}; height: auto; padding: 0 1; content-align: center middle; }}
    """

    BINDINGS = [
        Binding("q", "quit", "Quit"),
        Binding("tab", "toggle_filter", "Filter"),
        Binding("r", "refresh", "Refresh"),
        # Note: up/down arrows work by default with DataTable
    ]

    def __init__(self, interval: int = 2000, cwd: str | None = None):
        super().__init__()
        self.interval = interval
        self.cwd_filter = cwd

        # Cached data with hashes for comparison
        self._sessions_hash: str = ""
        self._stats_hash: str = ""
        self._model_stats_hash: str = ""

        # Current data
        self.all_sessions: list[Session] = []
        self.stats_cache: dict[str, SessionStats] = {}
        self.model_stats: dict[str, dict] = {}

    def _footer_text(self) -> str:
        """Custom footer with icons."""
        # Unicode arrows: ↑ (U+2191) ↓ (U+2193)
        return "[bold]↑↓[/bold] Navigate | [bold]Tab[/bold] Filter | [bold]R[/bold] Refresh | [bold]Q[/bold] Quit"

    def compose(self) -> ComposeResult:
        yield Header()

        with Horizontal(id="main-grid"):
            yield DataTable(id="session-table", cursor_type="row")

            with Vertical(id="right-panel"):
                yield Static("Model Usage", id="model-panel")
                yield Static("TODOs", id="todos-panel")
                yield Static("Skills", id="skills-panel")

        yield Static("Aggregation", id="aggregation")
        yield Static(self._footer_text(), id="footer-bar")

    def on_mount(self) -> None:
        table = self.query_one("#session-table", DataTable)
        table.add_columns("Status", "Session", "CWD", "Duration", "Msgs", "Tools")
        table.fixed_columns = 1
        self.refresh_data()
        self.set_interval(self.interval / 1000, self.refresh_data)

    def _status_text(self, status: SessionStatus) -> Text:
        icons = {
            SessionStatus.WORKING: ("●", GREEN),
            SessionStatus.ACTIVE: ("◐", ORANGE),
            SessionStatus.IDLE: ("○", MUTED),
        }
        icon, color = icons[status]
        return Text(icon, style=f"bold {color}")

    def _format_duration(self, seconds: int) -> str:
        if seconds < 60:
            return f"{seconds}s"
        minutes, secs = divmod(seconds, 60)
        if minutes < 60:
            return f"{minutes}m{secs:02d}"
        hours, mins = divmod(minutes, 60)
        return f"{hours}h{mins:02d}"

    def _format_cwd(self, cwd: str) -> str:
        parts = cwd.replace("\\", "/").split("/")
        if len(parts) > 2:
            return "..." + "/".join(parts[-2:])
        return cwd

    @work
    async def refresh_data(self) -> None:
        """Refresh data only when it changes."""
        # Fetch new data
        sessions = db.get_sessions(self.cwd_filter)

        # Create hash of sessions
        sessions_data = [
            {
                "id": s.id,
                "title": s.title,
                "directory": s.directory,
                "status": s.status.value,
                "time_updated": s.time_updated,
            }
            for s in sessions
        ]
        new_sessions_hash = _data_hash(sessions_data)

        # Only proceed if sessions changed
        sessions_changed = new_sessions_hash != self._sessions_hash

        if sessions_changed:
            self.all_sessions = sessions
            self._sessions_hash = new_sessions_hash

            # Fetch stats for all sessions
            new_stats = {}
            for session in sessions:
                new_stats[session.id] = db.get_session_stats(session.id)

            new_stats_hash = _data_hash(new_stats)
            stats_changed = new_stats_hash != self._stats_hash

            if stats_changed:
                self.stats_cache = new_stats
                self._stats_hash = new_stats_hash
                self.update_session_table()

        # Always check model stats (they can change independently)
        new_model_stats = db.get_model_usage_stats()
        new_model_hash = _data_hash(new_model_stats)

        if new_model_hash != self._model_stats_hash:
            self.model_stats = new_model_stats
            self._model_stats_hash = new_model_hash
            self.update_model_panel()

        # Update dynamic panels (todos/skills) based on selection
        self.update_todos()
        self.update_skills()

        # Update aggregation (depends on session count)
        if sessions_changed:
            self.update_aggregation()

    def update_session_table(self) -> None:
        """Update the session table with current data, preserving cursor position."""
        table = self.query_one("#session-table", DataTable)

        # Save current cursor position
        current_row = table.cursor_row
        current_key = None
        if current_row is not None and current_row < len(self.all_sessions):
            current_key = self.all_sessions[current_row].id if self.all_sessions else None

        table.clear()

        if not self.all_sessions:
            return

        new_row_index = None
        for idx, session in enumerate(self.all_sessions):
            stats = self.stats_cache.get(session.id)

            status = self._status_text(session.status)
            title = session.title[:35]
            cwd = self._format_cwd(session.directory)
            duration = self._format_duration(session.duration)
            msgs = str(stats.message_count) if stats else "-"
            tools = str(stats.tool_call_count) if stats else "-"

            table.add_row(status, title, cwd, duration, msgs, tools, key=session.id)

            if session.id == current_key:
                new_row_index = idx

        if new_row_index is not None:
            table.move_cursor(row=new_row_index)
        elif current_row is not None and self.all_sessions:
            target = min(current_row, len(self.all_sessions) - 1)
            table.move_cursor(row=target)

    def update_model_panel(self) -> None:
        """Update the model usage panel."""
        widget = self.query_one("#model-panel", Static)

        if not self.model_stats:
            widget.update("No model usage data available")
            return

        import time

        now = time.time() * 1000

        lines = []
        lines.append("[bold cyan]Model Usage Stats[/bold cyan]")
        lines.append("")

        for model_key, stats in sorted(self.model_stats.items()):
            lines.append(f"[bold]{model_key}[/bold]")
            lines.append(f"  Requests: {stats['request_count']}")

            if stats["last_used"]:
                ago = self._format_time_ago(now - stats["last_used"])
                lines.append(f"  Last used: {ago} ago")

            if stats["last_rate_limit"]:
                ago = self._format_time_ago(now - stats["last_rate_limit"])
                cooldown_ms = 60 * 60 * 1000  # 1 hour

                if (now - stats["last_rate_limit"]) > cooldown_ms:
                    lines.append(f"  [green]Rate limit: {ago} ago (cleared)[/green]")
                else:
                    remaining = int((cooldown_ms - (now - stats["last_rate_limit"])) / 1000 / 60)
                    lines.append(f"  [red]Rate limit: {ago} ago ({remaining}m remaining)[/red]")

            lines.append("")

        widget.update(Text.from_markup("\n".join(lines)))

    def _format_time_ago(self, ms: float) -> str:
        seconds = int(ms / 1000)
        if seconds < 60:
            return f"{seconds}s"
        minutes = seconds // 60
        if minutes < 60:
            return f"{minutes}m"
        hours = minutes // 60
        if hours < 24:
            return f"{hours}h"
        days = hours // 24
        return f"{days}d"

    def update_todos(self) -> None:
        """Update the TODOs panel for selected session."""
        widget = self.query_one("#todos-panel", Static)
        table = self.query_one("#session-table", DataTable)

        cursor_row = table.cursor_row
        if cursor_row is None or cursor_row >= len(self.all_sessions):
            widget.update(render_todos([]))
            return

        session = self.all_sessions[cursor_row]
        todos = db.get_todos(session.id)
        widget.update(render_todos(todos))

    def update_skills(self) -> None:
        """Update the skills panel."""
        widget = self.query_one("#skills-panel", Static)
        widget.update(render_skills())

    def update_aggregation(self) -> None:
        """Update the aggregation panel."""
        widget = self.query_one("#aggregation", Static)
        widget.update(render_aggregation(self.all_sessions))

    def on_data_table_row_highlighted(self, event) -> None:
        """Called when cursor moves to a different row."""
        self.update_todos()
        self.update_skills()

    def action_refresh(self) -> None:
        self.refresh_data()

    def action_toggle_filter(self) -> None:
        import os

        self.cwd_filter = None if self.cwd_filter else os.getcwd()
        self.refresh_data()
