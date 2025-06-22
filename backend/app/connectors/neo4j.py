from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any, ClassVar

from dotenv import load_dotenv
from neo4j import AsyncDriver, AsyncGraphDatabase, AsyncSession
from pydantic import BaseModel

from app.config import settings

load_dotenv()


class Neo4jConfig(BaseModel):
    uri: str
    user: str
    password: str


class Neo4jConnector:
    _drivers: ClassVar[dict[str, AsyncDriver]] = {}

    @classmethod
    def _get_config_key(cls, config: Neo4jConfig) -> str:
        """Generate a unique key for the config to use as cache key."""
        return f"{config.uri}:{config.user}"

    @classmethod
    async def get_driver(cls, config: Neo4jConfig | None = None) -> AsyncDriver:
        """
        Get or create an AsyncDriver based on the provided config.
        If no config is provided, uses default settings.

        Args:
            config: Neo4jConfig instance with connection details

        Returns:
            AsyncDriver instance
        """
        if config is None:
            # Use default settings if no config provided
            config = Neo4jConfig(
                uri=settings.neo4j_uri,
                user=settings.neo4j_user,
                password=settings.neo4j_password,
            )

        config_key = cls._get_config_key(config)

        if config_key not in cls._drivers:
            cls._drivers[config_key] = AsyncGraphDatabase.driver(
                uri=config.uri,
                auth=(config.user, config.password),
                max_connection_lifetime=3600,
                max_connection_pool_size=50,
                connection_acquisition_timeout=60,
            )
        return cls._drivers[config_key]

    @classmethod
    async def close_driver(cls, config: Neo4jConfig | None = None):
        """
        Close a specific driver or all drivers.

        Args:
            config: Neo4jConfig instance. If None, closes all drivers.
        """
        if config is None:
            # Close all drivers
            for driver in cls._drivers.values():
                await driver.close()
            cls._drivers.clear()
        else:
            config_key = cls._get_config_key(config)
            if config_key in cls._drivers:
                await cls._drivers[config_key].close()
                del cls._drivers[config_key]

    @classmethod
    @asynccontextmanager
    async def get_session(
        cls, config: Neo4jConfig | None = None, database: str | None = None
    ) -> AsyncGenerator[AsyncSession, None]:
        """
        Async context manager that yields a Neo4j session.
        The session is automatically closed when the context exits.

        Args:
            config: Neo4jConfig instance with connection details
            database: Database name (optional)

        Usage:
        ```python
        config = Neo4jConfig(
            uri="bolt://localhost:7687",
            user="neo4j",
            password="password",
        )
        async with Neo4jConnector.get_session(config=config) as session:
            result = await session.run("MATCH (n) RETURN n LIMIT 10")
            records = await result.data()
        ```
        """
        driver = await cls.get_driver(config)
        async with driver.session(database=database) as session:
            yield session

    @classmethod
    async def execute_query(
        cls,
        query: str,
        parameters: dict[str, Any] | None = None,
        config: Neo4jConfig | None = None,
        database: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Execute a Cypher query and return the results as a list of dictionaries.

        Args:
            query: Cypher query string
            parameters: Query parameters
            config: Neo4jConfig instance with connection details
            database: Database name (optional)

        Returns:
            List of records as dictionaries
        """
        async with cls.get_session(config=config, database=database) as session:
            result = await session.run(query, parameters or {})
            return await result.data()

    @classmethod
    async def execute_write_query(
        cls,
        query: str,
        parameters: dict[str, Any] | None = None,
        config: Neo4jConfig | None = None,
        database: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Execute a write Cypher query within a write transaction.

        Args:
            query: Cypher query string
            parameters: Query parameters
            config: Neo4jConfig instance with connection details
            database: Database name (optional)

        Returns:
            List of records as dictionaries
        """

        async def _execute_write(tx):
            result = await tx.run(query, parameters or {})
            return await result.data()

        async with cls.get_session(config=config, database=database) as session:
            return await session.execute_write(_execute_write)

    @classmethod
    async def execute_read_query(
        cls,
        query: str,
        parameters: dict[str, Any] | None = None,
        config: Neo4jConfig | None = None,
        database: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Execute a read Cypher query within a read transaction.

        Args:
            query: Cypher query string
            parameters: Query parameters
            config: Neo4jConfig instance with connection details
            database: Database name (optional)

        Returns:
            List of records as dictionaries
        """

        async def _execute_read(tx):
            result = await tx.run(query, parameters or {})
            return await result.data()

        async with cls.get_session(config=config, database=database) as session:
            return await session.execute_read(_execute_read)

    @classmethod
    async def verify_connectivity(cls, config: Neo4jConfig | None = None) -> bool:
        """
        Verify that the Neo4j database is accessible.

        Args:
            config: Neo4jConfig instance with connection details

        Returns:
            True if connection is successful, False otherwise
        """
        try:
            driver = await cls.get_driver(config)
            await driver.verify_connectivity()
            return True
        except Exception:
            return False
