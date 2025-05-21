from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Kullanıcı favorileri için şemalar
class UserFavoriteBase(BaseModel):
    symbol: str = Field(..., description="Hisse senedi sembolü")

class UserFavoriteCreate(UserFavoriteBase):
    pass

class UserFavorite(UserFavoriteBase):
    id: int
    user_id: int
    name: str
    current_price: float
    change_percent: float

    class Config:
        orm_mode = True

# Tahmin geçmişi için şemalar
class DashboardPrediction(BaseModel):
    id: int
    symbol: str
    prediction_date: str
    predicted_price: float
    actual_price: float
    accuracy: float
    model: str

    class Config:
        orm_mode = True

# Model karşılaştırma için şema
class ModelComparisonItem(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    training_time: int

class ModelComparison(BaseModel):
    models: List[ModelComparisonItem]

# Dashboard API yanıtları için şemalar
class DashboardFavorites(BaseModel):
    favorites: List[UserFavorite]

class DashboardPredictions(BaseModel):
    predictions: List[DashboardPrediction] 