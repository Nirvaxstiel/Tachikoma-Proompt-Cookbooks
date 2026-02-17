"""
Type-safe query builder for OpenCode database.

Provides compile-time and runtime validation of table/column names
to prevent SQL errors from typos.
"""

from dataclasses import dataclass
from typing import (
    TypeVar, Generic, Callable, Any, 
    Literal, Type, Sequence, Optional
)
import sqlite3
import re


# =============================================================================
# Schema Definitions (from OpenCode source)
# =============================================================================

@dataclass(frozen=True)
class Column:
    """Represents a database column with type info."""
    name: str
    sql_type: str
    is_json: bool = False


@dataclass(frozen=True)
class Table:
    """Represents a database table."""
    name: str
    columns: tuple[Column, ...]


# Define tables based on OpenCode schema (session.sql.ts)
SESSION_TABLE = Table("session", (
    Column("id", "TEXT", False),
    Column("parent_id", "TEXT", False),
    Column("project_id", "TEXT", False),
    Column("title", "TEXT", False),
    Column("directory", "TEXT", False),
    Column("time_created", "INTEGER", False),
    Column("time_updated", "INTEGER", False),
))

MESSAGE_TABLE = Table("message", (
    Column("id", "TEXT", False),
    Column("session_id", "TEXT", False),
    Column("time_created", "INTEGER", False),
    Column("time_updated", "INTEGER", False),
    Column("data", "TEXT", True),  # JSON
))

TODO_TABLE = Table("todo", (
    Column("session_id", "TEXT", False),
    Column("content", "TEXT", False),
    Column("status", "TEXT", False),
    Column("priority", "TEXT", False),
    Column("position", "INTEGER", False),
    Column("time_created", "INTEGER", False),
    Column("time_updated", "INTEGER", False),
))

TABLES: dict[str, Table] = {
    "session": SESSION_TABLE,
    "message": MESSAGE_TABLE,
    "todo": TODO_TABLE,
}


# =============================================================================
# Type-Safe Query Builder
# =============================================================================

T = TypeVar("T")


@dataclass
class QueryResult(Generic[T]):
    """Result wrapper with metadata."""
    data: list[T]
    row_count: int
    query: str


