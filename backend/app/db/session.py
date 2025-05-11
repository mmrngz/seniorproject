from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

# Veritabanı URL'sini oluştur
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./stock_prediction.db")

# SQLite için:
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
# PostgreSQL veya diğer veritabanları için:
else:
    engine = create_engine(DATABASE_URL)

# Oturum oluşturucuyu tanımla
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Model tabanını oluştur
Base = declarative_base()

# Veritabanı oturumunu elde etme fonksiyonu
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 