from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    google_client_id: str
    google_client_secret: str
    google_oauth_redirect_uri: str
    jwt_secret_key: str
    jwt_algorithm: str
    jwt_access_token_expire_minutes: int
    jwt_refresh_token_expire_days: int
    # google_api_key: str
    gemini_api_key: str
    openai_api_key: str
    app_name: str

    class Config:
        env_file = ".env"


settings = Settings()