class QueryBuilder:
    """
    Type-safe SQL query builder.
    
    Validates table and column names at construction time,
    preventing runtime SQL errors from typos.
    """
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def _get_connection(self) -> sqlite3.Connection:
        """Get a database connection."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _validate_table(self, table: str | Table) -> Table:
        """Validate table name and return Table object."""
        table_name = table if isinstance(table, str) else table.name
        if table_name not in TABLES:
            raise ValueError(f"Unknown table: {table_name}")
        return TABLES[table_name]
    
    def _validate_column(self, table: Table, column: str) -> Column:
        """Validate column name and return Column object."""
        for col in table.columns:
            if col.name == column:
                return col
        valid = ", ".join(c.name for c in table.columns)
        raise ValueError(f"Unknown column '{column}' in table '{table.name}'. Valid: {valid}")
    
    def select(
        self,
        table: str | Table,
        columns: list[str] | None = None,
        where: dict[str, Any] | None = None,
        order_by: str | None = None,
        limit: int | None = None,
    ) -> list[sqlite3.Row]:
        """
        Build and execute a SELECT query.
        
        Args:
            table: Table name or Table object
            columns: List of columns to select (None = *)
            where: Dict of column -> value filters
            order_by: Column to order by (prefix with - for DESC)
            limit: Max rows to return
        """
        table_obj = self._validate_table(table)
        
        # Resolve columns
        if columns is None:
            col_list = [c.name for c in table_obj.columns]
        else:
            col_list = [self._validate_column(table_obj, c).name for c in columns]
        
        # Build query
        cols_sql = ", ".join(col_list)
        query = f"SELECT {cols_sql} FROM {table_obj.name}"
        params: list[Any] = []
        
        # WHERE clause
        if where:
            clauses = []
            for col_name, value in where.items():
                self._validate_column(table_obj, col_name)
                clauses.append(f"{col_name} = ?")
                params.append(value)
            query += " WHERE " + " AND ".join(clauses)
        
        # ORDER BY
        if order_by:
            desc = order_by.startswith("-")
            col = order_by.lstrip("-")
            self._validate_column(table_obj, col)
            direction = "DESC" if desc else "ASC"
            query += f" ORDER BY {col} {direction}"
        
        # LIMIT
        if limit:
            query += f" LIMIT {limit}"
        
        # Execute
        conn = self._get_connection()
        try:
            cursor = conn.execute(query, params)
            return cursor.fetchall()
        finally:
            conn.close()
    
    def count(
        self,
        table: str | Table,
        where: dict[str, Any] | None = None,
    ) -> int:
        """Count rows matching filter."""
        table_obj = self._validate_table(table)
        
        query = f"SELECT COUNT(*) FROM {table_obj.name}"
        params: list[Any] = []
        
        if where:
            clauses = []
            for col_name, value in where.items():
                self._validate_column(table_obj, col_name)
                clauses.append(f"{col_name} = ?")
                params.append(value)
            query += " WHERE " + " AND ".join(clauses)
        
        conn = self._get_connection()
        try:
            cursor = conn.execute(query, params)
            return cursor.fetchone()[0]
        finally:
            conn.close()
    
    def exists(self, table: str | Table, where: dict[str, Any]) -> bool:
        """Check if row exists."""
        return self.count(table, where) > 0


# =============================================================================
# JSON Query Helpers
# =============================================================================

class JsonQueryHelper:
    """Helper for querying JSON columns."""
    
    @staticmethod
    def extract(row: sqlite3.Row, path: str) -> Any:
        """Extract value from JSON column using path like '$.field.subfield'."""
        import json
        data = row["data"]
        if not data:
            return None
        try:
            parsed = json.loads(data)
            # Navigate the path
            parts = path.lstrip("$.").split(".")
            value = parsed
            for part in parts:
                if isinstance(value, dict):
                    value = value.get(part)
                else:
                    return None
            return value
        except (json.JSONDecodeError, KeyError):
            return None
    
    @staticmethod
    def query_json_rows(
        builder: QueryBuilder,
        table: str | Table,
        json_path: str,
        json_value: Any,
        order_by: str | None = None,
        limit: int | None = None,
    ) -> list[sqlite3.Row]:
        """Query rows where JSON column matches value."""
        table_obj = builder._validate_table(table)
        
        # Validate the data column exists and is JSON
        data_col = builder._validate_column(table_obj, "data")
        if not data_col.is_json:
            raise ValueError(f"Column {data_col.name} is not a JSON column")
        
        query = f"""
            SELECT * FROM {table_obj.name}
            WHERE json_valid(data) = 1 AND json_extract(data, ?) = ?
        """
        params = [json_path, json_value]
        
        if order_by:
            desc = order_by.startswith("-")
            col = order_by.lstrip("-")
            builder._validate_column(table_obj, col)
            direction = "DESC" if desc else "ASC"
            query += f" ORDER BY {col} {direction}"
        
        if limit:
            query += f" LIMIT {limit}"
        
        conn = builder._get_connection()
        try:
            cursor = conn.execute(query, params)
            return cursor.fetchall()
        finally:
            conn.close()


# =============================================================================
# Repository Pattern
# =============================================================================

T = TypeVar("T")


class Repository(Generic[T]):
    """Base repository with type-safe queries."""
    
    def __init__(self, db_path: str, table: Table):
        self.db_path = db_path
        self.table = table
        self._builder = QueryBuilder(db_path)
        self._json = JsonQueryHelper()
    
    @property
    def query(self) -> QueryBuilder:
        """Access query builder."""
        return self._builder
    
    @property
    def json(self) -> JsonQueryHelper:
        """Access JSON query helper."""
        return self._json
