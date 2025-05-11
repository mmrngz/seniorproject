from typing import List, Dict, Tuple, Any, Optional
import numpy as np
import pandas as pd
import yfinance as yf
import logging
import traceback
from datetime import datetime, timedelta, time
import pytz
from sqlalchemy.orm import Session
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, GRU, Attention, MultiHeadAttention, LayerNormalization
from tensorflow.keras.optimizers import Adam
from sklearn.preprocessing import MinMaxScaler
import ta
from ta.trend import MACD
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.volatility import BollingerBands, AverageTrueRange
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.metrics import mean_squared_error, mean_absolute_error
import json

from app.models.base_stock import BaseStock
from app.models.prediction_stock import PredictionStock
from app.services.base_stock_service import BaseStockService

class PredictionService:
    """
    Yapay zeka tabanlı hisse senedi fiyat tahmini yapan servis.
    """
    
    def __init__(self):
        """
        Tahmin servisi başlatıcı metodu
        """
        self.logger = logging.getLogger(__name__)
        self.base_service = BaseStockService()
        
        # Veri önbelleği - hisse sembollerine göre DataFrame'leri saklamak için
        self.data_cache = {}
        self.logger.info("PredictionService başlatıldı.")
        
        # Her hisse için ayrı DataFrame'leri tutacak sözlük
        self.stock_dataframes = {}
        
        # Veri normalizasyonu için scaler nesneleri
        self.scalers = {}
        
        # Sequence length (varsayılan değer)
        self.sequence_length = 15  # Daha kısa tutuyoruz ki az veriyle de çalışabilsin
        
        # Türkiye zaman dilimi
        self.turkey_tz = pytz.timezone('Europe/Istanbul')
        
        # Hata durumunda yeniden deneme sayısı
        self.max_retries = 3
        
        # Hata durumunda yeniden deneme aralığı (saniye)
        self.retry_interval = 2
        
        # Liste bazlı önbellek (cache)
        self.model_cache = {}
        
        # Performans metrikleri
        self.metrics = {
            'fetch_count': 0,
            'successful_predictions': 0,
            'failed_predictions': 0
        }
        
        # TensorFlow session'larının belleği boşaltma yöntemi
        tf.keras.backend.clear_session()
    
    def fetch_hourly_data(self, symbol: str, days: int = 45) -> pd.DataFrame:
        """
        Belirli bir hisse senedi için saatlik veri çeker.
        Filtreleme sisteminden bağımsız çalışır, doğrudan sembol üzerinden çalışır.
        
        Args:
            symbol: Veri çekilecek hisse senedi sembolü
            days: Kaç günlük veri çekileceği
            
        Returns:
            pd.DataFrame: Saatlik veri içeren DataFrame veya boş DataFrame (hata durumunda)
        """
        try:
            self.metrics['fetch_count'] += 1
            
            # Önbellekten kontrol et
            cache_key = f"{symbol}_{days}_hourly"
            if cache_key in self.data_cache:
                self.logger.info(f"{symbol} için önbellekten saatlik veri kullanılıyor")
                return self.data_cache[cache_key]
            
            # Başlangıç ve bitiş tarihleri
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            self.logger.info(f"{symbol} için saatlik veri çekiliyor (Son {days} gün)")
            self.logger.info(f"Veri aralığı: {start_date.strftime('%Y-%m-%d')} - {end_date.strftime('%Y-%m-%d')}")
            
            # İlk olarak date_range parametresi ile deneyelim (bu yöntem daha güvenilir olabilir)
            try:
                data = yf.download(
                    f"{symbol}.IS",
                    start=start_date.strftime('%Y-%m-%d'),
                    end=end_date.strftime('%Y-%m-%d'),
                    interval="1h"
                )
                
                if not data.empty:
                    self.logger.info(f"{symbol} için {len(data)} adet saatlik veri çekildi (date_range ile)")
                    
                    # MultiIndex varsa düzelt
                    if isinstance(data.columns, pd.MultiIndex):
                        self.logger.info("MultiIndex sütunları düzeltildi")
                        # Sütun isimlerini düzeltme (MultiIndex -> normal sütunlar)
                        data.columns = [f"{col[0]}_{col[1]}" if isinstance(col, tuple) else col for col in data.columns]
                    
                    # BIST ticaret saatlerine göre filtrele (10:00-18:00)
                    data = self._filter_trading_hours(data)
                    
                    # Veriyi önbelleğe al
                    self.data_cache[cache_key] = data
                    
                    if not data.empty:
                        self.logger.info(f"{symbol} için son veri tarihi: {data.index[-1]}")
                        self.logger.info(f"{symbol} için veri temizleme sonrası satır sayısı: {len(data)}")
                        return data
                    else:
                        self.logger.warning(f"{symbol} için filtreleme sonrası veri kalmadı")
            except Exception as e:
                self.logger.warning(f"{symbol} için date_range ile veri çekme hatası: {str(e)}")
            
            # İlk yöntem başarısız olursa, period parametresi ile deneyelim
            try:
                # Günlük veriden saatlik veri oluşturmak için önce günlük veriyi çekelim
                daily_data = yf.download(
                    f"{symbol}.IS",
                    period=f"{days+5}d",  # Biraz daha fazla gün alalım (hafta sonu vs. için)
                    interval="1d"
                )
                
                if not daily_data.empty:
                    self.logger.info(f"{symbol} için günlük veri çekildi: {len(daily_data)} gün")
                    
                    # Günlük verileri kullanarak saatlik veri oluştur
                    hourly_data = self._simulate_hourly_from_daily(daily_data, days)
                    
                    if not hourly_data.empty:
                        self.logger.info(f"{symbol} için günlük veriden {len(hourly_data)} saatlik veri oluşturuldu")
                        
                        # BIST ticaret saatlerine göre filtrele (10:00-18:00)
                        hourly_data = self._filter_trading_hours(hourly_data)
                        
                        # Veriyi önbelleğe al
                        self.data_cache[cache_key] = hourly_data
                        
                        return hourly_data
            except Exception as e:
                self.logger.warning(f"{symbol} için period ile veri çekme hatası: {str(e)}")
            
            # Her iki yöntem de başarısız olursa boş bir DataFrame döndür
            self.logger.warning(f"{symbol} için saatlik veri çekilemedi")
            return pd.DataFrame()
            
        except Exception as e:
            self.logger.error(f"{symbol} için saatlik veri çekme hatası: {str(e)}")
            return pd.DataFrame()
    
    def _filter_trading_hours(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Veriyi BIST ticaret saatlerine göre filtreler (10:00-18:00, hafta içi)
        
        Args:
            data: Filtrelenecek veri
            
        Returns:
            pd.DataFrame: Filtrelenmiş veri
        """
        try:
            # Önce indeksin doğru formatta olduğundan emin olalım
            if not isinstance(data.index, pd.DatetimeIndex):
                data.index = pd.to_datetime(data.index)
            
            # Türkiye saatine dönüştür
            data.index = data.index.tz_localize('UTC').tz_convert('Europe/Istanbul') if data.index.tz is None else data.index.tz_convert('Europe/Istanbul')
            
            # Hafta içi filtresi (Pazartesi-Cuma)
            weekday_filter = (data.index.dayofweek < 5)  # 0=Pazartesi, 6=Pazar
            
            # Ticaret saatleri filtresi (10:00-18:00)
            hour_filter = (data.index.hour >= 10) & (data.index.hour < 18)
            
            # Filtreleri birleştir
            filtered_data = data[weekday_filter & hour_filter].copy()
            
            self.logger.info(f"BIST ticaret saatlerine göre filtrelendi, kalan veri: {len(filtered_data)} satır")
            
            return filtered_data
            
        except Exception as e:
            self.logger.error(f"Ticaret saatleri filtreleme hatası: {str(e)}")
            return data
    
    def _simulate_hourly_from_daily(self, daily_data: pd.DataFrame, days: int) -> pd.DataFrame:
        """
        Günlük veriden saatlik veri simüle eder (gerçek saatlik veri çekilemediğinde yedek yöntem)
        
        Args:
            daily_data: Günlük veri
            days: Simüle edilecek gün sayısı
            
        Returns:
            pd.DataFrame: Simüle edilmiş saatlik veri
        """
        try:
            # Son n gün verisi
            daily_data = daily_data.tail(days)
            
            if daily_data.empty:
                return pd.DataFrame()
            
            # Saatlik veri oluşturmak için boş bir DataFrame
            hourly_data = []
            
            # Her gün için saatlik veri oluştur
            for date, row in daily_data.iterrows():
                # Tarih bilgisini kontrol et
                if not isinstance(date, pd.Timestamp):
                    date = pd.Timestamp(date)
                
                # O gün için ticaret saatleri (10:00-18:00)
                for hour in range(10, 18):
                    # Saatlik zaman damgası
                    timestamp = pd.Timestamp(year=date.year, month=date.month, day=date.day, hour=hour, tzinfo=pytz.UTC).tz_convert(self.turkey_tz)
                    
                    # Fiyat ve hacim simülasyonu
                    if hour == 10:
                        # Açılış saati
                        price = row['Open']
                        volume = row['Volume'] / 8  # Günlük hacmin 1/8'i
                    elif hour == 17:
                        # Kapanış saati
                        price = row['Close']
                        volume = row['Volume'] / 8  # Günlük hacmin 1/8'i
                    else:
                        # Ara saatler - doğrusal interpolasyon + biraz rastgelelik
                        progress = (hour - 10) / 7  # 0 ile 1 arasında ilerleme
                        price = row['Open'] + progress * (row['Close'] - row['Open'])
                        
                        # Biraz rastgelelik ekleyelim (yüksek-düşük aralığının %10'u kadar)
                        range_factor = (row['High'] - row['Low']) * 0.1
                        price += np.random.uniform(-range_factor, range_factor)
                        
                        # Fiyatı yüksek-düşük aralığında tut
                        price = min(max(price, row['Low']), row['High'])
                        
                        # Hacim
                        volume = row['Volume'] / 8  # Günlük hacmin 1/8'i
                    
                    # Saatlik veri satırı
                    hourly_row = {
                        'Open': price,
                        'High': price * 1.001,  # Saatlik yüksek = fiyat + %0.1
                        'Low': price * 0.999,   # Saatlik düşük = fiyat - %0.1
                        'Close': price,
                        'Adj Close': price,
                        'Volume': volume
                    }
                    
                    # Veri çerçevesine ekle
                    hourly_data.append((timestamp, hourly_row))
            
            # Saatlik veriyi DataFrame'e çevir
            hourly_df = pd.DataFrame([row for _, row in hourly_data], index=[ts for ts, _ in hourly_data])
            
            self.logger.info(f"Günlük veriden {len(hourly_df)} saatlik veri simüle edildi")
            
            return hourly_df
            
        except Exception as e:
            self.logger.error(f"Saatlik veri simülasyonu hatası: {str(e)}")
            return pd.DataFrame()

    def calculate_basic_indicators(self, df: pd.DataFrame, symbol: str = None) -> pd.DataFrame:
        """
        Temel teknik göstergeleri hesaplar ve DataFrame'i tahmin için hazırlar.
        
        Args:
            df: İşlenecek veri çerçevesi
            symbol: Hisse senedi sembolü (opsiyonel)
            
        Returns:
            pd.DataFrame: Göstergeleri içeren hazırlanmış veri çerçevesi
        """
        try:
            # Symbol bilgisi loglamak için kullanılıyor
            symbol_info = f"{symbol} için" if symbol else ""
            
            # DataFrame'in şeklini ve sütunlarını logla
            self.logger.info(f"Gösterge hesaplama için DataFrame şekli: {df.shape}")
            self.logger.info(f"DataFrame sütunları: {list(df.columns)}")
            
            # DataFrame boş mu kontrol et
            if df.empty:
                self.logger.warning(f"{symbol_info} Gösterge hesaplaması için DataFrame boş")
                return df
            
            # DataFrame'in kopyasını oluştur (orijinali korumak için)
            result_df = df.copy()
            
            # Datetime/Tarih sütunu kontrolü
            date_column = None
            date_columns = ['date', 'datetime', 'Date', 'Datetime']
            
            for col in date_columns:
                if col in result_df.columns:
                    date_column = col
                    break
            
            # Datetime sütunu varsa, indeks olarak ayarla
            if date_column:
                result_df.set_index(date_column, inplace=True)
            
            # Gerekli sütunların varlığını kontrol et ve eşleştir (esnek isim eşleştirme)
            required_columns = {
                'Close': None,  # Kapanış fiyatı
                'Open': None,   # Açılış fiyatı
                'High': None,   # Yüksek fiyat
                'Low': None,    # Düşük fiyat
                'Volume': None  # İşlem hacmi
            }
            
            # Standart sütun isimleri için olası alternatifler
            column_alternatives = {
                'Close': ['close', 'Close', 'close_price', 'last_price', 'price', 'Adj Close', 'Adj_Close', 'AdjClose'],
                'Open': ['open', 'Open', 'open_price', 'first_price'],
                'High': ['high', 'High', 'high_price', 'highest_price', 'max_price'],
                'Low': ['low', 'Low', 'low_price', 'lowest_price', 'min_price'],
                'Volume': ['volume', 'Volume', 'vol', 'trade_volume', 'trading_volume']
            }
            
            # Akıllı sütun eşleştirme
            # 1. Tam isim eşleşmesi
            # 2. Kısmi ad ile eşleşme (örn. 'Close_XYZ' -> 'Close')
            # 3. Alternatif isimler ile eşleşme
            for standard_name, alternatives in column_alternatives.items():
                # Tam eşleşme
                if standard_name in result_df.columns:
                    required_columns[standard_name] = standard_name
                    continue
                    
                # Kısmi ad eşleşmesi
                partial_matches = [col for col in result_df.columns if standard_name in col]
                if partial_matches:
                    required_columns[standard_name] = partial_matches[0]
                    continue
                    
                # Alternatif isimler
                for alt in alternatives:
                    if alt in result_df.columns:
                        required_columns[standard_name] = alt
                        break
                        
                    # Kısmi alternatif eşleşme
                    partial_alt_matches = [col for col in result_df.columns if alt in col]
                    if partial_alt_matches:
                        required_columns[standard_name] = partial_alt_matches[0]
                        break
            
            # Eşleştirmeleri logla
            for standard_name, matched_name in required_columns.items():
                if matched_name:
                    self.logger.info(f"'{standard_name}' sütunu için '{matched_name}' kullanılacak")
                else:
                    self.logger.warning(f"'{standard_name}' sütunu için eşleşme bulunamadı")
            
            # Gerekli sütunları standardize et (isimlerini değiştir)
            rename_dict = {v: k for k, v in required_columns.items() if v and v != k}
            if rename_dict:
                result_df = result_df.rename(columns=rename_dict)
                self.logger.info(f"Sütun isimleri standardize edildi: {rename_dict}")
            
            # En azından Close sütunu olmalı
            if 'Close' not in result_df.columns or required_columns['Close'] is None:
                self.logger.error("Close sütunu bulunamadı, göstergeler hesaplanamıyor")
                return df  # Orijinal DataFrame'i geri döndür
            
            # İndeks datetime tipinde değilse dönüştür
            if not isinstance(result_df.index, pd.DatetimeIndex):
                try:
                    result_df.index = pd.to_datetime(result_df.index)
                    self.logger.info("İndeks datetime tipine dönüştürüldü")
                except Exception as e:
                    self.logger.warning(f"İndeks datetime tipine dönüştürülemedi: {str(e)}")
            
            # NaN ve sonsuz değerleri temizle
            result_df = result_df.replace([np.inf, -np.inf], np.nan)
            
            # Numerik sütunları seç
            numeric_columns = result_df.select_dtypes(include=['float64', 'int64']).columns
            
            # NaN değer sayısını logla
            nan_counts = result_df[numeric_columns].isna().sum()
            if nan_counts.sum() > 0:
                self.logger.info(f"NaN değer sayıları: {nan_counts.to_dict()}")
            
            # Gösterge hesaplama sayacı
            indicator_count = 0
            
            # 1. RSI (Relative Strength Index - Göreceli Güç Endeksi)
            try:
                rsi = ta.momentum.RSIIndicator(close=result_df['Close'], window=14)
                result_df['RSI'] = rsi.rsi()
                indicator_count += 1
                self.logger.info("RSI hesaplandı")
            except Exception as e:
                self.logger.warning(f"RSI hesaplanamadı: {str(e)}")
            
            # 2. MACD (Moving Average Convergence/Divergence - Hareketli Ortalama Yakınsama/Iraksama)
            try:
                macd = ta.trend.MACD(close=result_df['Close'])
                result_df['MACD'] = macd.macd()
                result_df['MACD_Signal'] = macd.macd_signal()
                result_df['MACD_Hist'] = macd.macd_diff()
                indicator_count += 1
                self.logger.info("MACD hesaplandı")
            except Exception as e:
                self.logger.warning(f"MACD hesaplanamadı: {str(e)}")
            
            # 3. Stochastic Oscillator (Stokastik Osilatör)
            try:
                if all(col in result_df.columns for col in ['High', 'Low', 'Close']):
                    stoch = ta.momentum.StochasticOscillator(
                        high=result_df['High'],
                        low=result_df['Low'],
                        close=result_df['Close']
                    )
                    result_df['Stoch_K'] = stoch.stoch()
                    result_df['Stoch_D'] = stoch.stoch_signal()
                    indicator_count += 1
                    self.logger.info("Stochastic Oscillator hesaplandı")
                else:
                    self.logger.warning("Stochastic Oscillator için gerekli sütunlar eksik")
            except Exception as e:
                self.logger.warning(f"Stochastic Oscillator hesaplanamadı: {str(e)}")
            
            # 4. CCI (Commodity Channel Index)
            try:
                if all(col in result_df.columns for col in ['High', 'Low', 'Close']):
                    result_df['CCI'] = ta.trend.CCIIndicator(
                        high=result_df['High'],
                        low=result_df['Low'],
                        close=result_df['Close']
                    ).cci()
                    indicator_count += 1
                    self.logger.info("CCI hesaplandı")
                else:
                    self.logger.warning("CCI için gerekli sütunlar eksik")
            except Exception as e:
                self.logger.warning(f"CCI hesaplanamadı: {str(e)}")
            
            # 5. Hareketli Ortalamalar (Moving Averages)
            try:
                # Farklı periyotlarda hareketli ortalamalar
                for window in [9, 20, 50]:
                    # Yeterli veri var mı kontrol et
                    if len(result_df) >= window:
                        # EMA (Üssel Hareketli Ortalama)
                        if window == 9:
                            result_df['EMA_9'] = ta.trend.EMAIndicator(
                                close=result_df['Close'], 
                                window=window
                            ).ema_indicator()
                        
                        # SMA (Basit Hareketli Ortalama)
                        result_df[f'SMA_{window}'] = ta.trend.SMAIndicator(
                            close=result_df['Close'], 
                            window=window
                        ).sma_indicator()
                    else:
                        self.logger.warning(f"{window} günlük hareketli ortalama için yeterli veri yok")
                
                indicator_count += 1
                self.logger.info("Hareketli ortalamalar hesaplandı")
            except Exception as e:
                self.logger.warning(f"Hareketli ortalamalar hesaplanamadı: {str(e)}")
            
            # 6. Bollinger Bantları
            try:
                bollinger = ta.volatility.BollingerBands(close=result_df['Close'])
                result_df['BB_High'] = bollinger.bollinger_hband()
                result_df['BB_Mid'] = bollinger.bollinger_mavg()
                result_df['BB_Low'] = bollinger.bollinger_lband()
                result_df['BB_Width'] = bollinger.bollinger_wband()
                indicator_count += 1
                self.logger.info("Bollinger bantları hesaplandı")
            except Exception as e:
                self.logger.warning(f"Bollinger bantları hesaplanamadı: {str(e)}")
            
            # 7. ATR (Average True Range - Ortalama Gerçek Aralık)
            try:
                if all(col in result_df.columns for col in ['High', 'Low', 'Close']):
                    result_df['ATR'] = ta.volatility.AverageTrueRange(
                        high=result_df['High'],
                        low=result_df['Low'],
                        close=result_df['Close']
                    ).average_true_range()
                    indicator_count += 1
                    self.logger.info("ATR hesaplandı")
                else:
                    self.logger.warning("ATR için gerekli sütunlar eksik")
            except Exception as e:
                self.logger.warning(f"ATR hesaplanamadı: {str(e)}")
            
            # 8. ROC (Rate of Change - Değişim Oranı)
            try:
                result_df['ROC'] = ta.momentum.ROCIndicator(close=result_df['Close']).roc()
                indicator_count += 1
                self.logger.info("ROC hesaplandı")
            except Exception as e:
                self.logger.warning(f"ROC hesaplanamadı: {str(e)}")
            
            # NaN değerleri yönet
            # Her sütun için NaN yüzdesini kontrol et
            numeric_columns = result_df.select_dtypes(include=['float64', 'int64']).columns
            nan_percentages = result_df[numeric_columns].isna().mean() * 100
            
            # Çok fazla NaN içeren sütunları kaldır (örn. %50'den fazla)
            columns_to_drop = nan_percentages[nan_percentages > 50].index.tolist()
            if columns_to_drop:
                self.logger.warning(f"%50'den fazla NaN içeren sütunlar kaldırıldı: {columns_to_drop}")
                result_df = result_df.drop(columns=columns_to_drop)
            
            # NaN değerleri akıllıca doldur
            # 1. İleri doldurma (forward fill) - önceki değerleri kullanarak doldurma
            result_df = result_df.fillna(method='ffill')
            
            # 2. Geri doldurma (backward fill) - sonraki değerleri kullanarak doldurma
            result_df = result_df.fillna(method='bfill')
            
            # 3. Hala kalan NaN değerler varsa, sütun bazında ortalama ile doldur
            result_df = result_df.fillna(result_df.mean())
            
            # 4. Son kontrol - hala NaN kaldıysa 0 ile doldur
            nan_count_after = result_df.isna().sum().sum()
            if nan_count_after > 0:
                self.logger.warning(f"İşlemlerden sonra hala {nan_count_after} NaN değer mevcut, 0 ile doldurulacak")
                result_df = result_df.fillna(0)
            
            # Sonuç olarak kullanılabilir özellikleri belirle
            numeric_columns = result_df.select_dtypes(include=['float64', 'int64']).columns
            available_features = [col for col in numeric_columns if col not in ['date', 'datetime', 'Date', 'Datetime']]
            
            self.logger.info(f"Toplam {indicator_count} teknik gösterge hesaplandı")
            self.logger.info(f"Kullanılabilir özellikler: {', '.join(available_features)}")
            
            return result_df
            
        except Exception as e:
            self.logger.error(f"Temel göstergeleri hesaplarken hata: {str(e)}")
            self.logger.error(traceback.format_exc())
            return df  # Hata durumunda orijinal veriyi döndür
    
    def fetch_and_prepare_dataframe(self, symbol: str, days: int = 45) -> pd.DataFrame:
        """
        Belirli bir hisse senedi için saatlik veri çeker ve teknik göstergeleri hesaplayarak 
        kullanıma hazır bir DataFrame oluşturur.
        
        Args:
            symbol: Veri çekilecek hisse senedi sembolü
            days: Kaç günlük veri çekileceği
            
        Returns:
            pd.DataFrame: Hazırlanmış DataFrame veya boş DataFrame (hata durumunda)
        """
        try:
            # Eğer bu sembol için önceden hazırlanmış bir DataFrame varsa onu döndür
            if symbol in self.stock_dataframes:
                self.logger.info(f"{symbol} için önceden hazırlanmış DataFrame kullanılıyor")
                return self.stock_dataframes[symbol]
            
            # Saatlik veri çek
            hourly_data = self.fetch_hourly_data(symbol, days)
            
            if hourly_data.empty:
                self.logger.warning(f"{symbol} için saatlik veri çekilemedi")
                return pd.DataFrame()
            
            # Teknik göstergeleri hesapla - Symbol parametresini şimdi iletiyoruz
            df_with_indicators = self.calculate_basic_indicators(hourly_data, symbol)
            
            if df_with_indicators.empty:
                self.logger.warning(f"{symbol} için teknik göstergeler hesaplanamadı")
                return pd.DataFrame()
            
            # Hazırlanan DataFrame'i sakla
            self.stock_dataframes[symbol] = df_with_indicators
            
            self.logger.info(f"{symbol} için DataFrame hazırlandı ve saklandı")
            self.logger.info(f"DataFrame boyutu: {df_with_indicators.shape[0]} satır, {df_with_indicators.shape[1]} sütun")
            self.logger.info(f"Kullanılabilir özellikler: {', '.join(df_with_indicators.columns)}")
            
            return df_with_indicators
            
        except Exception as e:
            self.logger.error(f"{symbol} için DataFrame hazırlama hatası: {str(e)}")
            self.logger.error(traceback.format_exc())
            return pd.DataFrame()

    def get_stock_dataframe(self, symbol: str) -> pd.DataFrame:
        """
        Belirli bir hisse senedi için mevcut DataFrame'i döndürür.
        Eğer DataFrame henüz oluşturulmamışsa, boş bir DataFrame döndürür.
        
        Args:
            symbol: Hisse senedi sembolü
            
        Returns:
            pd.DataFrame: Hisse senedi DataFrame'i veya boş DataFrame
        """
        return self.stock_dataframes.get(symbol, pd.DataFrame())

    def save_stock_dataframe(self, symbol: str, df: pd.DataFrame) -> bool:
        """
        Belirli bir hisse senedi için DataFrame'i kaydeder.
        
        Args:
            symbol: Hisse senedi sembolü
            df: Kaydedilecek DataFrame
            
        Returns:
            bool: İşlem başarılı ise True, değilse False
        """
        try:
            self.stock_dataframes[symbol] = df
            self.logger.info(f"{symbol} için DataFrame güncellendi (satır: {df.shape[0]}, sütun: {df.shape[1]})")
            return True
        except Exception as e:
            self.logger.error(f"{symbol} için DataFrame kaydetme hatası: {str(e)}")
            return False

    def prepare_hourly_data_for_prediction(self, symbols: List[str], days: int = 45) -> Dict[str, Dict[str, Any]]:
        """
        Verilen hisse senetleri için saatlik tahmin verilerini hazırlar.
        
        Args:
            symbols: Hisse senedi sembollerinin listesi
            days: Kaç günlük veri alınacağı
            
        Returns:
            Dict: Her sembol için hazırlanan veri ve eğitilmiş modelleri içeren sözlük
        """
        results = {}
        sequence_length = 10  # Önceki değer 15'ti, daha az veri gerektirmesi için küçültüldü
        
        # Sonuçları depolamak için sözlük oluştur
        for symbol in symbols:
            results[symbol] = {
                "success": False,
                "message": "İşlem başlatılıyor",
                "models": {},
                "predictions": {},
                "last_data_points": None,
                "metrics": {},
                "dataframe": None  # DataFrame'i saklamak için yeni alan
            }
        
        # Minimum gereken veri noktası sayısı
        min_data_points = sequence_length + 24  # En az sequence_length + 24 saat gerekli
        
        self.logger.info(f"Saatlik tahmin verisi hazırlanıyor. {len(symbols)} adet sembol için, son {days} gün")
        self.logger.info(f"Her sembol için en az {min_data_points} veri noktası gerekli")
        
        for symbol in symbols:
            try:
                # Önce hazır DataFrame var mı kontrol et
                if symbol in self.stock_dataframes:
                    df = self.stock_dataframes[symbol].copy()
                    self.logger.info(f"{symbol} için hazır DataFrame kullanılıyor")
                else:
                    # Saatlik veri çek ve teknik göstergeleri hesapla
                    df = self.fetch_and_prepare_dataframe(symbol, days)
                
                if df.empty:
                    results[symbol]["message"] = "Veri hazırlanamadı"
                    self.logger.warning(f"{symbol} için veri hazırlanamadı")
                    continue
                
                # DataFrame'i sonuçlara ekle
                results[symbol]["dataframe"] = df.copy()
                
                # Veri temizliği ve filtreleme
                # NaN ve sonsuz değerleri temizle
                df = df.replace([np.inf, -np.inf], np.nan)
                
                # NaN değerleri doldur - silme
                for col in df.columns:
                    if df[col].isna().sum() > 0:
                        # Sayısal sütunlar için ileri/geri doldurma yöntemi
                        if np.issubdtype(df[col].dtype, np.number):
                            df[col] = df[col].fillna(method='ffill').fillna(method='bfill')
                    
                        # Hala NaN varsa ortalama ile doldur
                        if df[col].isna().sum() > 0 and np.issubdtype(df[col].dtype, np.number):
                            df[col] = df[col].fillna(df[col].mean() if not np.isnan(df[col].mean()) else 0)
                
                self.logger.info(f"{symbol} temizlenmiş veri: {df.shape[0]} satır")
                
                # Veri noktası sayısını kontrol et
                if len(df) < min_data_points:
                    results[symbol]["message"] = f"Yetersiz veri: {len(df)} satır (min {min_data_points} gerekli)"
                    self.logger.warning(f"{symbol} için yetersiz veri: {len(df)} satır (min {min_data_points} gerekli)")
                    continue
                
                # Son 24 saatlik veriyi ayır (tahmin için)
                df_train = df.iloc[:-24].copy()
                df_pred = df.iloc[-24:].copy()
                
                # Tahmin için kullanılacak özellikleri seç
                feature_columns = self.select_best_features(df_train)
                
                if len(feature_columns) < 3:
                    results[symbol]["message"] = f"Yetersiz özellik: {len(feature_columns)} özellik (min 3 gerekli)"
                    self.logger.warning(f"{symbol} için yetersiz özellik: {len(feature_columns)} özellik (min 3 gerekli)")
                    continue
                
                self.logger.info(f"{symbol} için seçilen özellikler: {feature_columns}")
                
                # Veriyi normalize et
                X, y, scaler_X, scaler_y = self.prepare_data(
                    df_train, 
                    df_train["Close"].values if "Close" in df_train.columns else df_train["close"].values, 
                    sequence_length, 
                    feature_columns
                )
                
                if X.shape[0] < 2 * sequence_length:
                    results[symbol]["message"] = f"Normalizasyon sonrası yetersiz veri: {X.shape[0]} satır"
                    self.logger.warning(f"{symbol} için normalizasyon sonrası yetersiz veri: {X.shape[0]} satır")
                    continue
                
                # Eğitim/test setlerini ayır - küçük veri setleri için tüm veriyi kullan
                if X.shape[0] < 50:
                    X_train, y_train = X, y
                    X_test, y_test = X[-10:], y[-10:]  # Test için son 10 örneği kullan
                    self.logger.warning(f"{symbol} için küçük veri seti: Tüm veri eğitim için kullanılıyor")
                else:
                    # Normal veri bölme
                    train_size = int(0.8 * len(X))
                    X_train, X_test = X[:train_size], X[train_size:]
                    y_train, y_test = y[:train_size], y[train_size:]
                
                self.logger.info(f"{symbol} eğitim/test bölünmesi: {X_train.shape[0]}/{X_test.shape[0]}")
                
                # Model eğitimi - LSTM
                try:
                    lstm_model, lstm_metrics = self.train_model(
                        symbol, 
                        X_train, y_train, 
                        X_test, y_test, 
                        model_type='lstm',
                        epochs=50, 
                        batch_size=16
                    )
                    
                    results[symbol]["models"]["lstm"] = lstm_model
                    results[symbol]["metrics"]["lstm"] = lstm_metrics
                    
                except Exception as e:
                    self.logger.error(f"{symbol} LSTM model eğitimi hatası: {str(e)}")
                    results[symbol]["message"] = f"LSTM model eğitimi hatası: {str(e)}"
                    # Hataya rağmen devam et, diğer modeli deneyeceğiz
                
                # Model eğitimi - GRU 
                try:
                    gru_model, gru_metrics = self.train_model(
                        symbol, 
                        X_train, y_train, 
                        X_test, y_test, 
                        model_type='gru',
                        epochs=50, 
                        batch_size=16
                    )
                    
                    results[symbol]["models"]["gru"] = gru_model
                    results[symbol]["metrics"]["gru"] = gru_metrics
                    
                except Exception as e:
                    self.logger.error(f"{symbol} GRU model eğitimi hatası: {str(e)}")
                    results[symbol]["message"] = f"GRU model eğitimi hatası: {str(e)}"
                
                # Modeller oluşturuldu mu kontrol et
                if not results[symbol]["models"]:
                    results[symbol]["message"] = "Hiçbir model başarıyla eğitilemedi"
                    self.logger.warning(f"{symbol} için hiçbir model başarıyla eğitilemedi")
                    continue
                
                # Gelecek 24 saat için tahmin
                X_pred = self.prepare_data_for_prediction(
                    df, feature_columns, scaler_X, sequence_length
                )
                
                # LSTM ve GRU tahminleri yap
                pred_results = {}
                
                for model_name, model in results[symbol]["models"].items():
                    raw_preds = model.predict(X_pred)
                    # Tahminleri orijinal ölçeğe çevir
                    scaled_preds = scaler_y.inverse_transform(raw_preds.reshape(-1, 1)).flatten()
                    pred_results[model_name] = scaled_preds
                
                # Tahminleri kaydet
                results[symbol]["predictions"] = pred_results
                results[symbol]["last_data_points"] = df_pred
                results[symbol]["success"] = True
                results[symbol]["message"] = "Tahmin başarılı"
                
                self.logger.info(f"{symbol} için tahmin başarıyla tamamlandı")
                
            except Exception as e:
                self.logger.error(f"{symbol} için hata: {str(e)}")
                results[symbol]["message"] = f"İşlem hatası: {str(e)}"
                traceback.print_exc()
        
        self.logger.info(f"Saatlik tahmin verisi hazırlama tamamlandı. "
                       f"Başarılı: {sum(1 for s in results.values() if s['success'])}/{len(symbols)}")
        
        return results

    def select_best_features(self, df: pd.DataFrame) -> List[str]:
        """
        Tahmin için en iyi özellikleri seçer.
        
        Args:
            df: İşlenecek veri çerçevesi
            
        Returns:
            List[str]: Seçilen özellik isimleri listesi
        """
        try:
            # Tüm sayısal sütunları al
            numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns.tolist()
            
            # İndeks, tarih ve saat sütunlarını hariç tut
            exclude_patterns = ['date', 'time', 'index', 'timestamp', 'datetime']
            filtered_cols = [col for col in numeric_cols if not any(pattern in col.lower() for pattern in exclude_patterns)]
            
            # En az 5 özellik seçmeye çalış, yoksa tüm özellikleri kullan
            if len(filtered_cols) > 5:
                # Temel fiyat ve hacim verilerini her zaman dahil et
                essential_cols = [col for col in filtered_cols if any(name in col for name in ['Open', 'High', 'Low', 'Close', 'Volume'])]
                
                # Teknik göstergelerden en önemlilerini seç
                indicator_cols = [col for col in filtered_cols if col not in essential_cols]
                important_indicators = [col for col in indicator_cols if any(name in col for name in ['RSI', 'MACD', 'BB_', 'SMA_', 'EMA_'])]
                
                # Son seçim
                selected_features = essential_cols + important_indicators
                
                # Eğer 5'ten az özellik varsa, diğer göstergelerden de ekle
                if len(selected_features) < 5 and len(indicator_cols) > 0:
                    remaining = [col for col in indicator_cols if col not in important_indicators]
                    selected_features.extend(remaining[:5-len(selected_features)])
            else:
                selected_features = filtered_cols
            
            # En az bir fiyat verisinin olduğundan emin ol
            if not any(name in ' '.join(selected_features) for name in ['Close', 'Open', 'High', 'Low']):
                if 'Close' in df.columns:
                    selected_features.append('Close')
                elif 'close' in df.columns:
                    selected_features.append('close')
            
            return selected_features
            
        except Exception as e:
            self.logger.error(f"Özellik seçme hatası: {str(e)}")
            # Hata durumunda mevcut tüm sayısal sütunları döndür
            return df.select_dtypes(include=['float64', 'int64']).columns.tolist()

    def prepare_data(self, df: pd.DataFrame, target_values: np.ndarray, sequence_length: int, feature_columns: List[str]) -> Tuple[np.ndarray, np.ndarray, MinMaxScaler, MinMaxScaler]:
        """
        Veriyi model eğitimi için hazırlar.
        
        Args:
            df: İşlenecek veri çerçevesi
            target_values: Tahmin edilecek hedef değerler
            sequence_length: Dizilerin uzunluğu
            feature_columns: Kullanılacak özellik isimleri
            
        Returns:
            Tuple: X dizileri, y hedef değerleri, özellik ölçekleyici, hedef ölçekleyici
        """
        try:
            # Özellik matrisini oluştur
            X_features = df[feature_columns].values
            
            # Normalizasyon
            scaler_X = MinMaxScaler()
            X_scaled = scaler_X.fit_transform(X_features)
            
            scaler_y = MinMaxScaler()
            y_scaled = scaler_y.fit_transform(target_values.reshape(-1, 1)).flatten()
            
            # Dizileri oluştur
            X, y = [], []
            
            for i in range(len(X_scaled) - sequence_length):
                # Girdi dizisi: t, t+1, ..., t+sequence_length-1
                X.append(X_scaled[i:i+sequence_length])
                # Hedef: t+sequence_length
                y.append(y_scaled[i+sequence_length])
            
            return np.array(X), np.array(y), scaler_X, scaler_y
            
        except Exception as e:
            self.logger.error(f"Veri hazırlama hatası: {str(e)}")
            raise

    def prepare_data_for_prediction(self, df: pd.DataFrame, feature_columns: List[str], scaler: MinMaxScaler, sequence_length: int) -> np.ndarray:
        """
        Tahmin için veriyi hazırlar.
        
        Args:
            df: İşlenecek veri çerçevesi
            feature_columns: Kullanılacak özellik isimleri
            scaler: Normalizasyon için ölçekleyici
            sequence_length: Dizi uzunluğu
            
        Returns:
            np.ndarray: Tahmin için hazırlanmış diziler
        """
        try:
            # Son 'sequence_length' kadar veriyi al
            recent_data = df[feature_columns].values[-sequence_length:]
            
            # Normalize et
            recent_scaled = scaler.transform(recent_data)
            
            # Tek bir örnek olarak şekillendir
            X_pred = np.array([recent_scaled])
            
            return X_pred
            
        except Exception as e:
            self.logger.error(f"Tahmin verisi hazırlama hatası: {str(e)}")
            raise

    def predict_stock_with_dataframe(self, symbol: str, model_type: str = 'lstm') -> Dict[str, Any]:
        """
        Kaydedilmiş DataFrame kullanarak hisse senedi tahmini yapar.
        
        Args:
            symbol: Hisse senedi sembolü
            model_type: Kullanılacak model tipi ('lstm', 'gru')
            
        Returns:
            Dict: Tahmin sonuçları
        """
        try:
            # DataFrame'i al
            df = self.get_stock_dataframe(symbol)
            
            if df.empty:
                self.logger.warning(f"{symbol} için DataFrame bulunamadı")
                return {"success": False, "message": "DataFrame bulunamadı"}
            
            # Tahmin için kullanılacak özellikleri seç
            feature_columns = self.select_best_features(df)
            
            if len(feature_columns) < 3:
                self.logger.warning(f"{symbol} için yeterli özellik yok")
                return {"success": False, "message": "Yeterli özellik yok"}
            
            # Son 24 saati ayır
            df_train = df.iloc[:-24].copy()
            df_pred = df.iloc[-24:].copy()
            
            # Veriyi hazırla
            sequence_length = 30  # 10'dan 30'a değiştirildi
            target_column = 'Close' if 'Close' in df.columns else 'close'
            
            X, y, scaler_X, scaler_y = self.prepare_data(
                df_train, 
                df_train[target_column].values, 
                sequence_length, 
                feature_columns
            )
            
            # Eğitim/test setlerini ayır
            train_size = int(0.8 * len(X))
            X_train, X_test = X[:train_size], X[train_size:]
            y_train, y_test = y[:train_size], y[train_size:]
            
            # Model eğit
            model, metrics = self.train_model(
                symbol, 
                X_train, y_train, 
                X_test, y_test, 
                model_type=model_type,
                epochs=150,  # 50'den 150'ye değiştirildi
                batch_size=20  # 16'dan 20'ye değiştirildi
            )
            
            # Tahmin için X_pred oluştur
            X_pred = self.prepare_data_for_prediction(
                df, 
                feature_columns, 
                scaler_X, 
                sequence_length
            )
            
            # Tahmin yap
            raw_preds = model.predict(X_pred)
            predictions = scaler_y.inverse_transform(raw_preds.reshape(-1, 1)).flatten()
            
            # Sonuçları hazırla
            results = {
                "success": True,
                "message": "Tahmin başarılı",
                "predicted_values": predictions.tolist(),
                "metrics": metrics,
                "last_price": df[target_column].iloc[-1],
                "features_used": feature_columns,
                "model_type": model_type
            }
            
            return results
            
        except Exception as e:
            self.logger.error(f"{symbol} için tahmin hatası: {str(e)}")
            return {"success": False, "message": f"Tahmin hatası: {str(e)}"}

    def train_model(self, symbol: str, X_train: np.ndarray, y_train: np.ndarray, 
                    X_test: np.ndarray, y_test: np.ndarray, 
                    model_type: str = 'lstm', epochs: int = 150, 
                    batch_size: int = 20) -> Tuple[Sequential, Dict[str, float]]:
        """
        Belirtilen model tipini eğitir ve test eder.
        
        Args:
            symbol: Hisse senedi sembolü
            X_train: Eğitim veri seti (giriş)
            y_train: Eğitim veri seti (hedef) 
            X_test: Test veri seti (giriş)
            y_test: Test veri seti (hedef)
            model_type: Model tipi ('lstm', 'gru', veya 'attention')
            epochs: Eğitim devresi sayısı (150)
            batch_size: Toplu işleme boyutu (20)
            
        Returns:
            Tuple[Sequential, Dict]: Eğitilmiş model ve başarı metrikleri
        """
        self.logger.info(f"{symbol} için {model_type.upper()} modeli eğitiliyor")
        
        input_shape = (X_train.shape[1], X_train.shape[2])
        
        # Model oluştur
        if model_type.lower() == 'lstm':
            model = self.create_lstm_model(input_shape)
        elif model_type.lower() == 'gru':
            model = self.create_gru_model(input_shape)
        elif model_type.lower() == 'attention':
            model = self.create_attention_model(input_shape)
        else:
            raise ValueError(f"Desteklenmeyen model tipi: {model_type}")
        
        # Early stopping callback'i oluştur - aşırı eğitimi önlemek için
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=30,  # Daha uzun süre bekle
            verbose=1,
            restore_best_weights=True
        )
        
        # Modeli eğit
        try:
            history = model.fit(
                X_train, y_train,
                epochs=epochs,  # 150 epoch
                batch_size=batch_size,  # 20 batch size
                validation_data=(X_test, y_test),
                verbose=0,
                callbacks=[early_stopping]
            )
            
            # Eğitim sonuçlarını logla
            self.logger.info(f"{symbol} {model_type.upper()} eğitimi tamamlandı: {len(history.epoch)} epoch")
            
            # Test veri seti üzerinde değerlendir
            y_pred = model.predict(X_test)
            
            # Metrikler
            mse = mean_squared_error(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            
            # İyi tahmin doğruluğu (yön bazında)
            direction_accuracy = np.mean((np.sign(y_pred) == np.sign(y_test)).astype(int))
            
            metrics = {
                'mse': float(mse),
                'mae': float(mae),
                'accuracy': float(direction_accuracy),
                'epochs': len(history.epoch),
                'final_loss': float(history.history['loss'][-1]),
                'final_val_loss': float(history.history['val_loss'][-1])
            }
            
            self.logger.info(f"{symbol} {model_type.upper()} metrikleri - MSE: {mse:.6f}, MAE: {mae:.6f}, Accuracy: {direction_accuracy:.4f}")
            
            return model, metrics
            
        except Exception as e:
            self.logger.error(f"{symbol} {model_type.upper()} eğitim hatası: {str(e)}")
            raise

    def create_lstm_model(self, input_shape: Tuple[int, int]) -> Sequential:
        """
        LSTM tabanlı sinir ağı modeli oluşturur.
        
        Args:
            input_shape: Girdi verisi boyutu (sequence_length, features)
            
        Returns:
            Sequential: Eğitime hazır LSTM modeli
        """
        try:
            # Model oluştur
            model = Sequential()
            
            # LSTM katmanları - 3 katmanlı model
            model.add(LSTM(128, input_shape=input_shape, return_sequences=True))
            model.add(Dropout(0.2))
            model.add(LSTM(64, return_sequences=True))
            model.add(Dropout(0.2))
            model.add(LSTM(32, return_sequences=False))
            model.add(Dropout(0.2))
            model.add(Dense(1))  # Tek bir tahmin için bir nöron
            
            # Modeli derle - öğrenme katsayısı 0.0001
            model.compile(optimizer=Adam(learning_rate=0.0001), loss='mse', metrics=['mae'])
            
            return model
            
        except Exception as e:
            self.logger.error(f"LSTM model oluşturma hatası: {str(e)}")
            self.logger.error(traceback.format_exc())
            # Daha basit bir model döndür
            fallback_model = Sequential()
            fallback_model.add(LSTM(20, input_shape=input_shape, return_sequences=False))
            fallback_model.add(Dense(1))
            fallback_model.compile(optimizer='adam', loss='mse')
            return fallback_model

    def create_gru_model(self, input_shape: Tuple[int, int]) -> Sequential:
        """
        GRU tabanlı sinir ağı modeli oluşturur.
        
        Args:
            input_shape: Girdi verisi boyutu (sequence_length, features)
            
        Returns:
            Sequential: Eğitime hazır GRU modeli
        """
        try:
            # Model oluştur
            model = Sequential()
            
            # GRU katmanları - daha basit bir model kullanıyoruz
            model.add(GRU(50, input_shape=input_shape, return_sequences=True))
            model.add(Dropout(0.2))
            model.add(GRU(30, return_sequences=False))
            model.add(Dropout(0.2))
            model.add(Dense(1))  # Tek bir tahmin için bir nöron
            
            # Modeli derle
            model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mae'])
            
            return model
            
        except Exception as e:
            self.logger.error(f"GRU model oluşturma hatası: {str(e)}")
            self.logger.error(traceback.format_exc())
            # Daha basit bir model döndür
            fallback_model = Sequential()
            fallback_model.add(GRU(20, input_shape=input_shape, return_sequences=False))
            fallback_model.add(Dense(1))
            fallback_model.compile(optimizer='adam', loss='mse')
            return fallback_model

    def create_attention_model(self, input_shape: Tuple[int, int]) -> Sequential:
        """
        Attention mekanizması içeren sinir ağı modeli oluşturur.
        
        Args:
            input_shape: Girdi verisi boyutu (sequence_length, features)
            
        Returns:
            Sequential: Eğitime hazır attention modeli
        """
        try:
            # TensorFlow sürümüne göre farklı implementasyon
            # TF 2.4+ için MultiHeadAttention kullanıyoruz
            
            # Functional API kullanıyoruz burada
            inputs = tf.keras.Input(shape=input_shape)
            
            # Self-attention ve normalizasyon
            x = LayerNormalization(epsilon=1e-6)(inputs)
            x = MultiHeadAttention(
                key_dim=input_shape[1],  # feature boyutu
                num_heads=2,             # 2 dikkat başlığı
                dropout=0.1
            )(x, x)
            
            # Feed forward network
            x = LayerNormalization(epsilon=1e-6)(x)
            x = tf.keras.layers.Dense(input_shape[1] * 2, activation='relu')(x)
            x = tf.keras.layers.Dropout(0.1)(x)
            x = tf.keras.layers.Dense(input_shape[1])(x)
            
            # Flatten ve tahmin
            x = tf.keras.layers.GlobalAveragePooling1D()(x)
            outputs = tf.keras.layers.Dense(1)(x)
            
            # Model oluştur
            model = tf.keras.Model(inputs=inputs, outputs=outputs)
            
            # Modeli derle
            model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mae'])
            
            return model
            
        except Exception as e:
            self.logger.error(f"Attention model oluşturma hatası: {str(e)}")
            self.logger.error(traceback.format_exc())
            # Daha basit bir GRU modeli döndür (fallback)
            fallback_model = Sequential()
            fallback_model.add(GRU(20, input_shape=input_shape, return_sequences=False))
            fallback_model.add(Dense(1))
            fallback_model.compile(optimizer='adam', loss='mse')
            return fallback_model

    def predict_stock(self, db: Session, stock: BaseStock, model_type: str = 'all') -> Dict[str, Any]:
        """
        Verilen hisse senedi için tahmin yapar ve sonuçları veritabanına kaydeder.
        
        Args:
            db: Veritabanı oturumu
            stock: Hisse senedi modeli
            model_type: Kullanılacak model tipi ('lstm', 'gru', 'attention' veya 'all')
            
        Returns:
            Dict: Tahmin sonuçları, PredictionStockResponse şemasıyla uyumlu
        """
        try:
            symbol = stock.symbol
            self.logger.info(f"{symbol} için {model_type} modeli ile tahmin yapılıyor")
            
            # Önce veriyi hazırla
            df = self.fetch_and_prepare_dataframe(symbol, days=45)
            
            if df.empty:
                self.logger.warning(f"{symbol} için veri hazırlanamadı")
                return None
            
            # DataFrame'i kaydet
            self.save_stock_dataframe(symbol, df)
            
            # Model tipine göre tahminleri yap
            predictions = {}
            metrics = {}
            
            # Kullanılan özellikler
            feature_columns = self.select_best_features(df)
            
            # Eğitim ve tahmin penceresi boyutları
            training_window = 30  # sequence_length değeri - 30'a çıkarıldı
            prediction_window = 1  # Tek adım tahmin
            
            if model_type.lower() == 'all':
                # Tüm model tipleri için tahmin yap
                model_types = ['lstm', 'gru', 'attention']
                for mt in model_types:
                    try:
                        result = self.predict_stock_with_dataframe(symbol, mt)
                        if result.get('success'):
                            predictions[mt] = result.get('predicted_values', [])
                            metrics[mt] = result.get('metrics', {})
                    except Exception as e:
                        self.logger.error(f"{symbol} için {mt} tahmin hatası: {str(e)}")
            else:
                # Sadece belirtilen model tipini kullan
                result = self.predict_stock_with_dataframe(symbol, model_type.lower())
                if result.get('success'):
                    predictions[model_type.lower()] = result.get('predicted_values', [])
                    metrics[model_type.lower()] = result.get('metrics', {})
            
            # En iyi modeli belirle (en düşük MSE değerine sahip model)
            best_model = None
            best_mse = float('inf')
            best_mae = float('inf')
            
            for model_name, model_metrics in metrics.items():
                current_mse = model_metrics.get('mse', float('inf'))
                if current_mse < best_mse:
                    best_model = model_name
                    best_mse = current_mse
                    best_mae = model_metrics.get('mae', 0)
            
            # Volatilite hesapla (basit yöntem - tahminler arasındaki farkın standart sapması)
            all_predictions = []
            for preds in predictions.values():
                all_predictions.extend(preds)
            
            volatility = np.std(all_predictions) if len(all_predictions) > 1 else 0.0
            
            # Her model için değişim yüzdeleri hesapla
            current_price = float(stock.last_price) if hasattr(stock, "last_price") else None
            price_changes = {}
            
            for model_name, preds in predictions.items():
                if current_price and preds and len(preds) > 0:
                    avg_pred = np.mean(preds)
                    price_changes[model_name] = ((avg_pred - current_price) / current_price) * 100
            
            # Tahmin sonuçlarını veritabanına kaydet
            try:
                # Mevcut tahmini kontrol et
                existing_prediction = db.query(PredictionStock).filter(PredictionStock.symbol == symbol).first()
                
                # Tüm model sonuçları birleştirilerek tahmin sonuçları
                combined_results = {
                    "predictions": predictions,
                    "metrics": metrics,
                    "last_updated": datetime.now().isoformat(),
                    "symbol": symbol,
                    "models_used": list(predictions.keys()),
                    "best_model": best_model,
                    "best_mse": best_mse,
                    "best_mae": best_mae,
                    "volatility": volatility,
                    "price_changes": price_changes,
                    "features_used": feature_columns,
                    "training_window": training_window,
                    "prediction_window": prediction_window,
                    "prediction_date": (datetime.now() + timedelta(days=1)).isoformat()
                }
                
                # Sonuçları JSON olarak sakla
                json_results = json.dumps(combined_results)
                
                if existing_prediction:
                    # Mevcut tahmini güncelle
                    existing_prediction.prediction_data = json_results
                    existing_prediction.last_updated = datetime.now()
                    
                    # Diğer sütunları da güncelle
                    existing_prediction.lstm_predicted_price = predictions.get('lstm', [0])[0] if 'lstm' in predictions and predictions['lstm'] else None
                    existing_prediction.lstm_change_percent = price_changes.get('lstm', 0) if 'lstm' in price_changes else None
                    existing_prediction.lstm_mse = metrics.get('lstm', {}).get('mse', 0) if 'lstm' in metrics else None
                    existing_prediction.lstm_mae = metrics.get('lstm', {}).get('mae', 0) if 'lstm' in metrics else None
                    
                    existing_prediction.gru_predicted_price = predictions.get('gru', [0])[0] if 'gru' in predictions and predictions['gru'] else None
                    existing_prediction.gru_change_percent = price_changes.get('gru', 0) if 'gru' in price_changes else None
                    existing_prediction.gru_mse = metrics.get('gru', {}).get('mse', 0) if 'gru' in metrics else None
                    existing_prediction.gru_mae = metrics.get('gru', {}).get('mae', 0) if 'gru' in metrics else None
                    
                    existing_prediction.attention_predicted_price = predictions.get('attention', [0])[0] if 'attention' in predictions and predictions['attention'] else None
                    existing_prediction.attention_change_percent = price_changes.get('attention', 0) if 'attention' in price_changes else None
                    existing_prediction.attention_mse = metrics.get('attention', {}).get('mse', 0) if 'attention' in metrics else None
                    existing_prediction.attention_mae = metrics.get('attention', {}).get('mae', 0) if 'attention' in metrics else None
                    
                    existing_prediction.current_price = current_price
                    existing_prediction.prediction_date = datetime.now() + timedelta(days=1)
                    existing_prediction.volatility = volatility
                    
                    existing_prediction.features_used = feature_columns
                    existing_prediction.training_window = training_window
                    existing_prediction.prediction_window = prediction_window
                    
                    existing_prediction.best_model = best_model
                    existing_prediction.best_mse = best_mse
                    existing_prediction.best_mae = best_mae
                    
                    existing_prediction.updated_at = datetime.now()
                    
                    db.commit()
                    self.logger.info(f"{symbol} için mevcut tahmin güncellendi")
                else:
                    # Yeni tahmin oluştur
                    new_prediction = PredictionStock(
                        symbol=symbol,
                        base_stock_id=stock.id,
                        prediction_data=json_results,
                        last_updated=datetime.now(),
                        
                        # Tahmin değerleri - LSTM
                        lstm_predicted_price=predictions.get('lstm', [0])[0] if 'lstm' in predictions and predictions['lstm'] else None,
                        lstm_change_percent=price_changes.get('lstm', 0) if 'lstm' in price_changes else None,
                        lstm_mse=metrics.get('lstm', {}).get('mse', 0) if 'lstm' in metrics else None,
                        lstm_mae=metrics.get('lstm', {}).get('mae', 0) if 'lstm' in metrics else None,
                        
                        # Tahmin değerleri - GRU
                        gru_predicted_price=predictions.get('gru', [0])[0] if 'gru' in predictions and predictions['gru'] else None,
                        gru_change_percent=price_changes.get('gru', 0) if 'gru' in price_changes else None,
                        gru_mse=metrics.get('gru', {}).get('mse', 0) if 'gru' in metrics else None,
                        gru_mae=metrics.get('gru', {}).get('mae', 0) if 'gru' in metrics else None,
                        
                        # Tahmin değerleri - Attention
                        attention_predicted_price=predictions.get('attention', [0])[0] if 'attention' in predictions and predictions['attention'] else None,
                        attention_change_percent=price_changes.get('attention', 0) if 'attention' in price_changes else None,
                        attention_mse=metrics.get('attention', {}).get('mse', 0) if 'attention' in metrics else None,
                        attention_mae=metrics.get('attention', {}).get('mae', 0) if 'attention' in metrics else None,
                        
                        # Ortak değerler
                        current_price=current_price,
                        prediction_date=datetime.now() + timedelta(days=1),
                        volatility=volatility,
                        
                        # Model detayları
                        features_used=feature_columns,
                        training_window=training_window,
                        prediction_window=prediction_window,
                        
                        # En iyi model
                        best_model=best_model,
                        best_mse=best_mse,
                        best_mae=best_mae,
                        
                        # Zaman damgaları
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    
                    db.add(new_prediction)
                    db.commit()
                    self.logger.info(f"{symbol} için yeni tahmin kaydı oluşturuldu")
                
            except Exception as e:
                db.rollback()
                self.logger.error(f"{symbol} için veritabanı kayıt hatası: {str(e)}")
                self.logger.error(traceback.format_exc())
            
            # API yanıtını hazırla - PredictionStockResponse şemasıyla uyumlu
            # Mevcut bir tahmin kaydı varsa ID'sini kullan, yoksa -1 ile doldur
            prediction_id = existing_prediction.id if 'existing_prediction' in locals() and existing_prediction else -1
            base_stock_id = stock.id if hasattr(stock, "id") else -1
            
            # Bireysel model tahminleri için değerleri ayarla
            lstm_pred = predictions.get('lstm', [0])[0] if 'lstm' in predictions and predictions['lstm'] else None
            gru_pred = predictions.get('gru', [0])[0] if 'gru' in predictions and predictions['gru'] else None
            attention_pred = predictions.get('attention', [0])[0] if 'attention' in predictions and predictions['attention'] else None
            
            # Değişim yüzdeleri
            lstm_change = price_changes.get('lstm', 0) if 'lstm' in price_changes else None
            gru_change = price_changes.get('gru', 0) if 'gru' in price_changes else None
            attention_change = price_changes.get('attention', 0) if 'attention' in price_changes else None
            
            # Metrikler
            lstm_mse = metrics.get('lstm', {}).get('mse', 0) if 'lstm' in metrics else None
            lstm_mae = metrics.get('lstm', {}).get('mae', 0) if 'lstm' in metrics else None
            gru_mse = metrics.get('gru', {}).get('mse', 0) if 'gru' in metrics else None
            gru_mae = metrics.get('gru', {}).get('mae', 0) if 'gru' in metrics else None
            attention_mse = metrics.get('attention', {}).get('mse', 0) if 'attention' in metrics else None
            attention_mae = metrics.get('attention', {}).get('mae', 0) if 'attention' in metrics else None
            
            response = {
                "id": prediction_id,
                "symbol": symbol,
                "base_stock_id": base_stock_id,
                "current_price": current_price or 0.0,
                
                # LSTM tahminleri
                "lstm_predicted_price": lstm_pred,
                "lstm_change_percent": lstm_change,
                "lstm_mse": lstm_mse,
                "lstm_mae": lstm_mae,
                
                # GRU tahminleri
                "gru_predicted_price": gru_pred,
                "gru_change_percent": gru_change,
                "gru_mse": gru_mse,
                "gru_mae": gru_mae,
                
                # Attention tahminleri
                "attention_predicted_price": attention_pred,
                "attention_change_percent": attention_change,
                "attention_mse": attention_mse,
                "attention_mae": attention_mae,
                
                # En iyi model bilgileri
                "best_model": best_model or "none",
                "best_mse": best_mse if best_mse != float('inf') else 0.0,
                "best_mae": best_mae if best_mae != float('inf') else 0.0,
                
                # Ortak değerler
                "volatility": volatility,
                "prediction_date": datetime.now() + timedelta(days=1),
                
                # Model detayları
                "features_used": feature_columns,
                "training_window": training_window,
                "prediction_window": prediction_window,
                
                # İsteğe bağlı teknik analiz bilgileri
                "technical_info": None,
                
                # Orjinal yanıt bilgileri
                "predictions": predictions,
                "metrics": metrics,
                "models_used": list(predictions.keys()),
                "success": True,
                "last_updated": datetime.now().isoformat()
            }
            
            return response
            
        except Exception as e:
            self.logger.error(f"{symbol} için genel tahmin hatası: {str(e)}")
            self.logger.error(traceback.format_exc())
            return None
    
    def get_prediction_by_symbol(self, db: Session, symbol: str) -> Dict[str, Any]:
        """
        Veritabanından belirli bir hisse senedi için tahmin bilgilerini getirir.
        
        Args:
            db: Veritabanı oturumu
            symbol: Hisse senedi sembolü
            
        Returns:
            Dict: Tahmin bilgileri veya None (bulunamazsa)
        """
        try:
            # Veritabanından tahmini sorgula
            prediction_record = db.query(PredictionStock).filter(PredictionStock.symbol == symbol).first()
            
            if not prediction_record:
                self.logger.warning(f"{symbol} için kayıtlı tahmin bulunamadı")
                return None
            
            # JSON verisini parse et
            try:
                prediction_data = json.loads(prediction_record.prediction_data)
            except:
                self.logger.error(f"{symbol} için tahmin verisi geçersiz JSON formatında")
                return None
            
            # API yanıtını hazırla
            stock = db.query(BaseStock).filter(BaseStock.symbol == symbol).first()
            current_price = float(stock.last_price) if stock and hasattr(stock, "last_price") else 0.0
            
            # Prediction Data'dan değerleri çıkar
            predictions = prediction_data.get("predictions", {})
            metrics = prediction_data.get("metrics", {})
            price_changes = prediction_data.get("price_changes", {})
            
            # Özellikler, eğer yoksa varsayılan değerler kullan
            best_model = prediction_data.get("best_model", "none")
            best_mse = prediction_data.get("best_mse", 0.0)
            best_mae = prediction_data.get("best_mae", 0.0)
            volatility = prediction_data.get("volatility", 0.0)
            features_used = prediction_data.get("features_used", [])
            training_window = prediction_data.get("training_window", 10)
            prediction_window = prediction_data.get("prediction_window", 1)
            
            # Tahmin tarihi
            prediction_date_str = prediction_data.get("prediction_date")
            try:
                prediction_date = datetime.fromisoformat(prediction_date_str) if prediction_date_str else datetime.now() + timedelta(days=1)
            except:
                prediction_date = datetime.now() + timedelta(days=1)
            
            # Bireysel model tahminleri
            lstm_pred = predictions.get('lstm', [0])[0] if 'lstm' in predictions and predictions['lstm'] else None
            gru_pred = predictions.get('gru', [0])[0] if 'gru' in predictions and predictions['gru'] else None
            attention_pred = predictions.get('attention', [0])[0] if 'attention' in predictions and predictions['attention'] else None
            
            # Değişim yüzdeleri
            lstm_change = price_changes.get('lstm', 0) if 'lstm' in price_changes else None
            gru_change = price_changes.get('gru', 0) if 'gru' in price_changes else None
            attention_change = price_changes.get('attention', 0) if 'attention' in price_changes else None
            
            # Metrikler
            lstm_mse = metrics.get('lstm', {}).get('mse', 0) if 'lstm' in metrics else None
            lstm_mae = metrics.get('lstm', {}).get('mae', 0) if 'lstm' in metrics else None
            gru_mse = metrics.get('gru', {}).get('mse', 0) if 'gru' in metrics else None
            gru_mae = metrics.get('gru', {}).get('mae', 0) if 'gru' in metrics else None
            attention_mse = metrics.get('attention', {}).get('mse', 0) if 'attention' in metrics else None
            attention_mae = metrics.get('attention', {}).get('mae', 0) if 'attention' in metrics else None
            
            # Son güncelleme zamanı
            last_updated = prediction_data.get("last_updated")
            if last_updated:
                try:
                    last_updated = datetime.fromisoformat(last_updated)
                except:
                    last_updated = prediction_record.last_updated if hasattr(prediction_record, "last_updated") else datetime.now()
            else:
                last_updated = prediction_record.last_updated if hasattr(prediction_record, "last_updated") else datetime.now()
            
            response = {
                "id": prediction_record.id,
                "symbol": symbol,
                "base_stock_id": stock.id if stock else -1,
                "current_price": current_price,
                
                # LSTM tahminleri
                "lstm_predicted_price": lstm_pred,
                "lstm_change_percent": lstm_change,
                "lstm_mse": lstm_mse,
                "lstm_mae": lstm_mae,
                
                # GRU tahminleri
                "gru_predicted_price": gru_pred,
                "gru_change_percent": gru_change,
                "gru_mse": gru_mse,
                "gru_mae": gru_mae,
                
                # Attention tahminleri
                "attention_predicted_price": attention_pred,
                "attention_change_percent": attention_change,
                "attention_mse": attention_mse,
                "attention_mae": attention_mae,
                
                # En iyi model bilgileri
                "best_model": best_model,
                "best_mse": best_mse,
                "best_mae": best_mae,
                
                # Ortak değerler
                "volatility": volatility,
                "prediction_date": prediction_date,
                
                # Model detayları
                "features_used": features_used,
                "training_window": training_window,
                "prediction_window": prediction_window,
                
                # İsteğe bağlı teknik analiz bilgileri
                "technical_info": None,
                
                # Orjinal yanıt bilgileri
                "predictions": predictions,
                "metrics": metrics,
                "models_used": prediction_data.get("models_used", []),
                "success": True,
                "last_updated": last_updated.isoformat() if isinstance(last_updated, datetime) else last_updated
            }
            
            return response
            
        except Exception as e:
            self.logger.error(f"{symbol} için tahmin getirme hatası: {str(e)}")
            self.logger.error(traceback.format_exc())
            return None