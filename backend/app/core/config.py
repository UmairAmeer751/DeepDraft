from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg://deepdraft:change_me_locally@localhost:5432/deepdraft"
    DATABASE_URL_TEST: str = "postgresql+psycopg://deepdraft:change_me_locally@localhost:5432/deepdraft_test"
    LLM_PROVIDER: str = "mock"
    LLM_MODEL: str = ""
    LLM_API_KEY: str = ""
    LLM_TIMEOUT_SECONDS: int = 30
    MOCK_FAIL: str = ""
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173"

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
