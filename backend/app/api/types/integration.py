from datetime import datetime

from pydantic import BaseModel


class IntegrationStatus(BaseModel):
    status: bool
    expires_at: datetime | None
