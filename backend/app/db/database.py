from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Veritabanı bağlantı URL'si
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@db:5432/bist_tahmin_db"
)

# SQLAlchemy engine oluştur
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# SessionLocal sınıfı oluştur
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base sınıfı oluştur
Base = declarative_base()

# Veritabanı bağlantı dependency'si
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 