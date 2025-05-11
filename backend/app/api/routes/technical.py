from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import logging

from app.db.session import get_db
from app.models.base_stock import BaseStock
from app.models.technical_stock import TechnicalStock
from app.services.technical_service import TechnicalService
from app.schemas import (
    TechnicalStockResponse,
    BaseStockResponse
)

router = APIRouter()
technical_service = TechnicalService()
logger = logging.getLogger(__name__)

# TechnicalStock modelini TechnicalStockResponse'a dönüştüren yardımcı fonksiyon
def convert_to_technical_response(technical: TechnicalStock) -> TechnicalStockResponse:
    """
    TechnicalStock modelini TechnicalStockResponse şemasına dönüştürür
    """
    return TechnicalStockResponse(
        id=technical.id,
        base_stock_id=technical.base_stock_id,
        symbol=technical.base_stock.symbol if technical.base_stock else None,
        # Teknik göstergeler
        macd=technical.macd,
        macd_signal=technical.macd_signal,
        macd_hist=technical.macd_hist,
        adx=technical.adx,
        dmi_plus=technical.dmi_plus,
        dmi_minus=technical.dmi_minus,
        stoch_k=technical.stoch_k,
        stoch_d=technical.stoch_d,
        cci=technical.cci,
        mfi=technical.mfi,
        bb_upper=technical.bb_upper,
        bb_middle=technical.bb_middle,
        bb_lower=technical.bb_lower,
        atr=technical.atr,
        sma_50=technical.sma_50,
        sma_200=technical.sma_200,
        ema_20=technical.ema_20,
        # Destek ve direnç seviyeleri
        support_levels=technical.support_levels,
        resistance_levels=technical.resistance_levels,
        # Fibonacci seviyeleri
        fib_retracement=technical.fib_retracement,
        # Teknik analize dayalı sinyaller
        trend_signals=technical.trend_signals,
        momentum_signals=technical.momentum_signals,
        volatility_signals=technical.volatility_signals,
        # Zaman damgaları
        created_at=technical.created_at,
        updated_at=technical.updated_at
    )

@router.post("/analyze", response_model=Dict[str, Any])
def analyze_technical(
    db: Session = Depends(get_db),
    symbols: Optional[List[str]] = Query(None, description="Analiz edilecek semboller (boş ise tüm seçili hisseler)")
):
    """
    Seçili hisseler için teknik analiz yapar.
    
    Belirli semboller belirtilmişse yalnızca onlar analiz edilir, 
    aksi takdirde tüm seçili hisseler analiz edilir.
    
    Args:
        symbols: Analiz edilecek hisse sembolleri (isteğe bağlı)
        
    Returns:
        Dict: Analiz sonuçları ve işlem istatistikleri
    """
    try:
        if symbols:
            # Belirli sembolleri analiz et
            stocks = db.query(BaseStock).filter(BaseStock.symbol.in_(symbols)).all()
            if not stocks:
                logger.warning(f"Belirtilen semboller bulunamadı: {symbols}")
                return {
                    "success": False,
                    "message": "Belirtilen semboller bulunamadı",
                    "analyzed_count": 0,
                    "symbols": symbols
                }
            
            # Bulunan hisseleri analiz et
            results = []
            for stock in stocks:
                technical = technical_service.analyze_stock(db, stock)
                if technical:
                    results.append(convert_to_technical_response(technical))
            
            return {
                "success": True,
                "message": f"{len(results)} hisse için teknik analiz tamamlandı",
                "analyzed_count": len(results),
                "symbols": [stock.symbol for stock in stocks],
                "results": results
            }
        else:
            # Tüm seçili hisseleri analiz et
            analyzed_stocks = technical_service.analyze_selected_stocks(db)
            
            return {
                "success": True,
                "message": f"{len(analyzed_stocks)} hisse için teknik analiz tamamlandı",
                "analyzed_count": len(analyzed_stocks),
                "symbols": [ts.base_stock.symbol for ts in analyzed_stocks if ts.base_stock]
            }
    except Exception as e:
        logger.error(f"Teknik analiz sırasında hata: {str(e)}")
        return {
            "success": False,
            "message": f"Teknik analiz sırasında hata oluştu: {str(e)}",
            "analyzed_count": 0
        }

@router.get("/all", response_model=List[TechnicalStockResponse])
def get_all_technical(db: Session = Depends(get_db)):
    """
    Tüm teknik analiz sonuçlarını döndürür
    
    Returns:
        List[TechnicalStockResponse]: Teknik analiz sonuçlarının listesi
    """
    technical_stocks = technical_service.get_all_technical_stocks(db)
    return [convert_to_technical_response(ts) for ts in technical_stocks]

