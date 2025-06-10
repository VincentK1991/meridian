import json
import pickle
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class EventRole(str, Enum):
    USER = "user"
    MODEL = "model"

class FunctionCallModel(BaseModel):
    id: str
    name: str
    args: str | dict

    @field_validator("args", mode="before")
    @classmethod
    def validate_args(cls, v):
        """Handle args field - can be string (JSON) or dict"""
        if isinstance(v, dict):
            # If it's already a dict, convert to JSON string or keep as dict
            # depending on your preference - here I'll keep as dict
            return v
        elif isinstance(v, str):
            try:
                # Try to parse as JSON if it's a string
                return json.loads(v)
            except json.JSONDecodeError:
                # If not valid JSON, return as string
                return v
        return v


class FunctionResponseModel(BaseModel):
    id: str
    name: str
    response: str | dict | None = None


class PartsModel(BaseModel):
    text: str | None = None
    function_response: FunctionResponseModel | None = None
    function_call: FunctionCallModel | None = None


class ContentModel(BaseModel):
    role: EventRole
    parts: list[PartsModel]

    @classmethod
    def from_json_string(cls, json_string: str) -> "ContentModel":
        """Create ContentModel from JSON string"""
        return cls.model_validate_json(json_string)


class EventModel(BaseModel):
    event_id: str = Field(alias="id")
    user_id: str
    session_id: str
    invocation_id: str
    author: str
    branch: str | None = None
    timestamp: datetime
    content: ContentModel
    actions: Any  # Can be bytes (pickled), string, or deserialized object
    #long_running_tool_ids_json: str | dict | None = None
    grounding_metadata: str | None = None
    partial: bool | None = None
    turn_complete: bool | None = None
    error_code: str | None = None
    error_message: str | None = None
    interrupted: bool | None = None

    @field_validator("content", mode="before")
    @classmethod
    def validate_content(cls, v):
        """Automatically convert JSON string to ContentModel"""
        if isinstance(v, str):
            return ContentModel.model_validate_json(v)
        return v

    @field_validator("actions", mode="before")
    @classmethod
    def validate_actions(cls, v):
        """Handle actions field - can be bytes (pickled), string, or object"""
        if isinstance(v, bytes):
            try:
                # Try to unpickle the binary data
                return pickle.loads(v)
            except Exception:
                # If unpickling fails, keep as bytes
                return v
        return v

    # @field_validator("long_running_tool_ids_json", mode="before")
    # @classmethod
    # def validate_long_running_tool_ids(cls, v):
    #     """Convert JSON string/list to dict if needed"""
    #     if isinstance(v, str):
    #         return json.loads(v) if v and v != "null" else {}
    #     elif isinstance(v, list):
    #         # Handle empty list or list of IDs
    #         if not v:  # Empty list
    #             return {}
    #         else:
    #             # Convert list to dict (assuming list of tool IDs)
    #             return {str(i): tool_id for i, tool_id in enumerate(v)}
    #     elif v is None:
    #         return {}
    #     return v or {}

    @field_validator("grounding_metadata", mode="before")
    @classmethod
    def validate_grounding_metadata(cls, v):
        """Handle grounding_metadata JSON string"""
        if isinstance(v, str) and v == "null":
            return None
        return v
