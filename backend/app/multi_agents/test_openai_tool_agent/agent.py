from google.adk.agents import Agent

from app.multi_agents.openAI_agents import openai_agent_as_tool, web_search_agent

root_agent = Agent(
    model="gemini-2.0-flash",
    name="searchUsingOpenAIAgent",
    instruction="""
    You're a specialist in web search.
    You have ability to use the web search tool to search the web.
    this tool is agentic AI and can receive a search query in natural language
    and will return json response of
    search results summary, references, and content of the search results.
    You should also provide natural context to help this AI search
    your query should be sufficient and clear to help this AI search
    """,
    description="""
    You're a specialist in web search.
    You can search the web and execute code to solve user problems.
    """,
    tools=[
        openai_agent_as_tool(web_search_agent),
    ],
)
