from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from neo4j import AsyncDriver, AsyncGraphDatabase, AsyncSession

from indexing_pipeline.config import settings

load_dotenv()


class Neo4jConnector:
    _driver: AsyncDriver | None = None

    @classmethod
    async def get_driver(cls) -> AsyncDriver:
        if cls._driver is None:
            cls._driver = AsyncGraphDatabase.driver(
                uri=settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password),
                max_connection_lifetime=3600,
                max_connection_pool_size=50,
                connection_acquisition_timeout=60,
            )
        return cls._driver

    @classmethod
    async def close_driver(cls):
        if cls._driver:
            await cls._driver.close()
            cls._driver = None

    @classmethod
    @asynccontextmanager
    async def get_session(
        cls, database: str | None = None
    ) -> AsyncGenerator[AsyncSession, None]:
        """
        Async context manager that yields a Neo4j session.
        The session is automatically closed when the context exits.

        Usage:
        ```python
        async with Neo4jConnector.get_session() as session:
            result = await session.run("MATCH (n) RETURN n LIMIT 10")
            records = await result.data()
        ```
        """
        driver = await cls.get_driver()
        async with driver.session(database=database) as session:
            yield session

    @classmethod
    async def execute_query(
        cls,
        query: str,
        parameters: dict[str, Any] | None = None,
        database: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Execute a Cypher query and return the results as a list of dictionaries.

        Args:
            query: Cypher query string
            parameters: Query parameters
            database: Database name (optional)

        Returns:
            List of records as dictionaries
        """
        async with cls.get_session(database=database) as session:
            result = await session.run(query, parameters or {})
            return await result.data()
