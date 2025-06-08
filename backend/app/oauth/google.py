from datetime import datetime

from google.auth.transport import requests
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from pydantic import BaseModel

from app.api.types.users import User
from app.config import settings
from app.oauth.base_oauth import BaseOAuth


class GoogleConfig(BaseModel):
    client_id: str
    client_secret: str
    redirect_uri: str
    scopes: list[str]


class GoogleUserInfo(BaseModel):
    id: str
    email: str
    name: str
    picture: str
    email_verified: bool
    access_token: str
    refresh_token: str
    id_token: str
    expires_at: str | None = None  # Can be None if no expiry
    scopes: list[str]


class GoogleOAuth(BaseOAuth):
    def __init__(self, config: GoogleConfig):
        self.config = config
        self.client_config = {
            "web": {
                "client_id": self.config.client_id,
                "client_secret": self.config.client_secret,
                "redirect_uris": [self.config.redirect_uri],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            }
        }
        self.flow = Flow.from_client_config(
            self.client_config,
            scopes=self.config.scopes,
            redirect_uri=self.config.redirect_uri,
        )

    def get_auth_url(self):
        authorization_url, state = self.flow.authorization_url(
            access_type="offline", include_granted_scopes=False, prompt="consent"
        )
        return authorization_url

    def get_user_info(self, code: str, state: str) -> dict:
        """
        Exchange authorization code for tokens and get user info from Google.

        Args:
            code (str): Authorization code from Google OAuth callback
            state (str): State parameter to prevent CSRF attacks

        Returns:
            Dict: User information including tokens and profile data
        """
        try:
            print(
                f"DEBUG: Attempting OAuth with code: {code[:10]}... state: {state[:10]}..."
            )
            print(f"DEBUG: Using redirect_uri: {self.config.redirect_uri}")

            # Create a new flow with the same state for security
            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.config.scopes,
                state=state,
                redirect_uri=self.config.redirect_uri,
            )

            # Exchange authorization code for tokens
            google_tokens = flow.fetch_token(code=code)
            credentials = flow.credentials

            # Verify and decode the ID token to get user info
            id_info = id_token.verify_oauth2_token(
                credentials.id_token, requests.Request(), self.config.client_id
            )

            # Return user info and tokens
            return GoogleUserInfo(
                id=id_info.get("sub"),  # Google user ID
                email=id_info.get("email"),
                name=id_info.get("name"),
                picture=id_info.get("picture"),
                email_verified=id_info.get("email_verified", False),
                access_token=google_tokens.get("access_token"),
                refresh_token=google_tokens.get("refresh_token"),
                id_token=google_tokens.get("id_token"),
                expires_at=credentials.expiry.isoformat()
                if credentials.expiry
                else None,
                scopes=credentials.granted_scopes
                if hasattr(credentials, "granted_scopes")
                else self.config.scopes,
            )

        except Exception as e:
            raise Exception(f"Failed to get user info from Google: {str(e)}")

    async def store_user_info(self, user_info: GoogleUserInfo, db):
        try:
            # Prepare OAuth integration data as JSON
            oauth_integration = {
                "integration": "identity",
                "scope": user_info.scopes,
                "access_token": user_info.access_token,
                "refresh_token": user_info.refresh_token,
                "expires_at": user_info.expires_at.isoformat()
                if isinstance(user_info.expires_at, datetime)
                else user_info.expires_at,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }

            # Check if user already exists
            user = await db.fetchrow(
                "SELECT * FROM users WHERE email = $1", user_info.email
            )

            if user:
                # Update existing user - asyncpg requires JSON as string
                updated_user = await db.fetchrow(
                    """
                    UPDATE users
                    SET oauth_integration = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE email = $2
                    RETURNING *
                """,
                    oauth_integration,
                    user_info.email,
                )
                return User(**updated_user)
            else:
                # Insert new user - asyncpg requires JSON as string
                new_user = await db.fetchrow(
                    """
                    INSERT INTO users (email, oauth_integration, name, created_at, updated_at)
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING *
                """,
                    user_info.email,
                    oauth_integration,  # asyncpg expects JSON as string
                    user_info.name,
                )
                return User(**new_user)

        except Exception as e:
            raise Exception(f"Failed to store user info in database: {str(e)}")


google_profile_oauth = GoogleOAuth(
    GoogleConfig(
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        redirect_uri=settings.google_oauth_redirect_uri,
        scopes=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ],
    )
)
