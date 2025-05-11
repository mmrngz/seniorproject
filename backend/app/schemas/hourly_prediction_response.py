from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime

class HourlyPredictionItem(BaseModel):
    """
    Belirli bir saat için tahmin bilgilerini içeren model.
    """
    hour: int
    timestamp: str
    predicted_price: float
    change_percent: float
    confidence: float
    
    class Config:
        orm_mode = True
        from_attributes = True

class HourlyModelPrediction(BaseModel):
    """
    Belirli bir model (LSTM, GRU, Attention) için saatlik tahmin bilgilerini içeren model.
    """
    model_name: str
    model_metrics: Dict[str, float]
    hourly_predictions: List[HourlyPredictionItem]
    
    class Config:
        orm_mode = True
        from_attributes = True

class HourlyPredictionResponse(BaseModel):
    """
    Saatlik tahmin yanıt modeli.
    """
    symbol: str
    current_price: float
    last_update: datetime
    best_model: str
    features_used: List[str]
    prediction_window: int  # Saat cinsinden
    models: List[HourlyModelPrediction]
    
    class Config:
        orm_mode = True
        from_attributes = True 