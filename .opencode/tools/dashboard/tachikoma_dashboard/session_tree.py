"""Interactive session tree widget using Textual's Tree.

Design principles:
- Extends Textual's Tree widget for native selection/expand/collapse
- Uses Session data type for type safety
- Custom rendering with GITS theme
- Cached label rendering for performance
"""

from __future__ import annotations

import time
from typing import TYPE_CHECKING, Generic, TypeVar

from rich.style import Style
from rich.text import Text
from textual.message import Message
from textual.widgets import Tree

from .models import Session, SessionStatus, SessionTree
from .theme import STATUS_COLORS, THEME

if TYPE_CHECKING:
    from textual.widgets._tree import TreeNode

# Type variable for the Tree widget
TreeDataType = TypeVar("TreeDataType")


def _format_duration(seconds: int) -> str:
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


def _truncate_path(path: str, max_len: int = 20) -> str:
    """Truncate a path for display, keeping the end."""
    if len(path) <= max_len:
        return path
    # Keep the last part
    parts = path.replace("\\", "/").split("/")
    if len(parts) > 1:
        return ".../" + parts[-1]
    return "..." + path[-(max_len - 3):]


class SessionTreeWidget(Tree[Session]):
    """Interactive tree widget for session hierarchy.

    Features:
    - Native keyboard navigation (arrow keys, enter)
    - Expand/collapse with mouse or keyboard
    - Custom GITS-themed labels
    - Status indicators with color coding
    - Shows CWD, runtime, and agent type
    """

    # Icons for tree nodes
    ICON_ROOT = "◈"
    ICON_SUBAGENT = "◇"
    ICON_LEAF = "·"

    # Status icons (matching theme)
    STATUS_ICONS = {
        SessionStatus.WORKING: "●",
        SessionStatus.ACTIVE: "◐",
        SessionStatus.IDLE: "○",
    }

    class Selected(Message):
        """Posted when a session is selected."""

        def __init__(self, session: Session) -> None:
            super().__init__()
            self.session = session

    DEFAULT_CSS = f"""
    SessionTreeWidget {{
        background: {THEME.bg1};
        color: {THEME.text};
        padding: 0 1;
        height: 1fr;
    }}

    SessionTreeWidget > .tree--guides {{
        color: {THEME.muted};
    }}

    SessionTreeWidget > .tree--guides-selected {{
        color: {THEME.red};
    }}

    SessionTreeWidget > .tree--guides-hover {{
        color: {THEME.cyan};
    }}

    SessionTreeWidget:focus .tree--cursor {{
        background: {THEME.bg3};
    }}

    SessionTreeWidget .tree--highlight-line {{
        background: {THEME.bg2};
    }}
    """

    def __init__(
        self,
        label: str = "Sessions",
        *,
        id: str | None = None,
        classes: str | None = None,
    ) -> None:
        """Initialize the session tree widget.

        Args:
            label: Root node label
            id: Widget ID
            classes: CSS classes
        """
        super().__init__(label, id=id, classes=classes)
        self.show_root = False  # Don't show the root node
        self.guide_depth = 3  # Indentation depth
        self._session_map: dict[str, TreeNode[Session]] = {}

    def render_label(
        self, node: TreeNode[Session], base_style: Style, style: Style
    ) -> Text:
        """Render a custom label for each session node.

        This overrides the default Tree.render_label to provide
        GITS-themed labels with status indicators and extra info.

        Args:
            node: The tree node to render
            base_style: Base style from the tree
            style: Additional style for the node

        Returns:
            Rich Text object with the rendered label
        """
        session = node.data
        if session is None:
            # Root node or placeholder
            return super().render_label(node, base_style, style)

        # Determine node type
        is_subagent = session.is_subagent
        has_children = len(node.children) > 0

        # Get status icon and color
        status = session.status
        status_icon = self.STATUS_ICONS.get(status, "○")
        status_color = STATUS_COLORS.get(status.value, (THEME.muted,))[0]

        # Get node icon based on type
        if is_subagent:
            node_icon = self.ICON_SUBAGENT
            node_color = THEME.red  # RED accent for subagents
        elif has_children:
            node_icon = self.ICON_ROOT
            node_color = THEME.green
        else:
            node_icon = self.ICON_LEAF
            node_color = THEME.text

        # Truncate title for display and extract agent name if available
        title = session.title
        agent_name = ""

        # Try to extract agent name from common patterns
        # Pattern: "AgentName: task..." or "AgentName - task..."
        # Only extract if colon or dash appears early in title and first part is short
        if ":" in title:
            parts = title.split(":", 1)
            first_part = parts[0].strip()
            # Only treat as agent name if first part is reasonably short (likely an agent name)
            if len(first_part) < 20:
                agent_name = first_part
                title = parts[1].strip()
        elif " - " in title:
            parts = title.split(" - ", 1)
            first_part = parts[0].strip()
            # Only treat as agent name if first part is reasonably short (likely an agent name)
            if len(first_part) < 20:
                agent_name = first_part
                title = parts[1].strip()

        # Truncate title for display
        if len(title) > 25:
            title = title[:22] + "..."

        # Truncate agent name for badge
        if len(agent_name) > 8:
            agent_name = agent_name[:5] + "..."

        # Truncate CWD
        cwd = _truncate_path(session.directory, 18)

        # Build of the label
        label = Text()

        # Status icon with color
        label.append(f"{status_icon} ", style=Style(color=status_color))

        # Node icon with type color
        label.append(f"{node_icon} ", style=Style(color=node_color))

        # Title
        label.append(title, style=Style(color=THEME.text, bold=True))

        # CWD (cyan, dimmed)
        label.append(f" ~{cwd}", style=Style(color=THEME.cyan, dim=True))

        # [sub] or [main] badge with optional agent name
        if is_subagent:
            badge = f" [sub] {agent_name}" if agent_name else " [sub]"
            label.append(badge, style=Style(color=THEME.red, bold=True))
        else:
            badge = f" [main] {agent_name}" if agent_name else " [main]"
            label.append(badge, style=Style(color=THEME.green, bold=True))

        # Apply the provided style
        label.stylize(style)

        return label

    def update_sessions(self, session_trees: list[SessionTree]) -> None:
        """Update the tree with new session data.

        This is a pure rebuild - clears and rebuilds the tree.
        Uses a two-pass algorithm for O(n) complexity.

        Args:
            session_trees: List of root SessionTree nodes
        """
        # Clear existing nodes
        self.clear()
        self._session_map.clear()

        if not session_trees:
            self.root.add("No sessions found", data=None)
            return

        # Build tree recursively
        def add_tree_node(
            parent: TreeNode[Session], tree: SessionTree
        ) -> None:
            """Recursively add session tree nodes."""
            # Add this session
            node = parent.add(tree.session.title, data=tree.session)
            self._session_map[tree.session.id] = node

            # Add children
            for child in tree.children:
                add_tree_node(node, child)

        # Add all root sessions
        for tree in session_trees:
            add_tree_node(self.root, tree)

        # Expand all nodes by default
        self.root.expand_all()

    def get_selected_session(self) -> Session | None:
        """Get the currently selected session.

        Returns:
            The selected Session or None if nothing selected
        """
        node = self.cursor_node
        if node and node.data:
            return node.data
        return None

    def select_session(self, session_id: str) -> bool:
        """Select a session by ID.

        Args:
            session_id: The session ID to select

        Returns:
            True if session was found and selected, False otherwise
        """
        node = self._session_map.get(session_id)
        if node:
            self.select_node(node)
            return True
        return False

    def on_tree_node_selected(self, event: Tree.NodeSelected) -> None:
        """Handle tree node selection event.

        Posts a Selected message with the selected session.
        """
        node = event.node
        if node and node.data:
            self.post_message(self.Selected(node.data))

    def on_tree_node_highlighted(self, event: Tree.NodeHighlighted) -> None:
        """Handle tree node highlight event (cursor movement).

        Posts a Selected message when cursor moves to a new node.
        """
        node = event.node
        if node and node.data:
            self.post_message(self.Selected(node.data))
