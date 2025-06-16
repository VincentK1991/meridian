import uuid

from pydantic import BaseModel, Field


class FileContent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    file_name: str


class ChunkWithEmbedding(BaseModel):
    chunk: str
    embedding: list[float]


class FileContentWithChunks(FileContent):
    chunks: list[str]


class FileContentWithChunksAndEmbedding(FileContent):
    chunks_with_embedding: list[ChunkWithEmbedding]
