"""
=====================================================================
ARIX BACKEND - Configuración central
=====================================================================
Carga las variables de entorno desde el archivo .env y las expone
como un objeto de configuración tipado, accesible en toda la app
mediante la instancia "settings".
=====================================================================
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Aplicación ---
    APP_NAME: str = "ARIX Backend"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api"

    # --- Base de datos MySQL ---
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "arix_db"
    DB_USER: str = "root"
    DB_PASSWORD: str = "root"

    # --- JWT ---
    JWT_SECRET_KEY: str = "ARIX_SUPER_SECRET_KEY_CAMBIAR_EN_PRODUCCION"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    JWT_REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:3000"

    # --- Archivos / uploads ---
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def DATABASE_URL(self) -> str:
        """URL de conexión a MySQL usando PyMySQL."""
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        """Convierte la cadena CORS_ORIGINS separada por comas en una lista."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Retorna una instancia cacheada de la configuración."""
    return Settings()


settings = get_settings()
