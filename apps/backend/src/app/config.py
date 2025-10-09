from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    app_name: str = "news-backend"
    environment: str = "development"
    debug: bool = True

    # Database
    database_url: str = (
        "mysql+pymysql://user:password@localhost:3306/newsdb"
    )  # MariaDB via PyMySQL driver

    # Security
    jwt_secret_key: str = "change-me-in-.env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    cors_allowed_origins: list[str] = ["*"]
    cors_allow_credentials: bool = True
    cors_allowed_methods: list[str] = ["*"]
    cors_allowed_headers: list[str] = ["*"]

    # Analytics / Kafka
    kafka_bootstrap_servers: str | None = None  # e.g., "localhost:9092" or "broker1:9092,broker2:9092"
    kafka_topic: str = "news_events"
    analytics_enabled: bool = True


settings = Settings()
