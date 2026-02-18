"""Interactive session tree widget using Textual's Tree.

Design principles:
- Extends Textual's Tree widget for native selection/expand/collapse
- Uses Session data type for type safety
- Custom rendering with GITS theme
- Cached label rendering for performance
"""

from __future__ import annotations

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


class SessionTreeWidget(Tree[Session]):
    """Interactive tree widget for session hierarchy.

    Features:
    - Native keyboard navigation (arrow keys, enter)
    - Expand/collapse with mouse or keyboard
    - Custom GITS-themed labels
    - Status indicators with color coding
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

        def __init__(self, node: TreeNode[Session]) -> None:
            super().__init__()
            self.node = node

    DEFAULT_CSS = f"""
    SessionTreeWidget {{
        background: {THEME.bg1};
        color: {THEME.text};
        border: solid {THEME.green};
        padding: 0 1;
    }}

    SessionTreeWidget:focus {{
        border: solid {THEME.red};
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
        GITS-themed labels with status indicators.

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

        # Truncate title if needed
        title = session.title
        if len(title) > 45:
            title = title[:42] + "..."

        # Build the label
        label = Text()

        # Status icon with color
        label.append(f"{status_icon} ", style=Style(color=status_color))

        # Node icon with type color
        label.append(f"{node_icon} ", style=Style(color=node_color))

        # Title
        label.append(title, style=Style(color=THEME.text))

        # Subagent badge
        if is_subagent:
            label.append(
                " [SUB]",
                style=Style(color=THEME.red, bold=True, italic=True)
            )

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

    def on_tree_selected(self, event: Tree.Selected) -> None:
        """Handle tree selection event.

        Posts a Selected message with the selected node.
        """
        # The event has a node attribute
        if event.node and event.node.data:
            self.post_message(self.Selected(event.node))
