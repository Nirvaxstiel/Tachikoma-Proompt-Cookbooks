"""
Type-safe query builder for OpenCode database.

Validates table/column names at runtime to prevent SQL errors from typos.
"""

from dataclasses import dataclass
from typing import Any
import sqlite3


# =============================================================================
# Schema - validated at import time
# =============================================================================

@dataclass(frozen=True)
class Column:
    name: str
    sql_type: str
    is_json: bool = False


@dataclass(frozen=True)
class Table:
    name: str
    columns: tuple[Column, ...]


SESSION = Table("session", (
    Column("id", "TEXT"),
    Column("parent_id", "TEXT"),
    Column("project_id", "TEXT"),
    Column("title", "TEXT"),
    Column("directory", "TEXT"),
    Column("time_created", "INTEGER"),
    Column("time_updated", "INTEGER"),
))

MESSAGE = Table("message", (
    Column("id", "TEXT"),
    Column("session_id", "TEXT"),
    Column("time_created", "INTEGER"),
    Column("time_updated", "INTEGER"),
    Column("data", "TEXT", True),
))

TODO = Table("todo", (
    Column("session_id", "TEXT"),
    Column("content", "TEXT"),
    Column("status", "TEXT"),
    Column("priority", "TEXT"),
    Column("position", "INTEGER"),
    Column("time_created", "INTEGER"),
    Column("time_updated", "INTEGER"),
))

TABLES = {t.name: t for t in (SESSION, MESSAGE, TODO)}


# =============================================================================
# Query Builder
# =============================================================================

class QueryBuilder:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _table(self, name: str | Table) -> Table:
        table_name = name if isinstance(name, str) else name.name
        if table_name not in TABLES:
            raise ValueError(f"Unknown table: {table_name}")
        return TABLES[table_name]

    def _col(self, table: Table, name: str) -> Column:
        for c in table.columns:
            if c.name == name:
                return c
        valid = ", ".join(c.name for c in table.columns)
        raise ValueError(f"Unknown column '{name}' in '{table.name}'. Valid: {valid}")

    def select(
        self,
        table: str | Table,
        columns: list[str] | None = None,
        where: dict[str, Any] | None = None,
        order_by: str | None = None,
        limit: int | None = None,
    ) -> list[sqlite3.Row]:
        table_obj = self._table(table)
        
        cols = [c.name for c in table_obj.columns] if columns is None else columns
        cols = [self._col(table_obj, c).name for c in cols]
        
        query = f"SELECT {', '.join(cols)} FROM {table_obj.name}"
        params: list[Any] = []

        if where:
            clauses = [f"{self._col(table_obj, k).name} = ?" for k in where]
            query += " WHERE " + " AND ".join(clauses)
            params.extend(where.values())

        if order_by:
            desc = order_by.startswith("-")
            col = self._col(table_obj, order_by.lstrip("-")).name
            query += f" ORDER BY {col} {'DESC' if desc else 'ASC'}"

        if limit:
            query += f" LIMIT {limit}"

        with self._conn() as conn:
            return list(conn.execute(query, params))

    def count(self, table: str | Table, where: dict[str, Any] | None = None) -> int:
        table_obj = self._table(table)
        query = f"SELECT COUNT(*) FROM {table_obj.name}"
        params: list[Any] = []

        if where:
            clauses = [f"{self._col(table_obj, k).name} = ?" for k in where]
            query += " WHERE " + " AND ".join(clauses)
            params.extend(where.values())

        with self._conn() as conn:
            return conn.execute(query, params).fetchone()[0]


# =============================================================================
# JSON Helpers
# =============================================================================

def json_extract(row: sqlite3.Row, path: str) -> Any:
    """Extract value from JSON column using '$.field' path syntax."""
    import json
    data = row["data"] if "data" in row.keys() else None
    if not data:
        return None
    try:
        obj = json.loads(data)
        for key in path.lstrip("$.").split("."):
            if isinstance(obj, dict):
                obj = obj.get(key)
            else:
                return None
        return obj
    except (json.JSONDecodeError, KeyError, TypeError):
        return None
