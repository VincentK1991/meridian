import json
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_serializer, field_validator


class TimestampMixin:
    """Mixin to add timestamp fields to Pydantic models"""

    created_at: datetime
    updated_at: datetime


class SoftDeleteMixin:
    """Mixin to add soft delete functionality to Pydantic models"""

    is_deleted: bool = False
    deleted_at: datetime | None = None


class UUIDStringMixin:
    """
    Mixin that validates UUID fields but stores them as strings.

    - Validates UUID inputs (accepts UUID objects or valid UUID strings)
    - Stores UUIDs as strings in the model (not UUID objects)
    - Works with any field that has 'uuid' in its name or is annotated with
    Union[str, uuid.UUID]

    Usage:
        class MyModel(BaseModel, UUIDStringMixin):
            user_id: str  # Will be validated as UUID but stored as string
            workspace_id: str  # Will be validated as UUID but stored as string

    Or with type hints for clarity:
        class MyModel(BaseModel, UUIDStringMixin):
            user_id: Union[str, uuid.UUID]  # Explicit UUID validation
    """

    @field_validator("*", mode="before")
    @classmethod
    def validate_uuid_string_fields(cls, v: Any, info) -> Any:
        """
        Validate UUID fields and convert them to strings.
        Applies to fields with 'id' in name or Union[str, uuid.UUID] annotation.
        """
        if v is None:
            return v

        field_name = info.field_name

        # Check if this field should be treated as a UUID
        should_validate_uuid = False

        if field_name in cls.model_fields:
            field_info = cls.model_fields[field_name]
            field_type = field_info.annotation

            # Check if field is annotated with Union[str, uuid.UUID]
            if hasattr(field_type, "__origin__") and hasattr(field_type, "__args__"):
                type_args = getattr(field_type, "__args__", [])
                if uuid.UUID in type_args:
                    should_validate_uuid = True

            # Auto-detect UUID fields by name pattern (ends with '_id')
            elif field_name.endswith("_id") or field_name in [
                "id",
                "user_id",
                "workspace_id",
                "session_id",
                "message_id",
            ]:
                should_validate_uuid = True

        if should_validate_uuid:
            if isinstance(v, uuid.UUID):
                return str(v)  # Convert UUID object to string
            if isinstance(v, str):
                try:
                    # Validate that it's a valid UUID string
                    uuid.UUID(v)
                    return v  # Return valid UUID string as-is
                except ValueError as err:
                    raise ValueError(
                        f"Invalid UUID format for field '{field_name}': {v}"
                    ) from err

        return v


class UUIDSerializationMixin:
    """
    DEPRECATED: Use UUIDStringMixin instead.

    This mixin converts to UUID objects, but UUIDStringMixin is better
    for most use cases as it stores as strings while validating UUID format.
    """

    @field_validator("*", mode="before")
    @classmethod
    def validate_uuid_fields(cls, v: Any, info) -> Any:
        """Convert UUID strings to UUID objects for validation"""
        if v is None:
            return v

        field_name = info.field_name
        if field_name in cls.model_fields:
            field_info = cls.model_fields[field_name]
            field_type = field_info.annotation

            # Check if field expects UUID type
            if field_type == uuid.UUID or (
                hasattr(field_type, "__origin__")
                and hasattr(field_type, "__args__")
                and uuid.UUID in getattr(field_type, "__args__", [])
            ):
                if isinstance(v, str):
                    try:
                        return uuid.UUID(v)
                    except ValueError:
                        # Let Pydantic handle the validation error
                        pass
                elif isinstance(v, uuid.UUID):
                    return v

        return v

    @field_serializer("*", when_used="json")
    def serialize_uuid_fields(self, value: Any, info) -> Any:
        """Convert UUID objects to strings during JSON serialization"""
        if isinstance(value, uuid.UUID):
            return str(value)
        return value


class JSONParsingMixin:
    """
    Mixin that provides automatic JSON string parsing for all fields.
    Any field that receives a JSON string will be automatically parsed.
    """

    @field_validator("*", mode="before")
    @classmethod
    def parse_json_strings(cls, v: Any, info) -> Any:
        """
        Generic validator that parses JSON strings for any field.
        Only applies to fields that expect complex types (dict, list, BaseModel).
        """
        if v is None or not isinstance(v, str):
            return v

        # Get the field's expected type from the model
        field_name = info.field_name
        if field_name in cls.model_fields:
            field_info = cls.model_fields[field_name]
            field_type = field_info.annotation

            # Check if field expects a complex type that might be JSON
            if hasattr(field_type, "__origin__") or (
                hasattr(field_type, "__class__")
                and issubclass(field_type.__class__, type)
                and issubclass(field_type, BaseModel)
            ):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    # If it's not valid JSON, return as-is
                    # and let Pydantic handle validation
                    return v

        return v
