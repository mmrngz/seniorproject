from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import logging
import time
from datetime import datetime, timedelta
import numpy as np
import ta

from app.db.session import get_db
from app.models.base_stock import BaseStock
from app.models.prediction_stock import PredictionStock
from app.services.base_stock_service import BaseStockService
from app.services.prediction_service import PredictionService
from app.schemas import (
    BaseStockResponse, 
    PredictionStockResponse,
    StockFilterParams,
    HourlyPredictionResponse,
    HourlyModelPrediction,
    HourlyPredictionItem
)

router = APIRouter()
base_service = BaseStockService()
prediction_service = PredictionService()
logger = logging.getLogger(__name__)

# BaseStock modelini BaseStockResponse'a dönüştüren yardımcı fonksiyon
def convert_to_response(stock: BaseStock) -> BaseStockResponse:
    """
    BaseStock modelini BaseStockResponse şemasına dönüştürür
    """
    return BaseStockResponse(
        id=stock.id,
        symbol=stock.symbol,
        name=stock.name,
        last_price=stock.last_price,
        open_price=stock.open_price if hasattr(stock, 'open_price') else None,
        high_price=stock.high_price if hasattr(stock, 'high_price') else None,
        low_price=stock.low_price if hasattr(stock, 'low_price') else None,
        previous_close=stock.previous_close if hasattr(stock, 'previous_close') else None,
        daily_change=stock.change_percent,  # change_percent'i daily_change olarak eşleştir
        daily_volume=stock.volume,
        relative_volume=stock.relative_volume,
        rsi=stock.rsi,
        pivot=stock.pivot_pp,
        r1=stock.pivot_r1,
        r2=stock.pivot_r2,
        s1=stock.pivot_s1,
        s2=stock.pivot_s2,
        passed_rsi_filter=stock.passed_rsi_filter if hasattr(stock, 'passed_rsi_filter') else False,
        passed_volume_filter=stock.passed_volume_filter if hasattr(stock, 'passed_volume_filter') else False,
        passed_pivot_filter=stock.passed_pivot_filter if hasattr(stock, 'passed_pivot_filter') else False,
        is_selected=stock.is_selected,
        last_updated=stock.updated_at
    )

@router.get("/symbols", response_model=List[str])
def get_symbols():
    """
    BIST sembollerinin listesini döndürür
    """
    return base_service.load_bist_symbols()

@router.get("/filtered-symbols", response_model=List[str])
def get_filtered_symbols(
    db: Session = Depends(get_db), 
    refresh: bool = Query(False, description="Verileri yeniden çek ve hesapla")
):
    """
    Filtreleme kriterlerini geçen hisselerin sembollerini döndürür.
    
    Args:
        db: Veritabanı oturumu
        refresh: Verileri yeniden çekip filtreleme işlemi yapılsın mı
        
    Returns:
        List[str]: Filtreleme kriterlerini geçen hisse sembolleri listesi
    """
    try:
        # Eğer refresh parametresi True ise, hisseleri yeniden işle
        if refresh:
            logger.info("Tüm hisseler yeniden işleniyor ve filtreleniyor...")
            start_time = time.time()
            base_service.process_all_stocks(db)
            elapsed_time = time.time() - start_time
            logger.info(f"Hisse işleme tamamlandı. Süre: {elapsed_time:.2f} saniye")
        
        # Seçilen (filtreleri geçen) hisseleri getir
        selected_stocks = base_service.get_selected_stocks(db)
        
        # Sembolleri çıkar
        symbols = [stock.symbol for stock in selected_stocks]
        
        logger.info(f"Filtreleme kriterlerini geçen {len(symbols)} hisse bulundu")
        if symbols:
            logger.info(f"Filtreleme kriterlerini geçen semboller: {', '.join(symbols)}")
        
        return symbols
    except Exception as e:
        logger.error(f"Filtrelenmiş sembolleri alma hatası: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Filtrelenmiş sembolleri alırken bir hata oluştu: {str(e)}"
        )

