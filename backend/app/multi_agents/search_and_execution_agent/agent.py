from google.adk.agents import Agent
from google.adk.tools import agent_tool

from app.multi_agents import coding_agent, google_search_agent

root_agent = Agent(
    model="gemini-2.0-flash",
    name="SearchAndExecutionAgent",
    instruction="""
    You're a specialist in Search and Execution.
    You can use the agents as tools to either perform a search
    or execute code to solve user problems.
    make sure that the tools return the correct output.
    and you should summarize the output back to the user.
    if the coding agent does not perform the code execution,
    you should make sure to tell the agent to perform the code execution.
    if the search agent returns a search result,
    you should summarize the search result back to the user.
    """,
    description="""
    You're a specialist in Search and Execution.
    You can search the web and execute code to solve user problems.
    """,
    tools=[
        agent_tool.AgentTool(agent=google_search_agent),
        agent_tool.AgentTool(agent=coding_agent),
    ],
)
