"""Enhanced widgets for Tachikoma dashboard using Textual's advanced widgets.

Design principles:
- Use Textual's native widgets (DataTable, Sparkline, ProgressBar, Collapsible)
- Functional updates (clear and rebuild rather than mutate)
- GITS theme integration
- Performance optimized with caching
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Sequence

from rich.text import Text
from textual.containers import Container, Horizontal
from textual.message import Message
from textual.reactive import reactive
from textual.widgets import DataTable, Input, Label, ProgressBar, Sparkline, Static

from .models import Skill, Todo
from .theme import PRIORITY_COLORS, THEME

if TYPE_CHECKING:
    from textual.widgets._data_table import ColumnKey, RowKey


# =============================================================================
# Search Widget
# =============================================================================

class SearchBar(Container):
    """Search bar widget for filtering sessions.

    Features:
    - Text input with placeholder
    - Real-time filtering
    - Keyboard shortcut hint
    """

    DEFAULT_CSS = f"""
    SearchBar {{
        width: 100%;
        height: auto;
        background: {THEME.bg2};
        padding: 0 1;
        display: none;
    }}

    SearchBar.visible {{
        display: block;
    }}

    SearchBar > Input {{
        width: 1fr;
        background: {THEME.bg1};
        color: {THEME.text};
        border: solid {THEME.cyan};
        padding: 0 1;
    }}

    SearchBar > Input:focus {{
        border: solid {THEME.red};
    }}

    SearchBar > #search-hint {{
        color: {THEME.muted};
        text-style: italic;
        padding: 0 1;
        height: 1;
    }}
    """

    class SearchChanged(Message):
        """Posted when search text changes."""

        def __init__(self, query: str) -> None:
            super().__init__()
            self.query = query

    query: reactive[str] = reactive("")

    def __init__(self, id: str | None = None) -> None:
        """Initialize the search bar."""
        super().__init__(id=id)
        self._visible = False

    def compose(self):
        """Compose the search bar."""
        yield Input(
            placeholder="Search sessions by title or directory...",
            id="search-input",
        )
        yield Label("Press Escape to close, Enter to apply", id="search-hint")

    def on_input_changed(self, event: Input.Changed) -> None:
        """Handle input changes."""
        self.query = event.value
        self.post_message(self.SearchChanged(event.value))

    def on_input_submitted(self, event: Input.Submitted) -> None:
        """Handle input submission."""
        self.post_message(self.SearchChanged(event.value))

    def toggle(self) -> None:
        """Toggle search bar visibility."""
        self._visible = not self._visible
        if self._visible:
            self.add_class("visible")
            # Focus the input
            try:
                self.query_one(Input).focus()
            except Exception:
                pass
        else:
            self.remove_class("visible")
            self.query = ""

    def show(self) -> None:
        """Show the search bar."""
        if not self._visible:
            self.toggle()

    def hide(self) -> None:
        """Hide the search bar."""
        if self._visible:
            self.toggle()

    def clear(self) -> None:
        """Clear the search input."""
        try:
            input_widget = self.query_one(Input)
            input_widget.value = ""
        except Exception:
            pass
        self.query = ""


# =============================================================================
# Collapsible Stats Widget
# =============================================================================

class CollapsibleStats(Container):
    """Collapsible container for advanced statistics.

    Features:
    - Expand/collapse with click or keyboard
    - GITS-themed styling
    - Contains detailed stats
    """

    DEFAULT_CSS = f"""
    CollapsibleStats {{
        width: 100%;
        height: auto;
        background: {THEME.bg1};
        border-top: solid {THEME.bg3};
        padding: 0 1;
    }}

    CollapsibleStats > #stats-header {{
        background: {THEME.bg2};
        color: {THEME.cyan};
        padding: 0 1;
        text-style: bold;
        height: 1;
    }}

    CollapsibleStats > #stats-content {{
        padding: 1;
        color: {THEME.text};
        display: none;
    }}

    CollapsibleStats.expanded > #stats-content {{
        display: block;
    }}
    """

    def __init__(
        self,
        title: str = "Advanced Stats",
        id: str | None = None,
    ) -> None:
        """Initialize the collapsible stats."""
        super().__init__(id=id)
        self._title = title
        self._expanded = False

    def compose(self):
        """Compose the collapsible stats."""
        yield Static(f"▶ {self._title}", id="stats-header")
        yield Static("", id="stats-content")

    def on_click(self) -> None:
        """Toggle on click."""
        self.toggle()

    def toggle(self) -> None:
        """Toggle expanded state."""
        self._expanded = not self._expanded
        header = self.query_one("#stats-header", Static)
        content = self.query_one("#stats-content", Static)

        if self._expanded:
            header.update(f"▼ {self._title}")
            self.add_class("expanded")
        else:
            header.update(f"▶ {self._title}")
            self.remove_class("expanded")

    def update_content(self, content: str) -> None:
        """Update the stats content."""
        stats_content = self.query_one("#stats-content", Static)
        stats_content.update(content)


# =============================================================================
# Data Table Widgets
# =============================================================================


class SkillsDataTable(DataTable):
    """DataTable widget for displaying skills with sortable columns.

    Features:
    - Sortable columns (click header to sort)
    - Row cursor for selection
    - GITS-themed styling
    """

    DEFAULT_CSS = f"""
    SkillsDataTable {{
        background: {THEME.bg1};
        color: {THEME.text};
        border: none;
        height: 1fr;
    }}

    SkillsDataTable > .datatable--header {{
        background: {THEME.bg2};
        color: {THEME.orange};
        text-style: bold;
    }}

    SkillsDataTable > .datatable--cursor {{
        background: {THEME.bg3};
        color: {THEME.text};
    }}

    SkillsDataTable > .datatable--hover {{
        background: {THEME.bg2};
    }}

    SkillsDataTable:focus .datatable--cursor {{
        background: {THEME.bg3};
        color: {THEME.green};
    }}
    """

    def __init__(self, id: str | None = None) -> None:
        """Initialize the skills data table."""
        super().__init__(
            id=id,
            show_header=True,
            show_cursor=True,
            cursor_type="row",
            zebra_stripes=True,
            cell_padding=1,
        )
        self._columns_added = False

    def _ensure_columns(self) -> None:
        """Ensure columns are added before adding rows."""
        if not self._columns_added:
            self.add_column("Skill", width=20)
            self.add_column("Calls", width=6)
            self.add_column("Last Used", width=12)
            self._columns_added = True

    def on_mount(self) -> None:
        """Set up columns on mount."""
        self._ensure_columns()

    def update_skills(self, skills: Sequence[Skill] | None) -> None:
        """Update the table with new skills data.

        Clears and rebuilds the table for simplicity.

        Args:
            skills: List of skills to display
        """
        # Ensure columns exist before clearing
        self._ensure_columns()

        # Clear existing rows
        self.clear()

        if not skills:
            return

        for skill in skills:
            # Format last used time
            last_used = "--"
            if skill.last_used:
                from .widgets import format_duration
                elapsed_sec = (skill.last_used - skill.time_loaded) // 1000
                if elapsed_sec > 0:
                    last_used = format_duration(elapsed_sec) + " ago"

            self.add_row(
                skill.name,
                str(skill.invocation_count),
                last_used,
            )


class TodosDataTable(DataTable):
    """DataTable widget for displaying todos with priority indicators.

    Features:
    - Priority-based row styling
    - Status indicators
    - Sortable by priority/status
    """

    DEFAULT_CSS = f"""
    TodosDataTable {{
        background: {THEME.bg1};
        color: {THEME.text};
        border: none;
        height: 1fr;
    }}

    TodosDataTable > .datatable--header {{
        background: {THEME.bg2};
        color: {THEME.red};
        text-style: bold;
    }}

    TodosDataTable > .datatable--cursor {{
        background: {THEME.bg3};
        color: {THEME.text};
    }}

    TodosDataTable > .datatable--hover {{
        background: {THEME.bg2};
    }}

    TodosDataTable:focus .datatable--cursor {{
        background: {THEME.bg3};
        color: {THEME.green};
    }}
    """

    # Status icons
    STATUS_ICONS = {
        "pending": "○",
        "in_progress": "◐",
        "completed": "●",
    }

    def __init__(self, id: str | None = None) -> None:
        """Initialize the todos data table."""
        super().__init__(
            id=id,
            show_header=True,
            show_cursor=True,
            cursor_type="row",
            zebra_stripes=True,
            cell_padding=1,
        )
        self._columns_added = False

    def _ensure_columns(self) -> None:
        """Ensure columns are added before adding rows."""
        if not self._columns_added:
            self.add_column("Status", width=3)
            self.add_column("P", width=1)
            self.add_column("Task", width=30)
            self._columns_added = True

    def on_mount(self) -> None:
        """Set up columns on mount."""
        self._ensure_columns()

    def update_todos(self, todos: Sequence[Todo]) -> None:
        """Update the table with new todos data.

        Args:
            todos: List of todos to display
        """
        # Ensure columns exist before clearing
        self._ensure_columns()

        self.clear()

        if not todos:
            return

        # Sort by priority (high first) then by status
        priority_order = {"high": 0, "medium": 1, "low": 2}
        status_order = {"in_progress": 0, "pending": 1, "completed": 2}

        sorted_todos = sorted(
            todos,
            key=lambda t: (
                priority_order.get(t.priority, 3),
                status_order.get(t.status, 3),
            ),
        )

        for todo in sorted_todos:
            status_icon = self.STATUS_ICONS.get(todo.status, "○")
            priority_char = todo.priority[0].upper()

            # Truncate content
            content = todo.content
            if len(content) > 28:
                content = content[:25] + "..."

            self.add_row(status_icon, priority_char, content)


class ActivitySparkline(Sparkline):
    """Sparkline widget for displaying activity over time.

    Features:
    - GITS-themed colors
    - Shows activity frequency
    """

    DEFAULT_CSS = f"""
    ActivitySparkline {{
        height: 1;
        margin: 0 1;
    }}

    ActivitySparkline > .sparkline--max-color {{
        color: {THEME.green};
    }}

    ActivitySparkline > .sparkline--min-color {{
        color: {THEME.muted};
    }}
    """

    def __init__(
        self,
        data: Sequence[float] | None = None,
        id: str | None = None,
    ) -> None:
        """Initialize the activity sparkline."""
        super().__init__(
            data=data or [],
            id=id,
        )

    def update_data(self, data: Sequence[float]) -> None:
        """Update the sparkline data.

        Args:
            data: Sequence of values to display
        """
        self.data = list(data) if data else []


class TodoProgressBar(ProgressBar):
    """Progress bar for todo completion.

    Features:
    - Shows completion percentage
    - GITS-themed colors
    - Gradient from orange to green
    """

    DEFAULT_CSS = f"""
    TodoProgressBar {{
        height: 1;
        margin: 0 1;
    }}

    TodoProgressBar > Bar > .bar--bar {{
        color: {THEME.orange};
        background: {THEME.bg2};
    }}

    TodoProgressBar > Bar > .bar--complete {{
        color: {THEME.green};
        background: {THEME.bg2};
    }}
    """

    def __init__(self, id: str | None = None) -> None:
        """Initialize the todo progress bar."""
        super().__init__(id=id, show_eta=False, show_percentage=True)

    def update_progress(self, completed: int, total: int) -> None:
        """Update the progress bar.

        Args:
            completed: Number of completed todos
            total: Total number of todos
        """
        if total == 0:
            self.update(total=1, progress=0)
            return

        self.update(total=total, progress=completed)


class StatsHeader(Static):
    """Header widget with title and optional stats.

    Features:
    - GITS-themed styling
    - Shows title with optional count
    """

    DEFAULT_CSS = f"""
    StatsHeader {{
        background: {THEME.bg2};
        color: {THEME.text};
        padding: 0 1;
        text-style: bold;
        height: 1;
    }}
    """

    def __init__(self, title: str, id: str | None = None) -> None:
        """Initialize the stats header.

        Args:
            title: Header title
            id: Widget ID
        """
        super().__init__(title, id=id)
        self._title = title

    def update_count(self, count: int) -> None:
        """Update the count shown in the header.

        Args:
            count: Count to display
        """
        self.update(f"{self._title} ({count})")
