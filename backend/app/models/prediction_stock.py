from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.session import Base
from app.models.base_stock import BaseStock

class PredictionStock(Base):
    """
    LSTM, GRU ve Attention modelleri ile yapılan tahmin bilgilerini içeren model.
    """
    __tablename__ = "prediction_stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    base_stock_id = Column(Integer, ForeignKey("base_stocks.id"), unique=True)
    symbol = Column(String, unique=True, index=True)
    
    # JSON formatında saklanacak tahmin verileri
    prediction_data = Column(Text)
    
    # Son güncelleme zamanı
    last_updated = Column(DateTime, default=datetime.now)
    
    # İlişkiler
    base_stock = relationship("BaseStock", back_populates="prediction")
    
    # Tahmin değerleri - LSTM
    lstm_predicted_price = Column(Float)
    lstm_change_percent = Column(Float)
    lstm_mse = Column(Float)
    lstm_mae = Column(Float)
    
    # Tahmin değerleri - GRU
    gru_predicted_price = Column(Float)
    gru_change_percent = Column(Float)
    gru_mse = Column(Float)
    gru_mae = Column(Float)
    
    # Tahmin değerleri - Attention
    attention_predicted_price = Column(Float)
    attention_change_percent = Column(Float)
    attention_mse = Column(Float)
    attention_mae = Column(Float)
    
    # Ortak değerler
    current_price = Column(Float)
    prediction_date = Column(DateTime)
    volatility = Column(Float)
    
    # Model detayları
    features_used = Column(JSON)  # Kullanılan özellikler
    training_window = Column(Integer)  # Eğitim penceresi
    prediction_window = Column(Integer)  # Tahmin penceresi
    
    # En iyi model
    best_model = Column(String)  # 'lstm', 'gru' veya 'attention'
    best_mse = Column(Float)
    best_mae = Column(Float)
    
    # Zaman damgaları
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<PredictionStock(symbol={self.symbol}, best_model={self.best_model})>" 