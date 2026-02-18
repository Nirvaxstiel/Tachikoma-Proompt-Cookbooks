"""Unit tests for dashboard widgets.

Tests cover:
- Pure rendering functions
- Theme integration
- Text formatting utilities
"""

from __future__ import annotations

import pytest
from rich.text import Text

from tachikoma_dashboard.models import Session, SessionStatus, Todo
from tachikoma_dashboard.theme import THEME
from tachikoma_dashboard.widgets import (
    format_duration,
    get_status_icon,
    render_aggregation,
    render_details,
    render_skills,
    render_todos,
    truncate_message,
)


class TestUtilityFunctions:
    """Tests for pure utility functions."""

    def test_truncate_message_none(self) -> None:
        """Test truncating None message."""
        assert truncate_message(None) == "--"

    def test_truncate_message_short(self) -> None:
        """Test truncating short message (no truncation)."""
        assert truncate_message("Short") == "Short"

    def test_truncate_message_exact_length(self) -> None:
        """Test message exactly at max length."""
        msg = "x" * 40
        assert truncate_message(msg) == msg

    def test_truncate_message_long(self) -> None:
        """Test truncating long message."""
        msg = "x" * 50
        result = truncate_message(msg, max_length=40)
        assert len(result) == 40
        assert result.endswith("...")

    def test_format_duration_seconds(self) -> None:
        """Test formatting seconds."""
        assert format_duration(0) == "0s"
        assert format_duration(30) == "30s"
        assert format_duration(59) == "59s"

    def test_format_duration_minutes(self) -> None:
        """Test formatting minutes."""
        assert format_duration(60) == "1m00s"
        assert format_duration(90) == "1m30s"
        assert format_duration(3599) == "59m59s"

    def test_format_duration_hours(self) -> None:
        """Test formatting hours."""
        assert format_duration(3600) == "1h00m"
        assert format_duration(3661) == "1h01m"
        assert format_duration(7325) == "2h02m"

    def test_format_duration_negative(self) -> None:
        """Test formatting negative duration."""
        assert format_duration(-1) == "0s"


class TestStatusIcon:
    """Tests for status icon function."""

    def test_working_icon(self) -> None:
        """Test WORKING status icon."""
        icon, color = get_status_icon(SessionStatus.WORKING)
        assert icon == "●"
        assert color == THEME.green

    def test_active_icon(self) -> None:
        """Test ACTIVE status icon."""
        icon, color = get_status_icon(SessionStatus.ACTIVE)
        assert icon == "◐"
        assert color == THEME.orange

    def test_idle_icon(self) -> None:
        """Test IDLE status icon."""
        icon, color = get_status_icon(SessionStatus.IDLE)
        assert icon == "○"
        assert color == THEME.muted


class TestRenderDetails:
    """Tests for render_details function."""

    @pytest.fixture
    def session(self) -> Session:
        """Create a test session."""
        import time

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

    def test_render_details_none_session(self) -> None:
        """Test rendering with no session."""
        result = render_details(None)
        assert isinstance(result, Text)
        assert "No session selected" in str(result)

    def test_render_details_returns_text(self, session: Session) -> None:
        """Test that render_details returns Text object."""
        result = render_details(session)
        assert isinstance(result, Text)

    def test_render_details_contains_title(self, session: Session) -> None:
        """Test that rendered text contains session title."""
        result = render_details(session)
        text_str = str(result)
        assert "Test Session" in text_str

    def test_render_details_subagent_badge(self) -> None:
        """Test that subagent session shows SUBAGENT badge."""
        import time

        now = int(time.time() * 1000)
        subagent = Session(
            id="sub-id",
            parent_id="parent-id",
            project_id="test",
            title="Subagent Session",
            directory="/test",
            time_created=now,
            time_updated=now,
        )
        result = render_details(subagent)
        text_str = str(result)
        assert "SUBAGENT" in text_str


class TestRenderSkills:
    """Tests for render_skills function."""

    def test_render_skills_none(self) -> None:
        """Test rendering with no skills."""
        result = render_skills(None)
        assert isinstance(result, Text)
        assert "No skills loaded" in str(result)

    def test_render_skills_empty_list(self) -> None:
        """Test rendering with empty list."""
        result = render_skills([])
        assert isinstance(result, Text)
        assert "No skills loaded" in str(result)


class TestRenderTodos:
    """Tests for render_todos function."""

    @pytest.fixture
    def todos(self) -> list[Todo]:
        """Create test todos."""
        import time

        now = int(time.time() * 1000)
        return [
            Todo(
                session_id="test",
                content="High priority task",
                status="pending",
                priority="high",
                position=0,
                time_created=now,
            ),
            Todo(
                session_id="test",
                content="Medium priority task",
                status="in_progress",
                priority="medium",
                position=1,
                time_created=now,
            ),
        ]

    def test_render_todos_empty(self) -> None:
        """Test rendering empty todo list."""
        result = render_todos([])
        assert isinstance(result, Text)
        assert "No pending tasks" in str(result)

    def test_render_todos_with_items(self, todos: list[Todo]) -> None:
        """Test rendering todo list with items."""
        result = render_todos(todos)
        assert isinstance(result, Text)
        text_str = str(result)
        assert "High priority task" in text_str

    def test_render_todos_truncation(self) -> None:
        """Test that long todo content is truncated."""
        import time

        now = int(time.time() * 1000)
        long_todo = Todo(
            session_id="test",
            content="x" * 50,  # 50 chars
            status="pending",
            priority="high",
            position=0,
            time_created=now,
        )
        result = render_todos([long_todo])
        text_str = str(result)
        assert "..." in text_str


class TestRenderAggregation:
    """Tests for render_aggregation function."""

    @pytest.fixture
    def sessions(self) -> list[Session]:
        """Create test sessions."""
        import time

        now = int(time.time() * 1000)
        return [
            Session(
                id="s1",
                parent_id=None,
                project_id="p1",
                title="Session 1",
                directory="/test",
                time_created=now,
                time_updated=now - 1000,  # WORKING
            ),
            Session(
                id="s2",
                parent_id="s1",  # Subagent
                project_id="p1",
                title="Session 2",
                directory="/test",
                time_created=now,
                time_updated=now - 60000,  # ACTIVE
            ),
        ]

    def test_render_aggregation_empty(self) -> None:
        """Test rendering empty session list."""
        result = render_aggregation([])
        assert isinstance(result, Text)
        assert "No sessions" in str(result)

    def test_render_aggregation_with_sessions(self, sessions: list[Session]) -> None:
        """Test rendering with sessions."""
        result = render_aggregation(sessions)
        assert isinstance(result, Text)
        text_str = str(result)
        assert "Sessions:" in text_str


class TestThemeIntegration:
    """Tests for theme color integration."""

    def test_theme_colors_exist(self) -> None:
        """Test that all required theme colors are defined."""
        assert THEME.bg0 is not None
        assert THEME.green is not None
        assert THEME.cyan is not None
        assert THEME.red is not None  # For accent/pop
        assert THEME.orange is not None
        assert THEME.muted is not None
        assert THEME.text is not None

    def test_theme_red_accent(self) -> None:
        """Test that RED accent color is properly set."""
        # Red should be #ff0066 (GITS red)
        assert THEME.red == "#ff0066"

    def test_theme_green_primary(self) -> None:
        """Test that GREEN is the primary color."""
        assert THEME.green == "#00ff9f"
