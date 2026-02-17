"""Widgets for the Tachikoma dashboard."""

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
    """Get icon and color for session status."""
    icons = {
        SessionStatus.WORKING: ("●", GITS_GREEN),
        SessionStatus.ACTIVE: ("◐", GITS_ORANGE),
        SessionStatus.IDLE: ("○", GITS_MUTED),
    }
    return icons[status]


def format_duration(seconds: int) -> str:
    """Format duration in human-readable format."""
    if seconds < 60:
        return f"{seconds}s"
    minutes, secs = divmod(seconds, 60)
    if minutes < 60:
        return f"{minutes}m {secs}s"
    hours, mins = divmod(minutes, 60)
    return f"{hours}h {mins}m"


def truncate_message(msg: str, max_len: int = 40) -> str:
    """Truncate message for display."""
    if not msg:
        return "--"
    if len(msg) > max_len:
        return msg[:max_len] + "..."
    return msg


def render_session_tree(trees: list[SessionTree], selected_id: str | None = None) -> Text:
    """Render the session tree as text."""
    # Header
    header = Text()
    header.append(" Status   ", style=Style(bold=True, color=GITS_CYAN))
    header.append(
        "Session                                        ", style=Style(bold=True, color=GITS_CYAN)
    )
    header.append("Directory", style=Style(bold=True, color=GITS_CYAN))

    lines = [header]
    lines.append(Text("-" * 80, style=Style(color=GITS_MUTED)))

    def add_rows(tree: SessionTree, depth: int = 0) -> None:
        icon_char, icon_color = get_status_icon(tree.status)
        title = tree.session.title[:40] if len(tree.session.title) > 40 else tree.session.title
        directory = (
            tree.session.directory[:30]
            if len(tree.session.directory) > 30
            else tree.session.directory
        )

        row = Text()
        row.append(f" {icon_char}  ", style=Style(color=icon_color))
        if tree.session.id == selected_id:
            row.append(f"{title}  ", style=Style(bold=True, color=GITS_RED))
            row.append(f"{directory}  ", style=Style(color=GITS_TEXT))
            row.append("<<", style=Style(bold=True, color=GITS_RED))
        else:
            row.append(f"{title}  ", style=Style(color=GITS_TEXT))
            row.append(f"{directory}", style=Style(color=GITS_TEXT))

        lines.append(row)

        for child in tree.children:
            add_rows(child, depth + 1)

    for tree in trees:
        add_rows(tree)

    return Text("\n", style=Style(color=GITS_MUTED)).join(lines)


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


def render_skills() -> Text:
    """Render loaded skills panel."""
    lines = [
        Text("Loaded Skills", style=Style(bold=True, color=GITS_CYAN)),
        Text("-" * 20, style=Style(color=GITS_MUTED)),
        Text("(No skills loaded)", style=Style(color=GITS_MUTED)),
    ]
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
