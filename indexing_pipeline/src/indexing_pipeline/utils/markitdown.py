from dotenv import load_dotenv
from markitdown import MarkItDown
from openai import OpenAI
from functools import lru_cache

load_dotenv()

@lru_cache(maxsize=1)
def get_md_client() -> MarkItDown:
    client = OpenAI()
    md = MarkItDown(llm_client=client, llm_model="gpt-4.1-mini")
    return md

def convert_pdf_to_text(pdf_path: str) -> str:
    md = get_md_client()
    result = md.convert(pdf_path)
    return result.text_content



