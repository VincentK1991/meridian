from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, Request, Response
from jose import JWTError, jwt

from app.api.types.users import User
from app.config import settings
from app.connectors.databases import get_postgres
from app.connectors.postgres import PostgreSQLConnector


async def get_current_user(
    request: Request,
    response: Response,
    db: Annotated[PostgreSQLConnector, Depends(get_postgres)],
):
    """
    Dependency function to validate JWT token and retrieve current user.

    Args:
        token (str): JWT token from request
        db: Postgres database connection

    Returns:
        dict: User document from database

    Raises:
        HTTPException: If token is invalid or user not found

    Used for protected endpoints:
    1. Frontend includes JWT token in request header
    2. This function:
       a. Extracts token from request
       b. Verifies token signature using our secret key
       c. Extracts user email from token
       d. Looks up user in Postgres
    3. If anything fails, user isn't authenticated
    4. Returns user data if successful
    """
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")
    if not access_token or not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized no access token or refresh token",
        )

    try:
        access_token_payload = verify_token(access_token)
        user_id = access_token_payload.get("user_id")

        # Check if access token is expired
        exp = access_token_payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=UTC) > datetime.now(UTC):
            # Access token is still valid, proceed to get user
            user = await db.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)
            if not user:
                raise HTTPException(status_code=401, detail="Unauthorized unknown user")
            return User(**dict(user))

        # Access token is expired, check refresh token
        refresh_token_payload = verify_token(refresh_token)
        email = refresh_token_payload.get("email")
        user_id = refresh_token_payload.get("user_id")

        # Check if refresh token is expired
        exp = refresh_token_payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=UTC) <= datetime.now(UTC):
            # Refresh token is also expired
            raise HTTPException(
                status_code=401, detail="Unauthorized refresh token expired"
            )

        # Refresh token is valid, get user and create new access token
        user = await db.fetchrow("SELECT * FROM users WHERE email = $1", email)
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized unknown user")
        user_obj = User(**dict(user))

        # Create new access token (this would typically be set in response cookies)
        new_access_token = create_access_token(user_obj)
        set_response_cookies(response, new_access_token, refresh_token)

        return user_obj

    except JWTError:
        raise HTTPException(
            status_code=401, detail="Unauthorized invalid access token or refresh token"
        ) from None


def create_access_token(user: User):
    access_token_payload = {
        "user_id": user.user_id,
        "email": user.email,
        "exp": datetime.now(UTC)
        + timedelta(minutes=settings.jwt_access_token_expire_minutes),
    }
    access_token = jwt.encode(
        access_token_payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return access_token


def create_refresh_token(user: User):
    refresh_token_payload = {
        "user_id": user.user_id,
        "email": user.email,
        "exp": datetime.now(UTC)
        + timedelta(days=settings.jwt_refresh_token_expire_days),
    }
    refresh_token = jwt.encode(
        refresh_token_payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return refresh_token


def verify_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"verify_exp": False},
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Unauthorized") from None


def set_response_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=True,
        max_age=604800,
        samesite="lax",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=True,
        max_age=604800,
        samesite="lax",
    )
