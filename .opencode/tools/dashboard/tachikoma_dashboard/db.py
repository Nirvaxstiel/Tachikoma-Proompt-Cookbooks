"""
Database queries for OpenCode sessions.
"""

import json
import os
from pathlib import Path
from typing import Optional

from .models import Session, SessionStats, Skill, Todo
from .query import MESSAGE, SESSION, TODO, QueryBuilder, json_extract

DB_PATH = ".local/share/opencode/opencode.db"


def _db_path() -> Path:
    return Path(os.path.expanduser("~")) / DB_PATH


def _builder() -> QueryBuilder | None:
    if not _db_path().exists():
        return None
    return QueryBuilder(str(_db_path()))


def get_sessions(cwd: Optional[str] = None) -> list[Session]:
    b = _builder()
    if b is None:
        return []

    where = {"directory": cwd} if cwd else None
    rows = b.select(SESSION, order_by="-time_updated", where=where)

    return [
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
    b = _builder()
    if b is None:
        return None

    with b._conn() as conn:
        r = conn.execute(
            """
            SELECT data FROM message
            WHERE session_id = ?
            AND json_valid(data) = 1
            AND json_extract(data, '$.role') = 'user'
            ORDER BY time_created DESC
            LIMIT 1
        """,
            (session_id,),
        ).fetchone()

        if r:
            return json_extract(r, "$.format.body")
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
            "last_used": None,
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

            # Count requests
            stats[model_key]["request_count"] = int(stats[model_key]["request_count"] or 0) + 1

        except (json.JSONDecodeError, KeyError):
            continue

    # For rate limit errors, we need raw SQL for the LIKE queries
    # The query builder doesn't support complex WHERE clauses with OR/LIKE
    with b._conn() as conn:
        error_rows = conn.execute("""
            SELECT data, time_created FROM message
            WHERE json_valid(data) = 1
            AND (
                json_extract(data, '$.error.code') LIKE '%rate_limit%'
                OR json_extract(data, '$.error.message') LIKE '%rate limit%'
                OR json_extract(data, '$.error.message') LIKE '%quota%'
            )
            ORDER BY time_created DESC
        """).fetchall()

        for row in error_rows:
            data = row["data"]
            time_created = row["time_created"]

            if not data:
                continue

            try:
                msg = json.loads(data)
                model_key = "unknown/unknown"

                # Update rate limit info
                if stats[model_key]["last_rate_limit"] is None:
                    stats[model_key]["last_rate_limit"] = time_created

            except (json.JSONDecodeError, KeyError):
                continue

    return dict(stats)


def get_session_skills(session_id: str) -> list[Skill]:
    """Get skills loaded in a session by parsing tool calls from parts."""
    b = _builder()
    if b is None:
        return []

    skills = []
    skill_data = {}  # Track skill details: {skill_name: {count, first_loaded, last_loaded}}

    with b._conn() as conn:
        # Get parts with tool invocations for skills
        # Skills are tracked in the part table with detailed state
        rows = conn.execute(
            """
            SELECT p.data, p.time_created
            FROM part p
            JOIN message m ON p.message_id = m.id
            WHERE m.session_id = ?
            AND json_valid(p.data) = 1
            AND json_extract(p.data, '$.type') = 'tool'
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

                # Track skill invocations (either 'skill' tool or skill-specific tools)
                if tool_name == "skill" or "skill" in tool_name.lower():
                    # Extract skill name from tool state input
                    state = part.get("state", {})
                    input_data = state.get("input", {})

                    # Try to get skill name from various possible locations
                    skill_name = input_data.get("name") or input_data.get("skill_name") or tool_name

                    if skill_name and skill_name not in skill_data:
                        skill_data[skill_name] = {
                            "count": 0,
                            "first_loaded": time_created,
                            "last_loaded": time_created,
                            "tool_name": tool_name
                        }

                    if skill_name in skill_data:
                        skill_data[skill_name]["count"] += 1
                        skill_data[skill_name]["last_loaded"] = time_created

            except (json.JSONDecodeError, KeyError, AttributeError):
                continue

        # Convert to Skill objects with enhanced data
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
                s["total_duration_ms"] / s["total_invocations"]
                if s["total_invocations"] > 0
                else 0
            )
            s["success_rate"] = (
                s["success_count"] / s["total_invocations"]
                if s["total_invocations"] > 0
                else 0.0
            )

    return stats
