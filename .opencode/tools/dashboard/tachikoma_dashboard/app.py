"""Main TUI application for the Tachikoma dashboard.

Design principles:
- Textual reactive patterns for state management
- Background workers for database queries
- Centralized GITS theme with RED accents
- Lazy loading for performance
"""

from __future__ import annotations

import hashlib
import json
from typing import Optional

from textual import work
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.message import Message
from textual.reactive import reactive
from textual.widgets import Header, Static

from . import db
from .models import Session, SessionStats, SessionTree, build_session_tree
from .theme import PANEL_BORDERS, THEME
from .tree_renderer import render_tree_iterative
from .widgets import (
    render_aggregation,
    render_details,
    render_skills,
    render_todos,
)


def _data_hash(data: list[dict]) -> str:
    """Create hash of data for change detection (pure function)."""
    try:
        return hashlib.md5(
            json.dumps(data, sort_keys=True, default=str).encode()
        ).hexdigest()[:16]
    except (TypeError, ValueError):
        return ""


# Messages for reactive updates


class SessionsLoaded(Message):
    """Posted when sessions are loaded from database."""

    def __init__(self, sessions: list[Session], trees: list[SessionTree]) -> None:
        super().__init__()
        self.sessions = sessions
        self.trees = trees


class StatsLoaded(Message):
    """Posted when stats are loaded for a session."""

    def __init__(self, session_id: str, stats: SessionStats) -> None:
        super().__init__()
        self.session_id = session_id
        self.stats = stats


