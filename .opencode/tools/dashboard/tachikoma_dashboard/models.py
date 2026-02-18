"""Data models for the Tachikoma dashboard."""

import time
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class SessionStatus(Enum):
    """Session activity status."""

    WORKING = "working"  # Currently active (< 30s since last update)
    ACTIVE = "active"  # Has activity (< 5min)
    IDLE = "idle"  # No recent activity


def _ms_to_seconds(ms: int) -> int:
    """Convert milliseconds to seconds."""
    return ms // 1000


@dataclass
class Session:
    """Represents an OpenCode session."""

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
        now = int(time.time())
        updated_secs = self.updated_seconds
        if now - updated_secs < 30:
            return SessionStatus.WORKING
        elif now - updated_secs < 300:
            return SessionStatus.ACTIVE
        return SessionStatus.IDLE


@dataclass
class Todo:
    """Represents a task/todo item."""

    session_id: str
    content: str
    status: str
    priority: str
    position: int
    time_created: int


@dataclass
class SessionStats:
    """Statistics for a session."""

    message_count: int
    tool_call_count: int
    last_user_message: str | None


@dataclass
class Skill:
    """Represents a loaded skill with usage metrics."""

    name: str
    session_id: str
    time_loaded: int
    invocation_count: int = 1
    last_used: int | None = None


class SessionTree:
    """Tree structure for session hierarchy."""

    def __init__(self, session: Session):
        self.session = session
        self.children: list[SessionTree] = []
        self._status: Optional[SessionStatus] = None
        self._is_expanded: bool = True  # Default to expanded

    @property
    def status(self) -> SessionStatus:
        """Get session status (cached)."""
        if self._status is None:
            self._status = self.session.status
        return self._status

    @property
    def is_subagent(self) -> bool:
        """Check if this session is a subagent (has parent_id)."""
        return self.session.parent_id is not None

    def add_child(self, child: "SessionTree") -> None:
        """Add a child session tree."""
        self.children.append(child)

    def toggle_expanded(self) -> None:
        """Toggle expanded state."""
        self._is_expanded = not self._is_expanded

    def find_by_id(self, session_id: str) -> Optional["SessionTree"]:
        """Find a session tree by ID."""
        if self.session.id == session_id:
            return self
        for child in self.children:
            found = child.find_by_id(session_id)
            if found:
                return found
        return None


def build_session_tree(sessions: list[Session]) -> list[SessionTree]:
    """Build a tree structure from flat session list."""
    # Create a map of id -> SessionTree
    trees: dict[str, SessionTree] = {}
    roots: list[SessionTree] = []

    for session in sessions:
        trees[session.id] = SessionTree(session)

    # Build parent-child relationships
    for session in sessions:
        tree = trees[session.id]
        if session.parent_id and session.parent_id in trees:
            trees[session.parent_id].add_child(tree)
        else:
            roots.append(tree)

    return roots