@router.get("/filtered-predictions", response_model=List[PredictionStockResponse])
def get_filtered_predictions(
    db: Session = Depends(get_db),
    run_predictions: bool = Query(False, description="Filtrelenmiş hisseler için tahmin yap")
):
    """
    Filtreleme kriterlerini geçen hisselerin tahminlerini döndürür.
    
    Args:
        db: Veritabanı oturumu
        run_predictions: Tahminlerin yeniden hesaplanıp hesaplanmayacağı
        
    Returns:
        List[PredictionStockResponse]: Filtrelenen hisselerin tahmin sonuçları listesi
    """
    try:
        # Seçilen (filtreleri geçen) hisseleri getir
        selected_stocks = base_service.get_selected_stocks(db)
        
        if not selected_stocks:
            logger.warning("Filtreleme kriterlerini geçen hisse bulunamadı")
            return []
        
        # Sembolleri çıkar
        symbols = [stock.symbol for stock in selected_stocks]
        logger.info(f"Filtreleme kriterlerini geçen {len(symbols)} hisse için tahminler getiriliyor")
        
        if run_predictions:
            # Tahminleri yeniden hesapla
            logger.info(f"Filtrelenen {len(symbols)} hisse için tahminler yeniden hesaplanıyor...")
            predictions = prediction_service.predict_with_hourly_data(db, symbols)
            logger.info(f"Toplam {len(predictions)} hisse için tahminler hesaplandı")
            return predictions
        else:
            # Mevcut tahminleri getir
            predictions = []
            for symbol in symbols:
                prediction = prediction_service.get_prediction_by_symbol(db, symbol)
                if prediction:
                    predictions.append(prediction)
            
            logger.info(f"Toplam {len(predictions)}/{len(symbols)} hisse için tahminler bulundu")
            return predictions
    except Exception as e:
        logger.error(f"Filtrelenmiş tahminleri alma hatası: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Filtrelenmiş tahminleri alırken bir hata oluştu: {str(e)}"
        )

@router.get("/filtered", response_model=List[BaseStockResponse])
def get_filtered_stocks(
    db: Session = Depends(get_db),
    params: StockFilterParams = Depends(),
    refresh: bool = Query(False, description="Verileri yeniden çek ve hesapla")
):
    """
    Belirli filtre kriterlerine uyan hisse senetlerini döndürür
    """
    if refresh:
        # Hisseleri yeniden çek ve filtrele
        base_service.process_stocks(db)
    
    # Filtre parametrelerine göre hisseleri getir
    stocks = base_service.get_filtered_stocks(
        db=db,
        min_rsi=params.min_rsi,
        max_rsi=params.max_rsi,
        min_rel_volume=params.min_rel_volume,
        pivot_cross=params.pivot_cross,
        limit=params.limit
    )
    
    return stocks

@router.get("/prediction/{symbol}", response_model=PredictionStockResponse)
def get_prediction(
    symbol: str, 
    db: Session = Depends(get_db), 
    refresh: bool = Query(False),
    model_type: str = Query("all", description="Model tipi: 'lstm', 'gru', 'attention' veya 'all'")
):
    """
    Belirli bir hisse senedi için tahmin bilgilerini döndürür.
    Üç farklı model kullanılabilir: LSTM, GRU ve Attention.
    """
    # Eğer /predictions ile karışma olursa özel işlem yap
    if symbol.lower() == "predictions":
        raise HTTPException(status_code=400, detail="Geçersiz sembol. Tüm tahminleri görüntülemek için /api/stocks/predictions endpoint'ini kullanın.")
    
    stock = db.query(BaseStock).filter(BaseStock.symbol == symbol).first()
    if not stock:
        raise HTTPException(status_code=404, detail=f"{symbol} sembolü bulunamadı")
    
    # Eğer yenileme isteniyorsa veya hisse için tahmin henüz yapılmamışsa
    if refresh:
        prediction = prediction_service.predict_stock(db, stock, model_type)
        if not prediction:
            raise HTTPException(status_code=500, detail=f"{symbol} için tahmin yapılamadı")
        return prediction
    
    # Mevcut tahminleri döndür
    prediction = prediction_service.get_prediction_by_symbol(db, symbol)
    if not prediction:
        raise HTTPException(status_code=404, detail=f"{symbol} için tahmin bulunamadı")
    
    return prediction

