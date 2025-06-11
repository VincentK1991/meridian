import random
import uuid

from dotenv import load_dotenv
from google.adk import Agent
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.adk.tools.mcp_tool.mcp_toolset import (
    MCPToolset,
    StreamableHTTPServerParams,
)
from google.adk.tools.tool_context import ToolContext
from google.genai import types

load_dotenv()

# Example using a local PostgreSQL database:
db_user = "postgres"
db_password = "password123"
db_host = "localhost"
db_port = "5432"
db_name = "postgres"
# format: postgres://postgres:password123@localhost:5432/postgres
db_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
session_service = DatabaseSessionService(db_url=db_url)

def roll_die(sides: int, tool_context: ToolContext) -> int:
    """Roll a die and return the rolled result.

    Args:
      sides: The integer number of sides the die has.

    Returns:
      An integer of the result of rolling the die.
    """
    result = random.randint(1, sides)
    if "rolls" not in tool_context.state:
        tool_context.state["rolls"] = []

    tool_context.state["rolls"] = tool_context.state["rolls"] + [result]
    return result


async def check_prime(nums: list[int]) -> str:
    """Check if a given list of numbers are prime.

    Args:
      nums: The list of numbers to check.

    Returns:
      A str indicating which number is prime.
    """
    primes = set()
    for number in nums:
        number = int(number)
        if number <= 1:
            continue
        is_prime = True
        for i in range(2, int(number**0.5) + 1):
            if number % i == 0:
                is_prime = False
                break
        if is_prime:
            primes.add(number)
    return (
        "No prime numbers found."
        if not primes
        else f"{', '.join(str(num) for num in primes)} are prime numbers."
    )


root_agent = Agent(
    # model='gemini-2.0-flash-live-001',
    # model='gemini-2.0-flash-lite-preview-02-05',
    #model="gemini-2.0-flash-exp",
    model="gemini-2.0-flash",
    name="hello_world_agent",
    description=(
        "hello world agent that can roll a dice of 8 sides and check prime numbers."
    ),
    instruction="""
      You roll dice and answer questions about the outcome of the dice rolls.
      You can roll dice of different sizes.
      You can use multiple tools in parallel by calling functions in parallel
      (in one request and in one round).
      It is ok to discuss previous dice roles, and comment on the dice rolls.
      When you are asked to roll a die, you must call the roll_die tool with
      the number of sides. Be sure to pass in an integer. Do not pass in a string.
      You should never roll a die on your own.
      When checking prime numbers, call the check_prime tool with a list of integers.
        Be sure to pass in a list of integers. You should never pass in a string.
      You should not check prime numbers before calling the tool.
      When you are asked to roll a die and check prime numbers, you should
      always make the following two function calls:
      1. You should first call the roll_die tool to get a roll. Wait for the
      function response before calling the check_prime tool.
      2. After you get the function response from roll_die tool, you should
      call the check_prime tool with the roll_die result.
        2.1 If user asks you to check primes based on previous rolls, make sure
        you include the previous rolls in the list.
      3. When you respond, you must include the roll_die result from step 1.
      You should always perform the previous 3 steps when asking for a roll
      and checking prime numbers.
      You should not rely on the previous history on prime results.
    """,
    tools=[
        roll_die,
        check_prime,
    ],
)

mcp_agent = Agent(
    model="gemini-2.0-flash",
    name="mcp_agent",
    description=(
        "mcp agent that can call mcp tools."
    ),
    instruction="""
      You are an mcp agent that can call mcp tools.
      this is a calculator tool that can perform basic arithmetic.
    """,
    tools=[
        roll_die,
        check_prime,
        MCPToolset(
            connection_params=StreamableHTTPServerParams(
                url="http://localhost:8001/mcp",
            ),
        ),
    ],
)

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
        # run_config=RunConfig(
        #     streaming_mode=StreamingMode.NONE,
        #     max_llm_calls=15,
        #     support_cfc=True,
        # ),
    ):
        for parts in event.content.parts:
            # breakpoint()
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
        event_list.append(event)
    return event_list


async def main():
    app_name = "meridian"
    user_id_1 = "6f48d6b6-6e51-4fce-a64f-5d109c59c004"
    session_id = str(uuid.uuid4())
    runner = Runner(
    # Start with the info capture agent
        agent=mcp_agent,
        app_name=app_name,
        session_service=session_service,
    )
    # check if session exists
    session_exists = await runner.session_service.get_session(
        app_name=app_name, user_id=user_id_1, session_id=session_id
    )
    if session_exists:
        print(f"Session exists: {session_exists}")
    else:
        session_1 = await runner.session_service.create_session(
            app_name=app_name, user_id=user_id_1, session_id=session_id
        )
        print(f"Session created: {session_1}")

    while True:
        user_message = input("Enter a message: ")
        _ = await run_agent(user_message, runner, user_id_1, session_id)
        # print(result)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
