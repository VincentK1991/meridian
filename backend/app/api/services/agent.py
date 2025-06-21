from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.genai import types

from app.agents.run_config import run_config
from app.api.types.Event import EventModel
from app.config import settings

# Example using a local PostgreSQL database:
db_user = "postgres"
db_password = "password123"  # noqa: S105
db_host = "localhost"
db_port = "5432"
db_name = "postgres"
# format: postgres://postgres:password123@localhost:5432/postgres
db_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
session_service = DatabaseSessionService(db_url=db_url)


def get_runner(agent: Agent, app_name: str):
    my_runner = Runner(agent=agent, app_name=app_name, session_service=session_service)
    return my_runner


def get_session(app_name: str, user_id: str, session_id: str):
    return session_service.get_session(
        app_name=app_name, user_id=user_id, session_id=session_id
    )


async def agent_event_stream(
    agent: Agent, user_id: str, session_id: str, user_input: str
):
    runner = get_runner(agent, settings.app_name)
    user_content = types.Content(
        role="user", parts=[types.Part.from_text(text=user_input)]
    )
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=user_content,
        run_config=run_config,
    ):
        event_dict = event.model_dump()
        event_dict["session_id"] = session_id
        event_dict["user_id"] = user_id
        event_model = EventModel(**event_dict)
        event_model_str = event_model.model_dump_json()
        yield event_model_str
