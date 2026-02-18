"""Widgets for Tachikoma dashboard."""

from typing import Any, Optional

from rich.style import Style
from rich.text import Text

from .models import Session, SessionStats, SessionStatus, SessionTree, Todo

# GITS Theme colors
GITS_BG = "#0a0e14"
GITS_GREEN = "#00ff9f"
GITS_CYAN = "#26c6da"
GITS_RED = "#ff0066"
GITS_ORANGE = "#ffa726"
GITS_TEXT = "#b3e5fc"
GITS_MUTED = "#4a5f6d"


def get_status_icon(status: SessionStatus) -> tuple[str, str]:
    """Get status icon and color."""
    icons = {
        SessionStatus.WORKING: ("●", GITS_GREEN),
        SessionStatus.ACTIVE: ("◐", GITS_ORANGE),
        SessionStatus.IDLE: ("○", GITS_MUTED),
    }
    return icons.get(status, ("?", GITS_MUTED))


def truncate_message(msg: str | None, max_length: int = 40) -> str:
    """Truncate message to max length with ellipsis."""
    if not msg:
        return "--"
    if len(msg) <= max_length:
        return msg
    return msg[:max_length] + "..."


def format_duration(seconds: int) -> str:
    if seconds < 60:
        return f"{seconds}s"
    minutes, secs = divmod(seconds, 60)
    if minutes < 60:
        return f"{minutes}m{secs:02d}"
    hours, mins = divmod(minutes, 60)
    return f"{hours}h{mins:02d}"


def render_details(session: Session | None, stats: SessionStats | None = None) -> Text:
    """Render session details."""
    if not session:
        return Text("No session selected", style=Style(color=GITS_MUTED))

    icon_char, icon_color = get_status_icon(session.status)
    duration = format_duration(session.duration)

    # Get stats or use defaults
    msg_count = stats.message_count if stats else 0
    tool_count = stats.tool_call_count if stats else 0
    last_msg = (
        truncate_message(stats.last_user_message) if stats and stats.last_user_message else "--"
    )

    lines = [
        Text()
        + Text("Selected: ", style=Style(bold=True, color=GITS_CYAN))
        + Text(session.title, style=Style(color=GITS_TEXT)),
        Text()
        + Text("Status: ", style=Style(bold=True, color=GITS_CYAN))
        + Text(f"{icon_char} ", style=Style(color=icon_color))
        + Text(session.status.value, style=Style(color=GITS_TEXT)),
        Text()
        + Text("Duration: ", style=Style(bold=True, color=GITS_CYAN))
        + Text(duration, style=Style(color=GITS_TEXT)),
        Text()
        + Text("CWD: ", style=Style(bold=True, color=GITS_CYAN))
        + Text(session.directory, style=Style(color=GITS_TEXT)),
        Text()
        + Text("Tool Calls: ", style=Style(bold=True, color=GITS_CYAN))
        + Text(str(tool_count), style=Style(color=GITS_GREEN)),
        Text()
        + Text("Messages: ", style=Style(bold=True, color=GITS_CYAN))
        + Text(str(msg_count), style=Style(color=GITS_GREEN)),
        Text()
        + Text("Last User: ", style=Style(bold=True, color=GITS_CYAN))
        + Text(last_msg, style=Style(color=GITS_TEXT)),
    ]
    return Text("\n", style=Style(color=GITS_MUTED)).join(lines)


def render_skills(skills: list[Any] | None = None) -> Text:
    """Render loaded skills panel."""
    if not skills or len(skills) == 0:
        lines = [
            Text("Loaded Skills", style=Style(bold=True, color=GITS_CYAN)),
            Text("-" * 20, style=Style(color=GITS_MUTED)),
            Text("(No skills loaded)", style=Style(color=GITS_MUTED)),
        ]
        return Text("\n", style=Style(color=GITS_MUTED)).join(lines)

    lines = [
        Text("Loaded Skills", style=Style(bold=True, color=GITS_CYAN)),
        Text("-" * 20, style=Style(color=GITS_MUTED)),
    ]

    for skill in skills:
        invocations = skill.invocation_count if hasattr(skill, 'invocation_count') else 1
        last_used = (
            format_duration(int(skill.last_used / 1000))
            if hasattr(skill, 'last_used') and skill.last_used
            else "N/A"
        )

        lines.append(Text())
        lines.append(Text(f"  • {skill.name}", style=Style(color=GITS_TEXT)))
        lines.append(Text(f"    Invocations: {invocations}", style=Style(color=GITS_MUTED)))
        if hasattr(skill, 'last_used') and skill.last_used:
            lines.append(Text(f"    Last Used: {last_used}", style=Style(color=GITS_MUTED)))

    return Text("\n", style=Style(color=GITS_MUTED)).join(lines)


def render_todos(todos: list[Todo]) -> Text:
    """Render todo panel."""
    if not todos:
        lines = [
            Text("TODOs", style=Style(bold=True, color=GITS_CYAN)),
            Text("-" * 20, style=Style(color=GITS_MUTED)),
            Text("(No todos)", style=Style(color=GITS_MUTED)),
        ]
        return Text("\n", style=Style(color=GITS_MUTED)).join(lines)

    lines = [Text("TODOs", style=Style(bold=True, color=GITS_CYAN))]
    lines.append(Text("-" * 30, style=Style(color=GITS_MUTED)))

    for todo in todos:
        # Status icon based on priority
        priority_color = {
            "high": GITS_RED,
            "medium": GITS_ORANGE,
            "low": GITS_MUTED,
        }.get(todo.priority, GITS_MUTED)

        status_icon = {
            "pending": "○",
            "in_progress": "◐",
            "completed": "●",
        }.get(todo.status, "○")

        # Truncate content if too long
        content = todo.content[:40] + "..." if len(todo.content) > 40 else todo.content

        line = Text()
        line.append(f"{status_icon} ", style=Style(color=priority_color))
        line.append(f"[{todo.priority}] ", style=Style(color=priority_color))
        line.append(content, style=Style(color=GITS_TEXT))

        lines.append(line)

    return Text("\n", style=Style(color=GITS_MUTED)).join(lines)


def render_aggregation(sessions: list[Session]) -> Text:
    """Render root aggregation stats."""
    total = len(sessions)
    working = sum(1 for s in sessions if s.status == SessionStatus.WORKING)
    active = sum(1 for s in sessions if s.status == SessionStatus.ACTIVE)

    text = Text()
    text.append("Sessions: ", style=Style(color=GITS_TEXT))
    text.append(f"{working}", style=Style(bold=True, color=GITS_GREEN))
    text.append(" running | ", style=Style(color=GITS_TEXT))
    text.append(f"{active}", style=Style(bold=True, color=GITS_ORANGE))
    text.append(" active | ", style=Style(color=GITS_TEXT))
    text.append(f"{total}", style=Style(bold=True, color=GITS_MUTED))
    text.append(" total", style=Style(color=GITS_TEXT))

    return text


def render_empty_state(message: str) -> Text:
    """Render an empty state message."""
    return Text(message, style=Style(color=GITS_MUTED))