@router.get("/saatlik-data/{symbol}")
def get_hourly_data(
    symbol: str, 
    db: Session = Depends(get_db), 
    days: int = Query(45, description="Kaç günlük saatlik veri çekilsin (1-90 arası)")
):
    """
    Belirtilen sembol için saatlik veri çeker ve teknik göstergelerle birlikte döndürür.
    Bu endpoint filtreleme sisteminden tamamen bağımsız çalışır.
    
    Args:
        symbol: Hisse senedi sembolü
        days: Kaç günlük veri çekileceği (1-90 arası)
        
    Returns:
        Dict: Saatlik veriler ve göstergeleri içeren yanıt
    """
    # Giriş parametrelerini kontrol et
    if days < 1:
        days = 1
    elif days > 90:
        days = 90  # YFinance için 90 gün uygun bir üst limit
    
    logger.info(f"{symbol} için saatlik veri çekme işlemi başlatılıyor (Son {days} gün)")
    
    # PredictionService kullanarak saatlik veri çek
    prediction_service = PredictionService()
    hourly_data = prediction_service.fetch_hourly_data(symbol, days)
    
    if hourly_data.empty:
        logger.warning(f"{symbol} için saatlik veri çekilemedi")
        return {
            "success": False,
            "message": f"{symbol} için saatlik veri çekilemedi",
            "data": None
        }
    
    # Veriyi temizle (NaN ve Inf değerlerini kaldır)
    hourly_data = hourly_data.replace([np.inf, -np.inf], np.nan)
    hourly_data = hourly_data.fillna(method='ffill').fillna(method='bfill')
    
    # Temel göstergeleri hesapla
    hourly_data = prediction_service.calculate_basic_indicators(hourly_data)
    
    # DataFrame'i JSON formatına dönüştür
    if 'Datetime' in hourly_data.columns:
        # Datetime sütununu string formatına dönüştür
        hourly_data['Datetime'] = hourly_data['Datetime'].astype(str)
    
    # JSON serileştirme için verileri hazırla
    data_dict = hourly_data.to_dict(orient='records')
    
    # Temel istatistikler
    stats = {
        "total_rows": len(hourly_data),
        "start_date": hourly_data['Datetime'].iloc[0] if 'Datetime' in hourly_data.columns else None,
        "end_date": hourly_data['Datetime'].iloc[-1] if 'Datetime' in hourly_data.columns else None,
        "available_columns": hourly_data.columns.tolist()
    }
    
    return {
        "success": True,
        "message": f"{symbol} için saatlik veri başarıyla çekildi",
        "symbol": symbol,
        "days": days,
        "stats": stats,
        "data": data_dict
    }

