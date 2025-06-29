from google.adk.runners import Runner

from app.connectors.neo4j import Neo4jConfig


# Set up filtering context before agent execution
async def create_session_with_search_context(
    runner: Runner,
    app_name: str,
    user_id: str,
    session_id: str,
    neo4j_config: Neo4jConfig,
):
    """Programmatically inject context
    required for connecting to knowledge graph database
    """

    new_session = await runner.session_service.create_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id,
            state={"user:neo4j_config": neo4j_config.model_dump_json()},
    )
    return new_session
