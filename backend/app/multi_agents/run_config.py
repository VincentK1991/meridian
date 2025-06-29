from google.adk.agents.run_config import RunConfig, StreamingMode

run_config = RunConfig(
    streaming_mode=StreamingMode.NONE, max_llm_calls=15
)
