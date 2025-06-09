from google.adk.agents.run_config import RunConfig, StreamingMode

config = RunConfig(
    streaming_mode=StreamingMode.NONE,
    support_cfc=True,
    max_llm_calls=15
)