class DashboardApp(App):
    """Main dashboard application with GITS-themed visuals.

    Features:
    - Reactive state management
    - Background data loading
    - Session tree visualization
    - Real-time updates
    """

    # Reactive state
    sessions: reactive[list[Session]] = reactive(list)
    session_trees: reactive[list[SessionTree]] = reactive(list)
    selected_session: reactive[Optional[Session]] = reactive(None)
    stats_cache: reactive[dict[str, SessionStats]] = reactive(dict)

    # Configuration
    CSS = f"""
    Screen {{
        background: {THEME.bg0};
    }}

    #main-grid {{
        layout: grid;
        grid-size: 2;
        grid-gutter: 1;
        height: 1fr;
    }}

    /* Session Tree Panel - GREEN border */
    #session-tree {{
        width: 100%;
        height: 100%;
        border: solid {THEME.green};
        background: {THEME.bg1};
        overflow-y: auto;
    }}

    #session-tree-title {{
        background: {THEME.green};
        color: {THEME.bg0};
        padding: 0 1;
        border-bottom: solid {THEME.muted};
        text-style: bold;
    }}

    #session-tree-content {{
        padding: 1 2;
        color: {THEME.text};
    }}

    /* Right Panel Container */
    #right-panel {{
        width: 100%;
        height: 100%;
        layout: vertical;
    }}

    /* Details Panel - CYAN border */
    #details {{
        width: 100%;
        height: 1fr;
        border: solid {THEME.cyan};
        padding: 1;
        background: {THEME.bg1};
        color: {THEME.text};
    }}

    /* Skills Panel - ORANGE border */
    #skills {{
        width: 100%;
        height: 1fr;
        border: solid {THEME.orange};
        padding: 1;
        background: {THEME.bg1};
        color: {THEME.text};
    }}

    /* Todos Panel - RED border for pop! */
    #todos {{
        width: 100%;
        height: 1fr;
        border: solid {THEME.red};
        padding: 1;
        background: {THEME.bg1};
        color: {THEME.text};
    }}

    /* Aggregation Bar */
    #aggregation {{
        width: 100%;
        height: auto;
        border: solid {THEME.muted};
        padding: 1;
        color: {THEME.text};
    }}

    /* Footer */
    #footer-bar {{
        background: {THEME.bg0};
        color: {THEME.muted};
        height: auto;
        padding: 0 1;
        text-align: center;
    }}

    /* Focus effects with RED accent */
    #session-tree:focus {{
        border: solid {THEME.red};
    }}

    #details:focus {{
        border: solid {THEME.red};
    }}

    #skills:focus {{
        border: solid {THEME.red};
    }}

    #todos:focus {{
        border: solid {THEME.red};
    }}
    """

    BINDINGS = [
        Binding("q", "quit", "Quit", show=True),
        Binding("tab", "toggle_filter", "Filter", show=True),
        Binding("r", "refresh", "Refresh", show=True),
        Binding("enter", "select", "Select", show=True),
        Binding("up", "scroll_up", "↑", show=False),
        Binding("down", "scroll_down", "↓", show=False),
    ]

    def __init__(
        self,
        interval: int = 2000,
        cwd: str | None = None,
    ) -> None:
        super().__init__()
        self.interval = interval
        self.cwd_filter = cwd
        self._sessions_hash: str = ""

    def _footer_text(self) -> str:
        """Generate footer text with filter status."""
        filter_status = f" [{THEME.red}][ON][/{THEME.red}]" if self.cwd_filter else ""
        return (
            f"[bold]Enter[/bold] Select │ "
            f"[bold]Tab[/bold] Filter{filter_status} │ "
            f"[bold]R[/bold] Refresh │ "
            f"[bold]Q[/bold] Quit"
        )

    def compose(self) -> ComposeResult:
        """Compose the dashboard layout."""
        yield Header()

        with Horizontal(id="main-grid"):
            with Vertical(id="session-tree"):
                yield Static("◈ SESSION TREE", id="session-tree-title")
                yield Static("", id="session-tree-content")

            with Vertical(id="right-panel"):
                yield Static("◇ DETAILS", id="details")
                yield Static("◆ SKILLS", id="skills")
                yield Static("● TODOS", id="todos")

        yield Static("", id="aggregation")
        yield Static(self._footer_text(), id="footer-bar")

    def on_mount(self) -> None:
        """Initialize dashboard on mount."""
        self._load_data()
        self.set_interval(self.interval / 1000, self._load_data)

    @work(exclusive=True, thread=True)
    def _load_data(self) -> None:
        """Load data from database in background worker.

        This uses Textual's @work decorator to run in a separate thread,
        preventing UI blocking during database queries.
        """
        # Fetch sessions
        sessions = db.get_sessions(self.cwd_filter)

        # Check if changed
        sessions_data = [
            {
                "id": s.id,
                "title": s.title,
                "directory": s.directory,
                "time_updated": s.time_updated,
            }
            for s in sessions
        ]
        new_hash = _data_hash(sessions_data)

        if new_hash != self._sessions_hash:
            self._sessions_hash = new_hash
            trees = build_session_tree(sessions)
            self.post_message(SessionsLoaded(sessions, trees))

    def on_sessions_loaded(self, event: SessionsLoaded) -> None:
        """Handle sessions loaded event."""
        self.sessions = event.sessions
        self.session_trees = event.trees
        self._update_session_tree()
        self._update_aggregation()

        # Load stats for selected session
        if self.selected_session:
            self._load_stats(self.selected_session.id)

    @work(exclusive=True, thread=True)
    def _load_stats(self, session_id: str) -> None:
        """Load stats for a session in background."""
        stats = db.get_session_stats(session_id)
        self.post_message(StatsLoaded(session_id, stats))

    def on_stats_loaded(self, event: StatsLoaded) -> None:
        """Handle stats loaded event."""
        self.stats_cache = {**self.stats_cache, event.session_id: event.stats}
        if self.selected_session and self.selected_session.id == event.session_id:
            self._update_details()

    def _update_session_tree(self) -> None:
        """Update session tree panel."""
        tree_content = self.query_one("#session-tree-content", Static)
        if not self.session_trees:
            tree_content.update("[dim]No sessions found[/dim]")
            return

        lines = render_tree_iterative(self.session_trees)
        tree_content.update("\n".join(lines))

    def _update_aggregation(self) -> None:
        """Update aggregation panel."""
        agg_widget = self.query_one("#aggregation", Static)
        agg_widget.update(render_aggregation(self.sessions))

    def _update_details(self) -> None:
        """Update details panel."""
        details = self.query_one("#details", Static)
        if self.selected_session:
            stats = self.stats_cache.get(self.selected_session.id)
            details.update(render_details(self.selected_session, stats))
        else:
            details.update("[dim]No session selected[/dim]")

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
        if self.sessions:
            self.selected_session = self.sessions[0]
            self._update_details()
            self._update_skills()
            self._update_todos()
            self._load_stats(self.selected_session.id)

    def action_refresh(self) -> None:
        """Force refresh data."""
        self._sessions_hash = ""  # Force reload
        self._load_data()

    def action_toggle_filter(self) -> None:
        """Toggle CWD filter."""
        import os

        self.cwd_filter = None if self.cwd_filter else os.getcwd()
        self._sessions_hash = ""  # Force refresh
        self._load_data()

        # Update footer
        footer = self.query_one("#footer-bar", Static)
        footer.update(self._footer_text())

    def action_scroll_up(self) -> None:
        """Scroll up in tree."""
        tree = self.query_one("#session-tree-content", Static)
        # Textual handles this automatically with overflow-y: auto

    def action_scroll_down(self) -> None:
        """Scroll down in tree."""
        tree = self.query_one("#session-tree-content", Static)
        # Textual handles this automatically with overflow-y: auto
