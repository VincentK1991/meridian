from google.adk.agents import Agent, ParallelAgent, SequentialAgent
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.genai import types

from app.api.types.Event import EventModel
from app.api.types.message import Orchestration
from app.config import settings
from app.multi_agents import (
    calculator_agent,
    coding_agent,
    google_search_agent,
    graph_search_agent,
    search_using_openai_agent,
)
from app.multi_agents.run_config import run_config

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
    agent_names: list[str],
    orchestration_strategy: Orchestration,
    user_id: str,
    session_id: str,
    user_input: str,
):
    main_agent = prepare_agents(agent_names, orchestration_strategy)
    runner = get_runner(main_agent, settings.app_name)
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


def get_agent(agent_name: str):
    if agent_name == "google_search_agent":
        return google_search_agent
    if agent_name == "coding_agent":
        return coding_agent
    if agent_name == "calculator_agent":
        return calculator_agent
    if agent_name == "graph_search_agent":
        return graph_search_agent
    if agent_name == "search_using_openai_agent":
        return search_using_openai_agent
    raise ValueError(f"Agent {agent_name} not found")


def get_all_agents_names() -> list[str]:
    return [
        "google_search_agent",
        "coding_agent",
        "calculator_agent",
        "graph_search_agent",
        "search_using_openai_agent",
    ]


def prepare_agents(
    agent_names: list[str], orchestration_strategy: Orchestration
) -> Agent:
    if len(agent_names) == 0:
        return google_search_agent
    if len(agent_names) == 1:
        return get_agent(agent_names[0])
    sub_agents = [get_agent(agent) for agent in agent_names]
    if orchestration_strategy == Orchestration.SEQUENTIAL:
        sequential_agent = SequentialAgent(
            name="SequentialPipelineAgent",
            sub_agents=sub_agents,
            description="Executes a sequence of agents in order",
        )
        return sequential_agent
    if orchestration_strategy == Orchestration.PARALLEL:
        parallel_agent = ParallelAgent(
            name="ParallelPipelineAgent",
            sub_agents=sub_agents,
            description="Executes a sequence of agents in parallel",
        )
        return parallel_agent
    if orchestration_strategy == Orchestration.DEEP_RESEARCH:
        return google_search_agent  # TODO: implement deep research
    raise ValueError(f"Orchestration strategy {orchestration_strategy} not found")
