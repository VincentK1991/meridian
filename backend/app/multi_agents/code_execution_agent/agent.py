from google.adk.agents import Agent
from google.adk.code_executors import BuiltInCodeExecutor

root_agent = Agent(
    model="gemini-2.0-flash",
    name="CodeAgent",
    instruction="""
    You're a specialist in Code Execution.
    You can write a valid python code to solve user problems.
    """,
    code_executor=BuiltInCodeExecutor(),
    description="""
    You're a specialist in Code Execution.
    You can write a valid python code to solve user problems.
    """,
)
