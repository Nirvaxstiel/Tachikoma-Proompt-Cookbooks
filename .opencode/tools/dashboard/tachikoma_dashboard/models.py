"""Data models for the Tachikoma dashboard.

Design principles:
- Immutable dataclasses (frozen=True) for FP patterns
- Pure functions for transformations
- Type-safe with full mypy compliance
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from enum import Enum
from functools import lru_cache
from typing import Optional


class SessionStatus(Enum):
    """Session activity status based on time since last update."""

    WORKING = "working"  # Active < 30s
    ACTIVE = "active"  # Active < 5min
    IDLE = "idle"  # No recent activity


# Pure utility functions


def _ms_to_seconds(ms: int) -> int:
    """Convert milliseconds to seconds (pure function)."""
    return ms // 1000


@lru_cache(maxsize=128)
def _get_status_cached(updated_seconds: int, now: int) -> SessionStatus:
    """Determine session status (cached for performance).

    This is a pure function that can be cached.
    """
    elapsed = now - updated_seconds
    if elapsed < 30:
        return SessionStatus.WORKING
    if elapsed < 300:
        return SessionStatus.ACTIVE
    return SessionStatus.IDLE


# Immutable data models


@dataclass(frozen=True)
class Session:
    """Immutable representation of an OpenCode session."""

    id: str
    parent_id: Optional[str]
    project_id: str
    title: str
    directory: str
    time_created: int
    time_updated: int

    @property
    def created_seconds(self) -> int:
        """Get creation time in seconds."""
        return _ms_to_seconds(self.time_created)

    @property
    def updated_seconds(self) -> int:
        """Get last update time in seconds."""
        return _ms_to_seconds(self.time_updated)

    @property
    def duration(self) -> int:
        """Get session duration in seconds."""
        return int(time.time()) - self.created_seconds

    @property
    def status(self) -> SessionStatus:
        """Determine session status based on activity."""
        return _get_status_cached(self.updated_seconds, int(time.time()))

    @property
    def is_subagent(self) -> bool:
        """Check if this is a subagent session."""
        return self.parent_id is not None


@dataclass(frozen=True)
class Todo:
    """Immutable todo item."""

    session_id: str
    content: str
    status: str
    priority: str
    position: int
    time_created: int


@dataclass(frozen=True)
class SessionStats:
    """Immutable session statistics."""

    message_count: int
    tool_call_count: int
    last_user_message: Optional[str]


@dataclass(frozen=True)
class Skill:
    """Immutable skill with usage metrics."""

    name: str
    session_id: str
    time_loaded: int
    invocation_count: int = 1
    last_used: Optional[int] = None


@dataclass(frozen=True)
class ModelUsage:
    """Immutable model usage statistics."""

    provider: str
    model: str
    request_count: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    last_used: Optional[int] = None
    last_rate_limit: Optional[int] = None

    @property
    def model_key(self) -> str:
        """Get the model key (provider/model)."""
        return f"{self.provider}/{self.model}"

    @property
    def avg_tokens_per_request(self) -> float:
        """Get average tokens per request."""
        if self.request_count == 0:
            return 0.0
        return self.total_tokens / self.request_count


@dataclass(frozen=True)
class SessionTokens:
    """Immutable token usage for a session."""

    session_id: str
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_tokens: int = 0
    request_count: int = 0
    models: tuple[ModelUsage, ...] = ()


# SessionTree - mutable for Textual integration
# (Textual widgets need mutable state for reactivity)


class SessionTree:
    """Tree structure for session hierarchy.

    This is intentionally mutable for Textual's reactivity system.
    The tree structure allows for expand/collapse functionality.
    """

    def __init__(self, session: Session):
        self.session = session
        self.children: list[SessionTree] = []
        self._is_expanded: bool = True

    @property
    def status(self) -> SessionStatus:
        """Get session status (delegates to immutable Session)."""
        return self.session.status

    @property
    def is_subagent(self) -> bool:
        """Check if this session is a subagent."""
        return self.session.is_subagent

    def add_child(self, child: SessionTree) -> None:
        """Add a child session tree."""
        self.children.append(child)

    def toggle_expanded(self) -> None:
        """Toggle expanded state."""
        self._is_expanded = not self._is_expanded

    def find_by_id(self, session_id: str) -> Optional[SessionTree]:
        """Find a session tree by ID (recursive search)."""
        if self.session.id == session_id:
            return self
        for child in self.children:
            found = child.find_by_id(session_id)
            if found:
                return found
        return None


# Pure tree building function


def build_session_tree(sessions: list[Session]) -> list[SessionTree]:
    """Build tree structure from flat session list.

    This is a pure function that transforms a flat list into a tree.
    Uses a two-pass algorithm for O(n) complexity.

    Args:
        sessions: List of Session objects (immutable)

    Returns:
        List of root SessionTree nodes with children attached
    """
    if not sessions:
        return []

    # Pass 1: Create all tree nodes
    node_map: dict[str, SessionTree] = {s.id: SessionTree(s) for s in sessions}

    # Pass 2: Build parent-child relationships
    roots: list[SessionTree] = []

    for session in sessions:
        tree = node_map[session.id]
        if session.parent_id and session.parent_id in node_map:
            node_map[session.parent_id].add_child(tree)
        else:
            roots.append(tree)

    return roots
