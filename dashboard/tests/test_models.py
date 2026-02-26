#!/usr/bin/env python3
"""Unit tests for dashboard models.

Tests cover:
- Immutable dataclasses
- Pure utility functions
- Tree building algorithm
- Status caching
"""

from __future__ import annotations

import time

import pytest

from tachikoma_dashboard.models import (
    Session,
    SessionStats,
    SessionStatus,
    Skill,
    Todo,
    _get_status_cached,
    _ms_to_seconds,
    build_session_tree,
)


class TestUtilityFunctions:
    """Tests for pure utility functions."""

    def test_ms_to_seconds_zero(self) -> None:
        """Test zero milliseconds."""
        assert _ms_to_seconds(0) == 0

    def test_ms_to_seconds_exact(self) -> None:
        """Test exact second conversion."""
        assert _ms_to_seconds(1000) == 1
        assert _ms_to_seconds(60000) == 60
        assert _ms_to_seconds(3600000) == 3600

    def test_ms_to_seconds_truncation(self) -> None:
        """Test truncation (integer division)."""
        assert _ms_to_seconds(1500) == 1  # Truncates
        assert _ms_to_seconds(999) == 0


class TestStatusCaching:
    """Tests for LRU-cached status function."""

    def test_status_working(self, clean_cache) -> None:
        """Test WORKING status (< 30s)."""
        now = int(time.time())
        status = _get_status_cached(now - 10, now)
        assert status == SessionStatus.WORKING

    def test_status_active(self, clean_cache) -> None:
        """Test ACTIVE status (< 5min)."""
        now = int(time.time())
        status = _get_status_cached(now - 100, now)
        assert status == SessionStatus.ACTIVE

    def test_status_idle(self, clean_cache) -> None:
        """Test IDLE status (> 5min)."""
        now = int(time.time())
        status = _get_status_cached(now - 400, now)
        assert status == SessionStatus.IDLE

    def test_status_caching(self, clean_cache) -> None:
        """Test that results are cached."""
        now = int(time.time())

        # First call
        result1 = _get_status_cached(now - 10, now)

        # Second call with same args should return cached value
        result2 = _get_status_cached(now - 10, now)

        assert result1 is result2


class TestSession:
    """Tests for immutable Session dataclass."""

    @pytest.fixture
    def session(self) -> Session:
        """Create a test session."""
        now = int(time.time() * 1000)
        return Session(
            id="test-id",
            parent_id=None,
            project_id="test-project",
            title="Test Session",
            directory="/test/dir",
            time_created=now - 3600000,
            time_updated=now - 1000,
        )

    def test_session_is_frozen(self, session: Session) -> None:
        """Test that Session is immutable (frozen=True)."""
        with pytest.raises(AttributeError):
            session.title = "New Title"  # type: ignore

    def test_session_is_subagent_false(self, session: Session) -> None:
        """Test is_subagent property returns False for root session."""
        assert session.is_subagent is False

    def test_session_is_subagent_true(self) -> None:
        """Test is_subagent property returns True for subagent."""
        now = int(time.time() * 1000)
        subagent = Session(
            id="sub-id",
            parent_id="parent-id",
            project_id="test-project",
            title="Subagent",
            directory="/test/dir",
            time_created=now,
            time_updated=now,
        )
        assert subagent.is_subagent is True

    def test_session_duration(self, session: Session) -> None:
        """Test duration calculation."""
        # Should be approximately 1 hour (3600 seconds)
        assert 3599 <= session.duration <= 3601

    def test_session_status(self, session: Session, clean_cache) -> None:
        """Test status property delegates to cached function."""
        # Updated 1 second ago, should be WORKING
        assert session.status == SessionStatus.WORKING


class TestTodo:
    """Tests for immutable Todo dataclass."""

    def test_todo_is_frozen(self) -> None:
        """Test that Todo is immutable."""
        todo = Todo(
            session_id="test",
            content="Test todo",
            status="pending",
            priority="high",
            position=0,
            time_created=0,
        )
        with pytest.raises(AttributeError):
            todo.content = "Changed"  # type: ignore


class TestSessionStats:
    """Tests for immutable SessionStats dataclass."""

    def test_stats_is_frozen(self) -> None:
        """Test that SessionStats is immutable."""
        stats = SessionStats(
            message_count=10,
            tool_call_count=5,
            last_user_message="Hello",
        )
        with pytest.raises(AttributeError):
            stats.message_count = 20  # type: ignore


class TestSkill:
    """Tests for immutable Skill dataclass."""

    def test_skill_defaults(self) -> None:
        """Test Skill default values."""
        skill = Skill(
            name="test-skill",
            session_id="test",
            time_loaded=1000,
        )
        assert skill.invocation_count == 1
        assert skill.last_used is None


class TestSessionTree:
    """Tests for SessionTree class."""

    @pytest.fixture
    def sessions(self) -> list[Session]:
        """Create test sessions with parent-child relationship."""
        now = int(time.time() * 1000)
        return [
            Session(
                id="root-1",
                parent_id=None,
                project_id="p1",
                title="Root 1",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
            Session(
                id="child-1",
                parent_id="root-1",
                project_id="p1",
                title="Child 1",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
            Session(
                id="child-2",
                parent_id="root-1",
                project_id="p1",
                title="Child 2",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
            Session(
                id="root-2",
                parent_id=None,
                project_id="p2",
                title="Root 2",
                directory="/test",
                time_created=now,
                time_updated=now,
            ),
        ]

    def test_build_session_tree_empty(self) -> None:
        """Test tree building with empty list."""
        trees = build_session_tree([])
        assert trees == []

    def test_build_session_tree_single_root(self, sessions: list[Session]) -> None:
        """Test tree building with single root (no children)."""
        trees = build_session_tree([sessions[3]])  # root-2
        assert len(trees) == 1
        assert trees[0].session.id == "root-2"
        assert len(trees[0].children) == 0

    def test_build_session_tree_with_children(self, sessions: list[Session]) -> None:
        """Test tree building with parent-child relationships."""
        trees = build_session_tree(sessions)

        # Should have 2 roots
        assert len(trees) == 2

        # Find root-1
        root_1 = next((t for t in trees if t.session.id == "root-1"), None)
        assert root_1 is not None
        assert len(root_1.children) == 2

    def test_tree_find_by_id(self, sessions: list[Session]) -> None:
        """Test finding a node by session ID."""
        trees = build_session_tree(sessions)

        # Find child node
        found = trees[0].find_by_id("child-1")
        assert found is not None
        assert found.session.id == "child-1"

    def test_tree_find_by_id_not_found(self, sessions: list[Session]) -> None:
        """Test finding non-existent ID returns None."""
        trees = build_session_tree(sessions)
        found = trees[0].find_by_id("nonexistent")
        assert found is None


class TestBuildSessionTreePerformance:
    """Performance tests for tree building."""

    def test_large_tree_performance(self) -> None:
        """Test O(n) performance with large tree."""
        now = int(time.time() * 1000)

        # Create 1000 sessions
        sessions = [
            Session(
                id=f"session-{i}",
                parent_id=f"session-{i - 1}" if i > 0 else None,
                project_id="test",
                title=f"Session {i}",
                directory="/test",
                time_created=now,
                time_updated=now,
            )
            for i in range(1000)
        ]

        import time as time_module

        start = time_module.time()
        trees = build_session_tree(sessions)
        elapsed = time_module.time() - start

        # Should complete in under 100ms
        assert elapsed < 0.1
        assert len(trees) == 1  # One chain
