"""
Database queries for OpenCode sessions.

Design principles:
- Pure functions for data extraction
- Caching for performance (time-based TTL cache)
- Type-safe with immutable models
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Generic, Optional, TypeVar

from .models import ModelError, ModelUsage, Session, SessionStats, SessionTokens, Skill, Todo
from .query import MESSAGE, SESSION, TODO, QueryBuilder, json_extract

DB_PATH = ".local/share/opencode/opencode.db"

# Cache timeout in seconds
CACHE_TTL = 5


# =============================================================================
# Simple TTL Cache
# =============================================================================

T = TypeVar("T")


@dataclass
class CacheEntry(Generic[T]):
    """Cache entry with timestamp."""

    value: T
    timestamp: float


class TTLCache(Generic[T]):
    """Simple time-to-live cache.

    Features:
    - Time-based expiration
    - Max size limit
    - Thread-safe for reads
    """

    def __init__(self, ttl: float = CACHE_TTL, max_size: int = 100) -> None:
        """Initialize the cache.

        Args:
            ttl: Time-to-live in seconds
            max_size: Maximum number of entries
        """
        self._cache: dict[str, CacheEntry[T]] = {}
        self._ttl = ttl
        self._max_size = max_size

    def get(self, key: str) -> Optional[T]:
        """Get a value from cache if not expired.

        Args:
            key: Cache key

        Returns:
            Cached value or None if expired/not found
        """
        entry = self._cache.get(key)
        if entry is None:
            return None

        if time.time() - entry.timestamp > self._ttl:
            del self._cache[key]
            return None

        return entry.value

    def set(self, key: str, value: T) -> None:
        """Set a value in cache.

        Args:
            key: Cache key
            value: Value to cache
        """
        # Evict oldest if at max size
        if len(self._cache) >= self._max_size:
            oldest_key = min(
                self._cache.keys(),
                key=lambda k: self._cache[k].timestamp,
            )
            del self._cache[oldest_key]

        self._cache[key] = CacheEntry(value=value, timestamp=time.time())

    def clear(self) -> None:
        """Clear all cached entries."""
        self._cache.clear()

    def invalidate(self, key: str) -> None:
        """Invalidate a specific cache entry.

        Args:
            key: Cache key to invalidate
        """
        self._cache.pop(key, None)


# Global caches
_session_cache: TTLCache[list[Session]] = TTLCache()
_stats_cache: TTLCache[SessionStats] = TTLCache()
_tokens_cache: TTLCache[SessionTokens] = TTLCache()
_model_usage_cache: TTLCache[list[ModelUsage]] = TTLCache(ttl=10)


# =============================================================================
# Database Path Helpers
# =============================================================================


def _db_path() -> Path:
    """Get the path to the OpenCode database.

    Returns:
        Path to opencode.db in user's home directory
    """
    return Path(os.path.expanduser("~")) / DB_PATH


def _builder() -> QueryBuilder | None:
    """Create a query builder for the database.

    Returns:
        QueryBuilder instance or None if database doesn't exist
    """
    if not _db_path().exists():
        return None
    return QueryBuilder(str(_db_path()))


def _extract_retry_after(error: dict[str, Any]) -> Optional[int]:
    """Extract retry_after duration from error data.

    Checks multiple locations where retry information might be stored:
    1. error.data.retry_after (milliseconds)
    2. error.data.retryAfter (milliseconds)
    3. Parses message text for patterns like "retry after 60s"

    Args:
        error: Error dictionary from message

    Returns:
        Retry duration in milliseconds, or None if not found
    """
    error_data = error.get("data", {})

    # Check direct retry_after field
    if retry_after := error_data.get("retry_after"):
        try:
            return int(retry_after)
        except (ValueError, TypeError):
            pass

    if retry_after := error_data.get("retryAfter"):
        try:
            return int(retry_after)
        except (ValueError, TypeError):
            pass

    # Parse from message text
    import re
    message = error_data.get("message", "").lower()

    # Pattern: "retry after X seconds/minutes"
    match = re.search(r"retry after\s+(\d+)\s*(second|minute|min|hour)", message)
    if match:
        try:
            value = int(match.group(1))
            unit = match.group(2)
            if unit.startswith("minute") or unit == "min":
                return value * 60 * 1000
            elif unit.startswith("hour"):
                return value * 3600 * 1000
            else:  # seconds
                return value * 1000
        except (ValueError, TypeError):
            pass

    return None


# =============================================================================
# Session Queries
# =============================================================================


def get_sessions(cwd: Optional[str] = None) -> list[Session]:
    """Get all sessions, optionally filtered by directory.

    Results are cached for CACHE_TTL seconds.

    Args:
        cwd: Working directory filter (None for all)

    Returns:
        List of Session objects
    """
    cache_key = f"sessions:{cwd or 'all'}"

    # Check cache
    cached = _session_cache.get(cache_key)
    if cached is not None:
        return cached

    b = _builder()
    if b is None:
        return []

    where = {"directory": cwd} if cwd else None
    rows = b.select(SESSION, order_by="-time_updated", where=where)

    sessions = [
        Session(
            id=r["id"],
            parent_id=r["parent_id"],
            project_id=r["project_id"],
            title=r["title"],
            directory=r["directory"],
            time_created=r["time_created"],
            time_updated=r["time_updated"],
        )
        for r in rows
    ]

    _session_cache.set(cache_key, sessions)
    return sessions


def get_session_by_id(session_id: str) -> Optional[Session]:
    b = _builder()
    if b is None:
        return None

    rows = b.select(SESSION, where={"id": session_id}, limit=1)
    if not rows:
        return None

    r = rows[0]
    return Session(
        id=r["id"],
        parent_id=r["parent_id"],
        project_id=r["project_id"],
        title=r["title"],
        directory=r["directory"],
        time_created=r["time_created"],
        time_updated=r["time_updated"],
    )


def get_session_message_count(session_id: str) -> int:
    b = _builder()
    if b is None:
        return 0
    return b.count(MESSAGE, {"session_id": session_id})


def get_session_tool_call_count(session_id: str) -> int:
    """Count assistant messages (contain tool calls)."""
    import sqlite3

    b = _builder()
    if b is None:
        return 0

    with b._conn() as conn:
        r = conn.execute(
            """
            SELECT COUNT(*) FROM message
            WHERE session_id = ?
            AND json_valid(data) = 1
            AND json_extract(data, '$.role') = 'assistant'
        """,
            (session_id,),
        ).fetchone()
        return r[0] if r else 0


def get_last_user_message(session_id: str) -> Optional[str]:
    """Get the last user message text from parts.

    User message content is stored in the part table with type='text',
    not in the message table's format.body field.

    Args:
        session_id: The session ID to query

    Returns:
        The last user message text or None
    """
    b = _builder()
    if b is None:
        return None

    with b._conn() as conn:
        # Get text parts from user messages
        r = conn.execute(
            """
            SELECT p.data
            FROM part p
            JOIN message m ON p.message_id = m.id
            WHERE m.session_id = ?
            AND json_extract(m.data, '$.role') = 'user'
            AND json_valid(p.data) = 1
            AND json_extract(p.data, '$.type') = 'text'
            ORDER BY p.time_created DESC
            LIMIT 1
            """,
            (session_id,),
        ).fetchone()

        if r:
            try:
                data = json.loads(r["data"])
                return data.get("text", None)
            except (json.JSONDecodeError, KeyError):
                return None
        return None


def get_session_stats(session_id: str) -> SessionStats:
    return SessionStats(
        message_count=get_session_message_count(session_id),
        tool_call_count=get_session_tool_call_count(session_id),
        last_user_message=get_last_user_message(session_id),
    )


def get_todos(session_id: str) -> list[Todo]:
    b = _builder()
    if b is None:
        return []

    rows = b.select(TODO, where={"session_id": session_id}, order_by="position")

    return [
        Todo(
            session_id=r["session_id"],
            content=r["content"],
            status=r["status"],
            priority=r["priority"],
            position=r["position"],
            time_created=r["time_created"],
        )
        for r in rows
    ]


def get_session_count(cwd: Optional[str] = None) -> int:
    b = _builder()
    if b is None:
        return 0
    where = {"directory": cwd} if cwd else None
    return b.count(SESSION, where)


def get_model_usage_stats() -> dict[str, dict]:
    """Get usage stats per model from all messages."""
    from collections import defaultdict

    b = _builder()
    if b is None:
        return {}

    stats = defaultdict(
        lambda: {
            "total_tokens": 0,
            "input_tokens": 0,
            "output_tokens": 0,
            "request_count": 0,
            "last_rate_limit": None,
            "retry_after_ms": None,
            "last_used": None,
            "error_count": 0,
            "last_error": None,
            "last_error_type": None,
        }
    )

    # Use query builder for assistant messages
    rows = b.select_json(
        MESSAGE,
        json_path="$.role",
        json_value="assistant",
        columns=["data", "time_created"],
        order_by="-time_created",
    )

    for row in rows:
        data = row["data"]
        time_created = row["time_created"]

        if not data:
            continue

        try:
            msg = json.loads(data)

            # Get model info
            provider_id = msg.get("providerID", "unknown")
            model_id = msg.get("modelID", "unknown")
            model_key = f"{provider_id}/{model_id}"

            # Update last used
            if stats[model_key]["last_used"] is None:
                stats[model_key]["last_used"] = time_created

            # Extract token counts
            tokens = msg.get("tokens", {})
            input_tokens = int(tokens.get("input", 0) or 0)
            output_tokens = int(tokens.get("output", 0) or 0)

            stats[model_key]["input_tokens"] = int(stats[model_key]["input_tokens"] or 0) + input_tokens
            stats[model_key]["output_tokens"] = int(stats[model_key]["output_tokens"] or 0) + output_tokens
            stats[model_key]["total_tokens"] = int(stats[model_key]["total_tokens"] or 0) + input_tokens + output_tokens

            # Count requests
            stats[model_key]["request_count"] = int(stats[model_key]["request_count"] or 0) + 1

        except (json.JSONDecodeError, KeyError):
            continue

    # For all errors (not just rate limits)
    with b._conn() as conn:
        error_rows = conn.execute("""
            SELECT data, time_created FROM message
            WHERE json_valid(data) = 1
            AND json_extract(data, '$.error') IS NOT NULL
            ORDER BY time_created DESC
        """).fetchall()

        for row in error_rows:
            data = row["data"]
            time_created = row["time_created"]

            if not data:
                continue

            try:
                msg = json.loads(data)
                provider_id = msg.get("providerID", "unknown")
                model_id = msg.get("modelID", "unknown")
                model_key = f"{provider_id}/{model_id}"

                error = msg.get("error", {})
                error_name = error.get("name", "Unknown")
                error_message = error.get("data", {}).get("message", "")

                # Update error stats
                stats[model_key]["error_count"] = int(stats[model_key]["error_count"] or 0) + 1
                if stats[model_key]["last_error"] is None:
                    stats[model_key]["last_error"] = time_created
                    stats[model_key]["last_error_type"] = error_name

                # Special handling for rate limit errors
                if (
                    "rate_limit" in error_name.lower()
                    or "rate limit" in error_message.lower()
                    or "quota" in error_message.lower()
                ):
                    if stats[model_key]["last_rate_limit"] is None:
                        stats[model_key]["last_rate_limit"] = time_created
                        retry_after = _extract_retry_after(error)
                        if retry_after:
                            stats[model_key]["retry_after_ms"] = retry_after

            except (json.JSONDecodeError, KeyError):
                continue

    return dict(stats)


def get_session_skills(session_id: str) -> list[Skill]:
    """Get skills loaded in a session by parsing tool calls from parts.

    Skills are stored as tool calls with:
    - part.tool = "skill"
    - part.state.input.name = "skill-name"

    Args:
        session_id: The session ID to query

    Returns:
        List of Skill objects with invocation counts
    """
    b = _builder()
    if b is None:
        return []

    skills = []
    skill_data: dict[str, dict] = {}  # Track skill details

    with b._conn() as conn:
        # Get parts with skill tool invocations
        # The skill tool has: tool="skill", state.input.name="skill-name"
        rows = conn.execute(
            """
            SELECT p.data, p.time_created
            FROM part p
            JOIN message m ON p.message_id = m.id
            WHERE m.session_id = ?
            AND json_valid(p.data) = 1
            AND json_extract(p.data, '$.type') = 'tool'
            AND json_extract(p.data, '$.tool') = 'skill'
            ORDER BY p.time_created ASC
            """,
            (session_id,),
        ).fetchall()

        for row in rows:
            data = row["data"]
            time_created = row["time_created"]

            if not data:
                continue

            try:
                part = json.loads(data)
                tool_name = part.get("tool", "")

                # Skill tool has the name in state.input.name
                if tool_name == "skill":
                    state = part.get("state", {})
                    input_data = state.get("input", {})
                    skill_name = input_data.get("name", "")

                    if not skill_name:
                        continue

                    # Track this skill
                    if skill_name not in skill_data:
                        skill_data[skill_name] = {
                            "count": 0,
                            "first_loaded": time_created,
                            "last_loaded": time_created,
                        }

                    skill_data[skill_name]["count"] += 1
                    skill_data[skill_name]["last_loaded"] = time_created

            except (json.JSONDecodeError, KeyError, AttributeError):
                continue

        # Convert to Skill objects
        for skill_name, data in skill_data.items():
            skills.append(
                Skill(
                    name=skill_name,
                    session_id=session_id,
                    time_loaded=data["first_loaded"],
                    invocation_count=data["count"],
                    last_used=data["last_loaded"],
                )
            )

    return skills


def get_skill_usage_stats(cwd: Optional[str] = None) -> dict[str, dict]:
    """Get aggregated skill usage statistics across sessions."""
    b = _builder()
    if b is None:
        return {}

    stats = {}
    where_clause = "AND s.directory = ?" if cwd else ""

    with b._conn() as conn:
        # Get all skill invocations with session info
        query = f"""
            SELECT
                s.id as session_id,
                s.directory,
                p.data,
                p.time_created
            FROM part p
            JOIN message m ON p.message_id = m.id
            JOIN session s ON m.session_id = s.id
            WHERE json_valid(p.data) = 1
            AND json_extract(p.data, '$.type') = 'tool'
            {where_clause}
            ORDER BY p.time_created DESC
        """
        params = (cwd,) if cwd else ()
        rows = conn.execute(query, params).fetchall()

        for row in rows:
            data = row["data"]
            time_created = row["time_created"]

            if not data:
                continue

            try:
                part = json.loads(data)
                tool_name = part.get("tool", "")

                # Track skill invocations
                if tool_name == "skill" or "skill" in tool_name.lower():
                    state = part.get("state", {})
                    input_data = state.get("input", {})

                    skill_name = input_data.get("name") or input_data.get("skill_name") or tool_name

                    if not skill_name:
                        continue

                    # Calculate duration if available
                    duration_ms = 0
                    time_data = state.get("time", {})
                    if "start" in time_data and "end" in time_data:
                        duration_ms = time_data["end"] - time_data["start"]

                    # Get status
                    status = state.get("status", "unknown")

                    # Initialize skill stats
                    if skill_name not in stats:
                        stats[skill_name] = {
                            "total_invocations": 0,
                            "total_duration_ms": 0,
                            "sessions": set(),
                            "first_used": time_created,
                            "last_used": time_created,
                            "success_count": 0,
                            "failure_count": 0,
                        }

                    # Update stats
                    stats[skill_name]["total_invocations"] += 1
                    stats[skill_name]["total_duration_ms"] += duration_ms
                    stats[skill_name]["sessions"].add(row["session_id"])
                    stats[skill_name]["last_used"] = time_created

                    if status == "completed":
                        stats[skill_name]["success_count"] += 1
                    elif status == "failed":
                        stats[skill_name]["failure_count"] += 1

            except (json.JSONDecodeError, KeyError, AttributeError):
                continue

        # Convert sets to counts and calculate derived metrics
        for skill_name in stats:
            s = stats[skill_name]
            s["session_count"] = len(s["sessions"])
            s["sessions"] = list(s["sessions"])
            s["avg_duration_ms"] = (
                s["total_duration_ms"] / s["total_invocations"] if s["total_invocations"] > 0 else 0
            )
            s["success_rate"] = (
                s["success_count"] / s["total_invocations"] if s["total_invocations"] > 0 else 0.0
            )

    return stats


def get_session_tokens(session_id: str) -> SessionTokens:
    """Get token usage for a specific session.

    Parses assistant messages to extract token counts.

    Args:
        session_id: The session ID to query

    Returns:
        SessionTokens with aggregated token usage
    """
    b = _builder()
    if b is None:
        return SessionTokens(session_id=session_id)

    total_input = 0
    total_output = 0
    request_count = 0
    models: dict[str, dict] = {}

    with b._conn() as conn:
        rows = conn.execute(
            """
            SELECT data, time_created FROM message
            WHERE session_id = ?
            AND json_valid(data) = 1
            AND json_extract(data, '$.role') = 'assistant'
            ORDER BY time_created ASC
            """,
            (session_id,),
        ).fetchall()

        for row in rows:
            data = row["data"]
            if not data:
                continue

            try:
                msg = json.loads(data)

                # Get model info
                provider = msg.get("providerID", "unknown")
                model = msg.get("modelID", "unknown")
                model_key = f"{provider}/{model}"

                # Token data is in 'tokens' field, not 'usage'
                tokens = msg.get("tokens", {})
                input_tokens = tokens.get("input", 0) or 0
                output_tokens = tokens.get("output", 0) or 0

                # Accumulate totals
                total_input += input_tokens
                total_output += output_tokens
                request_count += 1

                # Track per-model
                if model_key not in models:
                    models[model_key] = {
                        "provider": provider,
                        "model": model,
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "request_count": 0,
                        "last_used": row["time_created"],
                    }

                models[model_key]["input_tokens"] += input_tokens
                models[model_key]["output_tokens"] += output_tokens
                models[model_key]["request_count"] += 1

            except (json.JSONDecodeError, KeyError):
                continue

    # Convert to ModelUsage objects
    model_usages = tuple(
        ModelUsage(
            provider=m["provider"],
            model=m["model"],
            request_count=m["request_count"],
            input_tokens=m["input_tokens"],
            output_tokens=m["output_tokens"],
            total_tokens=m["input_tokens"] + m["output_tokens"],
            last_used=m["last_used"],
            error_count=0,
            last_error=None,
            last_error_type=None,
        )
        for m in models.values()
    )

    return SessionTokens(
        session_id=session_id,
        total_input_tokens=total_input,
        total_output_tokens=total_output,
        total_tokens=total_input + total_output,
        request_count=request_count,
        models=model_usages,
    )


def get_all_model_usage() -> list[ModelUsage]:
    """Get aggregated model usage across all sessions.

    Returns:
        List of ModelUsage objects sorted by total tokens
    """
    b = _builder()
    if b is None:
        return []

    models: dict[str, dict] = {}

    with b._conn() as conn:
        rows = conn.execute(
            """
            SELECT data, time_created FROM message
            WHERE json_valid(data) = 1
            AND json_extract(data, '$.role') = 'assistant'
            ORDER BY time_created DESC
            """
        ).fetchall()

        for row in rows:
            data = row["data"]
            if not data:
                continue

            try:
                msg = json.loads(data)

                provider = msg.get("providerID", "unknown")
                model = msg.get("modelID", "unknown")
                model_key = f"{provider}/{model}"

                # Token data is in 'tokens' field, not 'usage'
                tokens = msg.get("tokens", {})
                input_tokens = tokens.get("input", 0) or 0
                output_tokens = tokens.get("output", 0) or 0

                if model_key not in models:
                    models[model_key] = {
                        "provider": provider,
                        "model": model,
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "request_count": 0,
                        "last_used": row["time_created"],
                        "last_rate_limit": None,
                        "retry_after_ms": None,
                        "error_count": 0,
                        "last_error": None,
                        "last_error_type": None,
                    }

                models[model_key]["input_tokens"] += input_tokens
                models[model_key]["output_tokens"] += output_tokens
                models[model_key]["request_count"] += 1

            except (json.JSONDecodeError, KeyError):
                continue

        # Check for all errors (not just rate limits)
        error_rows = conn.execute(
            """
            SELECT data, time_created FROM message
            WHERE json_valid(data) = 1
            AND json_extract(data, '$.error') IS NOT NULL
            ORDER BY time_created DESC
            """
        ).fetchall()

        for row in error_rows:
            data = row["data"]
            if not data:
                continue

            try:
                msg = json.loads(data)
                provider = msg.get("providerID", "unknown")
                model = msg.get("modelID", "unknown")
                model_key = f"{provider}/{model}"

                error = msg.get("error", {})
                error_name = error.get("name", "Unknown")
                error_message = error.get("data", {}).get("message", "")

                # Track errors for this model
                if model_key in models:
                    models[model_key]["error_count"] += 1
                    if models[model_key]["last_error"] is None:
                        models[model_key]["last_error"] = row["time_created"]
                        models[model_key]["last_error_type"] = error_name

                    # Special handling for rate limit errors
                    if (
                        "rate_limit" in error_name.lower()
                        or "rate limit" in error_message.lower()
                        or "quota" in error_message.lower()
                    ):
                        if models[model_key]["last_rate_limit"] is None:
                            models[model_key]["last_rate_limit"] = row["time_created"]
                            # Extract retry_after if available
                            retry_after = _extract_retry_after(error)
                            if retry_after:
                                models[model_key]["retry_after_ms"] = retry_after

            except (json.JSONDecodeError, KeyError):
                continue

    # Convert to ModelUsage objects and sort by total tokens
    result = [
        ModelUsage(
            provider=m["provider"],
            model=m["model"],
            request_count=m["request_count"],
            input_tokens=m["input_tokens"],
            output_tokens=m["output_tokens"],
            total_tokens=m["input_tokens"] + m["output_tokens"],
            last_used=m["last_used"],
            last_rate_limit=m["last_rate_limit"],
            retry_after_ms=m.get("retry_after_ms"),
            error_count=m["error_count"],
            last_error=m["last_error"],
            last_error_type=m["last_error_type"],
        )
        for m in models.values()
    ]

    return sorted(result, key=lambda x: x.total_tokens, reverse=True)


def get_all_errors(limit: int = 10) -> list[ModelError]:
    """Get all errors across all models, sorted by recency.

    Args:
        limit: Maximum number of errors to return

    Returns:
        List of ModelError objects sorted by timestamp (newest first)
    """
    b = _builder()
    if b is None:
        return []

    errors = []

    with b._conn() as conn:
        rows = conn.execute(
            """
            SELECT
                m.session_id,
                m.data,
                m.time_created
            FROM message m
            WHERE json_valid(m.data) = 1
            AND json_extract(m.data, '$.role') = 'assistant'
            AND json_extract(m.data, '$.error') IS NOT NULL
            ORDER BY m.time_created DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        for row in rows:
            data = row["data"]
            if not data:
                continue

            try:
                msg = json.loads(data)
                error = msg.get("error", {})

                errors.append(
                    ModelError(
                        session_id=row["session_id"],
                        provider=msg.get("providerID", "unknown"),
                        model=msg.get("modelID", "unknown"),
                        error_name=error.get("name", "Unknown"),
                        error_message=error.get("data", {}).get("message", ""),
                        timestamp=row["time_created"],
                        time_created=row["time_created"],
                    )
                )

            except (json.JSONDecodeError, KeyError):
                continue

    return errors


