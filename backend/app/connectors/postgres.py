import json
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import asyncpg
from dotenv import load_dotenv

from app.config import settings

load_dotenv()


class PostgreSQLConnector:
    _pool = None

    @classmethod
    async def get_pool(cls):
        if cls._pool is None:
            cls._pool = await asyncpg.create_pool(
                host=settings.postgres_host,
                port=settings.postgres_port,
                user=settings.postgres_user,
                password=settings.postgres_password,
                database=settings.postgres_db,
                min_size=5,
                max_size=20,
                init=cls._init_connection,
            )
        return cls._pool

    @classmethod
    async def _init_connection(cls, connection):
        """Initialize each connection with JSON codec support"""
        await connection.set_type_codec(
            "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
        )

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
