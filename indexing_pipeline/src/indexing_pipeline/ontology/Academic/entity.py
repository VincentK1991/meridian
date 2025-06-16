from typing import Literal

from indexing_pipeline.ontology.meta_graphs import BaseEntity


class Author(BaseEntity):
    sub_label: Literal["Author"]

class Institution(BaseEntity):
    sub_label: Literal["Institution"]


class Concept(BaseEntity):
    sub_label: Literal["Concept"]


class MaterialOutcome(BaseEntity):
    sub_label: Literal["MaterialOutcome"]


class ImplicitKnowledge(BaseEntity):
    sub_label: Literal["ImplicitKnowledge"]
