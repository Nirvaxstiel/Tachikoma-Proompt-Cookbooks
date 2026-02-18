"""Main TUI application for the Tachikoma dashboard.

Design principles:
- Textual reactive patterns for state management
- Background workers for database queries
- Centralized GITS theme with RED accents
- Native Textual widgets for interactivity
- Lazy loading and caching for performance
- Extracted CSS for maintainability
"""

from __future__ import annotations

import hashlib
import json
from functools import lru_cache
from typing import Optional

from textual import work
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.message import Message
from textual.reactive import reactive
from textual.widgets import Header, Static

from . import db
from .models import ModelUsage, Session, SessionStats, SessionTokens, SessionTree, Todo, build_session_tree
from .session_tree import SessionTreeWidget
from .styles import DASHBOARD_CSS
from .theme import THEME
from .widgets import (
    ActivitySparkline,
    render_aggregation,
    render_details,
    render_model_usage,
    render_session_tokens,
    SearchBar,
    SkillsDataTable,
    TodosDataTable,
)


# =============================================================================
# Utility Functions
# =============================================================================

def _data_hash(data: list[dict]) -> str:
    """Create hash of data for change detection (pure function).

    Args:
        data: List of dictionaries to hash

    Returns:
        MD5 hash string (16 chars) or empty string on error
    """
    try:
        return hashlib.md5(
            json.dumps(data, sort_keys=True, default=str).encode()
        ).hexdigest()[:16]
    except (TypeError, ValueError):
        return ""


# =============================================================================
# Message Classes
# =============================================================================

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


# =============================================================================
# Main Application
# =============================================================================

