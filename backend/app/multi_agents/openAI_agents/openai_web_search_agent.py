from agents import Agent, ModelSettings, WebSearchTool

from .structured_output import SearchResultWithReferences

web_search_model_settings = ModelSettings(
    tool_choice="required",
    parallel_tool_calls=True,
)

web_search_agent = Agent(
    name="WebSearchAgent",
    instructions="""
    You are a web search agent that can search the web for information.
    You can use this tool to search the web for information.
    You should always use the web search tool to search the web for information.
    You can also cite the sources of the information that you find.

    You must provide the output in the form of
    1. paragraph of search content with reference
    2. summary of the search result
    3. sources of the search result
    """,
    tools=[
        WebSearchTool(),
    ],
    output_type=SearchResultWithReferences,
    model="gpt-4.1",
    model_settings=web_search_model_settings,
)