def get_model_error_history(
    provider: str,
    model: str,
    limit: int = 10,
) -> list[ModelError]:
    """Get error history for a specific model.

    Args:
        provider: Model provider (e.g., "openai", "anthropic")
        model: Model name (e.g., "gpt-4", "claude-3-opus")
        limit: Maximum number of errors to return

    Returns:
        List of ModelError objects sorted by timestamp (newest first)
    """
    b = _builder()
    if b is None:
        return []

    errors = []

    with b._conn() as conn:
        rows = conn.execute(
            """
            SELECT
                m.session_id,
                m.data,
                m.time_created
            FROM message m
            WHERE json_valid(m.data) = 1
            AND json_extract(m.data, '$.role') = 'assistant'
            AND json_extract(m.data, '$.providerID') = ?
            AND json_extract(m.data, '$.modelID') = ?
            AND json_extract(m.data, '$.error') IS NOT NULL
            ORDER BY m.time_created DESC
            LIMIT ?
            """,
            (provider, model, limit),
        ).fetchall()

        for row in rows:
            data = row["data"]
            if not data:
                continue

            try:
                msg = json.loads(data)
                error = msg.get("error", {})

                errors.append(
                    ModelError(
                        session_id=row["session_id"],
                        provider=provider,
                        model=model,
                        error_name=error.get("name", "Unknown"),
                        error_message=error.get("data", {}).get("message", ""),
                        timestamp=row["time_created"],
                        time_created=row["time_created"],
                    )
                )

            except (json.JSONDecodeError, KeyError):
                continue

    return errors
