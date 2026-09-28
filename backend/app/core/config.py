# =========================================================
# NetMine AI — Application Configuration
# Uses pydantic-settings for environment variable loading.
#
# HOW IT WORKS:
#   Settings reads from environment variables or a .env file.
#   Access via:  from app.core.config import settings
# =========================================================
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App metadata
    APP_NAME: str = "NetMine AI"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # CORS — allow the React dev server
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # Database
    DATABASE_URL: str = "sqlite:///./netmine.db"

    # Future: PostgreSQL
    # DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost/netmine"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached Settings singleton.
    lru_cache ensures we only parse env vars once.
    """
    return Settings()


# Convenience alias used throughout the app
settings = get_settings()
