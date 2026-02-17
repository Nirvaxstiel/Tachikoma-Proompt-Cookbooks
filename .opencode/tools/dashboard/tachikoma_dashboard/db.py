"""Database queries for OpenCode session data."""

import sqlite3
import os
from pathlib import Path
from typing import Optional

from .models import Session, Todo, SessionStats

DB_PATH = ".local/share/opencode/opencode.db"


def get_db_path() -> Path:
    """Get the path to the OpenCode database."""
    return Path(os.path.expanduser("~")) / DB_PATH


def get_sessions(cwd: Optional[str] = None) -> list[Session]:
    """Get sessions from OpenCode database."""
    db_path = get_db_path()
    
    if not db_path.exists():
        return []

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    query = """
        SELECT id, parent_id, project_id, title, directory, time_created, time_updated 
        FROM session WHERE 1=1
    """
    params: list[str] = []

    if cwd:
        query += " AND directory = ?"
        params.append(cwd)

    query += " ORDER BY time_updated DESC"

    cursor = conn.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [
        Session(
            id=row["id"],
            parent_id=row["parent_id"],
            project_id=row["project_id"],
            title=row["title"],
            directory=row["directory"],
            time_created=row["time_created"],
            time_updated=row["time_updated"],
        )
        for row in rows
    ]


def get_session_stats(session_id: str) -> SessionStats:
    """Get stats for a specific session (message count, tool calls, last user message)."""
    db_path = get_db_path()
    
    if not db_path.exists():
        return SessionStats(message_count=0, tool_call_count=0, last_user_message=None)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # Get message count
    cursor = conn.execute(
        "SELECT COUNT(*) FROM message WHERE session_id = ?",
        (session_id,)
    )
    message_count = cursor.fetchone()[0]

    # Get tool call count - messages with assistant role that have tool calls in their JSON data
    # The data column contains JSON with parts array - tool calls are parts with type "tool"
    # For simplicity, we count assistant messages (they typically have tool calls)
    cursor = conn.execute(
        """SELECT COUNT(*) FROM message 
           WHERE session_id = ? AND json_valid(data) = 1 
           AND json_extract(data, '$.role') = 'assistant'""",
        (session_id,)
    )
    tool_call_count = cursor.fetchone()[0]

    # Get last user message - look for role = 'user' in the JSON data
    cursor = conn.execute(
        """SELECT json_extract(data, '$.format.body') as text 
           FROM message 
           WHERE session_id = ? AND json_valid(data) = 1 
           AND json_extract(data, '$.role') = 'user'
           ORDER BY time_created DESC LIMIT 1""",
        (session_id,)
    )
    row = cursor.fetchone()
    last_user_message = row["text"] if row and row["text"] else None

    conn.close()

    return SessionStats(
        message_count=message_count,
        tool_call_count=tool_call_count,
        last_user_message=last_user_message
    )


def get_todos(session_id: str) -> list[Todo]:
    """Get todos for a specific session."""
    db_path = get_db_path()

    if not db_path.exists():
        return []

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    cursor = conn.execute(
        "SELECT session_id, content, status, priority, position, time_created "
        "FROM todo WHERE session_id = ?",
        (session_id,),
    )

    rows = cursor.fetchall()
    conn.close()

    return [
        Todo(
            session_id=row["session_id"],
            content=row["content"],
            status=row["status"],
            priority=row["priority"],
            position=row["position"],
            time_created=row["time_created"],
        )
        for row in rows
    ]


def get_session_count(cwd: Optional[str] = None) -> int:
    """Get total session count."""
    db_path = get_db_path()

    if not db_path.exists():
        return 0

    conn = sqlite3.connect(db_path)

    query = "SELECT COUNT(*) FROM session"
    params: list[str] = []

    if cwd:
        query += " WHERE directory = ?"
        params.append(cwd)

    cursor = conn.execute(query, params)
    count = cursor.fetchone()[0]
    conn.close()

    return count
