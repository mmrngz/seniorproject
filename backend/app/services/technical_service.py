import pandas as pd
import numpy as np
import math
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import ta  # Technical Analysis kütüphanesi
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.base_stock import BaseStock
from app.models.technical_stock import TechnicalStock

logger = logging.getLogger(__name__)

class TechnicalService:
    """
    Teknik analizleri gerçekleştiren servis sınıfı.
    
    Bu sınıf, hisse senetleri için teknik göstergeleri hesaplar,
    teknik analize dayalı sinyalleri üretir ve veritabanında saklar.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def analyze_selected_stocks(self, db: Session) -> List[TechnicalStock]:
        """
        Veritabanındaki seçilmiş tüm hisseler için teknik analiz yapar.
        
        Args:
            db: Veritabanı oturumu
            
        Returns:
            List[TechnicalStock]: Analiz edilen teknik hisse nesnelerinin listesi
        """
        # Seçilmiş hisseleri al
        selected_stocks = db.query(BaseStock).filter(BaseStock.selected == True).all()
        
        if not selected_stocks:
            self.logger.warning("Seçilmiş hisse bulunamadı.")
            return []
        
        self.logger.info(f"{len(selected_stocks)} seçilmiş hisse analiz ediliyor...")
        
        analyzed_stocks = []
        for stock in selected_stocks:
            technical = self.analyze_stock(db, stock)
            if technical:
                analyzed_stocks.append(technical)
        
        self.logger.info(f"{len(analyzed_stocks)} hisse için teknik analiz tamamlandı.")
        return analyzed_stocks
    
    def analyze_stock(self, db: Session, stock: BaseStock) -> Optional[TechnicalStock]:
        """
        Belirli bir hisse için teknik analiz yapar.
        
        Args:
            db: Veritabanı oturumu
            stock: Analiz edilecek hisse senedi
            
        Returns:
            Optional[TechnicalStock]: Analiz edilen teknik hisse nesnesi veya None
        """
        try:
            # Tarihsel verileri elde et
            historical_data = self._get_historical_data(stock)
            
            if historical_data is None or historical_data.empty:
                self.logger.warning(f"{stock.symbol} için tarihsel veri bulunamadı.")
                return None
            
            # Mevcut bir teknik analiz kaydı var mı kontrol et
            existing_technical = db.query(TechnicalStock).filter(
                TechnicalStock.base_stock_id == stock.id
            ).first()
            
            # Teknik göstergeleri hesapla
            indicators = self._calculate_indicators(historical_data)
            
            # Destek ve direnç seviyelerini hesapla
            support_resistance = self._calculate_support_resistance(historical_data)
            
            # Fibonacci seviyelerini hesapla
            fibonacci_levels = self._calculate_fibonacci(historical_data)
            
            # Teknik sinyalleri hesapla
            signals = self._calculate_signals(indicators, historical_data)
            
            # Teknik hisse nesnesini oluştur/güncelle
            if existing_technical:
                technical = existing_technical
                # Teknik göstergeleri güncelle
                for key, value in indicators.items():
                    setattr(technical, key, value)
                
                # Destek ve direnç seviyelerini güncelle
                technical.support_levels = support_resistance['support']
                technical.resistance_levels = support_resistance['resistance']
                
                # Fibonacci seviyelerini güncelle
                technical.fib_retracement = fibonacci_levels
                
                # Sinyalleri güncelle
                technical.trend_signals = signals['trend']
                technical.momentum_signals = signals['momentum']
                technical.volatility_signals = signals['volatility']
                
                technical.updated_at = datetime.utcnow()
            else:
                # Yeni teknik hisse nesnesi oluştur
                technical = TechnicalStock(
                    base_stock_id=stock.id,
                    # Teknik göstergeler
                    **indicators,
                    # Destek ve direnç seviyeleri
                    support_levels=support_resistance['support'],
                    resistance_levels=support_resistance['resistance'],
                    # Fibonacci seviyeleri
                    fib_retracement=fibonacci_levels,
                    # Teknik sinyaller
                    trend_signals=signals['trend'],
                    momentum_signals=signals['momentum'],
                    volatility_signals=signals['volatility'],
                    # Zaman damgaları
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(technical)
            
            db.commit()
            db.refresh(technical)
            
            self.logger.info(f"{stock.symbol} için teknik analiz tamamlandı.")
            return technical
            
        except Exception as e:
            db.rollback()
            self.logger.error(f"{stock.symbol} için teknik analiz sırasında hata: {str(e)}")
            return None
    
    def get_all_technical_stocks(self, db: Session) -> List[TechnicalStock]:
        """
        Tüm teknik analiz sonuçlarını döndürür
        
        Args:
            db: Veritabanı oturumu
            
        Returns:
            List[TechnicalStock]: Teknik analiz sonuçlarının listesi
        """
        return db.query(TechnicalStock).order_by(desc(TechnicalStock.updated_at)).all()
    
    def get_technical_by_symbol(self, db: Session, symbol: str) -> Optional[TechnicalStock]:
        """
        Belirli bir hisse senedi sembolü için teknik analiz sonuçlarını döndürür
        
        Args:
            db: Veritabanı oturumu
            symbol: Teknik analiz sonuçları istenilen hisse senedi sembolü
            
        Returns:
            Optional[TechnicalStock]: Teknik analiz sonuçları
        """
        # Önce sembole göre hisseyi bul
        stock = db.query(BaseStock).filter(BaseStock.symbol == symbol).first()
        
        if not stock:
            return None
        
        # Hissenin teknik analizini bul
        return db.query(TechnicalStock).filter(
            TechnicalStock.base_stock_id == stock.id
        ).first()
    
    def _get_historical_data(self, stock: BaseStock) -> Optional[pd.DataFrame]:
        """
        Hisse senedi için tarihsel verileri döndürür.
        
        Args:
            stock: Hisse senedi
            
        Returns:
            Optional[pd.DataFrame]: Tarihsel veri DataFrame'i
        """
        # Burada BaseStock modelindeki historical_data alanını kullanıyoruz
        # Gerçek uygulamada, bu veriyi YFinance veya başka bir kaynaktan alabilirsiniz
        
        if not stock.historical_data or len(stock.historical_data) == 0:
            return None
        
        # historical_data'yı pandas DataFrame'e dönüştür
        try:
            df = pd.DataFrame(stock.historical_data)
            
            # Tarih sütununu dönüştür
            df['Date'] = pd.to_datetime(df['Date'])
            
            # Tarih sütununu dizin olarak ayarla
            df.set_index('Date', inplace=True)
            
            return df
        except Exception as e:
            self.logger.error(f"{stock.symbol} için tarihsel veri dönüştürme hatası: {str(e)}")
            return None
    
    def _calculate_indicators(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Tarihsel verilerden teknik göstergeleri hesaplar
        
        Args:
            df: Tarihsel veri DataFrame'i
            
        Returns:
            Dict[str, Any]: Hesaplanan teknik göstergeler
        """
        try:
            # DataFrame'in gerekli sütunları içerdiğinden emin ol
            required_columns = ['Open', 'High', 'Low', 'Close', 'Volume']
            for col in required_columns:
                if col not in df.columns:
                    self.logger.error(f"Eksik sütun: {col}")
                    return {}
            
            # TA kütüphanesini kullanarak göstergeleri hesapla
            # MACD
            macd = ta.trend.MACD(df['Close'])
            macd_line = macd.macd().iloc[-1]
            macd_signal = macd.macd_signal().iloc[-1]
            macd_hist = macd.macd_diff().iloc[-1]
            
            # ADX
            adx_indicator = ta.trend.ADXIndicator(df['High'], df['Low'], df['Close'])
            adx = adx_indicator.adx().iloc[-1]
            dmi_plus = adx_indicator.adx_pos().iloc[-1]
            dmi_minus = adx_indicator.adx_neg().iloc[-1]
            
            # Stochastic
            stoch = ta.momentum.StochasticOscillator(df['High'], df['Low'], df['Close'])
            stoch_k = stoch.stoch().iloc[-1]
            stoch_d = stoch.stoch_signal().iloc[-1]
            
            # CCI
            cci = ta.trend.CCIIndicator(df['High'], df['Low'], df['Close']).cci().iloc[-1]
            
            # MFI
            mfi = ta.volume.MFIIndicator(df['High'], df['Low'], df['Close'], df['Volume']).money_flow_index().iloc[-1]
            
            # Bollinger Bands
            bollinger = ta.volatility.BollingerBands(df['Close'])
            bb_upper = bollinger.bollinger_hband().iloc[-1]
            bb_middle = bollinger.bollinger_mavg().iloc[-1]
            bb_lower = bollinger.bollinger_lband().iloc[-1]
            
            # ATR
            atr = ta.volatility.AverageTrueRange(df['High'], df['Low'], df['Close']).average_true_range().iloc[-1]
            
            # SMA
            sma_50 = ta.trend.SMAIndicator(df['Close'], window=50).sma_indicator().iloc[-1]
            sma_200 = ta.trend.SMAIndicator(df['Close'], window=200).sma_indicator().iloc[-1]
            
            # EMA
            ema_20 = ta.trend.EMAIndicator(df['Close'], window=20).ema_indicator().iloc[-1]
            
            # NaN değerleri temizle
            indicators = {
                'macd': float(macd_line) if not math.isnan(macd_line) else None,
                'macd_signal': float(macd_signal) if not math.isnan(macd_signal) else None,
                'macd_hist': float(macd_hist) if not math.isnan(macd_hist) else None,
                'adx': float(adx) if not math.isnan(adx) else None,
                'dmi_plus': float(dmi_plus) if not math.isnan(dmi_plus) else None,
                'dmi_minus': float(dmi_minus) if not math.isnan(dmi_minus) else None,
                'stoch_k': float(stoch_k) if not math.isnan(stoch_k) else None,
                'stoch_d': float(stoch_d) if not math.isnan(stoch_d) else None,
                'cci': float(cci) if not math.isnan(cci) else None,
                'mfi': float(mfi) if not math.isnan(mfi) else None,
                'bb_upper': float(bb_upper) if not math.isnan(bb_upper) else None,
                'bb_middle': float(bb_middle) if not math.isnan(bb_middle) else None,
                'bb_lower': float(bb_lower) if not math.isnan(bb_lower) else None,
                'atr': float(atr) if not math.isnan(atr) else None,
                'sma_50': float(sma_50) if not math.isnan(sma_50) else None,
                'sma_200': float(sma_200) if not math.isnan(sma_200) else None,
                'ema_20': float(ema_20) if not math.isnan(ema_20) else None,
            }
            
            return indicators
        except Exception as e:
            self.logger.error(f"Teknik göstergeleri hesaplarken hata: {str(e)}")
            return {}
    
    def _calculate_support_resistance(self, df: pd.DataFrame, periods: int = 14) -> Dict[str, List[float]]:
        """
        Destek ve direnç seviyelerini hesaplar
        
        Args:
            df: Tarihsel veri DataFrame'i
            periods: Yerel minimum ve maksimumları belirlemek için kullanılacak dönem
            
        Returns:
            Dict[str, List[float]]: Destek ve direnç seviyeleri
        """
        try:
            if len(df) < periods:
                self.logger.warning(f"Yetersiz tarihsel veri: {len(df)} < {periods}")
                return {'support': [], 'resistance': []}
            
            # Son 'periods' sayıda dönem için çalış
            recent_data = df.iloc[-periods*3:] if len(df) > periods*3 else df
            
            # Yerel minimumları ve maksimumları bul
            highs = recent_data['High'].to_numpy()
            lows = recent_data['Low'].to_numpy()
            
            # Destek noktaları (yerel minimumlar)
            support_levels = []
            for i in range(1, len(lows) - 1):
                if lows[i] < lows[i-1] and lows[i] < lows[i+1]:
                    # Tekrarlanan seviyeleri önle
                    level = round(float(lows[i]), 2)
                    if level not in support_levels:
                        support_levels.append(level)
            
            # Direnç noktaları (yerel maksimumlar)
            resistance_levels = []
            for i in range(1, len(highs) - 1):
                if highs[i] > highs[i-1] and highs[i] > highs[i+1]:
                    # Tekrarlanan seviyeleri önle
                    level = round(float(highs[i]), 2)
                    if level not in resistance_levels:
                        resistance_levels.append(level)
            
            # Son günlerin en yüksek ve en düşük değerlerini ekle
            if len(recent_data) > 0:
                last_high = round(float(recent_data['High'].max()), 2)
                last_low = round(float(recent_data['Low'].min()), 2)
                
                if last_high not in resistance_levels:
                    resistance_levels.append(last_high)
                if last_low not in support_levels:
                    support_levels.append(last_low)
            
            # Seviyeleri sırala
            support_levels.sort()
            resistance_levels.sort()
            
            return {
                'support': support_levels,
                'resistance': resistance_levels
            }
        except Exception as e:
            self.logger.error(f"Destek ve direnç seviyelerini hesaplarken hata: {str(e)}")
            return {'support': [], 'resistance': []}
    
    def _calculate_fibonacci(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Fibonacci retracement seviyelerini hesaplar
        
        Args:
            df: Tarihsel veri DataFrame'i
            
        Returns:
            Dict[str, float]: Fibonacci retracement seviyeleri
        """
        try:
            if len(df) < 20:  # En az 20 günlük veri olsun
                return {}
            
            # Son 60 günü al (veya tüm veriyi, hangisi daha azsa)
            recent_data = df.iloc[-60:] if len(df) > 60 else df
            
            # En yüksek ve en düşük değerleri bul
            high = recent_data['High'].max()
            low = recent_data['Low'].min()
            
            # Fiyat aralığını hesapla
            diff = high - low
            
            # Fibonacci seviyeleri (retracement)
            fib_levels = {
                'trend': 'up' if df['Close'].iloc[-1] > df['Close'].iloc[-20] else 'down',
                'high': float(high),
                'low': float(low),
                '0.0': float(high),
                '0.236': float(high - 0.236 * diff),
                '0.382': float(high - 0.382 * diff),
                '0.5': float(high - 0.5 * diff),
                '0.618': float(high - 0.618 * diff),
                '0.786': float(high - 0.786 * diff),
                '1.0': float(low)
            }
            
            return fib_levels
        except Exception as e:
            self.logger.error(f"Fibonacci seviyelerini hesaplarken hata: {str(e)}")
            return {}
    
    def _calculate_signals(self, indicators: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Dict[str, bool]]:
        """
        Teknik göstergelere dayalı alım-satım sinyallerini hesaplar
        
        Args:
            indicators: Hesaplanan teknik göstergeler
            df: Tarihsel veri DataFrame'i
            
        Returns:
            Dict[str, Dict[str, bool]]: Teknik sinyaller
        """
        signals = {
            'trend': {},
            'momentum': {},
            'volatility': {}
        }
        
        try:
            # Son kapanış fiyatı
            if len(df) > 0:
                current_price = df['Close'].iloc[-1]
            else:
                return signals
            
            # Trend sinyalleri
            # SMA 50 ve SMA 200 Golden Cross/Death Cross
            if indicators.get('sma_50') and indicators.get('sma_200'):
                signals['trend']['golden_cross'] = indicators['sma_50'] > indicators['sma_200']
                signals['trend']['death_cross'] = indicators['sma_50'] < indicators['sma_200']
            
            # Fiyat SMA 50 üzerinde/altında
            if indicators.get('sma_50'):
                signals['trend']['price_above_sma50'] = current_price > indicators['sma_50']
                signals['trend']['price_below_sma50'] = current_price < indicators['sma_50']
            
            # Fiyat SMA 200 üzerinde/altında
            if indicators.get('sma_200'):
                signals['trend']['price_above_sma200'] = current_price > indicators['sma_200']
                signals['trend']['price_below_sma200'] = current_price < indicators['sma_200']
            
            # Yükselen trend
            if indicators.get('sma_50') and indicators.get('sma_200') and indicators.get('adx'):
                signals['trend']['uptrend'] = (
                    indicators['sma_50'] > indicators['sma_200'] and
                    current_price > indicators['sma_50'] and
                    indicators['adx'] > 25
                )
            
            # Düşen trend
            if indicators.get('sma_50') and indicators.get('sma_200') and indicators.get('adx'):
                signals['trend']['downtrend'] = (
                    indicators['sma_50'] < indicators['sma_200'] and
                    current_price < indicators['sma_50'] and
                    indicators['adx'] > 25
                )
            
            # Momentum sinyalleri
            # MACD sinyalleri
            if (indicators.get('macd') is not None and 
                indicators.get('macd_signal') is not None and 
                indicators.get('macd_hist') is not None):
                
                # MACD yükseliş (bullish) sinyali
                signals['momentum']['macd_bullish'] = (
                    indicators['macd'] > indicators['macd_signal'] and
                    indicators['macd_hist'] > 0
                )
                
                # MACD düşüş (bearish) sinyali
                signals['momentum']['macd_bearish'] = (
                    indicators['macd'] < indicators['macd_signal'] and
                    indicators['macd_hist'] < 0
                )
            
            # Stochastic sinyalleri
            if indicators.get('stoch_k') and indicators.get('stoch_d'):
                # Aşırı alım (overbought)
                signals['momentum']['stoch_overbought'] = (
                    indicators['stoch_k'] > 80 and
                    indicators['stoch_d'] > 80
                )
                
                # Aşırı satım (oversold)
                signals['momentum']['stoch_oversold'] = (
                    indicators['stoch_k'] < 20 and
                    indicators['stoch_d'] < 20
                )
                
                # Yükseliş (bullish) çaprazlama
                signals['momentum']['stoch_bullish_crossover'] = (
                    indicators['stoch_k'] > indicators['stoch_d'] and
                    indicators['stoch_k'] < 20
                )
                
                # Düşüş (bearish) çaprazlama
                signals['momentum']['stoch_bearish_crossover'] = (
                    indicators['stoch_k'] < indicators['stoch_d'] and
                    indicators['stoch_k'] > 80
                )
            
            # CCI sinyalleri
            if indicators.get('cci'):
                signals['momentum']['cci_overbought'] = indicators['cci'] > 100
                signals['momentum']['cci_oversold'] = indicators['cci'] < -100
            
            # MFI sinyalleri
            if indicators.get('mfi'):
                signals['momentum']['mfi_overbought'] = indicators['mfi'] > 80
                signals['momentum']['mfi_oversold'] = indicators['mfi'] < 20
            
            # Volatilite sinyalleri
            # Bollinger Bantları sinyalleri
            if (indicators.get('bb_upper') and 
                indicators.get('bb_lower') and 
                indicators.get('bb_middle')):
                
                # Fiyat üst bant üzerinde
                signals['volatility']['price_above_upper_band'] = current_price > indicators['bb_upper']
                
                # Fiyat alt bant altında
                signals['volatility']['price_below_lower_band'] = current_price < indicators['bb_lower']
                
                # Fiyat orta bandın üzerinde
                signals['volatility']['price_above_middle_band'] = current_price > indicators['bb_middle']
                
                # Fiyat orta bandın altında
                signals['volatility']['price_below_middle_band'] = current_price < indicators['bb_middle']
                
                # Bant sıkışması (Bollinger Squeeze)
                if len(df) > 20:  # Önceki bantları hesaplamak için yeterli veri olduğundan emin ol
                    prev_bb_upper = ta.volatility.BollingerBands(df['Close']).bollinger_hband().iloc[-20]
                    prev_bb_lower = ta.volatility.BollingerBands(df['Close']).bollinger_lband().iloc[-20]
                    prev_bandwidth = (prev_bb_upper - prev_bb_lower) / indicators['bb_middle']
                    current_bandwidth = (indicators['bb_upper'] - indicators['bb_lower']) / indicators['bb_middle']
                    
                    signals['volatility']['bollinger_squeeze'] = current_bandwidth < prev_bandwidth * 0.8
            
            # ATR sinyalleri
            if indicators.get('atr') and len(df) > 14:
                # ATR'nin son 14 günlük ortalamasını hesapla
                atr_mean = ta.volatility.AverageTrueRange(
                    df['High'], df['Low'], df['Close']
                ).average_true_range().rolling(window=14).mean().iloc[-1]
                
                # Volatilite artışı
                signals['volatility']['increased_volatility'] = indicators['atr'] > atr_mean * 1.5
                
                # Volatilite azalışı
                signals['volatility']['decreased_volatility'] = indicators['atr'] < atr_mean * 0.5
            
            return signals
        except Exception as e:
            self.logger.error(f"Teknik sinyalleri hesaplarken hata: {str(e)}")
            return signals 