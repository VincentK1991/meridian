"""
Custom Pydantic types for common use cases.
"""

import uuid
from typing import Any

from pydantic_core import core_schema


class UUIDStr(str):
    """
    A custom type that validates UUID input but stores as string.

    Usage:
        class MyModel(BaseModel):
            user_id: UUIDStr
            workspace_id: UUIDStr

    Benefits:
    - Accepts UUID objects or valid UUID strings
    - Always stores as string (JSON serializable)
    - Validates UUID format
    - Type hints show it's a string
    """

    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler
    ) -> core_schema.CoreSchema:
        return core_schema.with_info_before_validator_function(
            cls._validate,
            core_schema.str_schema(),
        )

    @classmethod
    def _validate(cls, value: Any, _: Any) -> str:
        """Validate and convert to string"""
        if isinstance(value, uuid.UUID):
            return str(value)
        if isinstance(value, str):
            try:
                # Validate it's a proper UUID
                uuid.UUID(value)
                return value
            except ValueError:
                raise ValueError(f"Invalid UUID format: {value}") from None
        else:
            raise ValueError(f"Expected UUID or string, got {type(value)}")


# Type alias for backwards compatibility
UUIDString = UUIDStr
