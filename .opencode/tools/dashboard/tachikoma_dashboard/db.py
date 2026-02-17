"""
Database queries for OpenCode sessions.
"""

import os
from pathlib import Path
from typing import Optional

from .models import Session, SessionStats, Todo
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
