from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Favori Hisse Şemaları
class UserFavoriteBase(BaseModel):
    symbol: str

class UserFavoriteCreate(UserFavoriteBase):
    pass

class UserFavorite(UserFavoriteBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Tahmin Geçmişi Şemaları
class PredictionHistoryBase(BaseModel):
    symbol: str
    prediction_date: datetime
    prediction_price: float
    model_used: str

class PredictionHistoryCreate(PredictionHistoryBase):
    pass

class PredictionHistoryUpdate(BaseModel):
    actual_price: Optional[float] = None
    is_successful: Optional[bool] = None
    accuracy_percent: Optional[float] = None

class PredictionHistory(PredictionHistoryBase):
    id: int
    actual_price: Optional[float] = None
    is_successful: Optional[bool] = None
    accuracy_percent: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard İçin API Yanıt Şemaları
class DashboardFavorites(BaseModel):
    favorites: List[UserFavorite]

class DashboardPredictions(BaseModel):
    predictions: List[PredictionHistory]

class ModelComparisonItem(BaseModel):
    model_name: str
    accuracy: float
    mse: float
    mae: float
    success_rate: float

class ModelComparison(BaseModel):
    models: List[ModelComparisonItem] 