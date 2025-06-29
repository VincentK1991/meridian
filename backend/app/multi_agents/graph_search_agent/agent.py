from google.adk.agents import Agent
from google.adk.tools.tool_context import ToolContext

from app.connectors.neo4j import Neo4jConfig, Neo4jConnector
from app.utils import embed_text

agent_instruction = """
you are a graph search agent.
you use graph search tool to search for relevant
information from a knowledge graph.

You should also summarize the result of the graph search tool.
so that the user can understand the result with proper context.
"""


async def graph_search_tool(query: str, tool_context: ToolContext) -> str:
    """
    Search the knowledge graph for the given query.
    """
    neo4j_config_str = tool_context.state.get("user:neo4j_config")
    neo4j_config = Neo4jConfig.model_validate_json(neo4j_config_str)
    if not neo4j_config:
        raise ValueError("Neo4j config not found")

    query = """
        CALL db.index.vector.queryNodes('entityEmbedding', 3, $embedding)
        YIELD node AS entity, score
        MATCH path=(entity:Entity)-[r]-(m:Entity)
        RETURN entity.description as source, r.description as relation,
        m.description as target, score
        LIMIT 10
    """
    embedding = await embed_text([query])
    embedding = embedding[0]
    parameters = {"embedding": embedding}

    async with Neo4jConnector.get_session(config=neo4j_config) as session:
        result = await session.run(query, parameters)
        return await result.data()


root_agent = Agent(
    name="root_agent",
    description="a graph search agent.",
    instruction=agent_instruction,
    model="gemini-2.0-flash",
    tools=[graph_search_tool],
)
