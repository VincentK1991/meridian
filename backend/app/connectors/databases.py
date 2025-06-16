from collections.abc import AsyncGenerator

import asyncpg
from dotenv import load_dotenv
from neo4j import AsyncSession

from app.connectors.neo4j import Neo4jConnector
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

async def get_neo4j() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a Neo4j session.
    The session is automatically closed when the request is complete.
    """
    async with Neo4jConnector.get_session() as session:
        yield session
