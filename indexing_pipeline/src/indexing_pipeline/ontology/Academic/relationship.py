from typing import Literal

from pydantic import Field

from indexing_pipeline.ontology.meta_graphs import BaseRelationship

from .entity import (
    Author,
    Concept,
    ImplicitKnowledge,
    MaterialOutcome,
)

# class Author_Collaborate_with_Author(BaseRelationship):
#     source_entity: Author
#     target_entity: Author

#     def create_label(self):
#         self.label = "Collaborate_with"
#         return self


# class Author_Affiliate_with_Institution(BaseRelationship):
#     label: Literal["Author_Affiliate_with_Institution"]
#     source_entity: Author
#     target_entity: Institution


class Author_Develop_Concept(BaseRelationship):
    label: Literal["Author_Develop_Concept"]
    source_entity: Author = Field(..., description="a person who develops the concept")
    target_entity: Concept = Field(
        ..., description="a concept that is developed by a person"
    )


class Concept_Related_to_Concept(BaseRelationship):
    label: Literal["Concept_Related_to_Concept"]
    source_entity: Concept = Field(
        ..., description="a concept (abstract idea) that is related to another concept"
    )
    target_entity: Concept = Field(
        ..., description="a concept (abstract idea) that is related to another concept"
    )


class Concept_Create_MaterialOutcome(BaseRelationship):
    label: Literal["Concept_Create_MaterialOutcome"]
    source_entity: Concept = Field(
        ..., description="a concept (abstract idea) that creates a material outcome"
    )
    target_entity: MaterialOutcome = Field(
        ...,
        description="""a material outcome (improvement methodology,
        tools, models artifacts) that is created by a concept""",
    )


class Concept_Require_ImplicitKnowledge(BaseRelationship):
    label: Literal["Concept_Require_ImplicitKnowledge"]
    source_entity: Concept = Field(
        ...,
        description="""a concept (abstract idea) that requires implicit knowledge""",
    )
    target_entity: ImplicitKnowledge = Field(
        ...,
        description="""implicit knowledge (background information,
        well known concepts) that can be inferred from the text and how it's related
        to the concept""",
    )
