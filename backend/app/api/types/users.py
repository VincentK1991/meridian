from datetime import datetime
from enum import Enum

from pydantic import BaseModel

from .custom_types import UUIDStr
from .mixins import JSONParsingMixin, TimestampMixin


class Integration(Enum):
    IDENTITY = "identity"
    GOOGLE = "google"
    GITHUB = "github"
    MICROSOFT = "microsoft"
    CALENDAR = "calendar"
    DRIVE = "drive"
    GMAIL = "gmail"


class OAuthIntegration(BaseModel, TimestampMixin):
    integration: Integration
    scope: list[str]
    access_token: str
    refresh_token: str
    expires_at: datetime


class User(BaseModel, TimestampMixin, JSONParsingMixin):
    user_id: UUIDStr  # Custom type: validates UUID, stores as string
    oauth_integration: list[OAuthIntegration] | None = None  # List of integrations
    email: str
    name: str


class Session(BaseModel, TimestampMixin):
    session_id: UUIDStr  # Custom type: validates UUID, stores as string
    user_id: UUIDStr  # Custom type: validates UUID, stores as string
    session_name: str
