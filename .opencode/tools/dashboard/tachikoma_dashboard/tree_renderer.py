"""Modern tree rendering for Tachikoma dashboard sessions.

Design principles:
- Strategy pattern for different node types
- Guard clauses for validation
- Iterative rendering (no stack overflow)
- Pure functions for rendering
- Centralized GITS theme with RED accents
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from .models import Session, SessionStatus, SessionTree
from .theme import STATUS_COLORS, THEME


class NodeType(Enum):
    """Type of tree node for rendering strategy."""
    
    ROOT = "root"      # Top-level session
    SUBAGENT = "subagent"  # Child session (subagent)
    LEAF = "leaf"      # No children


@dataclass(frozen=True)
class TreeRenderContext:
    """Immutable context for tree rendering."""
    
    max_title_length: int = 40
    indent_size: int = 2


@dataclass(frozen=True)
class RenderedLine:
    """Immutable rendered line with metadata."""
    
    text: str
    depth: int
    is_last: bool


# Pure utility functions


def get_status_icon(status: SessionStatus) -> tuple[str, str]:
    """Get status icon and color (pure function)."""
    return STATUS_COLORS.get(status.value, ("?", THEME.muted))


def get_node_type(tree: SessionTree) -> NodeType:
    """Determine node type based on tree structure (pure function)."""
    if not tree.children:
        return NodeType.LEAF
    if tree.is_subagent:
        return NodeType.SUBAGENT
    return NodeType.ROOT


def truncate_title(title: str, max_length: int) -> str:
    """Truncate title with ellipsis (pure function)."""
    if len(title) <= max_length:
        return title
    return title[: max_length - 3] + "..."


def get_branch_chars(is_last: bool) -> tuple[str, str]:
    """Get branch connector and continuation prefix (pure function)."""
    if is_last:
        return "└─ ", "   "
    return "├─ ", "│  "


def get_node_styling(node_type: NodeType) -> tuple[str, str]:
    """Get icon and color for node type (pure function).
    
    Uses RED accent for subagents to make them pop.
    """
    if node_type == NodeType.ROOT:
        return "◈ ", THEME.green
    elif node_type == NodeType.SUBAGENT:
        return "◇ ", THEME.red  # RED for subagents!
    else:
        return "· ", THEME.text


# Rendering functions (pure)


def render_tree_node_line(
    session: Session,
    node_type: NodeType,
    prefix: str,
    is_last: bool,
    context: Optional[TreeRenderContext] = None,
) -> RenderedLine:
    """Render a single tree node line (pure function).
    
    Args:
        session: Session to render
        node_type: Type of node (ROOT/SUBAGENT/LEAF)
        prefix: Current indentation prefix
        is_last: Whether this is the last child
        context: Render context settings
        
    Returns:
        Immutable RenderedLine with text and metadata
    """
    if session is None:
        raise ValueError("Session cannot be None")
    
    ctx = context or TreeRenderContext()
    
    # Get styling
    node_icon, name_color = get_node_styling(node_type)
    connector, _ = get_branch_chars(is_last)
    status_icon, status_color = get_status_icon(session.status)
    
    # Truncate title
    title = truncate_title(session.title, ctx.max_title_length)
    
    # Build line with Rich markup
    line_text = (
        f"{prefix}{connector}"
        f"{status_icon} "
        f"[{name_color}]{node_icon}{title}[/{name_color}]"
    )
    
    return RenderedLine(
        text=line_text,
        depth=prefix.count("│") + prefix.count("   ") + 1,
        is_last=is_last,
    )


def render_tree_iterative(
    trees: list[SessionTree],
    context: Optional[TreeRenderContext] = None,
    debug: bool = False,
) -> list[str]:
    """Render entire tree iteratively (non-recursive).
    
    Benefits over recursive:
    - No stack overflow on deep trees
    - Easier to debug (linear execution)
    - Can handle very large trees
    
    Args:
        trees: List of root SessionTree nodes
        context: Render context (max title length, etc.)
        debug: Print debug information
        
    Returns:
        List of rendered lines (strings with Rich markup)
    """
    if not trees:
        return ["[dim]No sessions found[/dim]"]
    
    ctx = context or TreeRenderContext()
    lines: list[str] = []
    
    # Stack items: (tree, prefix, is_last, depth)
    stack: list[tuple[SessionTree, str, bool, int]] = []
    
    # Initialize stack with root nodes (reverse order for correct processing)
    for i, tree in enumerate(reversed(trees)):
        is_last = i == 0
        stack.append((tree, "", is_last, 1))
    
    if debug:
        print(f"[DEBUG] Rendering {len(trees)} root trees")
    
    # Iterative rendering
    while stack:
        tree, prefix, is_last, depth = stack.pop()
        
        if tree is None:
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
        
        # Add children to stack if expanded (reverse order)
        if tree._is_expanded and tree.children:
            _, continuation = get_branch_chars(is_last)
            new_prefix = prefix + continuation
            
            for i, child in enumerate(reversed(tree.children)):
                child_is_last = i == 0
                stack.append((child, new_prefix, child_is_last, depth + 1))
    
    if debug:
        print(f"[DEBUG] Total lines rendered: {len(lines)}")
    
    return lines


def get_tree_stats(trees: list[SessionTree]) -> dict[str, int]:
    """Get statistics about the tree structure (pure function).
    
    Uses iterative traversal to avoid stack overflow.
    """
    if not trees:
        return {"total_nodes": 0, "max_depth": 0, "total_subagents": 0}
    
    total_roots = len(trees)
    total_subagents = 0
    max_depth = 0
    total_nodes = 0
    
    # Stack: (tree, depth)
    stack: list[tuple[SessionTree, int]] = [(t, 1) for t in trees]
    
    while stack:
        tree, depth = stack.pop()
        
        total_nodes += 1
        max_depth = max(max_depth, depth)
        
        if tree.is_subagent:
            total_subagents += 1
        
        for child in tree.children:
            stack.append((child, depth + 1))
    
    return {
        "total_nodes": total_nodes,
        "max_depth": max_depth,
        "total_subagents": total_subagents,
        "total_roots": total_roots,
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
        
        print(f"{i + 1}. {tree.session.title[:40]}")
        print(f"   Type: {'SUBAGENT' if is_subagent else 'ROOT'}")
        print(f"   Status: {tree.status.value}")
        print(f"   Children: {child_count}")
        print(f"   Expanded: {tree._is_expanded}")
        print()