@router.get("/model-features/{symbol}")
def get_model_features(
    symbol: str, 
    db: Session = Depends(get_db),
    days: int = Query(45, description="Kaç günlük saatlik veri çekilsin (1-90 arası)")
):
    """
    Belirtilen sembol için model eğitiminde kullanılacak özellikleri hesaplar ve döndürür.
    Hesaplanan özellikler: Close, Volume, RSI, MACD, Stoch_K, CCI, ATR, EMA_9, SMA_20, ADX
    
    Args:
        symbol: Hisse senedi sembolü
        days: Kaç günlük veri çekileceği (1-90 arası)
        
    Returns:
        Dict: Hesaplanan özellikleri içeren yanıt
    """
    try:
        # Giriş parametrelerini kontrol et
        if days < 1:
            days = 1
        elif days > 90:
            days = 90  # YFinance için 90 gün uygun bir üst limit
        
        logger.info(f"{symbol} için model özellikleri hesaplanıyor (Son {days} gün)")
        
        # PredictionService kullanarak saatlik veri çek
        prediction_service = PredictionService()
        hourly_data = prediction_service.fetch_hourly_data(symbol, days)
        
        if hourly_data.empty:
            logger.warning(f"{symbol} için saatlik veri çekilemedi")
            return {
                "success": False,
                "message": f"{symbol} için saatlik veri çekilemedi, özellikler hesaplanamadı",
                "data": None
            }
        
        # Veriyi temizle (NaN ve Inf değerlerini kaldır)
        hourly_data = hourly_data.replace([np.inf, -np.inf], np.nan)
        
        # İsteğe özel özellikleri tanımla
        features = [
            'Close', 'Volume', 'RSI', 'MACD', 'Stoch_K',
            'CCI', 'ATR', 'EMA_9', 'SMA_20', 'ADX'
        ]
        
        logger.info(f"{symbol} için hesaplanacak özellikler: {', '.join(features)}")
        
        # Temel göstergeleri hesapla
        result_df = hourly_data.copy()
        
        # Close ve Volume zaten mevcut olmalı, ancak doğrulayalım
        # Eğer Volume yoksa ama vol gibi benzeri bir sütun varsa onu kullanalım
        if 'Volume' not in result_df.columns and 'vol' in result_df.columns:
            result_df['Volume'] = result_df['vol']
        
        # Close yoksa ama benzeri bir sütun varsa onu kullanalım
        close_alternatives = ['Close', 'close', 'Adj Close', 'Adj_Close', 'last_price']
        found_close = False
        for col in close_alternatives:
            if col in result_df.columns:
                result_df['Close'] = result_df[col]
                found_close = True
                break
        
        if not found_close:
            logger.error(f"{symbol} için kapanış fiyatı sütunu bulunamadı")
            return {
                "success": False,
                "message": f"{symbol} için kapanış fiyatı verisi bulunamadı",
                "data": None
            }
        
        # Teknİk göstergeleri hesapla
        # 1. RSI
        if 'RSI' in features and 'Close' in result_df.columns:
            try:
                rsi = ta.momentum.RSIIndicator(close=result_df['Close'], window=14)
                result_df['RSI'] = rsi.rsi()
                logger.info(f"{symbol} için RSI hesaplandı")
            except Exception as e:
                logger.warning(f"{symbol} için RSI hesaplanamadı: {str(e)}")
                result_df['RSI'] = np.nan
        
        # 2. MACD
        if 'MACD' in features and 'Close' in result_df.columns:
            try:
                macd = ta.trend.MACD(close=result_df['Close'])
                result_df['MACD'] = macd.macd()
                logger.info(f"{symbol} için MACD hesaplandı")
            except Exception as e:
                logger.warning(f"{symbol} için MACD hesaplanamadı: {str(e)}")
                result_df['MACD'] = np.nan
        
        # 3. Stochastic Oscillator (K değeri)
        if 'Stoch_K' in features:
            try:
                # Önce gerekli sütunları doğrula (High, Low, Close)
                required_cols = ['High', 'Low', 'Close']
                has_required_cols = all(col in result_df.columns for col in required_cols)
                
                if has_required_cols:
                    stoch = ta.momentum.StochasticOscillator(
                        high=result_df['High'],
                        low=result_df['Low'],
                        close=result_df['Close']
                    )
                    result_df['Stoch_K'] = stoch.stoch()
                    logger.info(f"{symbol} için Stoch_K hesaplandı")
                else:
                    logger.warning(f"{symbol} için Stochastic Oscillator hesaplanamadı: Gerekli sütunlar eksik")
                    result_df['Stoch_K'] = np.nan
            except Exception as e:
                logger.warning(f"{symbol} için Stoch_K hesaplanamadı: {str(e)}")
                result_df['Stoch_K'] = np.nan
        
        # 4. CCI
        if 'CCI' in features:
            try:
                # Önce gerekli sütunları doğrula (High, Low, Close)
                required_cols = ['High', 'Low', 'Close']
                has_required_cols = all(col in result_df.columns for col in required_cols)
                
                if has_required_cols:
                    result_df['CCI'] = ta.trend.CCIIndicator(
                        high=result_df['High'],
                        low=result_df['Low'],
                        close=result_df['Close']
                    ).cci()
                    logger.info(f"{symbol} için CCI hesaplandı")
                else:
                    logger.warning(f"{symbol} için CCI hesaplanamadı: Gerekli sütunlar eksik")
                    result_df['CCI'] = np.nan
            except Exception as e:
                logger.warning(f"{symbol} için CCI hesaplanamadı: {str(e)}")
                result_df['CCI'] = np.nan
        
        # 5. ATR
        if 'ATR' in features:
            try:
                # Önce gerekli sütunları doğrula (High, Low, Close)
                required_cols = ['High', 'Low', 'Close']
                has_required_cols = all(col in result_df.columns for col in required_cols)
                
                if has_required_cols:
                    result_df['ATR'] = ta.volatility.AverageTrueRange(
                        high=result_df['High'],
                        low=result_df['Low'],
                        close=result_df['Close']
                    ).average_true_range()
                    logger.info(f"{symbol} için ATR hesaplandı")
                else:
                    logger.warning(f"{symbol} için ATR hesaplanamadı: Gerekli sütunlar eksik")
                    result_df['ATR'] = np.nan
            except Exception as e:
                logger.warning(f"{symbol} için ATR hesaplanamadı: {str(e)}")
                result_df['ATR'] = np.nan
        
        # 6. EMA_9
        if 'EMA_9' in features and 'Close' in result_df.columns:
            try:
                result_df['EMA_9'] = ta.trend.EMAIndicator(
                    close=result_df['Close'], 
                    window=9
                ).ema_indicator()
                logger.info(f"{symbol} için EMA_9 hesaplandı")
            except Exception as e:
                logger.warning(f"{symbol} için EMA_9 hesaplanamadı: {str(e)}")
                result_df['EMA_9'] = np.nan
        
        # 7. SMA_20
        if 'SMA_20' in features and 'Close' in result_df.columns:
            try:
                result_df['SMA_20'] = ta.trend.SMAIndicator(
                    close=result_df['Close'], 
                    window=20
                ).sma_indicator()
                logger.info(f"{symbol} için SMA_20 hesaplandı")
            except Exception as e:
                logger.warning(f"{symbol} için SMA_20 hesaplanamadı: {str(e)}")
                result_df['SMA_20'] = np.nan
        
        # 8. ADX
        if 'ADX' in features:
            try:
                # Önce gerekli sütunları doğrula (High, Low, Close)
                required_cols = ['High', 'Low', 'Close']
                has_required_cols = all(col in result_df.columns for col in required_cols)
                
                if has_required_cols:
                    result_df['ADX'] = ta.trend.ADXIndicator(
                        high=result_df['High'],
                        low=result_df['Low'],
                        close=result_df['Close']
                    ).adx()
                    logger.info(f"{symbol} için ADX hesaplandı")
                else:
                    logger.warning(f"{symbol} için ADX hesaplanamadı: Gerekli sütunlar eksik")
                    result_df['ADX'] = np.nan
            except Exception as e:
                logger.warning(f"{symbol} için ADX hesaplanamadı: {str(e)}")
                result_df['ADX'] = np.nan
        
        # NaN değerleri doldur
        result_df = result_df.fillna(method='ffill').fillna(method='bfill')
        
        # Datetime sütununu string formatına dönüştür (varsa)
        if 'Datetime' in result_df.columns:
            result_df['Datetime'] = result_df['Datetime'].astype(str)
        elif 'Date' in result_df.columns:
            result_df['Datetime'] = result_df['Date'].astype(str)
        
        # Sadece istenen özellikleri ve gerekli sütunları seç
        # Datetime veya Date sütununu da ekle (varsa)
        cols_to_keep = []
        for col in result_df.columns:
            if col in ['Datetime', 'Date', 'date', 'datetime'] or col in features:
                cols_to_keep.append(col)
        
        # Eğer hiçbir zaman sütunu bulunamadıysa, indeksi sütun olarak ekle
        if not any(col in ['Datetime', 'Date', 'date', 'datetime'] for col in cols_to_keep):
            result_df['Datetime'] = result_df.index.astype(str)
            cols_to_keep.append('Datetime')
        
        # Seçilen sütunları al
        result_df = result_df[cols_to_keep]
        
        # JSON serileştirme için verileri hazırla
        data_dict = result_df.to_dict(orient='records')
        
        # Temel istatistikler
        stats = {
            "total_rows": len(result_df),
            "start_date": result_df['Datetime'].iloc[0] if 'Datetime' in result_df.columns else None,
            "end_date": result_df['Datetime'].iloc[-1] if 'Datetime' in result_df.columns else None,
            "features": features,
            "available_columns": result_df.columns.tolist()
        }
        
        return {
            "success": True,
            "message": f"{symbol} için model özellikleri başarıyla hesaplandı",
            "symbol": symbol,
            "days": days,
            "stats": stats,
            "features": features,
            "data": data_dict
        }
    
    except Exception as e:
        logger.error(f"{symbol} için model özellikleri hesaplanırken hata: {str(e)}")
        logger.exception("Hata ayrıntıları")
        return {
            "success": False,
            "message": f"{symbol} için model özellikleri hesaplanırken hata oluştu: {str(e)}",
            "data": None
        }

@router.get("/{symbol}", response_model=BaseStockResponse)
def get_stock(symbol: str, db: Session = Depends(get_db)):
    """
    Belirli bir sembol için temel hisse bilgilerini döndürür
    """
    stock = db.query(BaseStock).filter(BaseStock.symbol == symbol).first()
    if not stock:
        raise HTTPException(status_code=404, detail=f"{symbol} sembolü bulunamadı")
    
    # BaseStockResponse formatına dönüştür
    return convert_to_response(stock)

# Her sembol isteği arasında bekle
time.sleep(3)  # 3 saniye bekle