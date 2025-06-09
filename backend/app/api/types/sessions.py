from datetime import datetime

from pydantic import BaseModel

from .custom_types import UUIDStr


class Session(BaseModel):
    id: UUIDStr
    create_time: datetime
    update_time: datetime
