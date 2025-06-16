import re
from typing import List


def chunk_text(text: str, chunk_size: int = 8000, overlap: int = 400) -> List[str]:
    """
    Split a long text into chunks with specified size and overlap.

    Args:
        text (str): The input text to be chunked
        chunk_size (int): Target size for each chunk (default: 32000)
        overlap (int): Number of characters to overlap between chunks (default: 400)

    Returns:
        List[str]: List of text chunks
    """
    if not text or len(text) <= chunk_size:
        return [text] if text else []

    chunks = []
    start = 0

    while start < len(text):
        # Calculate the end position for this chunk
        end = min(start + chunk_size, len(text))

        # If this isn't the last chunk, try to find a good breaking point
        if end < len(text):
            # Look for sentence endings near the target end position
            # Search in the last 200 characters of the chunk
            search_start = max(end - 200, start)
            sentence_endings = []

            # Find sentence endings (., !, ?) followed by whitespace
            for match in re.finditer(r"[.!?]\s+", text[search_start:end]):
                sentence_endings.append(search_start + match.end())

            if sentence_endings:
                # Use the last sentence ending found
                end = sentence_endings[-1]
            else:
                # If no sentence ending found, look for word boundaries
                # Search for the last space in the last 100 characters
                search_text = text[max(end - 100, start) : end]
                last_space = search_text.rfind(" ")
                if last_space != -1:
                    end = max(end - 100, start) + last_space + 1

        # Extract the chunk
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # If this was the last chunk, break
        if end >= len(text):
            break

        # Calculate the start position for the next chunk (with overlap)
        start = max(end - overlap, start + 1)

    return chunks


def chunk_text_simple(
    text: str, chunk_size: int = 8000, overlap: int = 400
) -> List[str]:
    """
    Simple text chunking without intelligent boundary detection.

    Args:
        text (str): The input text to be chunked
        chunk_size (int): Target size for each chunk (default: 32000)
        overlap (int): Number of characters to overlap between chunks (default: 400)

    Returns:
        List[str]: List of text chunks
    """
    if not text or len(text) <= chunk_size:
        return [text] if text else []

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end]
        chunks.append(chunk)

        if end >= len(text):
            break

        start = end - overlap

    return chunks
