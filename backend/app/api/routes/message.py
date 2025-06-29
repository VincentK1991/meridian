import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.api.services.auth import get_current_user
from app.api.services.message import (
    agent_event_stream,
    get_all_agents_names,
)
from app.api.types.users import User

router = APIRouter(prefix="/session/{session_id}/messages", tags=["messages"])


class ConversationRequest(BaseModel):
    user_input: str
    agents: list[str]


@router.post("")
async def conversation_turn(
    session_id: str,
    request: ConversationRequest,
    user: User = Depends(get_current_user),
):
    """
    Server-sent event endpoint that streams agent responses
    """
    print(request)

    async def event_stream():
        try:
            # Run the agent and stream events
            async for event_string in agent_event_stream(
                agent_names=request.agents,
                user_id=user.user_id,
                session_id=session_id,
                user_input=request.user_input,
            ):
                # Convert event to JSON and format as SSE
                yield f"data: {event_string}\n\n"
        except Exception as e:
            # Send error event
            error_data = {"type": "error", "data": {"message": str(e)}}
            yield f"data: {json.dumps(error_data)}\n\n"
        finally:
            yield f"data: {json.dumps({'type': 'end', 'data': {}})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        },
    )


@router.get("/agents")
async def get_agents():
    return get_all_agents_names()
