import uuid
from datetime import datetime

import asyncpg
from dotenv import load_dotenv
from faker import Faker
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.genai import types

from app.agents import graph_search_agent
from app.api.types.Event import EventModel
from app.config import settings
from app.connectors.neo4j import Neo4jConfig

load_dotenv()
fake = Faker()

# Example using a local PostgreSQL database:
db_user = "postgres"
db_password = "password123"  # noqa: S105
db_host = "localhost"
db_port = "5432"
db_name = "postgres"
# format: postgres://postgres:password123@localhost:5432/postgres
db_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
session_service = DatabaseSessionService(db_url=db_url)


async def rename_session(session_id: str, title: str):
    conn = await asyncpg.connect(db_url)
    query = """
        UPDATE sessions
        SET title = $2, update_time = $3
        WHERE id = $1
        """
    await conn.execute(query, session_id, title, datetime.utcnow())
    await conn.close()
    return True


async def run_agent(user_message: str, runner: Runner, user_id: str, session_id: str):
    user_content = types.Content(
        role="user", parts=[types.Part.from_text(text=user_message)]
    )
    print(f"User message: {user_message}")
    event_list = []
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=user_content,
    ):
        for parts in event.content.parts:
            if parts.text:
                print(parts.text)
            elif parts.function_call:
                print(parts.function_call.name + " " + str(parts.function_call.args))
            elif parts.function_response:
                print(
                    parts.function_response.name
                    + " "
                    + str(parts.function_response.response)
                )
        event_dict = event.model_dump()
        event_dict["session_id"] = session_id
        event_dict["user_id"] = user_id
        event_model = EventModel(**event_dict)
        event_model_str = event_model.model_dump_json()
        print(event_model_str)
        event_list.append(event)
    return event_list


async def main():
    app_name = "meridian"
    user_id_1 = "6f48d6b6-6e51-4fce-a64f-5d109c59c004"
    session_id = str(uuid.uuid4())
    runner = Runner(
        # Start with the info capture agent
        agent=graph_search_agent,
        app_name=app_name,
        session_service=session_service,
    )
    # check if session exists
    session_exists = await runner.session_service.get_session(
        app_name=app_name, user_id=user_id_1, session_id=session_id
    )
    neo4j_config = Neo4jConfig(
        uri=settings.neo4j_uri,
        user=settings.neo4j_user,
        password=settings.neo4j_password,
    )

    if session_exists:
        print(f"Session exists: {session_exists}")
    else:
        _ = await runner.session_service.create_session(
            app_name=app_name,
            user_id=user_id_1,
            session_id=session_id,
            state={"user:neo4j_config": neo4j_config.model_dump_json()},
        )
        renamed_session_title = fake.catch_phrase().replace(" ", " -")
        await rename_session(session_id, renamed_session_title)

    while True:
        user_message = input("Enter a message: ")
        _ = await run_agent(user_message, runner, user_id_1, session_id)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
