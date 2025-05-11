from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.session import Base
from app.models.base_stock import BaseStock

class TechnicalStock(Base):
    """
    Detaylı teknik analiz bilgilerini içeren model. BaseStock'tan seçilen hisseler için hesaplanır.
    """
    __tablename__ = "technical_stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    base_stock_id = Column(Integer, ForeignKey("base_stocks.id"), unique=True)
    
    # İlişkiler
    base_stock = relationship("BaseStock", back_populates="technical")
    
    # Teknik göstergeler
    macd = Column(Float)
    macd_signal = Column(Float)
    macd_hist = Column(Float)
    adx = Column(Float)
    dmi_plus = Column(Float)
    dmi_minus = Column(Float)
    stoch_k = Column(Float)
    stoch_d = Column(Float)
    cci = Column(Float)
    mfi = Column(Float)
    bb_upper = Column(Float)
    bb_middle = Column(Float)
    bb_lower = Column(Float)
    atr = Column(Float)
    sma_50 = Column(Float)
    sma_200 = Column(Float)
    ema_20 = Column(Float)
    
    # Destek ve direnç seviyeleri
    support_levels = Column(JSON)     # [level1, level2, ...]
    resistance_levels = Column(JSON)  # [level1, level2, ...]
    
    # Fibonacci seviyeleri
    fib_retracement = Column(JSON)    # {0: price0, 0.236: price1, ...}
    
    # Teknik analize dayalı sinyaller
    trend_signals = Column(JSON)      # {'uptrend': True, 'downtrend': False, ...}
    momentum_signals = Column(JSON)   # {'rsi_overbought': False, 'macd_bullish': True, ...}
    volatility_signals = Column(JSON) # {'bb_squeeze': False, 'high_atr': True, ...}
    
    # Zaman damgaları
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<TechnicalStock(base_stock_id={self.base_stock_id})>" 