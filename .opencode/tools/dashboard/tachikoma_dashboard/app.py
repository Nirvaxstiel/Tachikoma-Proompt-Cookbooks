"""Main TUI application for the Tachikoma dashboard.

Design principles:
- Textual reactive patterns for state management
- Background workers for database queries
- Centralized GITS theme with RED accents
- Native Textual widgets for interactivity
- Lazy loading and caching for performance
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
from .enhanced_widgets import ActivitySparkline, SkillsDataTable, TodoProgressBar, TodosDataTable
from .models import ModelUsage, Session, SessionStats, SessionTokens, SessionTree, Todo, build_session_tree
from .session_tree import SessionTreeWidget
from .theme import THEME
from .widgets import (
    render_aggregation,
    render_details,
    render_model_usage,
    render_session_tokens,
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


class TokensLoaded(Message):
    """Posted when token data is loaded for a session."""

    def __init__(self, session_id: str, tokens: SessionTokens) -> None:
        super().__init__()
        self.session_id = session_id
        self.tokens = tokens


class ModelUsageLoaded(Message):
    """Posted when model usage data is loaded."""

    def __init__(self, models: list[ModelUsage]) -> None:
        super().__init__()
        self.models = models


class SkillsLoaded(Message):
    """Posted when skills are loaded for a session."""

    def __init__(self, session_id: str, skills: list) -> None:
        super().__init__()
        self.session_id = session_id
        self.skills = skills


class TodosLoaded(Message):
    """Posted when todos are loaded for a session."""

    def __init__(self, session_id: str, todos: list[Todo]) -> None:
        super().__init__()
        self.session_id = session_id
        self.todos = todos


class DashboardApp(App):
    """Main dashboard application with GITS-themed visuals.

    Features:
    - Interactive session tree with native Textual Tree widget
    - DataTable for skills and todos
    - Sparkline for activity visualization
    - Progress bar for todo completion
    - Reactive state management
    - Background data loading
    - Token/cost tracking
    """

    # Reactive state
    sessions: reactive[list[Session]] = reactive(list)
    session_trees: reactive[list[SessionTree]] = reactive(list)
    selected_session: reactive[Optional[Session]] = reactive(None)
    stats_cache: reactive[dict[str, SessionStats]] = reactive(dict)
    tokens_cache: reactive[dict[str, SessionTokens]] = reactive(dict)
    model_usage: reactive[list[ModelUsage]] = reactive(list)
    skills_cache: reactive[dict[str, list]] = reactive(dict)
    todos_cache: reactive[dict[str, list[Todo]]] = reactive(dict)
    activity_data: reactive[list[float]] = reactive(list)

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
    #session-tree-container {{
        width: 100%;
        height: 100%;
        border: solid {THEME.green};
        background: {THEME.bg1};
    }}

    #session-tree-title {{
        background: {THEME.green};
        color: {THEME.bg0};
        padding: 0 1;
        text-style: bold;
    }}

    /* Right Panel Container */
    #right-panel {{
        width: 100%;
        height: 100%;
        layout: grid;
        grid-size: 1;
        grid-rows: 1fr 1fr 1fr 1fr;
    }}

    /* Details Panel - CYAN border */
    #details-container {{
        width: 100%;
        height: 100%;
        border: solid {THEME.cyan};
        background: {THEME.bg1};
    }}

    #details {{
        padding: 1;
        color: {THEME.text};
        overflow-y: auto;
        height: 1fr;
    }}

    /* Tokens Panel - TEAL border */
    #tokens-container {{
        width: 100%;
        height: 100%;
        border: solid {THEME.teal};
        background: {THEME.bg1};
    }}

    #tokens {{
        padding: 1;
        color: {THEME.text};
        overflow-y: auto;
        height: 1fr;
    }}

    /* Skills Panel - ORANGE border */
    #skills-container {{
        width: 100%;
        height: 100%;
        border: solid {THEME.orange};
        background: {THEME.bg1};
    }}

    #skills-header {{
        background: {THEME.orange};
        color: {THEME.bg0};
        padding: 0 1;
        text-style: bold;
        height: 1;
    }}

    /* Todos Panel - RED border for pop! */
    #todos-container {{
        width: 100%;
        height: 100%;
        border: solid {THEME.red};
        background: {THEME.bg1};
    }}

    #todos-header {{
        background: {THEME.red};
        color: {THEME.bg0};
        padding: 0 1;
        text-style: bold;
        height: 1;
    }}

    /* Aggregation Bar */
    #aggregation {{
        width: 100%;
        height: auto;
        border: solid {THEME.muted};
        padding: 1;
        color: {THEME.text};
    }}

    /* Activity Bar */
    #activity-bar {{
        width: 100%;
        height: auto;
        background: {THEME.bg1};
        padding: 0 1;
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
    #session-tree-container:focus {{
        border: solid {THEME.red};
    }}

    #details-container:focus {{
        border: solid {THEME.red};
    }}

    #tokens-container:focus {{
        border: solid {THEME.red};
    }}

    #skills-container:focus {{
        border: solid {THEME.red};
    }}

    #todos-container:focus {{
        border: solid {THEME.red};
    }}
    """

    BINDINGS = [
        Binding("q", "quit", "Quit", show=True),
        Binding("tab", "toggle_filter", "Filter", show=True),
        Binding("r", "refresh", "Refresh", show=True),
        Binding("m", "toggle_model_panel", "Models", show=True),
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
        self._show_model_panel: bool = False

    def _footer_text(self) -> str:
        """Generate footer text with filter status."""
        filter_status = f" [{THEME.red}][ON][/{THEME.red}]" if self.cwd_filter else ""
        return (
            f"[bold]Enter[/bold] Select │ "
            f"[bold]Tab[/bold] Filter{filter_status} │ "
            f"[bold]M[/bold] Models │ "
            f"[bold]R[/bold] Refresh │ "
            f"[bold]Q[/bold] Quit"
        )

    def compose(self) -> ComposeResult:
        """Compose the dashboard layout."""
        yield Header()

        with Horizontal(id="main-grid"):
            # Left panel: Session Tree
            with Vertical(id="session-tree-container"):
                yield Static("◈ SESSION TREE", id="session-tree-title")
                yield SessionTreeWidget("Sessions", id="session-tree")

            # Right panel: Details, Tokens, Skills, Todos
            with Vertical(id="right-panel"):
                # Details panel
                with Vertical(id="details-container"):
                    yield Static("◇ DETAILS", id="details")

                # Tokens panel
                with Vertical(id="tokens-container"):
                    yield Static("◈ TOKENS", id="tokens")

                # Skills panel with DataTable
                with Vertical(id="skills-container"):
                    yield Static("◆ SKILLS", id="skills-header")
                    yield SkillsDataTable(id="skills-table")

                # Todos panel with DataTable and progress
                with Vertical(id="todos-container"):
                    yield Static("● TODOS", id="todos-header")
                    yield TodosDataTable(id="todos-table")

        # Activity bar with sparkline
        with Vertical(id="activity-bar"):
            yield ActivitySparkline(id="activity-sparkline")

        yield Static("", id="aggregation")
        yield Static(self._footer_text(), id="footer-bar")

    def on_mount(self) -> None:
        """Initialize dashboard on mount."""
        self._load_data()
        self._load_model_usage()
        self._update_activity_data()
        self.set_interval(self.interval / 1000, self._load_data)
        self.set_interval(5.0, self._update_activity_data)  # Update activity every 5s

    @work(exclusive=True, thread=True)
    def _load_data(self) -> None:
        """Load data from database in background worker."""
        sessions = db.get_sessions(self.cwd_filter)

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

    @work(exclusive=True, thread=True)
    def _load_stats(self, session_id: str) -> None:
        """Load stats for a session in background."""
        stats = db.get_session_stats(session_id)
        self.post_message(StatsLoaded(session_id, stats))

    @work(exclusive=True, thread=True)
    def _load_tokens(self, session_id: str) -> None:
        """Load token data for a session in background."""
        tokens = db.get_session_tokens(session_id)
        self.post_message(TokensLoaded(session_id, tokens))

    @work(exclusive=True, thread=True)
    def _load_model_usage(self) -> None:
        """Load model usage data in background."""
        models = db.get_all_model_usage()
        self.post_message(ModelUsageLoaded(models))

    @work(exclusive=True, thread=True)
    def _load_skills(self, session_id: str) -> None:
        """Load skills for a session in background."""
        skills = db.get_session_skills(session_id)
        self.post_message(SkillsLoaded(session_id, skills))

    @work(exclusive=True, thread=True)
    def _load_todos(self, session_id: str) -> None:
        """Load todos for a session in background."""
        todos = db.get_todos(session_id)
        self.post_message(TodosLoaded(session_id, todos))

    def _update_activity_data(self) -> None:
        """Update activity sparkline data."""
        # Generate activity data based on recent sessions
        import time

        now = int(time.time())
        # Create 20 data points for last 20 minutes
        activity = []
        for i in range(20):
            # Count sessions active in each minute bucket
            bucket_time = now - (i * 60)
            count = sum(
                1 for s in self.sessions
                if s.updated_seconds > bucket_time - 60
            )
            activity.append(float(count))

        # Reverse so most recent is on the right
        activity.reverse()
        self.activity_data = activity

        # Update sparkline
        try:
            sparkline = self.query_one(ActivitySparkline)
            sparkline.update_data(activity)
        except Exception:
            pass  # Widget may not be mounted yet

    def on_sessions_loaded(self, event: SessionsLoaded) -> None:
        """Handle sessions loaded event."""
        self.sessions = event.sessions
        self.session_trees = event.trees

        tree_widget = self.query_one(SessionTreeWidget)
        tree_widget.update_sessions(event.trees)

        self._update_aggregation()
        self._update_activity_data()

        if self.selected_session:
            self._load_stats(self.selected_session.id)
            self._load_tokens(self.selected_session.id)
            self._load_skills(self.selected_session.id)
            self._load_todos(self.selected_session.id)

    def on_stats_loaded(self, event: StatsLoaded) -> None:
        """Handle stats loaded event."""
        self.stats_cache = {**self.stats_cache, event.session_id: event.stats}
        if self.selected_session and self.selected_session.id == event.session_id:
            self._update_details()

    def on_tokens_loaded(self, event: TokensLoaded) -> None:
        """Handle tokens loaded event."""
        self.tokens_cache = {**self.tokens_cache, event.session_id: event.tokens}
        if self.selected_session and self.selected_session.id == event.session_id:
            self._update_tokens()

    def on_model_usage_loaded(self, event: ModelUsageLoaded) -> None:
        """Handle model usage loaded event."""
        self.model_usage = event.models

    def on_skills_loaded(self, event: SkillsLoaded) -> None:
        """Handle skills loaded event."""
        self.skills_cache = {**self.skills_cache, event.session_id: event.skills}
        if self.selected_session and self.selected_session.id == event.session_id:
            self._update_skills()

    def on_todos_loaded(self, event: TodosLoaded) -> None:
        """Handle todos loaded event."""
        self.todos_cache = {**self.todos_cache, event.session_id: event.todos}
        if self.selected_session and self.selected_session.id == event.session_id:
            self._update_todos()

    def on_session_tree_widget_selected(
        self, event: SessionTreeWidget.Selected
    ) -> None:
        """Handle session selection from tree widget."""
        node = event.node
        if node and node.data:
            self.selected_session = node.data
            self._update_details()
            self._load_stats(node.data.id)
            self._load_tokens(node.data.id)
            self._load_skills(node.data.id)
            self._load_todos(node.data.id)

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

    def _update_tokens(self) -> None:
        """Update tokens panel."""
        tokens_widget = self.query_one("#tokens", Static)
        if self._show_model_panel:
            tokens_widget.update(render_model_usage(self.model_usage))
        elif self.selected_session:
            tokens = self.tokens_cache.get(self.selected_session.id)
            tokens_widget.update(render_session_tokens(tokens))
        else:
            tokens_widget.update("[dim]No session selected[/dim]")

    def _update_skills(self) -> None:
        """Update skills panel with DataTable."""
        skills_table = self.query_one(SkillsDataTable)
        if self.selected_session:
            skills = self.skills_cache.get(self.selected_session.id)
            if skills is None:
                # Load if not cached
                self._load_skills(self.selected_session.id)
                skills = []
            skills_table.update_skills(skills)
        else:
            skills_table.update_skills(None)

    def _update_todos(self) -> None:
        """Update todos panel with DataTable."""
        todos_table = self.query_one(TodosDataTable)
        if self.selected_session:
            todos = self.todos_cache.get(self.selected_session.id)
            if todos is None:
                # Load if not cached
                self._load_todos(self.selected_session.id)
                todos = []
            todos_table.update_todos(todos)
        else:
            todos_table.update_todos([])

    def action_toggle_filter(self) -> None:
        """Toggle CWD filter."""
        import os

        self.cwd_filter = None if self.cwd_filter else os.getcwd()
        self._sessions_hash = ""  # Force refresh
        self._load_data()

        footer = self.query_one("#footer-bar", Static)
        footer.update(self._footer_text())

    def action_toggle_model_panel(self) -> None:
        """Toggle model usage panel (show in tokens area)."""
        self._show_model_panel = not self._show_model_panel
        self._update_tokens()

    def action_refresh(self) -> None:
        """Force refresh data."""
        self._sessions_hash = ""  # Force reload
        self._load_data()
        self._load_model_usage()
        self._update_activity_data()
