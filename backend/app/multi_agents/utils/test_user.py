from functools import lru_cache

from app.api.types.users import User
from app.connectors.postgres import PostgreSQLConnector


@lru_cache(maxsize=1)
def get_test_user():
    import asyncio
    async def _get_user():
        async with PostgreSQLConnector.get_connection() as conn:
            user = await conn.fetchrow(
                "SELECT * FROM users WHERE email = $1",
                "vkieuvongngam@gmail.com",
            )
            return User(**dict(user))
    return asyncio.run(_get_user())
