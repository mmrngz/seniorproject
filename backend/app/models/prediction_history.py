from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False)
    prediction_date = Column(DateTime, nullable=False)
    prediction_price = Column(Float, nullable=False)
    actual_price = Column(Float, nullable=True)  # Gerçekleşen değer (tahmin doğrulama için)
    model_used = Column(String, nullable=False)  # 'lstm', 'gru', etc.
    is_successful = Column(Boolean, nullable=True)  # Tahmin başarılı mı?
    accuracy_percent = Column(Float, nullable=True)  # Tahmin doğruluk yüzdesi
    created_at = Column(DateTime, default=func.now())
    
    # Bir tahmin birden çok kullanıcı tarafından görüntülenebilir, 
    # bu nedenle kullanıcı referansına ihtiyaç yok 