from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.core.security import get_password_hash, verify_password

class UserService:
    """
    Kullanıcı işlemleri için servis sınıfı
    """
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """
        E-posta adresine göre kullanıcı getir
        """
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """
        Kullanıcı adına göre kullanıcı getir
        """
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """
        ID'ye göre kullanıcı getir
        """
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Tüm kullanıcıları getir
        """
        return db.query(User).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        """
        Yeni kullanıcı oluştur
        """
        # E-posta kontrolü
        db_user = UserService.get_user_by_email(db, user.email)
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu e-posta adresi zaten kullanımda"
            )
        
        # Kullanıcı adı oluştur (e-postadan)
        username = user.email.split('@')[0]
        
        # Kullanıcı adı kontrolü
        if UserService.get_user_by_username(db, username):
            # Kullanıcı adı varsa sonuna rastgele sayı ekle
            import random
            username = f"{username}{random.randint(1, 9999)}"
        
        # Görünen ad oluştur
        display_name = f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else username
        
        # Şifreyi hashleme işlemi kaldırıldı, doğrudan şifreyi kullanıyoruz
        password = user.password
        
        # Yeni kullanıcı oluştur
        db_user = User(
            email=user.email,
            username=username,
            display_name=display_name,
            password=password  # hashed_password yerine password kullanıldı
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    
    @staticmethod
    def authenticate_user(db: Session, username_or_email: str, password: str) -> Optional[User]:
        """
        Kullanıcıyı doğrula
        """
        # Kullanıcıyı e-posta veya kullanıcı adı ile bul
        user = db.query(User).filter(
            (User.email == username_or_email) | (User.username == username_or_email)
        ).first()
        
        if not user:
            return None
        
        # Şifreyi doğrula - artık düz metin karşılaştırması yapılıyor
        if not verify_password(password, user.password):
            return None
            
        return user
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_data: dict) -> Optional[User]:
        """
        Kullanıcı bilgilerini güncelle
        """
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            return None
            
        # Güncelleme yapılacak alanlar
        update_data = {}
        
        # E-posta güncelleme
        if "email" in user_data and user_data["email"] != user.email:
            # E-posta kontrolü
            if UserService.get_user_by_email(db, user_data["email"]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bu e-posta adresi zaten kullanımda"
                )
            update_data["email"] = user_data["email"]
            
        # Şifre güncelleme
        if "password" in user_data and user_data["password"]:
            # Şifreyi hashleme işlemi kaldırıldı, doğrudan şifreyi kullanıyoruz
            update_data["password"] = user_data["password"]
            
        # Diğer alanları güncelle
        for field in ["username", "display_name"]:
            if field in user_data and user_data[field]:
                update_data[field] = user_data[field]
                
        # Güncelleme yap
        if update_data:
            for key, value in update_data.items():
                setattr(user, key, value)
            db.commit()
            db.refresh(user)
            
        return user
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """
        Kullanıcıyı sil
        """
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            return False
            
        db.delete(user)
        db.commit()
        
        return True
    
    @staticmethod
    def to_response(user: User) -> UserResponse:
        """
        User modelini UserResponse şemasına dönüştür
        """
        return UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            display_name=user.display_name
        ) 