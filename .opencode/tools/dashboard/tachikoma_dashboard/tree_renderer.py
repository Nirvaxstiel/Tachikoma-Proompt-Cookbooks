"""Modern tree rendering for Tachikoma dashboard sessions.

Features:
- Strategy pattern for different node types
- Guard clauses for validation
- Iterative rendering (no stack overflow)
- Debug helpers for tracing
- Type hints for IDE support
"""

from dataclasses import dataclass
from typing import Generator, Optional
from enum import Enum

from .models import Session, SessionTree, SessionStatus


# GITS Theme colors
GITS_GREEN = "#00ff9f"
GITS_CYAN = "#26c6da"
GITS_TEXT = "#b3e5fc"
GITS_MUTED = "#4a5f6d"
GITS_ORANGE = "#ffa726"


def get_status_icon(status: SessionStatus) -> tuple[str, str]:
    """Get status icon and color."""
    icons = {
        SessionStatus.WORKING: ("●", GITS_GREEN),
        SessionStatus.ACTIVE: ("◐", GITS_ORANGE),
        SessionStatus.IDLE: ("○", GITS_MUTED),
    }
    return icons.get(status, ("?", GITS_MUTED))


class NodeType(Enum):
    """Type of tree node for rendering strategy."""
    ROOT = "root"
    SUBAGENT = "subagent"
    LEAF = "leaf"


@dataclass
class TreeRenderContext:
    """Context for tree rendering."""
    max_title_length: int = 40
    ellipsis: str = "..."
    indent_size: int = 2


@dataclass
class RenderedLine:
    """A single rendered line with metadata."""
    text: str
    prefix: str
    node_prefix: str
    title: str
    is_expanded: bool
    depth: int


def validate_tree_node(tree: SessionTree) -> None:
    """Guard clause: Validate tree node before rendering."""
    if not tree:
        raise ValueError("Tree node cannot be None")
    
    if not tree.session:
        raise ValueError("Tree session cannot be None")


def get_node_type(tree: SessionTree) -> NodeType:
    """Determine node type based on tree structure."""
    if not tree.children:
        return NodeType.LEAF
    if tree.is_subagent:
        return NodeType.SUBAGENT
    return NodeType.ROOT


def get_branch_chars(is_last: bool, node_type: NodeType) -> tuple[str, str]:
    """Get branch connector and node prefix based on position."""
    if is_last:
        connector = "└─ "
        node_prefix = "   " if node_type == NodeType.SUBAGENT else "├─ "
    else:
        connector = "├─ "
        node_prefix = "│  " if node_type == NodeType.SUBAGENT else "│  "
    
    return connector, node_prefix


def get_node_styling(node_type: NodeType) -> tuple[str, str]:
    """Get icon and color for node type."""
    if node_type == NodeType.ROOT:
        return "📂 ", GITS_GREEN  # Folder icon for regular session
    elif node_type == NodeType.SUBAGENT:
        return "📦 ", GITS_CYAN   # Package icon for subagent
    else:
        return "   ", GITS_TEXT     # No icon for leaf nodes


def truncate_title(title: str, max_length: int) -> str:
    """Truncate title with ellipsis if too long."""
    if len(title) <= max_length:
        return title
    return title[:max_length - len("...")] + "..."


def render_tree_node_line(
    session: Session,
    node_type: NodeType,
    prefix: str,
    is_last: bool,
    context: Optional[TreeRenderContext] = None,
) -> RenderedLine:
    """Render a single tree node line (non-recursive)."""
    # Guard: Validate inputs
    if not session:
        raise ValueError("Session cannot be None")
    
    ctx = context or TreeRenderContext()
    
    # Get styling based on node type
    node_icon, name_color = get_node_styling(node_type)
    connector, node_prefix = get_branch_chars(is_last, node_type)
    
    # Get status icon
    status_icon, status_color = get_status_icon(session.status)
    
    # Truncate title if needed
    title = truncate_title(session.title, ctx.max_title_length)
    
    # Build the line
    line_text = f"{prefix}{connector}{node_prefix}{status_icon} [{name_color}]{title}[/{name_color}]"
    
    return RenderedLine(
        text=line_text,
        prefix=prefix,
        node_prefix=node_prefix,
        title=title,
        is_expanded=False,  # Will be set by caller
        depth=prefix.count("│") + 1,  # Calculate depth from prefix
    )


