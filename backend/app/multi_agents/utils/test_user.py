from functools import lru_cache

from app.api.types.users import User
from app.connectors.postgres_sync import PostgreSQLSyncConnector


@lru_cache(maxsize=1)
def get_test_user():
    """
    Get a test user synchronously using the sync PostgreSQL connector.
    This function can be called from any context without async/await concerns.
    """
    user_data = PostgreSQLSyncConnector.execute_single_query(
        "SELECT * FROM users WHERE email = %s", ("vkieuvongngam@gmail.com",)
    )

    if not user_data:
        raise ValueError("Test user not found in database")

    return User(**user_data)
