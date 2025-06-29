from agents import Agent, Runner


def openai_agent_as_tool(agent: Agent):
    async def run(user_message: str):
        result = await Runner.run(agent, user_message)
        return result.final_output

    return run
