from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime

class TechnicalStockResponse(BaseModel):
    id: int
    symbol: str
    base_stock_id: int
    
    # Trend göstergeleri
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist: Optional[float] = None
    adx: Optional[float] = None
    ema_9d: Optional[float] = None
    sma_20d: Optional[float] = None
    sma_50d: Optional[float] = None
    sma_200d: Optional[float] = None
    
    # Momentum göstergeleri
    rsi: Optional[float] = None
    stoch_k: Optional[float] = None
    stoch_d: Optional[float] = None
    cci: Optional[float] = None
    mfi: Optional[float] = None
    
    # Oynaklık göstergeleri
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None
    bb_width: Optional[float] = None
    atr: Optional[float] = None
    
    # Destek ve direnç seviyeleri
    support_levels: List[float] = []
    resistance_levels: List[float] = []
    fibonacci_levels: Dict[str, float] = {}
    
    # Teknik sinyaller
    trend_signals: Dict[str, Any] = {}
    momentum_signals: Dict[str, Any] = {}
    volatility_signals: Dict[str, Any] = {}
    
    # Meta veriler
    last_updated: Optional[datetime] = None
    
    class Config:
        orm_mode = True 