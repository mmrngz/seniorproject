from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.session import Base

class BaseStock(Base):
    """
    Temel hisse senedi bilgilerini içeren model. İlk filtreleme için kullanılır.
    """
    __tablename__ = "base_stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    name = Column(String)
    sector = Column(String, nullable=True)
    
    # Teknik veriler
    last_price = Column(Float)
    open_price = Column(Float)       # Açılış fiyatı
    high_price = Column(Float)       # En yüksek fiyat
    low_price = Column(Float)        # En düşük fiyat
    previous_close = Column(Float)   # Önceki gün kapanış fiyatı
    volume = Column(Float)
    relative_volume = Column(Float)  # Ortalama hacme göre bağıl hacim
    change_percent = Column(Float)   # Günlük değişim yüzdesi
    
    # Hesaplanan göstergeler
    rsi = Column(Float)              # Göreceli güç endeksi
    pivot_r1 = Column(Float)         # Dirençler 
    pivot_r2 = Column(Float)
    pivot_r3 = Column(Float)
    pivot_s1 = Column(Float)         # Destekler
    pivot_s2 = Column(Float) 
    pivot_s3 = Column(Float)
    pivot_pp = Column(Float)         # Pivot noktası
    
    # Filtre kriterlerine uygunluk
    above_pivot = Column(Boolean, default=False)  # Fiyat pivot üzerinde mi
    crossed_pivot = Column(Boolean, default=False)  # Pivot noktasını yukarı yönde geçti mi
    is_selected = Column(Boolean, default=False)  # Tüm seçim kriterlerini karşılıyor mu
    
    # Filtre geçiş sonuçları
    passed_rsi_filter = Column(Boolean, default=False)
    passed_volume_filter = Column(Boolean, default=False)
    passed_pivot_filter = Column(Boolean, default=False)
    
    # İlişkiler
    prediction = relationship("PredictionStock", back_populates="base_stock", uselist=False, cascade="all, delete-orphan")
    technical = relationship("TechnicalStock", back_populates="base_stock", uselist=False, cascade="all, delete-orphan")
    
    # Zaman damgaları
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<BaseStock(symbol='{self.symbol}', last_price={self.last_price}, rsi={self.rsi})>" 