class DashboardApp(App):
    """Main dashboard application with GITS-themed visuals.

    Features:
    - Interactive session tree with native Textual Tree widget
    - DataTable for skills and todos
    - Sparkline for activity visualization
    - Progress bar for todo completion
    - Search/filter functionality
    - Collapsible advanced stats
    - Reactive state management
    - Background data loading
    - Token/cost tracking

    Keybindings:
    - Enter: Select session
    - Tab: Toggle CWD filter
    - /: Toggle search
    - M: Toggle model usage panel
    - R: Refresh data
    - Q: Quit
    """

    # Use extracted CSS
    CSS = DASHBOARD_CSS

    # Reactive state
    sessions: reactive[list[Session]] = reactive(list)
    session_trees: reactive[list[SessionTree]] = reactive(list)
    filtered_sessions: reactive[list[Session]] = reactive(list)
    selected_session: reactive[Optional[Session]] = reactive(None)
    stats_cache: reactive[dict[str, SessionStats]] = reactive(dict)
    tokens_cache: reactive[dict[str, SessionTokens]] = reactive(dict)
    model_usage: reactive[list[ModelUsage]] = reactive(list)
    skills_cache: reactive[dict[str, list]] = reactive(dict)
    todos_cache: reactive[dict[str, list[Todo]]] = reactive(dict)
    activity_data: reactive[list[float]] = reactive(list)
    search_query: reactive[str] = reactive("")

    # Keybindings
    BINDINGS = [
        Binding("q", "quit", "Quit", show=True),
        Binding("tab", "toggle_filter", "Filter", show=True),
        Binding("slash", "toggle_search", "Search", show=True),
        Binding("escape", "close_search", "Close", show=False),
        Binding("r", "refresh", "Refresh", show=True),
    ]

    def __init__(
        self,
        interval: int = 2000,
        cwd: str | None = None,
    ) -> None:
        """Initialize the dashboard application.

        Args:
            interval: Refresh interval in milliseconds
            cwd: Working directory filter (None for all)
        """
        super().__init__()
        self.interval = interval
        self.cwd_filter = cwd
        self._sessions_hash: str = ""

    def _footer_text(self) -> str:
        """Generate footer text with filter status.

        Returns:
            Formatted footer text with current state
        """
        filter_status = f" [{THEME.red}][ON][/{THEME.red}]" if self.cwd_filter else ""
        search_status = f" [{THEME.cyan}][SEARCH][/{THEME.cyan}]" if self.search_query else ""
        return (
            f"[bold]/[/bold] Search{search_status} │ "
            f"[bold]Tab[/bold] Filter{filter_status} │ "
            f"[bold]R[/bold] Refresh │ "
            f"[bold]Q[/bold] Quit"
        )

    def compose(self) -> ComposeResult:
        """Compose the dashboard layout.

        Yields:
            Widget tree for the dashboard
        """
        yield Header()

        with Horizontal(id="main-grid"):
            # Left panel: Session Tree
            with Vertical(id="session-tree-container"):
                yield Static("◈ SESSION TREE", id="session-tree-title")
                yield SearchBar(id="search-bar")
                yield SessionTreeWidget("Sessions", id="session-tree")

            # Right panel: Details, Tokens, Skills, Todos
            with Vertical(id="right-panel"):
                # Details panel with header
                with Vertical(id="details-container"):
                    yield Static("◇ DETAILS", id="details-header")
                    yield Static("", id="details")

                # Tokens panel with header
                with Vertical(id="tokens-container"):
                    yield Static("◈ MODEL USAGE", id="tokens-header")
                    yield Static("", id="tokens")

                # Skills panel with DataTable
                with Vertical(id="skills-container"):
                    yield Static("◆ SKILLS", id="skills-header")
                    yield SkillsDataTable(id="skills-table")

                # Todos panel with DataTable
                with Vertical(id="todos-container"):
                    yield Static("● TODOS", id="todos-header")
                    yield TodosDataTable(id="todos-table")

        # Activity bar with sparkline
        with Vertical(id="activity-bar"):
            yield ActivitySparkline(id="activity-sparkline")

        yield Static("", id="aggregation")
        yield Static(self._footer_text(), id="footer-bar")

    # =========================================================================
    # Lifecycle Methods
    # =========================================================================

    def on_mount(self) -> None:
        """Initialize dashboard on mount."""
        self._load_data()
        self._load_model_usage()
        self._update_activity_data()
        self.set_interval(self.interval / 1000, self._load_data)
        self.set_interval(5.0, self._update_activity_data)

    # =========================================================================
    # Data Loading Methods
    # =========================================================================

    @work(exclusive=True, thread=True)
    def _load_data(self) -> None:
        """Load data from database in background worker.

        Uses Textual's @work decorator to run in a separate thread,
        preventing UI blocking during database queries.
        """
        sessions = db.get_sessions(self.cwd_filter)

        # Apply search filter if active
        if self.search_query:
            query_lower = self.search_query.lower()
            sessions = [
                s for s in sessions
                if query_lower in s.title.lower()
                or query_lower in s.directory.lower()
            ]

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
        """Load stats for a session in background.

        Args:
            session_id: The session ID to load stats for
        """
        stats = db.get_session_stats(session_id)
        self.post_message(StatsLoaded(session_id, stats))

    @work(exclusive=True, thread=True)
    def _load_tokens(self, session_id: str) -> None:
        """Load token data for a session in background.

        Args:
            session_id: The session ID to load tokens for
        """
        tokens = db.get_session_tokens(session_id)
        self.post_message(TokensLoaded(session_id, tokens))

    @work(exclusive=True, thread=True)
    def _load_model_usage(self) -> None:
        """Load model usage data in background."""
        models = db.get_all_model_usage()
        self.post_message(ModelUsageLoaded(models))

    @work(exclusive=True, thread=True)
    def _load_skills(self, session_id: str) -> None:
        """Load skills for a session in background.

        Args:
            session_id: The session ID to load skills for
        """
        skills = db.get_session_skills(session_id)
        self.post_message(SkillsLoaded(session_id, skills))

    @work(exclusive=True, thread=True)
    def _load_todos(self, session_id: str) -> None:
        """Load todos for a session in background.

        Args:
            session_id: The session ID to load todos for
        """
        todos = db.get_todos(session_id)
        self.post_message(TodosLoaded(session_id, todos))

    def _update_activity_data(self) -> None:
        """Update activity sparkline data.

        Generates activity data based on recent session updates.
        """
        import time

        now = int(time.time())
        activity = []
        for i in range(20):
            bucket_time = now - (i * 60)
            count = sum(
                1 for s in self.sessions
                if s.updated_seconds > bucket_time - 60
            )
            activity.append(float(count))

        activity.reverse()
        self.activity_data = activity

        try:
            sparkline = self.query_one(ActivitySparkline)
            sparkline.update_data(activity)
        except Exception:
            pass

    # =========================================================================
    # Event Handlers
    # =========================================================================

    def on_sessions_loaded(self, event: SessionsLoaded) -> None:
        """Handle sessions loaded event.

        Args:
            event: The SessionsLoaded message
        """
        self.sessions = event.sessions
        self.session_trees = event.trees

        tree_widget = self.query_one(SessionTreeWidget)
        tree_widget.update_sessions(event.trees)

        self._update_aggregation()
        self._update_activity_data()

        # Auto-select first session if none selected
        if not self.selected_session and event.sessions:
            self._select_session(event.sessions[0])

    def _select_session(self, session: Session) -> None:
        """Select a session and load all its data.

        This is the single entry point for session selection.
        All panels update based on this selection.

        Args:
            session: The session to select
        """
        if session == self.selected_session:
            return

        self.selected_session = session

        # Clear old data
        self.stats_cache = {}
        self.skills_cache = {}
        self.todos_cache = {}

        # Show loading state in panels
        self._update_details()
        self._update_tokens()
        self._update_skills()
        self._update_todos()

        # Load all data for this session
        self._load_stats(session.id)
        self._load_skills(session.id)
        self._load_todos(session.id)

    def on_stats_loaded(self, event: StatsLoaded) -> None:
        """Handle stats loaded event."""
        self.stats_cache = {event.session_id: event.stats}
        if self.selected_session and self.selected_session.id == event.session_id:
            self._update_details()

    def on_tokens_loaded(self, event: TokensLoaded) -> None:
        """Handle tokens loaded event."""
        self.tokens_cache = {event.session_id: event.tokens}

    def on_model_usage_loaded(self, event: ModelUsageLoaded) -> None:
        """Handle model usage loaded event."""
        self.model_usage = event.models
        self._update_tokens()

    def on_skills_loaded(self, event: SkillsLoaded) -> None:
        """Handle skills loaded event."""
        self.skills_cache = {event.session_id: event.skills}
        if self.selected_session and self.selected_session.id == event.session_id:
            self._update_skills()

    def on_todos_loaded(self, event: TodosLoaded) -> None:
        """Handle todos loaded event."""
        self.todos_cache = {event.session_id: event.todos}
        if self.selected_session and self.selected_session.id == event.session_id:
            self._update_todos()

    def on_session_tree_widget_selected(
        self, event: SessionTreeWidget.Selected
    ) -> None:
        """Handle session selection from tree widget."""
        if event.session:
            self._select_session(event.session)

    def on_tree_node_highlighted(self, event) -> None:
        """Handle tree node highlight event (cursor movement)."""
        try:
            tree_widget = self.query_one(SessionTreeWidget)
            session = tree_widget.get_selected_session()
            if session:
                self._select_session(session)
        except Exception:
            pass

    def on_search_bar_search_changed(self, event: SearchBar.SearchChanged) -> None:
        """Handle search query changes.

        Args:
            event: The SearchChanged message
        """
        self.search_query = event.query
        self._sessions_hash = ""  # Force reload with filter
        self._load_data()

        # Update footer
        footer = self.query_one("#footer-bar", Static)
        footer.update(self._footer_text())

    # =========================================================================
    # UI Update Methods
    # =========================================================================

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
        """Update tokens panel with model usage."""
        tokens_widget = self.query_one("#tokens", Static)
        tokens_widget.update(render_model_usage(self.model_usage))

    def _update_skills(self) -> None:
        """Update skills panel with DataTable."""
        skills_table = self.query_one(SkillsDataTable)
        if self.selected_session:
            skills = self.skills_cache.get(self.selected_session.id)
            if skills is None:
                # Show loading state
                skills_table.update_skills(None)
            else:
                skills_table.update_skills(skills)
        else:
            skills_table.update_skills(None)

    def _update_todos(self) -> None:
        """Update todos panel with DataTable."""
        todos_table = self.query_one(TodosDataTable)
        if self.selected_session:
            todos = self.todos_cache.get(self.selected_session.id)
            if todos is None:
                # Show loading state
                todos_table.update_todos([])
            else:
                todos_table.update_todos(todos)
        else:
            todos_table.update_todos([])

    # =========================================================================
    # Action Methods
    # =========================================================================

    def action_toggle_filter(self) -> None:
        """Toggle CWD filter."""
        import os

        self.cwd_filter = None if self.cwd_filter else os.getcwd()
        self._sessions_hash = ""
        self._load_data()

        footer = self.query_one("#footer-bar", Static)
        footer.update(self._footer_text())

    def action_toggle_search(self) -> None:
        """Toggle search bar visibility."""
        try:
            search_bar = self.query_one(SearchBar)
            search_bar.toggle()
        except Exception:
            pass

    def action_close_search(self) -> None:
        """Close search bar."""
        try:
            search_bar = self.query_one(SearchBar)
            if search_bar._visible:
                search_bar.hide()
                # Clear search filter
                if self.search_query:
                    self.search_query = ""
                    self._sessions_hash = ""
                    self._load_data()
        except Exception:
            pass

    def action_refresh(self) -> None:
        """Force refresh data."""
        self._sessions_hash = ""
        self._load_data()
        self._load_model_usage()
        self._update_activity_data()
