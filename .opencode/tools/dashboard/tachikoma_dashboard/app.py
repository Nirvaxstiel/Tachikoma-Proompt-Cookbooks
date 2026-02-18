"""Main TUI application for the Tachikoma dashboard."""

import hashlib
import time

from rich.text import Text
from textual import work
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.widgets import Header, Static

from . import db
from .models import Session, SessionStats, SessionStatus, SessionTree, build_session_tree
from .widgets import render_aggregation, render_details, render_skills, render_todos
from .tree_renderer import render_tree_iterative

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
        return str(id(data))


class DashboardApp(App):
    """Main dashboard application with session tree visualization."""

    CSS = f"""
    Screen {{
        background: {BG};
    }}

    #main-grid {{
        layout: grid;
        grid-size: 2;
        grid-gutter: 1;
        height: 1fr;
    }}

    #session-tree {{
        width: 100%;
        height: 100%;
        border: solid {GREEN};
        background: {BG1};
        overflow-y: auto;
    }}

    #session-tree-title {{
        background: {GREEN};
        padding: 0 1;
        border-bottom: solid {MUTED};
        text-style: bold;
    }}

    #session-tree-content {{
        padding: 1 2;
    }}

    #right-panel {{
        width: 100%;
        height: 100%;
        layout: vertical;
    }}

    #details {{
        width: 100%;
        height: 1fr;
        border: solid {CYAN};
        padding: 1;
        background: {BG1};
    }}

    #skills {{
        width: 100%;
        height: 1fr;
        border: solid {ORANGE};
        padding: 1;
        background: {BG1};
    }}

    #todos {{
        width: 100%;
        height: 1fr;
        border: solid {RED};
        padding: 1;
        background: {BG1};
    }}

    #aggregation {{
        width: 100%;
        height: auto;
        border: solid {MUTED};
        padding: 1;
    }}

    #footer-bar {{
        background: {BG};
        color: {MUTED};
        height: auto;
        padding: 0 1;
        text-align: center;
    }}
    """

    BINDINGS = [
        Binding("q", "quit", "Quit"),
        Binding("tab", "toggle_filter", "Filter"),
        Binding("r", "refresh", "Refresh"),
        Binding("enter", "select", "Select"),
    ]

    def __init__(self, interval: int = 2000, cwd: str | None = None):
        super().__init__()
        self.interval = interval
        self.cwd_filter = cwd

        # Cached data
        self._sessions_hash: str = ""
        self._stats_hash: str = ""

        # Current data
        self.all_sessions: list[Session] = []
        self.session_trees: list[SessionTree] = []
        self.selected_session: Session | None = None
        self.stats_cache: dict[str, SessionStats] = {}

    def _footer_text(self) -> str:
        """Custom footer text."""
        filter_status = " [red][ON][/red]" if self.cwd_filter else ""
        return f"[bold]Enter[/bold] Select | [bold]Tab[/bold] Filter{filter_status} | [bold]R[/bold] Refresh | [bold]Q[/bold] Quit"

    def compose(self) -> ComposeResult:
        yield Header()

        with Horizontal(id="main-grid"):
            with Vertical(id="session-tree"):
                yield Static("SESSION TREE", id="session-tree-title")
                yield Static("", id="session-tree-content")

            with Vertical(id="right-panel"):
                yield Static("DETAILS", id="details")
                yield Static("SKILLS", id="skills")
                yield Static("TODOS", id="todos")

        yield Static("AGGREGATION", id="aggregation")
        yield Static(self._footer_text(), id="footer-bar")

    def on_mount(self) -> None:
        """Initialize dashboard on mount."""
        self.refresh_data()
        self.set_interval(self.interval / 1000, self.refresh_data)

    def refresh_data(self) -> None:
        """Refresh all data from database."""
        # Fetch sessions
        sessions = db.get_sessions(self.cwd_filter)

        # Check if changed
        sessions_data = [
            {"id": s.id, "title": s.title, "directory": s.directory, "time_updated": s.time_updated}
            for s in sessions
        ]
        new_hash = _data_hash(sessions_data)

        if new_hash != self._sessions_hash:
            self.all_sessions = sessions
            self._sessions_hash = new_hash

            # Build tree
            self.session_trees = build_session_tree(sessions)

            # Fetch stats
            self.stats_cache = {s.id: db.get_session_stats(s.id) for s in sessions}

            # Update UI
            self._update_session_tree()
            self._update_aggregation()

        # Update details panel if session selected
        if self.selected_session:
            self._update_details()
            self._update_skills()
            self._update_todos()

    def _update_session_tree(self) -> None:
        """Update session tree panel."""
        tree_content = self.query_one("#session-tree-content", Static)
        if not self.session_trees:
            tree_content.update("(No sessions)")
            return

        lines = render_tree_iterative(self.session_trees)
        tree_content.update("\n".join(lines))

    def _update_aggregation(self) -> None:
        """Update aggregation panel."""
        agg_widget = self.query_one("#aggregation", Static)
        agg_widget.update(render_aggregation(self.all_sessions))

    def _update_details(self) -> None:
        """Update details panel."""
        details = self.query_one("#details", Static)
        if self.selected_session:
            stats = self.stats_cache.get(self.selected_session.id)
            details.update(render_details(self.selected_session, stats))
        else:
            details.update("No session selected")

    def _update_skills(self) -> None:
        """Update skills panel."""
        skills = self.query_one("#skills", Static)
        if self.selected_session:
            session_skills = db.get_session_skills(self.selected_session.id)
            skills.update(render_skills(session_skills))
        else:
            skills.update(render_skills(None))

    def _update_todos(self) -> None:
        """Update todos panel."""
        todos = self.query_one("#todos", Static)
        if self.selected_session:
            session_todos = db.get_todos(self.selected_session.id)
            todos.update(render_todos(session_todos))
        else:
            todos.update(render_todos([]))

    def action_select(self) -> None:
        """Select first session (simplified for now)."""
        if self.all_sessions:
            self.selected_session = self.all_sessions[0]
            self._update_details()
            self._update_skills()
            self._update_todos()

    def action_refresh(self) -> None:
        """Refresh data manually."""
        self.refresh_data()

    def action_toggle_filter(self) -> None:
        """Toggle CWD filter."""
        import os
        self.cwd_filter = None if self.cwd_filter else os.getcwd()
        self._sessions_hash = ""  # Force refresh
        self.refresh_data()
