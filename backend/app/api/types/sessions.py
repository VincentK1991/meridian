from datetime import datetime

from pydantic import BaseModel

from .custom_types import UUIDStr


class SessionCreate(BaseModel):
    user_id: UUIDStr
    session_id: UUIDStr


class Session(BaseModel):
    id: UUIDStr
    create_time: datetime
    update_time: datetime
    title: str
