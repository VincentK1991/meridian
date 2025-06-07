from typing import AsyncGenerator
import asyncpg
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

class PostgreSQLConnector:
    _pool = None

    @classmethod
    async def get_pool(cls):
        if cls._pool is None:
            cls._pool = await asyncpg.create_pool(
                host=os.getenv("POSTGRES_HOST", "localhost"),
                port=int(os.getenv("POSTGRES_PORT", "5432")),
                user=os.getenv("POSTGRES_USER", "postgres"),
                password=os.getenv("POSTGRES_PASSWORD", "password123"),
                database=os.getenv("POSTGRES_DB", "postgres"),
                min_size=5,
                max_size=20
            )
        return cls._pool

    @classmethod
    async def close_pool(cls):
        if cls._pool:
            await cls._pool.close()
            cls._pool = None

    @classmethod
    @asynccontextmanager
    async def get_connection(cls) -> AsyncGenerator[asyncpg.Connection, None]:
        """
        Async context manager that yields a PostgreSQL connection from the pool.
        The connection is automatically returned to the pool when the context exits.
        
        Usage:
        ```python
        async with PostgreSQLConnector.get_connection() as conn:
            result = await conn.fetch("SELECT * FROM users")
        ```
        """
        pool = await cls.get_pool()
        async with pool.acquire() as connection:
            yield connection