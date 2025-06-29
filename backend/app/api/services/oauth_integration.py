from fastapi import HTTPException

from app.api.routes.auth import GoogleCallback
from app.api.types.users import User
from app.connectors.postgres import PostgreSQLConnector
from app.oauth.google_integration import (
    google_calendar_oauth,
    google_drive_oauth,
    google_gmail_oauth,
)


async def get_google_integration_url(google_integration: str):
    if google_integration == "calendar":
        return google_calendar_oauth.get_auth_url()
    if google_integration == "drive":
        return google_drive_oauth.get_auth_url()
    if google_integration == "gmail":
        return google_gmail_oauth.get_auth_url()
    raise HTTPException(status_code=400, detail="Invalid Google integration")


async def create_store_user_oauth_tokens(
    google_integration: str,
    callback_data: GoogleCallback,
    current_user: User,
    db: PostgreSQLConnector,
):
    breakpoint()
    if google_integration == "calendar":
        oauth_integration_strategy = google_calendar_oauth
    elif google_integration == "drive":
        oauth_integration_strategy = google_drive_oauth
    elif google_integration == "gmail":
        oauth_integration_strategy = google_gmail_oauth
    else:
        raise HTTPException(status_code=400, detail="Invalid Google integration")
    breakpoint()
    google_user_info = oauth_integration_strategy.get_user_info(
        callback_data.code, callback_data.state
    )
    breakpoint()
    user = await oauth_integration_strategy.store_user_info(
        user_info=google_user_info,
        current_user=current_user,
        db=db,
    )
    return user


async def check_google_integration(
    google_integration: str, current_user: User, db: PostgreSQLConnector
):
    if google_integration == "calendar":
        oauth_integration_strategy = google_calendar_oauth
    elif google_integration == "drive":
        oauth_integration_strategy = google_drive_oauth
    elif google_integration == "gmail":
        oauth_integration_strategy = google_gmail_oauth
    else:
        raise HTTPException(status_code=400, detail="Invalid Google integration")
    status = await oauth_integration_strategy.check_valid_integration(
        google_integration, current_user, db
    )
    return status
