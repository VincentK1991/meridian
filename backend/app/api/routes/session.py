from fastapi import APIRouter, Depends

from app.api.services import sessions
from app.api.types.sessions import Session
from app.connectors.databases import get_postgres

router = APIRouter(prefix="/session", tags=["session"])

@router.get("/{user_id}", response_model=list[Session])
async def get_all_sessions(
    # request: Request,
    # response: Response,
    # current_user=Depends(get_current_user),
    user_id: str,
    db=Depends(get_postgres),
):
    sessions_list = await sessions.get_all_sessions(user_id, db)
    return sessions_list
