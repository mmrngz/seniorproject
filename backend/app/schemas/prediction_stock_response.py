from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class PredictionStockResponse(BaseModel):
    id: int
    symbol: str
    base_stock_id: int
    
    # Mevcut fiyat
    current_price: float
    
    # LSTM tahminleri
    lstm_predicted_price: Optional[float]
    lstm_change_percent: Optional[float]
    lstm_mse: Optional[float]
    lstm_mae: Optional[float]
    
    # GRU tahminleri
    gru_predicted_price: Optional[float]
    gru_change_percent: Optional[float]
    gru_mse: Optional[float]
    gru_mae: Optional[float]
    
    # Attention tahminleri
    attention_predicted_price: Optional[float]
    attention_change_percent: Optional[float]
    attention_mse: Optional[float]
    attention_mae: Optional[float]
    
    # En iyi model bilgileri
    best_model: str
    best_mse: float
    best_mae: float
    
    # Ortak değerler
    volatility: float
    prediction_date: datetime
    
    # Model detayları
    features_used: List[str]
    training_window: int
    prediction_window: int
    
    # İsteğe bağlı teknik analiz bilgileri
    technical_info: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True 