from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.services import sessions
from app.api.services.auth import get_current_user
from app.api.types.Event import EventModel
from app.api.types.sessions import Session, SessionCreate, SessionUpdate
from app.api.types.users import User
from app.connectors.databases import get_postgres

router = APIRouter(prefix="/sessions", tags=["sessions"])


# GET /sessions - List all sessions for the authenticated user
@router.get("", response_model=list[Session])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db=Depends(get_postgres),
):
    """List all sessions for the authenticated user."""
    sessions_list = await sessions.get_all_sessions(current_user.user_id, db)
    return sessions_list


@router.get("/paginated", response_model=list[Session])
async def list_paginated_sessions(
    current_user: User = Depends(get_current_user),
    db=Depends(get_postgres),
    limit: int = Query(
        default=10, ge=1, le=50, description="Number of sessions to return"
    ),
    cursor: str | None = Query(
        default=None, description="Cursor for pagination (ISO datetime string)"
    ),
):
    """List paginated sessions for the authenticated user."""
    # If no cursor provided, use current UTC time as starting point
    # This matches how sessions are created with datetime.utcnow()
    cursor_time = datetime.now(UTC)
    if cursor:
        try:
            # Parse the ISO string and convert to naive datetime (remove timezone info)
            # since the database column is timestamp without timezone (stores UTC)
            parsed_time = datetime.fromisoformat(cursor.replace("Z", "+00:00"))
            cursor_time = parsed_time.replace(tzinfo=None)
        except ValueError:
            cursor_time = datetime.now(UTC)

    sessions_list = await sessions.get_paginated_sessions(
        current_user.user_id, cursor_time, limit, db
    )
    return sessions_list


# POST /sessions - Create a new session
@router.post("", response_model=SessionCreate, status_code=status.HTTP_201_CREATED)
async def create_session(
    current_user: User = Depends(get_current_user),
    db=Depends(get_postgres),
):
    """Create a new session for the authenticated user."""
    session_create = await sessions.create_new_session(current_user.user_id, db)

    # Get the created session to return full Session model
    session = await sessions.get_session_by_id(session_create.session_id, db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve created session",
        )
    return session_create


# GET /sessions/{session_id} - Get a specific session
@router.get("/{session_id}", response_model=Session)
async def get_session_by_id(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_postgres),
):
    """Get a specific session by ID."""
    session = await sessions.get_session_by_id(session_id, db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    # Verify session belongs to current user
    if session.user_id != str(current_user.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this session is forbidden",
        )

    return session


# GET /sessions/{session_id}/events - Get events for a specific session
@router.get("/{session_id}/events", response_model=list[EventModel])
async def list_session_events(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_postgres),
):
    """Get all events for a specific session."""
    # First verify session exists and belongs to user
    session = await sessions.get_session_by_id(session_id, db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if session.user_id != str(current_user.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this session is forbidden",
        )

    events = await sessions.get_session(session_id, db)
    return events


# PUT /sessions/{session_id} - Update a session (for renaming)
@router.put("/{session_id}", response_model=Session)
async def update_session(
    session_id: str,
    session_update: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_postgres),
):
    """Update a session (e.g., rename title)."""
    # Verify session exists and belongs to user
    session = await sessions.get_session_by_id(session_id, db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if session.user_id != str(current_user.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this session is forbidden",
        )

    # Update the session
    success = await sessions.rename_session(session_id, session_update.title, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update session",
        )

    # Return updated session
    updated_session = await sessions.get_session_by_id(session_id, db)
    return updated_session


# DELETE /sessions/{session_id} - Delete a session
@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_postgres),
):
    """Delete a session."""
    # Verify session exists and belongs to user
    session = await sessions.get_session_by_id(session_id, db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    if session.user_id != str(current_user.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this session is forbidden",
        )

    deleted = await sessions.delete_session(session_id, db)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete session",
        )

    # Return 204 No Content for successful deletion
    return
