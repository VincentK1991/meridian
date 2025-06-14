from fastapi import APIRouter, Depends

from app.api.services import sessions
from app.api.services.auth import get_current_user
from app.api.types.Event import EventModel
from app.api.types.sessions import Session, SessionCreate
from app.api.types.users import User
from app.connectors.databases import get_postgres

router = APIRouter(prefix="/session", tags=["session"])


@router.get("/users/{user_id}/sessions", response_model=list[Session])
async def get_all_sessions(
    user_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_postgres),
):
    sessions_list = await sessions.get_all_sessions(user_id, db)
    return sessions_list


@router.get("/sessions/{session_id}/events", response_model=list[EventModel])
async def get_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_postgres),
):
    session_list = await sessions.get_session(session_id, db)
    return session_list

@router.post("/create", response_model=SessionCreate)
async def create_session(
    user: User = Depends(get_current_user),
    db=Depends(get_postgres),
):
    session_create = await sessions.create_new_session(user.user_id, db)
    return session_create
