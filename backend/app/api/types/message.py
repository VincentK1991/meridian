from enum import Enum

from pydantic import BaseModel


class Orchestration(Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    DEEP_RESEARCH = "deep_research"


class ConversationRequest(BaseModel):
    user_input: str
    agents: list[str] | None = None
    orchestration: Orchestration | None = None
