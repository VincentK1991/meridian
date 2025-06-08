from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel

from app.api.services import auth
from app.api.services.auth import get_current_user
from app.api.types.custom_types import UUIDStr
from app.connectors.databases import get_postgres
from app.oauth.google import google_profile_oauth

router = APIRouter(prefix="/auth", tags=["authentication"])

class GoogleCallback(BaseModel):
    code: str
    state: str

class CurrentUserResponse(BaseModel):
    user_id: UUIDStr
    email: str
    name: str

@router.get("/google/url")
async def get_google_auth_url(request: Request):
    """
    Generates Google OAuth authorization URL for client-side redirect.

    Returns:
        dict: Contains authorization URL for Google OAuth consent screen

    When user clicks 'Login with Google':
    1. Frontend calls this endpoint
    2. Backend generates special URL using Google's OAuth flow
    3. URL includes:
       - Our app's client ID
       - Requested permissions (scopes)
       - Where to redirect after login
    4. Frontend receives URL and redirects user to Google's login page
    """
    authorization_url = google_profile_oauth.get_auth_url()

    return {"url": authorization_url}


@router.post("/google/callback", response_model=CurrentUserResponse)
async def google_auth_callback(
    request: Request,
    response: Response,
    callback_data: GoogleCallback,
    db=Depends(get_postgres),
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
    google_user_info = google_profile_oauth.get_user_info(
        callback_data.code, callback_data.state
    )
    user = await google_profile_oauth.store_user_info(google_user_info, db)
    access_token = await auth.create_access_token(user)
    refresh_token = await auth.create_refresh_token(user)
    await auth.set_response_cookies(response, access_token, refresh_token)

    return CurrentUserResponse(
        user_id=user.user_id,
        email=user.email,
        name=user.name
    )


@router.get("/me", response_model=CurrentUserResponse)
async def refresh_me(current_user=Depends(get_current_user)):
    """
    Example of protected endpoint.
    1. Frontend includes JWT token in cookies
    2. get_current_user verifies token signature
    3. returns user profile from postgres if authenticated

    Returns the current authenticated user's information.

    Args:
        current_user: User document from database (injected by dependency)

    Returns:
        dict: Current user's information
    """
    current_user_package = CurrentUserResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        name=current_user.name
    )
    return current_user_package

@router.post("/logout")
async def logout(request: Request, response: Response):
    """
    Logs out the current user.
    """
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}
