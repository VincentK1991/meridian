from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.routes.auth import CurrentUserResponse, GoogleCallback
from app.api.services import oauth_integration
from app.api.services.auth import get_current_user
from app.api.types.integration import IntegrationStatus
from app.api.types.users import User
from app.connectors.databases import get_postgres
from app.connectors.postgres import PostgreSQLConnector

router = APIRouter(prefix="/integration", tags=["integration"])


@router.get("/google/{google_integration}/url")
async def get_google_integration(
    google_integration: str,
    _: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    authorization_url = await oauth_integration.get_google_integration_url(
        google_integration
    )
    return {"authorization_url": authorization_url}


@router.post(
    "/google/{google_integration}/callback", response_model=CurrentUserResponse
)
async def google_integration_callback(
    google_integration: str,
    callback_data: GoogleCallback,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[PostgreSQLConnector, Depends(get_postgres)],
):
    """
    Handles Google OAuth callback, validates tokens, and creates user session.

    Args:
        callback_data (GoogleCallback): Contains OAuth authorization code
        db: MongoDB database connection

    Returns:
        CurrentUserResponse: Contains JWT access token, token type, and user data

    Raises:
        HTTPException: If Google credentials validation fails

    After user logs in with Google:
    1. Google redirects to our frontend with a temporary 'code'
    2. Frontend sends this code to this endpoint
    3. Backend:
       a. Exchanges code for Google access/refresh tokens
       b. Verifies tokens with Google to get user info
       c. Creates/updates user in our MongoDB:
          - Email and name from Google
          - Stores Google tokens for later use
       d. Creates our own JWT token containing:
          - User info (email, name)
          - Google tokens (for accessing Google services later)
          - Expiration time
    4. Frontend receives our JWT token for future requests
    """
    user = await oauth_integration.create_store_user_oauth_tokens(
        google_integration=google_integration,
        callback_data=callback_data,
        current_user=current_user,
        db=db,
    )
    return CurrentUserResponse(user_id=user.user_id, email=user.email, name=user.name)


@router.get("/google/{google_integration}/status", response_model=IntegrationStatus)
async def check_google_integration(
    google_integration: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[PostgreSQLConnector, Depends(get_postgres)],
) -> dict[str, bool]:
    status = await oauth_integration.check_google_integration(
        google_integration,
        current_user,
        db,
    )
    return status
