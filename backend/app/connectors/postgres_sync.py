from contextlib import contextmanager
from functools import lru_cache
from typing import Any

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

from app.config import settings

load_dotenv()


class PostgreSQLSyncConnector:
    """Synchronous PostgreSQL connector for use in sync contexts like get_test_user"""

    @classmethod
    @lru_cache(maxsize=1)
    def get_connection_string(cls) -> str:
        """Get the connection string for PostgreSQL"""
        return (
            f"host={settings.postgres_host} "
            f"port={settings.postgres_port} "
            f"user={settings.postgres_user} "
            f"password={settings.postgres_password} "
            f"dbname={settings.postgres_db} "
            f"application_name=meridian_backend_sync"
        )

    @classmethod
    @contextmanager
    def get_connection(cls):
        """
        Synchronous context manager that yields a PostgreSQL connection.
        The connection is automatically closed when the context exits.

        Usage:
        ```python
        with PostgreSQLSyncConnector.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
                result = cur.fetchone()
        ```
        """
        conn = None
        try:
            conn = psycopg2.connect(cls.get_connection_string())
            # Use RealDictCursor to get dict-like rows
            conn.cursor_factory = psycopg2.extras.RealDictCursor
            yield conn
        except Exception:
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()

    @classmethod
    def execute_query(cls, query: str, params: tuple = None) -> list[dict[str, Any]]:
        """
        Execute a SELECT query and return results as a list of dictionaries.

        Args:
            query: SQL query string with %s placeholders
            params: Query parameters tuple

        Returns:
            List of records as dictionaries
        """
        with cls.get_connection() as conn, conn.cursor() as cur:
            cur.execute(query, params or ())
            return [dict(row) for row in cur.fetchall()]

    @classmethod
    def execute_single_query(
        cls, query: str, params: tuple = None
    ) -> dict[str, Any] | None:
        """
        Execute a SELECT query and return a single result as a dictionary.

        Args:
            query: SQL query string with %s placeholders
            params: Query parameters tuple

        Returns:
            Single record as dictionary or None if not found
        """
        with cls.get_connection() as conn, conn.cursor() as cur:
            cur.execute(query, params or ())
            result = cur.fetchone()
            return dict(result) if result else None

    @classmethod
    def execute_write_query(cls, query: str, params: tuple = None) -> int:
        """
        Execute an INSERT/UPDATE/DELETE query.

        Args:
            query: SQL query string with %s placeholders
            params: Query parameters tuple

        Returns:
            Number of affected rows
        """
        with cls.get_connection() as conn, conn.cursor() as cur:
            cur.execute(query, params or ())
            conn.commit()
            return cur.rowcount

    @classmethod
    def health_check(cls) -> dict[str, Any]:
        """Perform a quick health check on the database connection"""
        try:
            with cls.get_connection() as conn, conn.cursor() as cur:
                cur.execute("SELECT 1 as test")
                result = cur.fetchone()
                return {"healthy": True, "test_query": result["test"]}
        except Exception as e:
            return {"healthy": False, "error": str(e)}
