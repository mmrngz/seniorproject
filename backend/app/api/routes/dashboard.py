from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import random
from fastapi.responses import JSONResponse
import math

from app.db.session import get_db
from app.models.user import User
from app.models.user_favorite import UserFavorite
from app.models.prediction_history import PredictionHistory
from app.models.prediction_stock import PredictionStock
from app.models.base_stock import BaseStock
from app.schemas.user import UserResponse
from app.schemas.dashboard import (
    UserFavoriteCreate, 
    UserFavorite,
    DashboardFavorites,
    DashboardPrediction,
    ModelComparisonItem,
    ModelComparison
)

router = APIRouter()

# Demo kullanıcı ID'si (gerçek uygulamada bu JWT token'dan alınacak)
DEMO_USER_ID = 1

# Favori hisseler endpoint'leri
@router.get("/favorites", response_model=List[UserFavorite])
async def get_favorites(db: Session = Depends(get_db)):
    """
    Kullanıcının favori hisselerini döndürür.
    """
    # Demo amaçlı sabit favoriler
    favorites = [
        {"id": 1, "user_id": DEMO_USER_ID, "symbol": "AAPL", "name": "Apple Inc.", "current_price": 150.25, "change_percent": 1.25},
        {"id": 2, "user_id": DEMO_USER_ID, "symbol": "MSFT", "name": "Microsoft Corporation", "current_price": 290.10, "change_percent": 0.75},
        {"id": 3, "user_id": DEMO_USER_ID, "symbol": "GOOGL", "name": "Alphabet Inc.", "current_price": 2750.50, "change_percent": -0.50},
        {"id": 4, "user_id": DEMO_USER_ID, "symbol": "AMZN", "name": "Amazon.com, Inc.", "current_price": 3300.75, "change_percent": 1.10},
    ]
    
    return favorites

@router.post("/favorites", response_model=UserFavorite)
async def add_favorite(favorite: UserFavoriteCreate, db: Session = Depends(get_db)):
    """
    Yeni bir favori hisse ekler.
    """
    # Gerçek uygulamada burada sembolün geçerli olup olmadığı kontrol edilir
    if not favorite.symbol:
        raise HTTPException(status_code=400, detail="Geçersiz hisse sembolü")
    
    # Gerçek uygulamada burada veritabanına kayıt yapılır
    # Şimdilik demo veri döndürüyoruz
    new_favorite = {
        "id": random.randint(5, 100),
        "user_id": DEMO_USER_ID,
        "symbol": favorite.symbol,
        "name": f"{favorite.symbol} Corporation",
        "current_price": round(random.uniform(50, 1000), 2),
        "change_percent": round(random.uniform(-5, 5), 2)
    }
    
    return new_favorite

@router.delete("/favorites/{symbol}", response_model=dict)
def remove_favorite(symbol: str, db: Session = Depends(get_db)):
    """
    Belirtilen sembolü kullanıcının favorilerinden kaldırır.
    """
    # Gerçek uygulamada burada veritabanından silme işlemi yapılır
    return {"message": f"{symbol} favorilerden kaldırıldı"}

