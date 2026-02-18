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

from .models import ModelUsage, Session, SessionStats, SessionStatus, SessionTokens, SessionTree, Todo
from .theme import PANEL_BORDERS, PRIORITY_COLORS, STATUS_COLORS, THEME

if TYPE_CHECKING:
    pass


# Pure utility functions

def get_status_icon(status: SessionStatus) -> tuple[str, str]:
    """Get status icon and color (pure function).

    Returns:
        Tuple of (icon_character, hex_color)
    """
    color, icon = STATUS_COLORS.get(status.value, (THEME.muted, "?"))
    return (icon, color)


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


def format_tokens(tokens: int) -> str:
    """Format token count with K/M suffixes (pure function)."""
    if tokens < 1000:
        return str(tokens)
    if tokens < 1_000_000:
        return f"{tokens / 1000:.1f}K"
    return f"{tokens / 1_000_000:.2f}M"


def format_model_name(provider: str, model: str, max_len: int = 25) -> str:
    """Format model name for display (pure function)."""
    # Shorten common provider names
    provider_short = {
        "openai": "openai",
        "anthropic": "anthropic",
        "google": "google",
        "opencode": "opencode",
    }.get(provider.lower(), provider[:8])

    # Shorten model name
    model_short = model.split("/")[-1] if "/" in model else model
    if len(model_short) > max_len:
        model_short = model_short[:max_len - 3] + "..."

    return f"{provider_short}/{model_short}"


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


def render_session_tokens(tokens: SessionTokens | None) -> Text:
    """Render token usage for a session (pure function).

    Shows input/output tokens with model breakdown.
    """
    header = Text("TOKEN USAGE", style=Style(bold=True, color=THEME.cyan))
    separator = Text("─" * 25, style=Style(color=THEME.muted))

    if not tokens or tokens.total_tokens == 0:
        return Text("\n").join([
            header,
            separator,
            Text("(No token data)", style=Style(color=THEME.muted)),
        ])

    lines = [header, separator]

    # Total tokens with GREEN accent
    total_line = Text()
    total_line.append("Total: ", style=Style(color=THEME.text))
    total_line.append(format_tokens(tokens.total_tokens), style=Style(bold=True, color=THEME.green))
    lines.append(total_line)

    # Input/Output breakdown
    io_line = Text()
    io_line.append(f"  In: {format_tokens(tokens.total_input_tokens)}", style=Style(color=THEME.muted))
    io_line.append("  ", style=Style(color=THEME.muted))
    io_line.append(f"Out: {format_tokens(tokens.total_output_tokens)}", style=Style(color=THEME.muted))
    lines.append(io_line)

    # Request count
    lines.append(
        Text(f"  Requests: {tokens.request_count}", style=Style(color=THEME.muted))
    )

    # Model breakdown if multiple models
    if len(tokens.models) > 0:
        lines.append(Text())  # Blank line
        lines.append(Text("Models:", style=Style(color=THEME.text, bold=True)))

        for model in tokens.models[:3]:  # Show top 3 models
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
    """Render model usage panel (pure function).

    Shows all models with token counts and request counts.
    """
    header = Text("MODEL USAGE", style=Style(bold=True, color=THEME.cyan))
    separator = Text("─" * 30, style=Style(color=THEME.muted))

    if not models:
        return Text("\n").join([
            header,
            separator,
            Text("(No model data)", style=Style(color=THEME.muted)),
        ])

    lines = [header, separator]

    # Calculate totals
    total_tokens = sum(m.total_tokens for m in models)
    total_requests = sum(m.request_count for m in models)

    # Summary line
    summary = Text()
    summary.append(f"Total: ", style=Style(color=THEME.text))
    summary.append(format_tokens(total_tokens), style=Style(bold=True, color=THEME.green))
    summary.append(f" tokens across ", style=Style(color=THEME.text))
    summary.append(f"{total_requests}", style=Style(bold=True, color=THEME.green))
    summary.append(f" requests", style=Style(color=THEME.text))
    lines.append(summary)
    lines.append(Text())  # Blank line

    # Model list
    for model in models[:5]:  # Show top 5 models
        # Model name
        model_line = Text()
        model_line.append("◆ ", style=Style(color=THEME.red))
        model_line.append(
            format_model_name(model.provider, model.model),
            style=Style(color=THEME.text, bold=True)
        )
        lines.append(model_line)

        # Stats
        stats_line = Text()
        stats_line.append(f"    Tokens: ", style=Style(color=THEME.muted))
        stats_line.append(format_tokens(model.total_tokens), style=Style(color=THEME.green))
        stats_line.append(f"  Reqs: {model.request_count}", style=Style(color=THEME.muted))

        # Rate limit warning
        if model.last_rate_limit:
            stats_line.append("  ⚠ rate limited", style=Style(color=THEME.orange))

        lines.append(stats_line)

    if len(models) > 5:
        lines.append(
            Text(f"  ... and {len(models) - 5} more", style=Style(color=THEME.muted))
        )

    return Text("\n").join(lines)
