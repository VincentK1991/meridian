import uuid
from typing import Any, Literal

from pydantic import Field

from indexing_pipeline.ontology.base import NodeBase
from indexing_pipeline.utils.embedding import embed_text


class Reference(NodeBase):
    label: Literal["Reference"]
    name: str
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str

    async def to_cypher(self) -> tuple[str, dict[str, Any]]:
        properties = self.get_properties()
        properties.update({"name": self.name})

        cypher_query = f"""
        MERGE (n:{self.label} {{name: $name}})
        ON CREATE SET n += $properties
        RETURN n
        """

        cypher_params = {"name": self.name, "properties": properties}
        return cypher_query, cypher_params


class ReferenceChunk(NodeBase):
    label: Literal["ReferenceChunk"]
    name: str
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference_id: str
    chunk: str
    embedding: list[float]

    # async def create_embedding(self):
    #     """
    #     Create and set the embedding for this chunk.
    #     This dynamically adds the embedding field to the instance.

    #     Returns:
    #         self: Returns the instance for method chaining
    #     """
    #     embedding = await embed_text([self.chunk])
    #     self.set_dynamic_field("embedding", embedding[0])
    #     return self

    async def to_cypher(self) -> tuple[str, dict[str, Any]]:
        properties = self.get_properties()
        # embedding = await embed_text([self.chunk])
        # properties.update({"embedding": embedding[0]})
        properties.update({"name": self.name})

        cypher_query = f"""
        MERGE (r:Reference {{id: $reference_id}})
        MERGE (n:{self.label} {{name: $name}})
        ON CREATE SET n += $properties
        MERGE (n)-[:CHUNK_OF]->(r)
        RETURN n, r
        """

        cypher_params = {
            "name": self.name,
            "reference_id": self.reference_id,
            "properties": properties,
        }

        return cypher_query.strip(), cypher_params


class BaseEntity(NodeBase):
    label: Literal["Entity"]
    name: str
    description: str

    async def to_cypher(self,id: str, reference_id: str) -> tuple[str, dict[str, Any]]:
        properties = self.get_properties()
        properties.update({"name": self.name})
        embedding = await embed_text([self.description])
        properties.update({"embedding": embedding[0]})
        properties.update({"id": id})

        # Note: sub_label would need to be dynamically set since it's not defined in the class
        cypher_query = f"""
        MERGE (r:Reference {{id: $reference_id}})
        MERGE (n:{self.label}:{self.sub_label} {{name: $name}})
        ON CREATE SET n += $properties
        MERGE (r)-[:MENTIONS]->(n)
        RETURN n, r
        """

        cypher_params = {
            "name": self.name,
            "reference_id": reference_id,
            "properties": properties,
        }

        return cypher_query.strip(), cypher_params

    def get_properties(self):
        return self.model_dump(exclude={"name", "label", "sub_label"})


class BaseRelationship(NodeBase):
    description: str
    source_entity: BaseEntity
    target_entity: BaseEntity

    async def to_cypher(self,source_id: str, target_id: str) -> tuple[str, dict[str, Any]]:
        properties = self.get_properties()
        properties.update({"name": getattr(self, "name", None)})

        # Note: Relationship labels cannot be parameterized in Cypher
        rel_label = getattr(self, "label", "RELATED_TO")

        cypher_query = f"""
        MERGE (s:{self.source_entity.label}:{self.source_entity.sub_label} {{id: $source_id}})
        MERGE (t:{self.target_entity.label}:{self.target_entity.sub_label} {{id: $target_id}})
        MERGE (s)-[r:{rel_label} {{name: $name}}]->(t)
        ON CREATE SET r += $properties
        RETURN s, r, t
        """

        cypher_params = {
            "source_id": source_id,
            "target_id": target_id,
            "name": getattr(self, "name", None),
            "properties": properties,
        }

        return cypher_query.strip(), cypher_params

    def get_properties(self):
        return self.model_dump(
            exclude={"name", "label", "source_entity", "target_entity"}
        )

    # async def create_embedding(self):
    #     """
    #     Create and set the embedding for this chunk.
    #     This dynamically adds the embedding field to the instance.

    #     Returns:
    #         self: Returns the instance for method chaining
    #     """
    #     embedding = await embed_text([self.description])
    #     self.set_dynamic_field("embedding", embedding[0])
    #     return self

    # def create_id(self):
    #     self.set_dynamic_field("id", str(uuid.uuid4()))
    #     return self

    # async def create_additional_fields(self):
    #     await self.create_embedding()
    #     self.create_id()
    #     return self