def render_tree_iterative(
    trees: list[SessionTree],
    context: Optional[TreeRenderContext] = None,
    debug: bool = False,
) -> list[str]:
    """
    Render entire tree iteratively (non-recursive).
    
    Benefits over recursive:
    - No stack overflow on deep trees
    - Easier to debug (linear execution)
    - Can handle very large trees
    
    Args:
        trees: List of root SessionTree nodes
        context: Render context (max title length, etc.)
        debug: Print debug information
    
    Returns:
        List of rendered lines
    """
    if debug:
        print(f"[DEBUG] Rendering {len(trees)} root trees")
    
    ctx = context or TreeRenderContext()
    lines = []
    
    # Use explicit stack for iterative traversal
    # Each item: (tree, prefix, is_last, depth)
    stack = []
    
    # Initialize stack with root nodes
    for i, tree in enumerate(trees):
        is_last = (i == len(trees) - 1)
        stack.append((tree, "", is_last, 1))
        if debug:
            print(f"[DEBUG] Added root: {tree.session.title[:30]} (depth 1, last={is_last})")
    
    # Iterative rendering
    while stack:
        tree, prefix, is_last, depth = stack.pop(0)
        
        # Guard: Validate tree
        if not tree:
            continue
        
        # Get node type
        node_type = get_node_type(tree)
        
        # Render this node
        line = render_tree_node_line(
            session=tree.session,
            node_type=node_type,
            prefix=prefix,
            is_last=is_last,
            context=ctx,
        )
        lines.append(line.text)
        
        if debug:
            print(f"[DEBUG] Rendered: {tree.session.title[:30]} at depth {depth}")
        
        # Add children to stack if expanded
        if tree._is_expanded and tree.children:
            child_count = len(tree.children)
            new_depth = depth + 1
            
            for i, child in enumerate(tree.children):
                child_is_last = (i == child_count - 1)
                
                # Build new prefix
                if is_last:
                    new_prefix = prefix + "   "  # No vertical line after last child
                else:
                    new_prefix = prefix + "│  "  # Vertical line continues
                
                stack.append((child, new_prefix, child_is_last, new_depth))
                
                if debug:
                    print(f"[DEBUG]   Added child: {child.session.title[:30]} (depth {new_depth}, last={child_is_last})")
    
    if debug:
        print(f"[DEBUG] Total lines rendered: {len(lines)}")
    
    return lines


def get_tree_stats(trees: list[SessionTree]) -> dict[str, int]:
    """Get statistics about the tree structure for debugging."""
    if not trees:
        return {"total_nodes": 0, "max_depth": 0, "total_subagents": 0}
    
    total_nodes = len(trees)
    total_subagents = sum(1 for t in trees if t.is_subagent)
    
    # Calculate max depth
    max_depth = 0
    
    def calculate_depth(tree: SessionTree, current_depth: int) -> None:
        nonlocal max_depth
        max_depth = max(max_depth, current_depth)
        
        for child in tree.children:
            calculate_depth(child, current_depth + 1)
    
    for tree in trees:
        calculate_depth(tree, 1)
    
    return {
        "total_nodes": total_nodes,
        "max_depth": max_depth,
        "total_subagents": total_subagents,
        "total_roots": total_nodes - total_subagents,
    }


def debug_tree(trees: list[SessionTree]) -> None:
    """Print debug information about tree structure."""
    stats = get_tree_stats(trees)
    
    print("=" * 60)
    print("TREE STRUCTURE DEBUG")
    print("=" * 60)
    print(f"Total Nodes: {stats['total_nodes']}")
    print(f"Root Sessions: {stats['total_roots']}")
    print(f"Subagents: {stats['total_subagents']}")
    print(f"Max Depth: {stats['max_depth']}")
    print()
    
    for i, tree in enumerate(trees):
        is_subagent = tree.is_subagent
        child_count = len(tree.children)
        
        print(f"{i+1}. {tree.session.title[:40]}")
        print(f"   Type: {'SUBAGENT' if is_subagent else 'ROOT'}")
        print(f"   Status: {tree.status.value}")
        print(f"   Children: {child_count}")
        print(f"   Expanded: {tree._is_expanded}")
        print()
