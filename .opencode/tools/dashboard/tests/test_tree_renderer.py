#!/usr/bin/env python3
"""Unit tests for tree renderer.

Tests cover:
- Iterative tree rendering
- Node type classification
- Branch character generation
- Tree statistics
"""

from __future__ import annotations

import time

import pytest

from tachikoma_dashboard.models import Session, build_session_tree
from tachikoma_dashboard.tree_renderer import (
    NodeType,
    RenderedLine,
    get_branch_chars,
    get_node_styling,
    get_node_type,
    get_tree_stats,
    render_tree_iterative,
    render_tree_node_line,
    truncate_title,
)


class TestNodeTypeClassification:
    """Tests for node type determination."""

    @pytest.fixture
    def sessions(self) -> list[Session]:
        """Create test sessions."""
        now = int(time.time() * 1000)
        return [
            Session(
                id="root",
                parent_id=None,
                project_id="p1",
                title="Root",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
            Session(
                id="child",
                parent_id="root",
                project_id="p1",
                title="Child",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
        ]

    def test_node_type_leaf(self, sessions: list[Session]) -> None:
        """Test that node with no children is LEAF."""
        trees = build_session_tree(sessions)
        # Find the child (has no children)
        child = trees[0].find_by_id("child")
        assert child is not None
        assert get_node_type(child) == NodeType.LEAF

    def test_node_type_subagent(self, sessions: list[Session]) -> None:
        """Test that subagent with children is SUBAGENT."""
        now = int(time.time() * 1000)
        # Create a subagent with a child
        sessions_with_grandchild = sessions + [
            Session(
                id="grandchild",
                parent_id="child",
                project_id="p1",
                title="Grandchild",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
        ]
        trees = build_session_tree(sessions_with_grandchild)
        child = trees[0].find_by_id("child")
        assert child is not None
        # child is a subagent with children
        assert get_node_type(child) == NodeType.SUBAGENT

    def test_node_type_root(self, sessions: list[Session]) -> None:
        """Test that root with children is ROOT."""
        trees = build_session_tree(sessions)
        # The root has children but is not a subagent
        assert get_node_type(trees[0]) == NodeType.ROOT


class TestBranchChars:
    """Tests for branch character generation."""

    def test_branch_chars_last(self) -> None:
        """Test characters for last child."""
        connector, continuation = get_branch_chars(is_last=True)
        assert connector == "└─ "
        assert continuation == "   "

    def test_branch_chars_not_last(self) -> None:
        """Test characters for non-last child."""
        connector, continuation = get_branch_chars(is_last=False)
        assert connector == "├─ "
        assert continuation == "│  "


class TestNodeStyling:
    """Tests for node styling (icon and color)."""

    def test_root_styling(self) -> None:
        """Test ROOT node styling."""
        icon, color = get_node_styling(NodeType.ROOT)
        assert icon == "◈ "
        assert color == "#00ff9f"  # Green

    def test_subagent_styling(self) -> None:
        """Test SUBAGENT node styling (should use RED accent)."""
        icon, color = get_node_styling(NodeType.SUBAGENT)
        assert icon == "◇ "
        assert color == "#ff0066"  # RED accent!

    def test_leaf_styling(self) -> None:
        """Test LEAF node styling."""
        icon, color = get_node_styling(NodeType.LEAF)
        assert icon == "· "
        # Leaf uses text color


class TestTruncateTitle:
    """Tests for title truncation."""

    def test_short_title(self) -> None:
        """Test title under max length."""
        assert truncate_title("Short", 40) == "Short"

    def test_exact_length_title(self) -> None:
        """Test title exactly at max length."""
        title = "x" * 40
        assert truncate_title(title, 40) == title

    def test_long_title(self) -> None:
        """Test title over max length."""
        title = "x" * 50
        result = truncate_title(title, 40)
        assert len(result) == 40
        assert result.endswith("...")


class TestRenderTreeNodeLine:
    """Tests for single node line rendering."""

    @pytest.fixture
    def session(self) -> Session:
        """Create a test session."""
        now = int(time.time() * 1000)
        return Session(
            id="test",
            parent_id=None,
            project_id="p1",
            title="Test Session",
            directory="/test",
            time_created=now,
            time_updated=now,
        )

    def test_returns_rendered_line(self, session: Session) -> None:
        """Test that function returns RenderedLine dataclass."""
        result = render_tree_node_line(
            session=session,
            node_type=NodeType.ROOT,
            prefix="",
            is_last=True,
        )
        assert isinstance(result, RenderedLine)

    def test_rended_line_is_frozen(self) -> None:
        """Test that RenderedLine is immutable."""
        line = RenderedLine(text="test", depth=1, is_last=True)
        with pytest.raises(AttributeError):
            line.text = "changed"  # type: ignore

    def test_contains_title(self, session: Session) -> None:
        """Test that rendered line contains session title."""
        result = render_tree_node_line(
            session=session,
            node_type=NodeType.ROOT,
            prefix="",
            is_last=True,
        )
        assert "Test Session" in result.text

    def test_raises_on_none_session(self) -> None:
        """Test that None session raises ValueError."""
        with pytest.raises(ValueError, match="Session cannot be None"):
            render_tree_node_line(
                session=None,  # type: ignore
                node_type=NodeType.ROOT,
                prefix="",
                is_last=True,
            )


class TestRenderTreeIterative:
    """Tests for iterative tree rendering."""

    @pytest.fixture
    def sessions(self) -> list[Session]:
        """Create test sessions."""
        now = int(time.time() * 1000)
        return [
            Session(
                id="root",
                parent_id=None,
                project_id="p1",
                title="Root Session",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
            Session(
                id="child1",
                parent_id="root",
                project_id="p1",
                title="Child One",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
            Session(
                id="child2",
                parent_id="root",
                project_id="p1",
                title="Child Two",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
        ]

    def test_empty_trees(self) -> None:
        """Test rendering empty tree list."""
        result = render_tree_iterative([])
        assert len(result) == 1
        assert "No sessions" in result[0]

    def test_returns_list_of_strings(self, sessions: list[Session]) -> None:
        """Test that result is a list of strings."""
        trees = build_session_tree(sessions)
        result = render_tree_iterative(trees)
        assert isinstance(result, list)
        assert all(isinstance(line, str) for line in result)

    def test_renders_all_nodes(self, sessions: list[Session]) -> None:
        """Test that all nodes are rendered."""
        trees = build_session_tree(sessions)
        result = render_tree_iterative(trees)
        # 1 root + 2 children = 3 lines
        assert len(result) == 3

    def test_debug_mode(self, sessions: list[Session], capsys) -> None:
        """Test debug mode prints debug info."""
        trees = build_session_tree(sessions)
        render_tree_iterative(trees, debug=True)
        captured = capsys.readouterr()
        assert "[DEBUG]" in captured.out


class TestGetTreeStats:
    """Tests for tree statistics."""

    @pytest.fixture
    def sessions(self) -> list[Session]:
        """Create test sessions."""
        now = int(time.time() * 1000)
        return [
            Session(
                id="root1",
                parent_id=None,
                project_id="p1",
                title="Root 1",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
            Session(
                id="root2",
                parent_id=None,
                project_id="p1",
                title="Root 2",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
            Session(
                id="child",
                parent_id="root1",
                project_id="p1",
                title="Child",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
        ]

    def test_empty_stats(self) -> None:
        """Test stats for empty tree."""
        stats = get_tree_stats([])
        assert stats["total_nodes"] == 0
        assert stats["max_depth"] == 0
        assert stats["total_subagents"] == 0

    def test_counts_nodes(self, sessions: list[Session]) -> None:
        """Test that stats counts all nodes."""
        trees = build_session_tree(sessions)
        stats = get_tree_stats(trees)
        assert stats["total_nodes"] == 3

    def test_counts_subagents(self, sessions: list[Session]) -> None:
        """Test that stats counts subagents."""
        trees = build_session_tree(sessions)
        stats = get_tree_stats(trees)
        assert stats["total_subagents"] == 1

    def test_calculates_max_depth(self, sessions: list[Session]) -> None:
        """Test that stats calculates max depth."""
        trees = build_session_tree(sessions)
        stats = get_tree_stats(trees)
        assert stats["max_depth"] == 2


class TestIterativeVsRecursive:
    """Tests ensuring iterative approach works correctly."""

    def test_deep_tree_no_overflow(self) -> None:
        """Test that deep trees don't cause stack overflow."""
        now = int(time.time() * 1000)

        # Create a very deep tree (500 levels)
        sessions = [
            Session(
                id=f"node-{i}",
                parent_id=f"node-{i - 1}" if i > 0 else None,
                project_id="p1",
                title=f"Node {i}",
                directory="/test",
                time_created=now,
                time_updated=now,
            )
            for i in range(500)
        ]

        trees = build_session_tree(sessions)

        # This should not raise RecursionError
        result = render_tree_iterative(trees)
        assert len(result) == 500
