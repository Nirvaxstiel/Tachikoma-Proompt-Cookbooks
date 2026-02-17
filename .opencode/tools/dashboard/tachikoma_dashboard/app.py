"""Main TUI application for the Tachikoma dashboard."""

from textual.app import App, ComposeResult
from textual.containers import Vertical
from textual.widgets import Header, Footer, Static
from textual import work
from textual.binding import Binding

from . import db
from .models import Session, SessionTree, build_session_tree, SessionStatus
from .widgets import (
    render_session_tree,
    render_details,
    render_skills,
    render_aggregation,
    render_empty_state,
    render_todos,
)

# GITS Theme colors
GITS_BG = "#0a0e14"
GITS_BG1 = "#0d1117"
GITS_GREEN = "#00ff9f"
GITS_CYAN = "#26c6da"
GITS_RED = "#ff0066"
GITS_ORANGE = "#ffa726"
GITS_TEXT = "#b3e5fc"
GITS_MUTED = "#4a5f6d"

CSS = f"""
Screen {{
    background: {GITS_BG};
}}

#session-tree {{
    width: 100%;
    height: 100%;
    border: solid {GITS_GREEN};
    padding: 1;
    background: {GITS_BG1};
}}

#details {{
    width: 100%;
    height: 100%;
    border: solid {GITS_CYAN};
    padding: 1;
    background: {GITS_BG1};
}}

#todos {{
    width: 100%;
    height: 100%;
    border: solid {GITS_RED};
    padding: 1;
    background: {GITS_BG1};
}}

#skills {{
    width: 100%;
    height: 100%;
    border: solid {GITS_ORANGE};
    padding: 1;
    background: {GITS_BG1};
}}

#aggregation {{
    width: 100%;
    column-span: 3;
    border: solid {GITS_MUTED};
    padding: 1;
    content-align: center middle;
    background: {GITS_BG1};
}}

Header {{
    background: {GITS_BG};
    color: {GITS_GREEN};
}}

Footer {{
    background: {GITS_BG};
    color: {GITS_MUTED};
}}

Static {{
    height: auto;
}}
"""


class DashboardApp(App):
    """Main dashboard application."""

    CSS = CSS

    BINDINGS = [
        Binding("q", "quit", "Quit"),
        Binding("enter", "select", "Select"),
        Binding("down", "cursor_down", "Down"),
        Binding("up", "cursor_up", "Up"),
        Binding("tab", "toggle_filter", "Filter"),
    ]

    def __init__(self, interval: int = 2000, cwd: str | None = None):
        super().__init__()
        self.interval = interval
        self.cwd_filter = cwd
        self.session_trees: list[SessionTree] = []
        self.all_sessions: list[Session] = []
        self.selected_session_id: str | None = None
        self._cursor_position = 0

    def compose(self) -> ComposeResult:
        yield Header()
        yield Vertical(
            Static("SESSION TREE", id="session-tree"),
            id="left-panel",
        )
        yield Vertical(
            Static("DETAILS", id="details"),
            Static("TODOS", id="todos"),
            id="middle-panel",
        )
        yield Vertical(
            Static("LOADED SKILLS", id="skills"),
            id="right-panel",
        )
        yield Static("ROOT AGGREGATION", id="aggregation")
        yield Footer()

    def on_mount(self) -> None:
        self.refresh_sessions()
        self.set_interval(self.interval / 1000, self.refresh_sessions)

    @work
    async def refresh_sessions(self) -> None:
        """Refresh session data from database."""
        sessions = db.get_sessions(self.cwd_filter)
        self.all_sessions = sessions
        self.session_trees = build_session_tree(sessions)

        # Update UI
        self.update_session_tree()
        self.update_details()
        self.update_skills()
        self.update_todos()
        self.update_aggregation()

    def update_session_tree(self) -> None:
        """Update the session tree panel."""
        tree_widget = self.query_one("#session-tree", Static)

        if not self.session_trees:
            tree_widget.update(render_empty_state("No sessions found"))
            return

        tree_widget.update(render_session_tree(self.session_trees, self.selected_session_id))

    def update_details(self) -> None:
        """Update the details panel."""
        details_widget = self.query_one("#details", Static)

        if self.selected_session_id:
            selected = next(
                (s for s in self.all_sessions if s.id == self.selected_session_id),
                None,
            )
            # Fetch stats for this session
            stats = db.get_session_stats(self.selected_session_id) if selected else None
            details_widget.update(render_details(selected, stats))
        else:
            details_widget.update(render_details(None))

    def update_skills(self) -> None:
        """Update the skills panel."""
        skills_widget = self.query_one("#skills", Static)
        skills_widget.update(render_skills())

    def update_todos(self) -> None:
        """Update the todos panel."""
        todos_widget = self.query_one("#todos", Static)
        
        if self.selected_session_id:
            todos = db.get_todos(self.selected_session_id)
        else:
            todos = []
        
        todos_widget.update(render_todos(todos))

    def update_aggregation(self) -> None:
        """Update the aggregation panel."""
        agg_widget = self.query_one("#aggregation", Static)
        agg_widget.update(render_aggregation(self.all_sessions))

    def action_cursor_down(self) -> None:
        """Move cursor down in session list."""
        if self.all_sessions:
            self._cursor_position = (self._cursor_position + 1) % len(self.all_sessions)
            self.selected_session_id = self.all_sessions[self._cursor_position].id
            self.update_session_tree()
            self.update_details()

    def action_cursor_up(self) -> None:
        """Move cursor up in session list."""
        if self.all_sessions:
            self._cursor_position = (self._cursor_position - 1) % len(self.all_sessions)
            self.selected_session_id = self.all_sessions[self._cursor_position].id
            self.update_session_tree()
            self.update_details()

    def action_select(self) -> None:
        """Select the current session."""
        if self.all_sessions and self._cursor_position < len(self.all_sessions):
            self.selected_session_id = self.all_sessions[self._cursor_position].id
            self.update_session_tree()
            self.update_details()
            self.update_todos()

    def action_toggle_filter(self) -> None:
        """Toggle filter by current working directory."""
        import os
        
        if self.cwd_filter:
            # Clear filter
            self.cwd_filter = None
        else:
            # Set filter to current working directory
            self.cwd_filter = os.getcwd()
        
        # Refresh sessions with new filter
        self.refresh_sessions()
