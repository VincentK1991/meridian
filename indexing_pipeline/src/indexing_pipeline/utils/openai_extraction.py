from agents import Agent, Runner

from indexing_pipeline.ontology.Academic import AcademicGraph


def openai_agent_as_tool(agent: Agent):
    async def run(user_message: str):
        result = await Runner.run(agent, user_message)
        return result.final_output

    return run


graph_extraction_agent = Agent(
    name="graph_extraction_agent",
    instructions="""
    You are a graph extraction agent that can extract the graph from the text.
    pay attention to the following:
    Author, concept, material outcome, implicit knowledge are the entities of the graph

    Author must be a person,
    Concept is an abstract idea,
    MaterialOutcome is an improvement, methodology, tools, model artifacts, etc.
    that is a created by the concept
    ImplicitKnowledge is background information,
    well known concepts, that the concept depends on or is related to
    even though they may not be explicitly mentioned in the text.


    These are the possible relationships between the entities:
    - Author can develop concepts
    - Concept can be related to other concepts
    - Concept can create material outcomes
    - Concept can require implicit knowledge

    You should extract as many graphs as possible from the text.
    You should also infer the concept, implicit knowledge or
     background information related to the subject domain
     or relations of ideas between concepts mentioned in the text and
      well known concepts even though
    they may not be explicitly mentioned in the text.
    """,
    output_type=AcademicGraph,
    model="gpt-4.1-nano",
)
