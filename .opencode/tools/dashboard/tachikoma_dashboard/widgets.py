"""Widgets for Tachikoma dashboard with GITS theme.

Design principles:
- Pure rendering functions (no side effects)
- Centralized theme via theme.py
- Rich Text for styling
- Red accents for visual "pop"
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Sequence

from rich.style import Style
from rich.text import Text

from .models import Session, SessionStats, SessionStatus, SessionTree, Todo
from .theme import PANEL_BORDERS, PRIORITY_COLORS, STATUS_COLORS, THEME

if TYPE_CHECKING:
    pass


# Pure utility functions

def get_status_icon(status: SessionStatus) -> tuple[str, str]:
    """Get status icon and color (pure function).
    
    Returns:
        Tuple of (icon_character, hex_color)
    """
    return STATUS_COLORS.get(status.value, ("?", THEME.muted))


def truncate_message(msg: str | None, max_length: int = 40) -> str:
    """Truncate message with ellipsis (pure function)."""
    if not msg:
        return "--"
    if len(msg) <= max_length:
        return msg
    return msg[: max_length - 3] + "..."


def format_duration(seconds: int) -> str:
    """Format seconds as human-readable duration (pure function)."""
    if seconds < 0:
        return "0s"
    if seconds < 60:
        return f"{seconds}s"
    minutes, secs = divmod(seconds, 60)
    if minutes < 60:
        return f"{minutes}m{secs:02d}s"
    hours, mins = divmod(minutes, 60)
    return f"{hours}h{mins:02d}m"


# Rendering functions (pure - return Text, no side effects)


def render_session_tree(trees: Sequence[SessionTree], debug: bool = False) -> str:
    """Render session hierarchy as a vertical tree.
    
    NOTE: This function is kept for API compatibility but delegates
    to the iterative renderer in tree_renderer.py
    
    Args:
        trees: List of root SessionTree nodes
        debug: Print debug information
    
    Returns:
        Rendered tree as string
    """
    from .tree_renderer import render_tree_iterative
    
    if not trees:
        return "No sessions found"
    
    return "\n".join(render_tree_iterative(list(trees), debug=debug))


def render_details(session: Session | None, stats: SessionStats | None = None) -> Text:
    """Render session details panel (pure function).
    
    Uses cyan labels with green/red accents for metrics.
    """
    if not session:
        return Text("No session selected", style=Style(color=THEME.muted))
    
    icon_char, icon_color = get_status_icon(session.status)
    duration = format_duration(session.duration)
    
    # Stats with defaults
    msg_count = stats.message_count if stats else 0
    tool_count = stats.tool_call_count if stats else 0
    last_msg = (
        truncate_message(stats.last_user_message)
        if stats and stats.last_user_message
        else "--"
    )
    
    # Subagent indicator with RED accent
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
    """Render loaded skills panel (pure function).
    
    Uses orange border with green/red accents for metrics.
    """
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
        
        # Skill name with accent (RED bullet)
        lines.append(Text())
        skill_line = Text("  ◆ ", style=Style(color=THEME.red))
        skill_line += Text(name, style=Style(color=THEME.text, bold=True))
        lines.append(skill_line)
        
        # Metrics with muted color
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
    """Render todos panel (pure function).
    
    Uses RED border and accents for high-priority items.
    """
    header = Text("TODOS", style=Style(bold=True, color=THEME.red))  # RED header
    separator = Text("─" * 30, style=Style(color=THEME.muted))
    
    if not todos:
        return Text("\n").join([
            header,
            separator,
            Text("(No pending tasks)", style=Style(color=THEME.muted)),
        ])
    
    lines = [header, separator]
    
    for todo in todos:
        # Priority determines color (RED for high!)
        priority_color = PRIORITY_COLORS.get(todo.priority, THEME.muted)
        
        # Status icon
        status_icon = {
            "pending": "○",
            "in_progress": "◐",
            "completed": "●",
        }.get(todo.status, "○")
        
        # Truncate content
        content = (
            todo.content[:40] + "..." if len(todo.content) > 40 else todo.content
        )
        
        # Build line with priority indicator
        line = Text()
        line.append(f"{status_icon} ", style=Style(color=priority_color))
        line.append(f"[{todo.priority.upper()[0]}] ", style=Style(color=priority_color, bold=True))
        line.append(content, style=Style(color=THEME.text))
        
        lines.append(line)
    
    return Text("\n").join(lines)


def render_aggregation(sessions: Sequence[Session]) -> Text:
    """Render aggregation stats bar (pure function).
    
    Shows counts with color-coded status indicators.
    """
    if not sessions:
        return Text("No sessions", style=Style(color=THEME.muted))
    
    total = len(sessions)
    subagent_count = sum(1 for s in sessions if s.is_subagent)
    working = sum(1 for s in sessions if s.status == SessionStatus.WORKING)
    active = sum(1 for s in sessions if s.status == SessionStatus.ACTIVE)
    
    text = Text()
    
    # Total with GREEN accent
    text.append("Sessions: ", style=Style(color=THEME.text))
    text.append(f"{total}", style=Style(bold=True, color=THEME.green))
    
    # Subagents with muted
    text.append(f" ({subagent_count} subagents) │ ", style=Style(color=THEME.muted))
    
    # Working count with GREEN
    text.append(f"{working}", style=Style(bold=True, color=THEME.green))
    text.append(" running │ ", style=Style(color=THEME.text))
    
    # Active count with ORANGE
    text.append(f"{active}", style=Style(bold=True, color=THEME.orange))
    text.append(" active", style=Style(color=THEME.text))
    
    return text


# Helper functions (private)


def _make_label_value(
    label: str, value: str, label_color: str, value_color: str
) -> Text:
    """Create a label: value text pair (pure helper)."""
    return (
        Text(label + ": ", style=Style(bold=True, color=label_color)) +
        Text(value, style=Style(color=value_color))
    )
