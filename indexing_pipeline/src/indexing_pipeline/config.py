from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str
    openai_api_key: str
    neo4j_uri: str
    neo4j_user: str
    neo4j_password: str

    class Config:
        env_file = ".env"


settings = Settings()
