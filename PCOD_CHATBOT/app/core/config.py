from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Neo4j Configuration
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = ""
    
    # Google Gemini Configuration
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Alternative models you can try:
    # "gemini-3-pro-preview" - Stronger reasoning (limited free)
    # "gemini-3.1-flash-lite-preview" - Ultra cheap, fast
    # "gemini-3-flash-preview" - Best balance of speed/quality
    
    # Response Settings
    TEMPERATURE: float = 0.8  # Higher = more creative/warm (0.7-0.9 is perfect)
    MAX_TOKENS: int = 1024
    TOP_P: float = 0.95
    
    # Cache Settings
    REDIS_URL: Optional[str] = None
    CACHE_TTL: int = 3600
    
    # App Settings
    APP_NAME: str = "PCOS Nutrition Chatbot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Unsplash setting
    UNSPLASH_ACCESS_KEY: str = ""
    
    model_config = ConfigDict(env_file=".env", extra="ignore")

settings = Settings()
