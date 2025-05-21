import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Borsa Tahmin ve Analiz Uygulaması"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey123456789")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # Server ayarları
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS ayarları
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost", "http://localhost:3000", "http://localhost:80"]
    
    # Veritabanı ayarları
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/bist_tahmin_db")
    
    # Uygulama modu
    ENV: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENV == "development"
    
    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "ignore"  # Ek alanlar için hata üretme
    }

settings = Settings() 