# Son tahminler endpoint'i
@router.get("/latest-predictions", response_model=List[DashboardPrediction])
async def get_latest_predictions(limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
    """
    En son yapılan tahminleri döndürür.
    """
    # Demo amaçlı sabit tahminler
    predictions = []
    
    for i in range(1, limit + 1):
        date = datetime.now() - timedelta(days=i-1)
        predictions.append({
            "id": i,
            "symbol": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"][i % 5],
            "prediction_date": date.strftime("%Y-%m-%d"),
            "predicted_price": round(random.uniform(100, 3000), 2),
            "actual_price": round(random.uniform(100, 3000), 2),
            "accuracy": round(random.uniform(70, 99), 2),
            "model": ["LSTM", "GRU", "RandomForest", "XGBoost", "Ensemble"][i % 5]
        })
    
    return predictions[:limit]

# Tahmin geçmişi endpoint'i
@router.get("/prediction-history", response_model=List[DashboardPrediction])
async def get_prediction_history(limit: int = Query(10, ge=1, le=50), symbol: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Tahmin geçmişini döndürür. İsteğe bağlı olarak belirli bir sembol için filtrelenebilir.
    """
    # Demo amaçlı sabit tahmin geçmişi
    history = []
    
    symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]
    if symbol:
        symbols = [symbol]
    
    for i in range(1, limit + 1):
        date = datetime.now() - timedelta(days=i)
        selected_symbol = symbols[i % len(symbols)]
        
        history.append({
            "id": i,
            "symbol": selected_symbol,
            "prediction_date": date.strftime("%Y-%m-%d"),
            "predicted_price": round(random.uniform(100, 3000), 2),
            "actual_price": round(random.uniform(100, 3000), 2),
            "accuracy": round(random.uniform(70, 99), 2),
            "model": ["LSTM", "GRU", "RandomForest", "XGBoost", "Ensemble"][i % 5]
        })
    
    return history[:limit]

# Tahmin geçmişi endpoint'i (veritabanı verilerine dayalı)
@router.get("/real-prediction-history", response_model=List[DashboardPrediction])
async def get_real_prediction_history(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    """
    Gerçek veritabanından tahmin_stocks tablosundan tahmin geçmişini döndürür.
    """
    from app.models.prediction_stock import PredictionStock
    from app.models.base_stock import BaseStock
    
    # Tahmin verilerini veritabanından çek
    predictions = db.query(PredictionStock).order_by(PredictionStock.updated_at.desc()).limit(limit).all()
    
    history = []
    
    for prediction in predictions:
        # Rastgele doğruluk - gerçek uygulamada burada gerçek bir doğruluk hesaplaması yapılabilir
        # Şu an için NaN ile değiştirilmiş veriler gösteriyoruz
        
        # En iyi model tahmini kullan
        best_model = prediction.best_model or "lstm"
        
        if best_model == "lstm":
            predicted_price = prediction.lstm_predicted_price
            accuracy = 100 - (prediction.lstm_mse * 100) if prediction.lstm_mse and prediction.lstm_mse < 1 else None
        elif best_model == "gru":
            predicted_price = prediction.gru_predicted_price
            accuracy = 100 - (prediction.gru_mse * 100) if prediction.gru_mse and prediction.gru_mse < 1 else None
        elif best_model == "attention":
            predicted_price = prediction.attention_predicted_price
            accuracy = 100 - (prediction.attention_mse * 100) if prediction.attention_mse and prediction.attention_mse < 1 else None
        else:
            predicted_price = prediction.lstm_predicted_price
            accuracy = None
        
        # Tahmin tarihini belirleme
        prediction_date = prediction.prediction_date if prediction.prediction_date else prediction.updated_at
        
        # Verinin NaN olup olmadığını kontrol et
        if predicted_price and not math.isnan(predicted_price):
            history.append({
                "id": prediction.id,
                "symbol": prediction.symbol,
                "prediction_date": prediction_date.strftime("%d.%m.%Y"),
                "predicted_price": predicted_price,
                "actual_price": prediction.current_price or 0,
                "accuracy": accuracy,
                "model": best_model.upper()
            })
    
    return history

# Model karşılaştırma endpoint'i
@router.get("/model-comparison", response_model=ModelComparison)
async def get_model_comparison(db: Session = Depends(get_db)):
    """
    Farklı modellerin karşılaştırmasını döndürür.
    """
    models = [
        {
            "model_name": "LSTM",
            "accuracy": 92.5,
            "precision": 0.89,
            "recall": 0.91,
            "f1_score": 0.90,
            "training_time": 145
        },
        {
            "model_name": "GRU",
            "accuracy": 91.8,
            "precision": 0.88,
            "recall": 0.90,
            "f1_score": 0.89,
            "training_time": 130
        },
        {
            "model_name": "RandomForest",
            "accuracy": 88.5,
            "precision": 0.85,
            "recall": 0.87,
            "f1_score": 0.86,
            "training_time": 75
        },
        {
            "model_name": "XGBoost",
            "accuracy": 90.2,
            "precision": 0.87,
            "recall": 0.89,
            "f1_score": 0.88,
            "training_time": 95
        },
        {
            "model_name": "Ensemble",
            "accuracy": 94.1,
            "precision": 0.92,
            "recall": 0.93,
            "f1_score": 0.92,
            "training_time": 180
        }
    ]
    
    return {"models": models}

# Teknik göstergeler endpoint'i
@router.get("/technical-indicators/{symbol}")
async def get_technical_indicators(symbol: str, db: Session = Depends(get_db)):
    """
    Belirli bir sembol için teknik göstergeleri döndürür.
    """
    # Demo amaçlı sabit teknik göstergeler
    indicators = {
        "rsi": {
            "value": round(random.uniform(30, 70), 2),
            "signal": "Nötr",  # Aşırı alım: >70, Aşırı satım: <30, Nötr: 30-70
            "description": "Relative Strength Index (RSI) - Göreceli Güç Endeksi"
        },
        "macd": {
            "value": round(random.uniform(-2, 2), 2),
            "signal": round(random.uniform(-1, 1), 2),
            "histogram": round(random.uniform(-0.5, 0.5), 2),
            "trend": "Nötr",  # Yükseliş: MACD > Signal, Düşüş: MACD < Signal, Nötr: MACD ≈ Signal
            "description": "Moving Average Convergence Divergence (MACD) - Hareketli Ortalama Yakınsama/Iraksama"
        },
        "bollinger_bands": {
            "upper": round(random.uniform(110, 120), 2),
            "middle": round(random.uniform(100, 110), 2),
            "lower": round(random.uniform(90, 100), 2),
            "width": round(random.uniform(2, 5), 2),
            "description": "Bollinger Bantları - Fiyat volatilitesi için kullanılan bir gösterge"
        },
        "moving_averages": {
            "sma_20": round(random.uniform(95, 105), 2),
            "sma_50": round(random.uniform(90, 110), 2),
            "sma_200": round(random.uniform(85, 115), 2),
            "ema_9": round(random.uniform(98, 102), 2),
            "signal": "Yükseliş",  # Yükseliş: SMA20 > SMA50, Düşüş: SMA20 < SMA50, Nötr: SMA20 ≈ SMA50
            "description": "Hareketli Ortalamalar - Farklı periyotlarda fiyat ortalamaları"
        },
        "stochastic": {
            "k": round(random.uniform(20, 80), 2),
            "d": round(random.uniform(20, 80), 2),
            "signal": "Nötr",  # Aşırı alım: >80, Aşırı satım: <20, Nötr: 20-80
            "description": "Stokastik Osilatör - Fiyatın belirli bir dönemdeki en yüksek ve en düşük değerlere göre konumunu gösterir"
        },
        "atr": {
            "value": round(random.uniform(1, 5), 2),
            "description": "Average True Range (ATR) - Ortalama Gerçek Aralık, fiyat volatilitesini ölçer"
        },
        "cci": {
            "value": round(random.uniform(-100, 100), 2),
            "signal": "Nötr",  # Aşırı alım: >100, Aşırı satım: <-100, Nötr: -100 ile 100 arası
            "description": "Commodity Channel Index (CCI) - Emtia Kanal Endeksi, fiyatın ortalamadan sapmasını ölçer"
        },
        "adx": {
            "value": round(random.uniform(10, 40), 2),
            "di_plus": round(random.uniform(10, 30), 2),
            "di_minus": round(random.uniform(10, 30), 2),
            "trend_strength": "Orta",  # Güçlü: >25, Zayıf: <20, Orta: 20-25
            "description": "Average Directional Index (ADX) - Ortalama Yön Endeksi, trend gücünü ölçer"
        }
    }
    
    return indicators 