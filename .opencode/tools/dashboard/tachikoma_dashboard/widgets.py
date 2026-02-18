"""Widgets for Tachikoma dashboard.

Architecture:
- Utility functions: Pure helpers for formatting
- Renderers: Pure functions that return Rich Text
- Widget classes: Textual interactive components

All styled with GITS theme (green primary, red accents).
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Sequence

from rich.style import Style
from rich.text import Text
from textual.containers import Container
from textual.message import Message
from textual.reactive import reactive
from textual.widgets import DataTable, Input, Label, ProgressBar, Sparkline, Static

from .models import ModelUsage, Session, SessionStats, SessionStatus, SessionTokens, SessionTree, Skill, Todo
from .theme import PANEL_BORDERS, PRIORITY_COLORS, STATUS_COLORS, THEME

if TYPE_CHECKING:
    pass


# =============================================================================
# UTILITY FUNCTIONS (Pure)
# =============================================================================

def get_status_icon(status: SessionStatus) -> tuple[str, str]:
    """Get status icon and color.

    Returns:
        Tuple of (icon_character, hex_color)
    """
    color, icon = STATUS_COLORS.get(status.value, (THEME.muted, "?"))
    return (icon, color)


def truncate_message(msg: str | None, max_length: int = 40) -> str:
    """Truncate message with ellipsis."""
    if not msg:
        return "--"
    if len(msg) <= max_length:
        return msg
    return msg[: max_length - 3] + "..."


def format_duration(seconds: int) -> str:
    """Format seconds as human-readable duration."""
    if seconds < 0:
        return "0s"
    if seconds < 60:
        return f"{seconds}s"
    minutes, secs = divmod(seconds, 60)
    if minutes < 60:
        return f"{minutes}m{secs:02d}s"
    hours, mins = divmod(minutes, 60)
    return f"{hours}h{mins:02d}m"


def format_tokens(tokens: int) -> str:
    """Format token count with K/M suffixes."""
    if tokens < 1000:
        return str(tokens)
    if tokens < 1_000_000:
        return f"{tokens / 1000:.1f}K"
    return f"{tokens / 1_000_000:.2f}M"


def format_model_name(provider: str, model: str, max_len: int = 25) -> str:
    """Format model name for display."""
    provider_short = {
        "openai": "openai",
        "anthropic": "anthropic",
        "google": "google",
        "opencode": "opencode",
    }.get(provider.lower(), provider[:8])

    model_short = model.split("/")[-1] if "/" in model else model
    if len(model_short) > max_len:
        model_short = model_short[:max_len - 3] + "..."

    return f"{provider_short}/{model_short}"


def _make_label_value(label: str, value: str, label_color: str, value_color: str) -> Text:
    """Create a label: value text pair."""
    return (
        Text(label + ": ", style=Style(bold=True, color=label_color)) +
        Text(value, style=Style(color=value_color))
    )


# =============================================================================
# RENDERERS (Pure functions returning Rich Text)
# =============================================================================

def render_session_tree(trees: Sequence[SessionTree], debug: bool = False) -> str:
    """Render session hierarchy as a vertical tree."""
    from .tree_renderer import render_tree_iterative

    if not trees:
        return "No sessions found"

    return "\n".join(render_tree_iterative(list(trees), debug=debug))


def render_details(session: Session | None, stats: SessionStats | None = None) -> Text:
    """Render session details panel."""
    if not session:
        return Text("No session selected", style=Style(color=THEME.muted))

    icon_char, icon_color = get_status_icon(session.status)
    duration = format_duration(session.duration)

    msg_count = stats.message_count if stats else 0
    tool_count = stats.tool_call_count if stats else 0
    last_msg = (
        truncate_message(stats.last_user_message)
        if stats and stats.last_user_message
        else "--"
    )

    subagent_badge = (
        Text(" [SUBAGENT]", style=Style(color=THEME.red, bold=True))
        if session.is_subagent
        else Text()
    )

    lines = [
        _make_label_value("Selected", session.title, THEME.cyan, THEME.text) + subagent_badge,
        _make_label_value("Status", f"{icon_char} {session.status.value}", THEME.cyan, icon_color),
        _make_label_value("Duration", duration, THEME.cyan, THEME.text),
        _make_label_value("CWD", session.directory, THEME.cyan, THEME.text),
        _make_label_value("Tool Calls", str(tool_count), THEME.cyan, THEME.green),
        _make_label_value("Messages", str(msg_count), THEME.cyan, THEME.green),
        _make_label_value("Last User", last_msg, THEME.cyan, THEME.text),
    ]

    return Text("\n").join(lines)


def render_skills(skills: Sequence[Any] | None = None) -> Text:
    """Render loaded skills panel."""
    header = Text("LOADED SKILLS", style=Style(bold=True, color=THEME.orange))
    separator = Text("─" * 25, style=Style(color=THEME.muted))

    if not skills:
        return Text("\n").join([
            header,
            separator,
            Text("(No skills loaded)", style=Style(color=THEME.muted)),
        ])

    lines = [header, separator]

    for skill in skills:
        name = getattr(skill, "name", "unknown")
        invocations = getattr(skill, "invocation_count", 1)
        last_used_ms = getattr(skill, "last_used", None)

        lines.append(Text())
        skill_line = Text("  ◆ ", style=Style(color=THEME.red))
        skill_line += Text(name, style=Style(color=THEME.text, bold=True))
        lines.append(skill_line)

        lines.append(
            Text(f"    Invocations: {invocations}", style=Style(color=THEME.muted))
        )

        if last_used_ms:
            last_used = format_duration(int(last_used_ms / 1000))
            lines.append(
                Text(f"    Last Used: {last_used} ago", style=Style(color=THEME.muted))
            )

    return Text("\n").join(lines)


def render_todos(todos: Sequence[Todo]) -> Text:
    """Render todos panel."""
    header = Text("TODOS", style=Style(bold=True, color=THEME.red))
    separator = Text("─" * 30, style=Style(color=THEME.muted))

    if not todos:
        return Text("\n").join([
            header,
            separator,
            Text("(No pending tasks)", style=Style(color=THEME.muted)),
        ])

    lines = [header, separator]

    for todo in todos:
        priority_color = PRIORITY_COLORS.get(todo.priority, THEME.muted)

        status_icon = {
            "pending": "○",
            "in_progress": "◐",
            "completed": "●",
        }.get(todo.status, "○")

        content = (
            todo.content[:40] + "..." if len(todo.content) > 40 else todo.content
        )

        line = Text()
        line.append(f"{status_icon} ", style=Style(color=priority_color))
        line.append(f"[{todo.priority.upper()[0]}] ", style=Style(color=priority_color, bold=True))
        line.append(content, style=Style(color=THEME.text))

        lines.append(line)

    return Text("\n").join(lines)


def render_aggregation(sessions: Sequence[Session]) -> Text:
    """Render aggregation stats bar."""
    if not sessions:
        return Text("No sessions", style=Style(color=THEME.muted))

    total = len(sessions)
    subagent_count = sum(1 for s in sessions if s.is_subagent)
    working = sum(1 for s in sessions if s.status == SessionStatus.WORKING)
    active = sum(1 for s in sessions if s.status == SessionStatus.ACTIVE)

    text = Text()

    text.append("Sessions: ", style=Style(color=THEME.text))
    text.append(f"{total}", style=Style(bold=True, color=THEME.green))

    text.append(f" ({subagent_count} subagents) │ ", style=Style(color=THEME.muted))

    text.append(f"{working}", style=Style(bold=True, color=THEME.green))
    text.append(" running │ ", style=Style(color=THEME.text))

    text.append(f"{active}", style=Style(bold=True, color=THEME.orange))
    text.append(" active", style=Style(color=THEME.text))

    return text


def render_session_tokens(tokens: SessionTokens | None) -> Text:
    """Render token usage for a session."""
    header = Text("TOKEN USAGE", style=Style(bold=True, color=THEME.cyan))
    separator = Text("─" * 25, style=Style(color=THEME.muted))

    if not tokens or tokens.total_tokens == 0:
        return Text("\n").join([
            header,
            separator,
            Text("(No token data)", style=Style(color=THEME.muted)),
        ])

    lines = [header, separator]

    total_line = Text()
    total_line.append("Total: ", style=Style(color=THEME.text))
    total_line.append(format_tokens(tokens.total_tokens), style=Style(bold=True, color=THEME.green))
    lines.append(total_line)

    io_line = Text()
    io_line.append(f"  In: {format_tokens(tokens.total_input_tokens)}", style=Style(color=THEME.muted))
    io_line.append("  ", style=Style(color=THEME.muted))
    io_line.append(f"Out: {format_tokens(tokens.total_output_tokens)}", style=Style(color=THEME.muted))
    lines.append(io_line)

    lines.append(
        Text(f"  Requests: {tokens.request_count}", style=Style(color=THEME.muted))
    )

    if len(tokens.models) > 0:
        lines.append(Text())
        lines.append(Text("Models:", style=Style(color=THEME.text, bold=True)))

        for model in tokens.models[:3]:
            model_line = Text()
            model_line.append(f"  ◇ ", style=Style(color=THEME.cyan))
            model_line.append(
                format_model_name(model.provider, model.model),
                style=Style(color=THEME.text)
            )
            model_line.append(
                f" {format_tokens(model.total_tokens)}",
                style=Style(color=THEME.green)
            )
            lines.append(model_line)

    return Text("\n").join(lines)


def render_model_usage(models: Sequence[ModelUsage] | None = None) -> Text:
    """Render model usage panel."""
    header = Text("MODEL USAGE", style=Style(bold=True, color=THEME.cyan))
    separator = Text("─" * 30, style=Style(color=THEME.muted))

    if not models:
        return Text("\n").join([
            header,
            separator,
            Text("(No model data)", style=Style(color=THEME.muted)),
        ])

    lines = [header, separator]

    total_tokens = sum(m.total_tokens for m in models)
    total_requests = sum(m.request_count for m in models)

    summary = Text()
    summary.append(f"Total: ", style=Style(color=THEME.text))
    summary.append(format_tokens(total_tokens), style=Style(bold=True, color=THEME.green))
    summary.append(f" tokens across ", style=Style(color=THEME.text))
    summary.append(f"{total_requests}", style=Style(bold=True, color=THEME.green))
    summary.append(f" requests", style=Style(color=THEME.text))
    lines.append(summary)
    lines.append(Text())

    for model in models[:5]:
        model_line = Text()
        model_line.append("◆ ", style=Style(color=THEME.red))
        model_line.append(
            format_model_name(model.provider, model.model),
            style=Style(color=THEME.text, bold=True)
        )
        lines.append(model_line)

        stats_line = Text()
        stats_line.append(f"    Tokens: ", style=Style(color=THEME.muted))
        stats_line.append(format_tokens(model.total_tokens), style=Style(color=THEME.green))
        stats_line.append(f"  Reqs: {model.request_count}", style=Style(color=THEME.muted))

        if model.last_rate_limit:
            stats_line.append("  ⚠ rate limited", style=Style(color=THEME.orange))

        lines.append(stats_line)

    if len(models) > 5:
        lines.append(
            Text(f"  ... and {len(models) - 5} more", style=Style(color=THEME.muted))
        )

    return Text("\n").join(lines)


# =============================================================================
# WIDGET CLASSES (Textual interactive components)
# =============================================================================

class SearchBar(Container):
    """Search bar widget for filtering sessions."""

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

    search_text: reactive[str] = reactive("")

    def __init__(self, id: str | None = None) -> None:
        super().__init__(id=id)
        self._visible = False

    def compose(self):
        yield Input(
            placeholder="Search sessions by title or directory...",
            id="search-input",
        )
        yield Label("Press Escape to close, Enter to apply", id="search-hint")

    def on_input_changed(self, event: Input.Changed) -> None:
        self.search_text = event.value
        self.post_message(self.SearchChanged(event.value))

    def on_input_submitted(self, event: Input.Submitted) -> None:
        self.post_message(self.SearchChanged(event.value))

    def toggle(self) -> None:
        self._visible = not self._visible
        if self._visible:
            self.add_class("visible")
            try:
                self.query_one(Input).focus()
            except Exception:
                pass
        else:
            self.remove_class("visible")
            self.search_text = ""

    def show(self) -> None:
        if not self._visible:
            self.toggle()

    def hide(self) -> None:
        if self._visible:
            self.toggle()

    def clear(self) -> None:
        try:
            self.query_one(Input).value = ""
        except Exception:
            pass
        self.search_text = ""


class SkillsDataTable(DataTable):
    """DataTable widget for displaying skills."""

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
        super().__init__(
            id=id,
            show_header=True,
            show_cursor=True,
            cursor_type="row",
            zebra_stripes=True,
            cell_padding=1,
        )

    def on_mount(self) -> None:
        self.add_column("Skill", width=20)
        self.add_column("Calls", width=6)
        self.add_column("Last Used", width=12)

    def update_skills(self, skills: Sequence[Skill] | None) -> None:
        self.clear()

        if not skills:
            return

        for skill in skills:
            last_used = "--"
            if skill.last_used and skill.time_loaded:
                elapsed_sec = (skill.last_used - skill.time_loaded) // 1000
                if elapsed_sec > 0:
                    last_used = format_duration(elapsed_sec) + " ago"

            self.add_row(
                skill.name,
                str(skill.invocation_count),
                last_used,
            )


class TodosDataTable(DataTable):
    """DataTable widget for displaying todos."""

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

    STATUS_ICONS = {
        "pending": "○",
        "in_progress": "◐",
        "completed": "●",
    }

    def __init__(self, id: str | None = None) -> None:
        super().__init__(
            id=id,
            show_header=True,
            show_cursor=True,
            cursor_type="row",
            zebra_stripes=True,
            cell_padding=1,
        )

    def on_mount(self) -> None:
        self.add_column("Status", width=3)
        self.add_column("P", width=1)
        self.add_column("Task", width=30)

    def update_todos(self, todos: Sequence[Todo]) -> None:
        self.clear()

        if not todos:
            return

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

            content = todo.content
            if len(content) > 28:
                content = content[:25] + "..."

            self.add_row(status_icon, priority_char, content)


class ActivitySparkline(Sparkline):
    """Sparkline widget for displaying activity over time."""

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
        super().__init__(data=data or [], id=id)

    def update_data(self, data: Sequence[float]) -> None:
        self.data = list(data) if data else []


class TodoProgressBar(ProgressBar):
    """Progress bar for todo completion."""

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
        super().__init__(id=id, show_eta=False, show_percentage=True)

    def update_progress(self, completed: int, total: int) -> None:
        if total == 0:
            self.update(total=1, progress=0)
            return

        self.update(total=total, progress=completed)