@router.get("/{symbol}", response_model=TechnicalStockResponse)
def get_technical_by_symbol(symbol: str, db: Session = Depends(get_db)):
    """
    Belirli bir hisse senedi için teknik analiz sonuçlarını döndürür
    
    Args:
        symbol: Teknik analiz sonuçları istenilen hisse senedinin sembolü
        
    Returns:
        TechnicalStockResponse: Teknik analiz sonuçları
    """
    technical = technical_service.get_technical_by_symbol(db, symbol)
    
    if not technical:
        raise HTTPException(
            status_code=404, 
            detail=f"'{symbol}' sembolü için teknik analiz bilgisi bulunamadı"
        )
    
    return convert_to_technical_response(technical)

@router.get("/signals/trend", response_model=List[Dict[str, Any]])
def get_trend_signals(db: Session = Depends(get_db)):
    """
    Trend sinyallerine göre filtrelenmiş teknik analiz sonuçlarını döndürür
    
    Returns:
        List[Dict]: Trend sinyallerine göre filtrelenmiş teknik analiz sonuçları
    """
    technical_stocks = technical_service.get_all_technical_stocks(db)
    
    trend_signals = []
    for ts in technical_stocks:
        if ts.base_stock and ts.trend_signals:
            # Yalnızca yukarı trend sinyali olan hisseleri filtrele
            if ts.trend_signals.get('uptrend', False):
                trend_signals.append({
                    "symbol": ts.base_stock.symbol,
                    "signals": ts.trend_signals,
                    "price": ts.base_stock.last_price,
                    "sma_50": ts.sma_50,
                    "sma_200": ts.sma_200,
                    "adx": ts.adx
                })
    
    return trend_signals

@router.get("/signals/momentum", response_model=List[Dict[str, Any]])
def get_momentum_signals(db: Session = Depends(get_db)):
    """
    Momentum sinyallerine göre filtrelenmiş teknik analiz sonuçlarını döndürür
    
    Returns:
        List[Dict]: Momentum sinyallerine göre filtrelenmiş teknik analiz sonuçları
    """
    technical_stocks = technical_service.get_all_technical_stocks(db)
    
    momentum_signals = []
    for ts in technical_stocks:
        if ts.base_stock and ts.momentum_signals:
            # Yalnızca alış sinyali olan hisseleri filtrele
            bullish_signals = [
                signal for signal, value in ts.momentum_signals.items() 
                if value is True and 'bullish' in signal.lower()
            ]
            
            if bullish_signals:
                momentum_signals.append({
                    "symbol": ts.base_stock.symbol,
                    "signals": ts.momentum_signals,
                    "bullish_signals": bullish_signals,
                    "macd": ts.macd,
                    "macd_signal": ts.macd_signal,
                    "macd_hist": ts.macd_hist,
                    "stoch_k": ts.stoch_k,
                    "stoch_d": ts.stoch_d
                })
    
    return momentum_signals

@router.get("/support-resistance/{symbol}", response_model=Dict[str, Any])
def get_support_resistance(symbol: str, db: Session = Depends(get_db)):
    """
    Belirli bir hisse için destek ve direnç seviyelerini döndürür
    
    Args:
        symbol: Hisse senedi sembolü
        
    Returns:
        Dict: Destek ve direnç seviyeleri
    """
    technical = technical_service.get_technical_by_symbol(db, symbol)
    
    if not technical:
        raise HTTPException(
            status_code=404, 
            detail=f"'{symbol}' sembolü için teknik analiz bilgisi bulunamadı"
        )
    
    if not technical.base_stock:
        raise HTTPException(
            status_code=404, 
            detail=f"'{symbol}' sembolü için temel hisse bilgisi bulunamadı"
        )
    
    current_price = technical.base_stock.last_price
    
    # En yakın destek ve direnç seviyelerini bul
    closest_support = None
    closest_resistance = None
    
    if technical.support_levels:
        supports_below = [s for s in technical.support_levels if s < current_price]
        if supports_below:
            closest_support = max(supports_below)
    
    if technical.resistance_levels:
        resistances_above = [r for r in technical.resistance_levels if r > current_price]
        if resistances_above:
            closest_resistance = min(resistances_above)
    
    return {
        "symbol": symbol,
        "current_price": current_price,
        "all_support_levels": technical.support_levels,
        "all_resistance_levels": technical.resistance_levels,
        "closest_support": closest_support,
        "closest_resistance": closest_resistance,
        "fibonacci_levels": technical.fib_retracement
    } 