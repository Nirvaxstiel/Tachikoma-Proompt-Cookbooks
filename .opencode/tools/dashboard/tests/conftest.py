"""Pytest configuration and fixtures for Tachikoma Dashboard tests."""

from __future__ import annotations

# Add parent directory to path for imports
import sys
from pathlib import Path
from typing import Generator
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def mock_db_path(tmp_path: Path) -> Path:
    """Create a temporary database path for testing."""
    db_file = tmp_path / "test_opencode.db"
    return db_file


@pytest.fixture
def sample_session_data() -> list[dict]:
    """Sample session data for testing."""
    import time

    now = int(time.time() * 1000)

    return [
        {
            "id": "session-1",
            "parent_id": None,
            "project_id": "project-1",
            "title": "Test Session 1",
            "directory": "/home/user/project1",
            "time_created": now - 3600000,  # 1 hour ago
            "time_updated": now - 1000,  # 1 second ago
        },
        {
            "id": "session-2",
            "parent_id": "session-1",
            "project_id": "project-1",
            "title": "Subagent Session",
            "directory": "/home/user/project1",
            "time_created": now - 1800000,  # 30 min ago
            "time_updated": now - 30000,  # 30 seconds ago
        },
        {
            "id": "session-3",
            "parent_id": None,
            "project_id": "project-2",
            "title": "Another Session",
            "directory": "/home/user/project2",
            "time_created": now - 7200000,  # 2 hours ago
            "time_updated": now - 600000,  # 10 min ago
        },
    ]


@pytest.fixture
def sample_todo_data() -> list[dict]:
    """Sample todo data for testing."""
    import time

    now = int(time.time() * 1000)

    return [
        {
            "session_id": "session-1",
            "content": "High priority task",
            "status": "pending",
            "priority": "high",
            "position": 0,
            "time_created": now,
        },
        {
            "session_id": "session-1",
            "content": "Medium priority task",
            "status": "in_progress",
            "priority": "medium",
            "position": 1,
            "time_created": now,
        },
        {
            "session_id": "session-1",
            "content": "Low priority task",
            "status": "completed",
            "priority": "low",
            "position": 2,
            "time_created": now,
        },
    ]


@pytest.fixture
def sample_skill_data() -> list[dict]:
    """Sample skill invocation data for testing."""
    import time

    now = int(time.time() * 1000)

    return [
        {
            "name": "code-review",
            "session_id": "session-1",
            "time_loaded": now - 300000,
            "invocation_count": 3,
            "last_used": now - 60000,
        },
        {
            "name": "research-agent",
            "session_id": "session-1",
            "time_loaded": now - 200000,
            "invocation_count": 1,
            "last_used": now - 200000,
        },
    ]


@pytest.fixture
def mock_db(
    sample_session_data: list[dict], sample_todo_data: list[dict]
) -> Generator[MagicMock, None, None]:
    """Mock database module for testing without real DB."""
    with (
        patch("tachikoma_dashboard.db._db_path") as mock_path,
        patch("tachikoma_dashboard.db._builder") as mock_builder,
    ):
        # Create mock query builder
        builder = MagicMock()
        mock_builder.return_value = builder

        # Mock select to return sample data
        def mock_select(table, **kwargs):
            if table.name == "session":
                return [type("Row", (), row) for row in sample_session_data]
            elif table.name == "todo":
                return [type("Row", (), row) for row in sample_todo_data]
            return []

        builder.select = mock_select
        builder.count = MagicMock(return_value=5)

        yield builder


@pytest.fixture
def clean_cache():
    """Clear LRU cache before each test."""
    from tachikoma_dashboard.models import _get_status_cached

    _get_status_cached.cache_clear()
    yield
    _get_status_cached.cache_clear()
