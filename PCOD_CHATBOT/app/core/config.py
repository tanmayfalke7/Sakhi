from typing import Optional

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    NEO4J_URI: str = "neo4j://127.0.0.1:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "Tanmaychaneo4j@123"
    NEO4J_DATABASE: str = "pcosknowledgegraph"

    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = "AIzaSyBMCppjWBjLnjLpcBb1Q4M11jadqnEnbQI"
    GEMINI_MODEL: str = "gemini-2.5-flash"

    TEMPERATURE: float = 0.6
    MAX_TOKENS: int = 1024
    TOP_P: float = 0.9

    REDIS_URL: Optional[str] = None
    CACHE_TTL: int = 3600

    APP_NAME: str = "PCOS Nutrition Chatbot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000,http://127.0.0.1:5000"
    UNSPLASH_ACCESS_KEY: str = "W0QzBYrexonp5A6KlRR7pLmiVmgdCkXSYUzf3q0jloo"

    model_config = ConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
