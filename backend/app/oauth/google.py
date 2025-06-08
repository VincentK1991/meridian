from datetime import UTC, datetime

from google.auth.transport import requests
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from pydantic import BaseModel

from app.api.types.users import Integration, OAuthIntegration, User
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
    def __init__(self, config: GoogleConfig, integration_type: Integration):
        super().__init__(integration_type)
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
        self.integration_type = integration_type

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
            oauth_integration = OAuthIntegration(
                integration=self.integration_type,
                scope=user_info.scopes,
                access_token=user_info.access_token,
                refresh_token=user_info.refresh_token,
                expires_at=user_info.expires_at
                if isinstance(user_info.expires_at, datetime)
                else datetime.fromisoformat(user_info.expires_at)
                if user_info.expires_at
                else None,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC),
            )

            # Check if user already exists
            user = await db.fetchrow(
                "SELECT * FROM users WHERE email = $1", user_info.email
            )

            if user:
                # Get existing integrations
                user = User(**user)
                existing_integrations = user.oauth_integration

                updated_integrations = self.deduplicate_integrations(
                    existing_integrations + [oauth_integration]
                )

                # Update existing user with new integrations list
                updated_user = await db.fetchrow(
                    """
                    UPDATE users
                    SET oauth_integration = $1, updated_at = CURRENT_TIMESTAMP, name = $3
                    WHERE email = $2
                    RETURNING *
                """,
                    [
                        i.model_dump(mode="json") for i in updated_integrations
                    ],  # Use mode='json' for datetime serialization
                    user_info.email,
                    user_info.name,  # Update name from Google
                )
                return User(**updated_user)
            else:
                # Insert new user with Google integration as first item in list
                new_user = await db.fetchrow(
                    """
                    INSERT INTO users (email, oauth_integration, name, created_at, updated_at)
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING *
                """,
                    user_info.email,
                    [
                        oauth_integration.model_dump(mode="json")
                    ],  # Use mode='json' for datetime serialization
                    user_info.name,
                )
                return User(**new_user)

        except Exception as e:
            raise Exception(f"Failed to store user info in database: {str(e)}")

    def refresh_access_token(self, refresh_token: str):
        """
        Refresh the access token using the refresh token

        Args:
            refresh_token: The refresh token from the initial OAuth flow
            client_id: Google OAuth client ID
            client_secret: Google OAuth client secret

        Returns:
            dict: New access token and related information
        """
        import requests

        token_url = "https://oauth2.googleapis.com/token"

        payload = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.config.client_id,
            "client_secret": self.config.client_secret,
        }

        try:
            response = requests.post(token_url, data=payload)
            response.raise_for_status()

            token_data = response.json()

            return {
                "access_token": token_data.get("access_token"),
                "expires_in": token_data.get("expires_in"),
                "token_type": token_data.get("token_type", "Bearer"),
                # Note: Google may or may not return a new refresh token
                "refresh_token": token_data.get("refresh_token", refresh_token),
            }

        except requests.RequestException as e:
            raise Exception(f"Failed to refresh Google access token: {str(e)}")

    def store_access_token(self, access_token: str):
        """Store the access token"""
        NotImplementedError("Not implemented")

    def store_refresh_token(self, refresh_token: str):
        """Store the refresh token"""
        NotImplementedError("Not implemented")


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
    ),
    Integration.IDENTITY,
)
