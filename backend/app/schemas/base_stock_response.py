from pydantic import BaseModel, Field, computed_field
from typing import Optional, Dict
from datetime import datetime

class BaseStockResponse(BaseModel):
    id: int
    symbol: str
    name: Optional[str] = None
    last_price: float
    open_price: Optional[float] = None   # Açılış fiyatı
    high_price: Optional[float] = None   # En yüksek fiyat
    low_price: Optional[float] = None    # En düşük fiyat
    previous_close: Optional[float] = None  # Önceki gün kapanış
    daily_change: Optional[float] = None
    daily_volume: Optional[float] = None
    avg_volume_20d: Optional[float] = None
    relative_volume: Optional[float] = None
    rsi: Optional[float] = None
    
    # Pivot noktaları
    pivot: Optional[float] = None
    r1: Optional[float] = None
    r2: Optional[float] = None
    s1: Optional[float] = None
    s2: Optional[float] = None
    
    # Filtre sonuçları
    passed_rsi_filter: bool = False
    passed_volume_filter: bool = False
    passed_pivot_filter: bool = False
    is_selected: bool = False
    
    # Meta veriler
    last_updated: Optional[datetime] = None
    
    @computed_field
    def filter_reasons(self) -> Dict[str, bool]:
        """
        Hangi filtrelere takıldığını gösteren bir sözlük döndürür.
        True değeri, filtreyi geçtiğini; False değeri, filtreye takıldığını gösterir.
        """
        return {
            "rsi_filter": self.passed_rsi_filter,
            "volume_filter": self.passed_volume_filter,
            "pivot_filter": self.passed_pivot_filter,
            "all_filters": self.is_selected
        }
    
    class Config:
        orm_mode = True
        from_attributes = True 