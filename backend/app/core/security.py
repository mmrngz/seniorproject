from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

# Güvenlik ayarları
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-jwt-tokens-keep-it-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 hafta

# Şifre hashleme için CryptContext'i kaldırıyorum
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, stored_password: str) -> bool:
    # Düz metin karşılaştırması yapacak şekilde değiştiriyorum
    return plain_password == stored_password

def get_password_hash(password: str) -> str:
    # Şifre hash'leme işlemini kaldırıyorum, düz metin döndürüyorum
    return password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Yeni bir JWT token oluştur"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt