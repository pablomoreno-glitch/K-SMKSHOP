from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the catalog service, loaded from the environment."""

    database_url: str = "postgresql+asyncpg://vape:vape@postgres:5432/vape_catalog"
    internal_token: str = "change-me"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
