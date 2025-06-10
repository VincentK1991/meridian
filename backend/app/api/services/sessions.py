import asyncpg

from app.api.types.Event import EventModel
from app.api.types.sessions import Session


async def create_new_session(user_id: str):
    #TODO: Implement session creation
    pass

async def get_session(session_id: str, db: asyncpg.Connection) -> list[EventModel]:
    query = """
        SELECT *
        FROM events
        WHERE session_id = $1
        ORDER BY timestamp ASC
        """
    result = await db.fetch(query, session_id)
    return [EventModel(**row) for row in result]


async def delete_session(session_id: str):
    #TODO: Implement session deletion
    pass

async def get_all_sessions(user_id: str, db: asyncpg.Connection) -> list[Session]:
    query = """
        SELECT id, s.create_time, s.update_time
        FROM sessions AS s
        LEFT JOIN users AS u
        ON uuid(s.user_id) = u.user_id
        WHERE u.user_id = $1
        """
    result = await db.fetch(query, user_id)
    return [Session(**row) for row in result]


