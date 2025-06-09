from collections.abc import AsyncGenerator

import asyncpg
from dotenv import load_dotenv

from app.connectors.postgres import PostgreSQLConnector

load_dotenv()


async def get_postgres() -> AsyncGenerator[asyncpg.Connection, None]:
    """
    FastAPI dependency that yields a PostgreSQL connection.
    The connection is automatically returned to the pool when the request is complete.

    Usage in FastAPI routes:
    ```python
    @router.get("/users")
    async def get_users(db = Depends(get_postgres)):
        result = await db.fetch("SELECT * FROM users")
        return result
    ```
    """
    async with PostgreSQLConnector.get_connection() as connection:
        yield connection
