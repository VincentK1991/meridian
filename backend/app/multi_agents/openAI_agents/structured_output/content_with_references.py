from pydantic import BaseModel, Field


class ParagraphWithReference(BaseModel):
    content: str = Field(description="The content of the paragraph")
    reference: str = Field(description="The reference of the paragraph")


class SearchResultWithReferences(BaseModel):
    paragraphs: list[ParagraphWithReference] = Field(
        description="The paragraphs of the search result"
    )
    summary: str = Field(description="The summary of the search result")
    sources: list[str] = Field(description="The sources of the search result")
