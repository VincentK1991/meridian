# src/indexing_pipeline/main.py

import asyncio
import logging
from pathlib import Path
from typing import Any

from prefect import flow, task

from indexing_pipeline.ontology.Academic import AcademicGraph
from indexing_pipeline.ontology.meta_graphs import Reference, ReferenceChunk
from indexing_pipeline.types.extraction import (
    ChunkWithEmbedding,
    FileContent,
    FileContentWithChunks,
    FileContentWithChunksAndEmbedding,
)
from indexing_pipeline.utils.chunking import chunk_text
from indexing_pipeline.utils.database import Neo4jConnector
from indexing_pipeline.utils.embedding import embed_text
from indexing_pipeline.utils.markitdown import convert_pdf_to_text
from indexing_pipeline.utils.openai_extraction import (
    graph_extraction_agent,
    openai_agent_as_tool,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@task(name="scan_files")
def scan_local_files(directory: str) -> list[Path]:
    """Scan local directory for files to process."""
    data_dir = Path(directory)
    if not data_dir.exists():
        logger.warning(f"Directory {directory} does not exist")
        return []

    files = list(data_dir.glob("*.pdf"))  # Look for PDF files
    logger.info(f"Found {len(files)} files to process")
    return files


@task(name="extract_data")
def extract_file_data(file_path: Path) -> FileContent:
    """Extract data from a single file."""
    logger.info(f"Processing file: {file_path}")

    try:
        # Example for CSV files - adjust based on your file types
        text = convert_pdf_to_text(file_path)
        logger.info(f"Extracted {len(text)} rows from {file_path.name}")
        return FileContent(content=text, file_name=file_path.name)
    except Exception as e:
        logger.error(f"Error processing {file_path}: {e}")
        raise


@task(name="chunk_data")
def chunk_data(file_content: FileContent) -> FileContentWithChunks:
    """Chunk the extracted data."""
    chunks = chunk_text(file_content.content)
    return FileContentWithChunks(
        content=file_content.content,
        file_name=file_content.file_name,
        chunks=chunks,
    )


@task(name="embed_chunks")
async def embed_chunks(
    file_content_with_chunks: FileContentWithChunks,
) -> FileContentWithChunksAndEmbedding:
    """perform embedding on the chunks"""
    embeddings = await embed_text(file_content_with_chunks.chunks)
    chunks_with_embedding = [
        ChunkWithEmbedding(chunk=chunk, embedding=embedding)
        for chunk, embedding in zip(
            file_content_with_chunks.chunks, embeddings, strict=False
        )
    ]
    return FileContentWithChunksAndEmbedding(
        content=file_content_with_chunks.content,
        file_name=file_content_with_chunks.file_name,
        chunks_with_embedding=chunks_with_embedding,
    )


@task(name="entity_relationship_extraction")
async def entity_relationship_extraction(
    file_content_with_chunks: FileContentWithChunksAndEmbedding,
) -> tuple[FileContentWithChunksAndEmbedding, list[AcademicGraph]]:
    """Transform the data to a pandas dataframe."""
    run_graph_extraction = openai_agent_as_tool(graph_extraction_agent)
    tasks = []
    for chunk_with_embedding in file_content_with_chunks.chunks_with_embedding:
        tasks.append(run_graph_extraction(chunk_with_embedding.chunk))
    academic_graphs = await asyncio.gather(*tasks)
    return file_content_with_chunks, academic_graphs


@task(name="convert_object_to_cypher")
async def convert_object_to_cypher(
    file_content_with_chunks: FileContentWithChunksAndEmbedding,
    academic_graphs: list[AcademicGraph],
) -> list[tuple[str, dict[str, Any]]]:
    """Convert the object to cypher."""
    cypher_queries = []
    # create a reference node
    reference_node = Reference(
        name=file_content_with_chunks.file_name,
        content=file_content_with_chunks.content,
        label="Reference",
    )
    cypher_query_params = await reference_node.to_cypher()
    cypher_queries.append(cypher_query_params)
    reference_id = reference_node.id
    # create a reference chunk node and link it to the reference node
    reference_chunk_nodes = []
    for index, chunk_with_embedding in enumerate(
        file_content_with_chunks.chunks_with_embedding
    ):
        reference_chunk_node = ReferenceChunk(
            name=f"{file_content_with_chunks.file_name}_{index}",
            chunk=chunk_with_embedding.chunk,
            embedding=chunk_with_embedding.embedding,
            reference_id=reference_id,
            label="ReferenceChunk",
        )
        reference_chunk_nodes.append(reference_chunk_node)
        cypher_query_params = await reference_chunk_node.to_cypher()
        cypher_queries.append(cypher_query_params)

    # create entities and relationships
    for academic_graph in academic_graphs:
        cypher_queries_for_graph = await academic_graph.to_cypher(reference_id)
        for cypher_query_params in cypher_queries_for_graph:
            cypher_queries.append(cypher_query_params)
    return cypher_queries


@task(name="index_to_database")
async def index_to_database(
    cypher_queries: list[tuple[str, dict[str, Any]]],
) -> dict[str, Any]:
    """Index the transformed data to database."""
    # Example using SQLAlchemy - adjust based on your database
    async with Neo4jConnector.get_session() as session:
        for cypher_query_params in cypher_queries:
            cypher_query = cypher_query_params[0]
            cypher_params = cypher_query_params[1]
            result = await session.run(cypher_query, cypher_params)
            records = await result.data()
            # print(records)
    return {"status": "success", "rows_processed": len(cypher_queries)}


@flow(name="etl_pipeline")
async def etl_pipeline(data_directory: str = "/app/data/input"):
    """Main ETL pipeline flow."""
    logger.info("Starting ETL pipeline...")

    # Step 1: Scan for files
    files = scan_local_files(data_directory)

    if not files:
        logger.warning("No files found to process")
        return {"status": "no_files", "processed": 0}

    total_processed = 0

    # Step 2-4: Process each file
    for file_path in files:
        try:
            # Extract
            file_content = extract_file_data(file_path)
            file_content_with_chunks = chunk_data(file_content)
            file_content_with_chunks_and_embedding = await embed_chunks(
                file_content_with_chunks
            )
            (
                file_content_with_chunks_and_embedding,
                academic_graphs,
            ) = await entity_relationship_extraction(
                file_content_with_chunks_and_embedding
            )
            cypher_queries = await convert_object_to_cypher(
                file_content_with_chunks_and_embedding, academic_graphs
            )
            result = await index_to_database(cypher_queries)
            total_processed += result["rows_processed"]

        except Exception as e:
            logger.error(f"Failed to process {file_path}: {e}")
            continue

    logger.info(f"ETL pipeline completed. Total rows processed: {total_processed}")
    return {"status": "completed", "total_processed": total_processed}


# For manual testing
if __name__ == "__main__":
    # Run the pipeline
    result = asyncio.run(etl_pipeline())
    print(f"Pipeline result: {result}")
