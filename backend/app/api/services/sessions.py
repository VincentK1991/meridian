import uuid
from datetime import datetime

import asyncpg
from faker import Faker

from app.api.types.Event import EventModel
from app.api.types.sessions import Session, SessionCreate
from app.config import settings

fake = Faker()


async def create_new_session(user_id: str, db: asyncpg.Connection):
    session_id = str(uuid.uuid4())
    title = fake.catch_phrase().replace(" ", "-")
    query = """
        INSERT INTO sessions (
            app_name, user_id, id, state, create_time, update_time, title
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        """
    await db.execute(
        query,
        settings.app_name,
        user_id,
        session_id,
        "{}",
        datetime.utcnow(),
        datetime.utcnow(),
        title,
    )
    return SessionCreate(user_id=user_id, session_id=session_id)


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
    # TODO: Implement session deletion
    pass


async def get_all_sessions(user_id: str, db: asyncpg.Connection) -> list[Session]:
    query = """
        SELECT id, s.create_time, s.update_time, title
        FROM sessions AS s
        LEFT JOIN users AS u
        ON uuid(s.user_id) = u.user_id
        WHERE u.user_id = $1
        ORDER BY s.update_time DESC
        """
    result = await db.fetch(query, user_id)
    return [Session(**row) for row in result]


async def rename_session(
    session_id: str, title: str, db: asyncpg.Connection
) -> list[Session]:
    query = """
        UPDATE sessions
        SET title = $2, update_time = $3
        WHERE id = $1
        """
    await db.execute(query, session_id, title, datetime.utcnow())
    return True
