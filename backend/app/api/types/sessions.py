from pydantic import BaseModel

from .custom_types import UUIDStr
from .mixins import TimestampMixin


class Session(BaseModel, TimestampMixin):
    session_id: UUIDStr
    user_id: UUIDStr
    session_name: str
