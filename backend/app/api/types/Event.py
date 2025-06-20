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


class CodeExecutionModel(BaseModel):
    code: str
    language: str


class CodeExecutionResultModel(BaseModel):
    output: str
    outcome: str


class PartsModel(BaseModel):
    text: str | None = None
    function_response: FunctionResponseModel | None = None
    function_call: FunctionCallModel | None = None
    executable_code: CodeExecutionModel | None = None
    code_execution_result: CodeExecutionResultModel | None = None


class ContentModel(BaseModel):
    role: EventRole
    parts: list[PartsModel]

    @classmethod
    def from_json_string(cls, json_string: str) -> "ContentModel":
        """Create ContentModel from JSON string"""
        return cls.model_validate_json(json_string)


class WebInfo(BaseModel):
    domain: str | None = None
    title: str | None = None
    uri: str | None = None


class GroundingChunk(BaseModel):
    retrieved_context: str | None = None
    web: WebInfo | None = None


class Segment(BaseModel):
    end_index: int
    part_index: int | None = None
    start_index: int
    text: str


class GroundingSupport(BaseModel):
    confidence_scores: list[float]
    grounding_chunk_indices: list[int]
    segment: Segment


class RetrievalMetadata(BaseModel):
    google_search_dynamic_retrieval_score: float | None = None


class SearchEntryPoint(BaseModel):
    rendered_content: str | dict | None = None
    sdk_blob: str | None = None


class GroundingMetadata(BaseModel):
    grounding_chunks: list[GroundingChunk] | None = None
    grounding_supports: list[GroundingSupport] | None = None
    retrieval_metadata: RetrievalMetadata | None = None
    retrieval_queries: str | None = None
    search_entry_point: SearchEntryPoint | None = None
    web_search_queries: list[str] | None = None


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
    grounding_metadata: GroundingMetadata | None = None
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

    @field_validator("grounding_metadata", mode="before")
    @classmethod
    def validate_grounding_metadata(cls, v):
        """Handle grounding_metadata JSON string or dict"""
        if isinstance(v, str):
            if v == "null":
                return None
            return GroundingMetadata.model_validate_json(v)
        elif isinstance(v, dict):
            return GroundingMetadata.model_validate(v)
        return v
