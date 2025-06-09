from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

session_service = InMemorySessionService()


def create_new_session(app_name: str, user_id: str, session_id: str):
    session_service.create_session(
        app_name=app_name, user_id=user_id, session_id=session_id
    )

def get_runner(agent: Agent, app_name: str):
    my_runner = Runner(
        agent=agent,
        app_name=app_name,
        session_service=session_service
    )
    return my_runner

def get_session(app_name: str, user_id: str, session_id: str):
    return session_service.get_session(
        app_name=app_name, user_id=user_id, session_id=session_id
    )

async def run_agent(runner, run_config, user_input):
    return await runner.run_async(
        user_input=user_input,
        run_config=run_config
    )



