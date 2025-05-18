from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models.user import User
from app.models.user_favorite import UserFavorite
from app.models.prediction_history import PredictionHistory
from app.models.prediction_stock import PredictionStock
from app.models.base_stock import BaseStock
from app.schemas.user import UserResponse
from app.schemas.dashboard import (
    UserFavoriteCreate, 
    UserFavorite as UserFavoriteSchema,
    PredictionHistory as PredictionHistorySchema,
    DashboardFavorites,
    DashboardPredictions,
    ModelComparisonItem,
    ModelComparison
)

router = APIRouter()

# Basitlik için geliştirme ortamında kullanıcı ID'yi bir sabit olarak tanımlayalım
DEMO_USER_ID = 1

# Favori hisseler endpoint'leri
@router.get("/favorites", response_model=List[UserFavoriteSchema])
async def get_favorites(db: Session = Depends(get_db)):
    favorites = db.query(UserFavorite).filter(UserFavorite.user_id == DEMO_USER_ID).all()
    return favorites

@router.post("/favorites", response_model=UserFavoriteSchema)
async def add_favorite(favorite: UserFavoriteCreate, db: Session = Depends(get_db)):
    # Sembolün geçerli olup olmadığını kontrol et
    stock = db.query(BaseStock).filter(BaseStock.symbol == favorite.symbol).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Hisse sembolü bulunamadı")
    
    # Zaten favorilerde var mı kontrol et
    existing = db.query(UserFavorite).filter(
        UserFavorite.user_id == DEMO_USER_ID,
        UserFavorite.symbol == favorite.symbol
    ).first()
    
    if existing:
        return existing
    
    # Yeni favori oluştur
    new_favorite = UserFavorite(
        user_id=DEMO_USER_ID,
        symbol=favorite.symbol,
        created_at=datetime.now()
    )
    
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    
    return new_favorite

@router.delete("/favorites/{symbol}", response_model=dict)
async def remove_favorite(symbol: str, db: Session = Depends(get_db)):
    favorite = db.query(UserFavorite).filter(
        UserFavorite.user_id == DEMO_USER_ID,
        UserFavorite.symbol == symbol
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="Favori hisse bulunamadı")
    
    db.delete(favorite)
    db.commit()
    
    return {"message": "Favori hisse başarıyla silindi"}

# Son tahminler endpoint'i
@router.get("/latest-predictions", response_model=List[PredictionHistorySchema])
async def get_latest_predictions(limit: int = 5, db: Session = Depends(get_db)):
    # Bu demo için, tahmin geçmişinden son tahminleri getirelim
    predictions = db.query(PredictionHistory).order_by(
        PredictionHistory.prediction_date.desc()
    ).limit(limit).all()
    
    # Eğer veri yoksa örnek veri oluşturalım (gerçek uygulamada bu kısım olmayacak)
    if not predictions:
        # Gerçek veritabanında olacak örnek veriler oluşturalım
        sample_predictions = [
            PredictionHistory(
                id=1,
                symbol="THYAO",
                prediction_date=datetime.now() - timedelta(days=7),
                prediction_price=230.50,
                actual_price=235.60,
                model_used="LSTM",
                is_successful=True,
                accuracy_percent=97.8,
                created_at=datetime.now() - timedelta(days=7)
            ),
            PredictionHistory(
                id=2,
                symbol="ASELS",
                prediction_date=datetime.now() - timedelta(days=7),
                prediction_price=46.20,
                actual_price=44.78,
                model_used="LSTM",
                is_successful=False,
                accuracy_percent=96.9,
                created_at=datetime.now() - timedelta(days=7)
            ),
            PredictionHistory(
                id=3,
                symbol="KRDMD",
                prediction_date=datetime.now() - timedelta(days=7),
                prediction_price=12.90,
                actual_price=12.42,
                model_used="LSTM",
                is_successful=True,
                accuracy_percent=96.2,
                created_at=datetime.now() - timedelta(days=7)
            )
        ]
        return sample_predictions
    
    return predictions

# Tahmin geçmişi endpoint'i
@router.get("/prediction-history", response_model=List[PredictionHistorySchema])
async def get_prediction_history(limit: int = 10, db: Session = Depends(get_db)):
    # Bu demo için, tahmin geçmişini getirelim
    history = db.query(PredictionHistory).order_by(
        PredictionHistory.prediction_date.desc()
    ).limit(limit).all()
    
    # Eğer veri yoksa örnek veri oluşturalım (gerçek uygulamada bu kısım olmayacak)
    if not history:
        # Aynı örnek verileri kullanabiliriz
        sample_history = [
            PredictionHistory(
                id=1,
                symbol="THYAO",
                prediction_date=datetime.now() - timedelta(days=7),
                prediction_price=230.50,
                actual_price=235.60,
                model_used="LSTM",
                is_successful=True,
                accuracy_percent=97.8,
                created_at=datetime.now() - timedelta(days=7)
            ),
            PredictionHistory(
                id=2,
                symbol="ASELS",
                prediction_date=datetime.now() - timedelta(days=7),
                prediction_price=46.20,
                actual_price=44.78,
                model_used="LSTM",
                is_successful=False,
                accuracy_percent=96.9,
                created_at=datetime.now() - timedelta(days=7)
            )
        ]
        return sample_history
    
    return history

# Model karşılaştırma endpoint'i
@router.get("/model-comparison", response_model=ModelComparison)
async def get_model_comparison(db: Session = Depends(get_db)):
    # Demo için, sabit model karşılaştırma verisi döndürelim
    models = [
        ModelComparisonItem(
            model_name="LSTM",
            accuracy=85.2,
            mse=0.0043,
            mae=0.0021,
            success_rate=0.78
        ),
        ModelComparisonItem(
            model_name="GRU",
            accuracy=87.5,
            mse=0.0038,
            mae=0.0019,
            success_rate=0.82
        ),
        ModelComparisonItem(
            model_name="Attention",
            accuracy=83.1,
            mse=0.0051,
            mae=0.0025,
            success_rate=0.75
        )
    ]
    
    return ModelComparison(models=models) 