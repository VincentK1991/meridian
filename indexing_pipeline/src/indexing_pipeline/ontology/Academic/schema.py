import asyncio
import uuid
from typing import Any

from pydantic import BaseModel

from .relationship import (
    Author_Develop_Concept,
    Concept_Create_MaterialOutcome,
    Concept_Related_to_Concept,
    Concept_Require_ImplicitKnowledge,
)

academic_schema = (
    Author_Develop_Concept
    | Concept_Related_to_Concept
    | Concept_Create_MaterialOutcome
    | Concept_Require_ImplicitKnowledge
)


class AcademicGraph(BaseModel):
    extracted_graphs: list[academic_schema]

    async def to_cypher(self, reference_id: str) -> list[tuple[str, dict[str, Any]]]:
        # Collect all coroutines for parallel execution
        tasks = []

        for rel in self.extracted_graphs:
            source_id = str(uuid.uuid4())
            target_id = str(uuid.uuid4())
            # Add source entity cypher task
            tasks.append(rel.source_entity.to_cypher(source_id, reference_id))
            # Add target entity cypher task
            tasks.append(rel.target_entity.to_cypher(target_id, reference_id))
            # Add relationship cypher task
            tasks.append(rel.to_cypher(source_id, target_id))

        # Execute all tasks in parallel
        results = await asyncio.gather(*tasks)

        # Process results back into the expected format
        cypher_queries = []
        for i in range(0, len(results), 3):
            # Each group of 3 results corresponds to: relationship,
            # source_entity, target_entity
            source_result = results[i]
            target_result = results[i + 1]
            rel_result = results[i + 2]

            cypher_queries.append(source_result)
            cypher_queries.append(target_result)
            cypher_queries.append(rel_result)

        return cypher_queries
