"""Main TUI application for the Tachikoma dashboard.

Design principles:
- Selection-based data loading (synchronous, fast queries)
- Centralized GITS theme with RED accents
- Native Textual widgets for interactivity
- Extracted CSS for maintainability
"""

from __future__ import annotations

import hashlib
import json
from typing import Optional, Type

from textual import work
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, ScrollableContainer, Vertical
from textual.message import Message
from textual.reactive import reactive
from textual.scrollbar import ScrollBarRender
from textual.widgets import Header, RichLog, Static

from . import db
from .models import ModelUsage, Session, SessionStats, SessionTree, build_session_tree
from .session_tree import SessionTreeWidget
from .styles import DASHBOARD_CSS
from .theme import THEME
from .widgets import (
    ActivitySparkline,
    SearchBar,
    SkillsDataTable,
    TodosDataTable,
    render_aggregation,
    render_details,
    render_model_usage,
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
        return hashlib.md5(json.dumps(data, sort_keys=True, default=str).encode()).hexdigest()[:16]
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


class ModelUsageLoaded(Message):
    """Posted when model usage data is loaded."""

    def __init__(self, models: list[ModelUsage]) -> None:
        super().__init__()
        self.models = models


# =============================================================================
# Main Application
# =============================================================================


class ThinScrollBarRender(ScrollBarRender):
    """Custom scrollbar renderer with thinner horizontal bars.

    Uses lower Unicode box-drawing characters that take up less vertical space.
    """

    HORIZONTAL_BARS: list[str] = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", " "]


class DashboardApp(App):
    """Main dashboard application with GITS-themed visuals.

    Features:
    - Interactive session tree with native Textual Tree widget
    - DataTable for skills and todos
    - Selection-based data loading
    - Search/filter functionality
    - Token/cost tracking

    Keybindings:
    - Arrow keys: Navigate sessions
    - Enter: Select session
    - Tab: Toggle CWD filter
    - /: Toggle search
    - R: Refresh data
    - Q: Quit
    """

    # Use extracted CSS
    CSS = DASHBOARD_CSS

    # Use thin horizontal scrollbars
    SCROLLBAR_RENDERER: Type[ScrollBarRender] = ThinScrollBarRender

    # Reactive state
    sessions: reactive[list[Session]] = reactive(list)
    session_trees: reactive[list[SessionTree]] = reactive(list)
    selected_session: reactive[Optional[Session]] = reactive(None)
    show_error_details: reactive[bool] = reactive(False)
    stats_cache: reactive[dict[str, SessionStats]] = reactive(dict)
    model_usage: reactive[list[ModelUsage]] = reactive(list)
    skills_cache: reactive[dict[str, list]] = reactive(dict)
    todos_cache: reactive[dict[str, list]] = reactive(dict)
    activity_data: reactive[list[float]] = reactive(list)
    search_query: reactive[str] = reactive("")

    # Keybindings
    BINDINGS = [
        Binding("q", "quit", "Quit", show=True),
        Binding("tab", "toggle_filter", "Filter", show=True),
        Binding("slash", "toggle_search", "Search", show=True),
        Binding("escape", "close_search", "Close", show=False),
        Binding("r", "refresh", "Refresh", show=True),
        Binding("e", "toggle_error_details", "Model Errors", show=False),
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
            f"[bold]E[/bold] Errors │ "
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
            # Left panel: Session Tree + Details
            with Vertical(id="left-panel"):
                # Session Tree
                with Vertical(id="session-tree-container"):
                    yield Static("◈ SESSION TREE", id="session-tree-title")
                    yield SearchBar(id="search-bar")
                    yield SessionTreeWidget("Sessions", id="session-tree")

                # Details panel with header
                with Vertical(id="details-container"):
                    yield Static("◇ DETAILS", id="details-header")
                    yield Static("", id="details")

            # Right panel: Model Usage, Skills, Todos, Error Details
            with Vertical(id="right-panel"):
                # Tokens panel with header (RichLog for native scrolling)
                with Vertical(id="tokens-container"):
                    yield Static("", id="tokens-header")
                    with ScrollableContainer(id="tokens-scroll"):
                        yield RichLog(id="tokens-content")

                # Error details panel (hidden by default) - RichLog for native scrolling
                with Vertical(id="error-details-container", classes="hidden"):
                    yield Static("", id="error-header")
                    with ScrollableContainer(id="error-scroll"):
                        yield RichLog(id="error-details-content")

                # Skills panel with DataTable
                with Vertical(id="skills-container"):
                    yield Static("◆ SKILLS", id="skills-header")
                    with ScrollableContainer(id="skills-scroll"):
                        yield SkillsDataTable(id="skills-table")

                # Todos panel with DataTable
                with Vertical(id="todos-container"):
                    yield Static("● TODOS", id="todos-header")
                    with ScrollableContainer(id="todos-scroll"):
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

        # Initialize panel headers
        self._update_panel_headers()

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
                s
                for s in sessions
                if query_lower in s.title.lower() or query_lower in s.directory.lower()
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
            # Fetch agent names for all sessions (from message agent field)
            agent_names = {s.id: db.get_session_agent(s.id) for s in sessions}
            trees = build_session_tree(sessions, agent_names)
            self.post_message(SessionsLoaded(sessions, trees))

    @work(exclusive=True, thread=True)
    def _load_model_usage(self) -> None:
        """Load model usage data in background."""
        models = db.get_all_model_usage()
        self.post_message(ModelUsageLoaded(models))

    def _update_activity_data(self) -> None:
        """Update activity sparkline data.

        Generates activity data based on recent session updates.
        """
        import time

        now = int(time.time())
        activity = []
        for i in range(20):
            bucket_time = now - (i * 60)
            count = sum(1 for s in self.sessions if s.updated_seconds > bucket_time - 60)
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

        # Load all data synchronously (queries are fast)
        stats = db.get_session_stats(session.id)
        skills = db.get_session_skills(session.id)
        todos = db.get_todos(session.id)

        # Update caches
        self.stats_cache = {session.id: stats}
        self.skills_cache = {session.id: skills}
        self.todos_cache = {session.id: todos}

        # Update all panels
        self._update_details()
        self._update_skills()
        self._update_todos()

    def on_model_usage_loaded(self, event: ModelUsageLoaded) -> None:
        """Handle model usage loaded event."""
        self.model_usage = event.models

        self._update_tokens()

    def on_session_tree_widget_selected(self, event: SessionTreeWidget.Selected) -> None:
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
            # Get agent name from database
            agent_name = db.get_session_agent(self.selected_session.id)
            details.update(render_details(self.selected_session, stats, agent_name))
        else:
            details.update("[dim]No session selected[/dim]")

    def _update_tokens(self) -> None:
        """Update tokens panel with model usage."""
        tokens_widget = self.query_one("#tokens-content", RichLog)
        tokens_widget.clear()
        tokens_widget.write(render_model_usage(self.model_usage))

    def _update_skills(self) -> None:
        """Update skills panel with DataTable."""
        try:
            skills_table = self.query_one(SkillsDataTable)
            if self.selected_session:
                # Get skills directly from cache
                session_id = self.selected_session.id
                skills = self.skills_cache.get(session_id)
                # Update the table
                skills_table.update_skills(skills)
            else:
                skills_table.update_skills(None)
        except Exception:
            pass  # Widget not ready yet

    def _update_todos(self) -> None:
        """Update todos panel with DataTable."""
        try:
            todos_table = self.query_one(TodosDataTable)
            if self.selected_session:
                # Get todos directly from cache
                session_id = self.selected_session.id
                todos = self.todos_cache.get(session_id)
                # Update the table
                todos_table.update_todos(todos or [])
            else:
                todos_table.update_todos([])
        except Exception:
            pass  # Widget not ready yet

    def _update_error_details(self) -> None:
        """Update error details panel - shows all errors from all models."""
        from .widgets import render_model_error_details

        try:
            error_widget = self.query_one("#error-details-content", RichLog)
            if self.show_error_details:
                # Get all errors from database (increased limit for scrollable panel)
                errors = db.get_all_errors(limit=50)
                error_widget.clear()
                error_widget.write(render_model_error_details(errors))
            else:
                error_widget.clear()
        except Exception:
            pass  # Widget not ready yet

    def _update_panel_headers(self) -> None:
        """Update panel headers based on current state."""
        # Update tokens header
        try:
            tokens_header = self.query_one("#tokens-header", Static)
            if self.show_error_details:
                tokens_header.update("◈ MODEL USAGE (E to hide errors)")
            else:
                tokens_header.update("◈ MODEL USAGE (E for errors)")
        except Exception:
            pass

        # Update error header
        try:
            error_header = self.query_one("#error-header", Static)
            if self.show_error_details:
                error_header.update("⚠ ALL ERRORS (Latest 10)")
            else:
                error_header.update("⚠ MODEL ERRORS (Press E to show)")
        except Exception:
            pass

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

    def action_toggle_error_details(self) -> None:
        """Toggle error details panel."""
        self.show_error_details = not self.show_error_details
        self._update_tokens()
        self._update_error_details()

        # Toggle hidden class on error panel
        try:
            error_container = self.query_one("#error-details-container", Vertical)
            if self.show_error_details:
                error_container.remove_class("hidden")
            else:
                error_container.add_class("hidden")
        except Exception:
            pass

        # Update headers
        self._update_panel_headers()
