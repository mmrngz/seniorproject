import yfinance as yf
import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta, time
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import math
import time
import traceback
import json
from requests.exceptions import ConnectionError  # URLlib3 yerine requests'in ConnectionError'unu kullanıyoruz

from app.models.base_stock import BaseStock
from app.db.session import get_db

logger = logging.getLogger(__name__)

class BaseStockService:
    """
    BIST hisse senetleriyle ilgili temel işlemleri gerçekleştiren servis sınıfı.
    
    Bu sınıf, hisse senetleri için veri çekme, gösterge hesaplama, filtreleme ve
    veritabanı işlemlerini gerçekleştirir.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        # Tüm BIST sembolleri - Alfabetik olarak sıralanmış
        self.symbols = [
            "A1CAP", "ACSEL", "ADEL", "ADESE", "ADGYO", "AEFES", "AFYON", "AGHOL", "AGESA", "AGROT", 
            "AGYO", "AHGAZ", "AHSGY", "AKBNK", "AKCNS", "AKENR", "AKFGY", "AKFYE", "AKGRT", "AKMGY", 
            "AKSEN", "AKSGY", "AKSUE", "AKYHO", "ALARK", "ALBRK", "ALCAR", "ALCTL", "ALFAS", "ALKIM", 
            "ALKLC", "ALKA", "ALMAD", "ALVES", "ALTNY", "ANGEN", "ANELE", "ANHYT", "ANSGR", "ARCLK", 
            "ARDYZ", "ARENA", "ARSAN", "ARTMS", "ARZUM", "ASELS", "ASGYO", "ASTOR", "ATAGY", "ATAKP", 
            "ATATP", "ATEKS", "ATLAS", "ATSYH", "AVHOL", "AVGYO", "AVOD", "AVPGY", "AVTUR", "AYDEM", 
            "AYEN","AYCES", "AYES", "AYGAZ", "AZTEK", "BAGFS", "BAHKM", "BAKAB", "BALAT", "BANVT", "BARMA", 
            "BASCM", "BASGZ", "BAYRK", "BEGYO", "BEYAZ", "BFREN", "BIMAS", "BINHO", "BIOEN", "BIENY", 
            "BIGCH", "BIZIM", "BJKAS", "BLCYT", "BMSCH", "BMSTL", "BNTAS", "BOBET", "BOSSA", "BORLS", 
            "BORSK", "BRISA", "BRKSN", "BRKVY", "BRLSM", "BRMEN", "BRYAT", "BSOKE", "BTCIM", "BUCIM", 
            "BURCE", "BURVA", "BVSAN", "BYDNR", "CANTE", "CASA", "CATES", "CCOLA", "CELHA", "CEMAS", 
            "CEMTS", "CEMZY", "CIMSA", "CLEBI", "CONSE", "COSMO", "CRDFA", "CRFSA", "CUSAN", "CVKMD", 
            "CWENE", "DAGHL", "DAGI", "DAPGM", "DARDL", "DCTTR", "DENGE", "DERHL", "DERIM", "DESA", 
            "DESPC", "DEVA", "DGATE", "DGNMO", "DIRIT", "DITAS", "DMSAS", "DMRGD", "DNISI", "DOAS", 
            "DOBUR", "DOCO", "DOGUB", "DOFER", "DOHOL", "DOKTA", "DURDO", "DURKN", "DZGYO", "ECILC", 
            "ECZYT", "EDIP", "EDATA", "EFORC", "EGEEN", "EGGUB", "EGPRO", "EGSER", "EKGYO", "EKIZ", 
            "ELITE", "EMKEL", "EMNIS", "ENJSA", "ENKAI", "ENSRI", "ERBOS", "EREGL", "ERSU", "ESCAR", 
            "ESCOM", "ESEN", "ETILR", "ETYAT", "EUKYO", "EUREN", "EUYO", "FADE", "FENER", "FLAP", 
            "FMIZP", "FONET", "FORMT", "FORTE", "FRIGO", "FROTO", "FZLGY", "GARAN", "GARFA", "GEDIK", 
            "GEDZA", "GENIL", "GENTS", "GESAN", "GIPTA", "GLBMD", "GLCVY", "GLRYH", "GLYHO", "GMTAS", 
            "GOKNR", "GOLTS", "GOODY", "GOZDE", "GRNYO", "GRSEL", "GRTHO", "GSDDE", "GSDHO", "GSRAY", 
            "GUBRF", "GUNDG", "GWIND", "GZNMI", "HALKB", "HATEK", "HATSN", "HDFGS", "HEDEF", "HEKTS", 
            "HLGYO", "HKTM", "HOROZ", "HRKET", "HTTBT", "HUBVC", "HUNER", "HURGZ", "ICBCT", "ICUGS", 
            "IDGYO", "IEYHO", "IHAAS", "IHEVA", "IHGZT", "IHLAS", "IHLGM", "IHYAY", "IMASM", "INDES", 
            "INGRM", "INTEK", "INTEM", "INVEO", "INVES", "IPEKE", "ISATR", "ISBIR", "ISBTR", "ISCTR", 
            "ISDMR", "ISFIN", "ISGSY", "ISGYO", "ISKPL", "ISKUR", "ISMEN", "ISSEN", "ISYAT", "IZENR", 
            "IZFAS", "IZINV", "IZMDC", "JANTS", "KAPLM", "KAREL", "KARSN", "KARTN", "KARYE", "KATMR", 
            "KAYSE", "KCAER", "KCHOL", "KFEIN", "KGYO", "KIMMR", "KLGYO", "KLKIM", "KLMSN", "KLNMA", 
            "KLRHO", "KLSER", "KLSYN", "KMPUR", "KNFRT", "KONKA", "KONTR", "KONYA", "KOPOL", "KORDS", 
            "KRDMA", "KRDMB", "KRDMD", "KRGYO", "KRPLS", "KRONT", "KRSTL", "KRVGD", "KRTEK", "KSTUR", 
            "KTLEV", "KUYAS", "KUVVA", "KZBGY", "KZGYO", "LIDFA", "LIDER", "LILAK", "LINK", "LKMNH", 
            "LMKDC", "LOGO", "LRSHO", "LUKSK", "LYDHO", "MAALT", "MACKO", "MAGEN", "MAKIM", "MAKTK", 
            "MANAS", "MARKA", "MARTI", "MAVI", "MEGAP", "MEGMT", "MEKAG", "MERCN", "MERIT", "MERKO", 
            "METRO", "METUR", "MGROS", "MIATK", "MNDRS", "MNDTR", "MOBTL", "MOGAN", "MPARK", "MRGYO", 
            "MRSHL", "MSGYO", "MTRKS", "MTRYO", "MZHLD", "NATEN", "NETAS", "NIBAS", "NTHOL", "NUHCM", 
            "NUGYO", "OBASE", "OBAMS", "ODAS", "ODINE", "OFSYM", "ONCSM", "ONRYT", "ORCAY", "ORGE", 
            "ORMA", "OSMEN", "OSTIM", "OTKAR", "OTTO", "OYAKC", "OYAYO", "OYLUM", "OZATD", "OZKGY", 
            "OZGYO", "OZRDN", "OZSUB", "OZSRY", "PAGYO", "PAMEL", "PAPIL", "PARSN", "PASEU", "PATEK", 
            "PCILT", "PEHOL", "PEKGY", "PENGD", "PENTA", "PETKM", "PETUN", "PGSUS", "PKART", "PKENT", 
            "PNSUT", "POLHO", "POLTK", "PRDGS", "PRKAB", "PRKME", "PRZMA", "PSDTC", "PSGYO", "QNBFB", 
            "QNBFL", "QUAGR", "RALYH", "RAYSG", "RNPOL", "RODRG", "ROYAL", "RTALB", "RUBNS", "RYGYO", 
            "RYSAS", "SAFKR", "SAHOL", "SAMAT", "SANEL", "SANFM", "SANKO", "SARKY", "SASA", "SAYAS", 
            "SEGYO", "SEKFK", "SELEC", "SELGD", "SELVA", "SEYKM", "SILVR", "SISE", "SKBNK", "SKTAS", 
            "SMART", "SMRTG", "SNGYO", "SNICA", "SNKRN", "SODSN", "SOKE", "SONME", "SUMAS", "SUNTK", 
            "SURGY", "SUWEN", "TABGD", "TATGD", "TATEN", "TAVHL", "TBORG", "TCELL", "TCKRC", "TDGYO", 
            "TEKTU", "TERA", "TEZOL", "THYAO", "TKFEN", "TKNSA", "TLMAN", "TMSN", "TOASO", "TRCAS", 
            "TRGYO", "TRILC", "TSKB", "TSGYO", "TSPOR", "TTKOM", "TTRAK", "TUPRS", "TUREX", "TURGG", 
            "UFUK", "ULAS", "ULKER", "ULUFA", "ULUSE", "ULUUN", "UNLU", "USAK", "VAKBN", "VAKFN", 
            "VAKKO", "VANGD", "VBTYZ", "VERTU", "VERUS", "VESBE", "VESTL", "VKFYO", "VKGYO", "VKING", 
            "YAPRK", "YATAS", "YAYLA", "YBTAS", "YEOTK", "YESIL", "YGYO", "YIGIT", "YKBNK", "YKSLN", 
            "YONGA", "YUNSA", "YYAPI", "YYLGD", "ZEDUR", "ZOREN", "ZRGYO"
        ]
    
    def _is_bist_trading_hours(self) -> bool:
        """
        Şu anki zamanın BIST işlem saatleri içinde olup olmadığını kontrol eder.
        BIST işlem saatleri: Hafta içi 10:00-18:00
        
        Returns:
            bool: BIST işlem saatleri içinde ise True, değilse False
        """
        now = datetime.now()
        
        # Hafta sonu kontrolü (5: Cumartesi, 6: Pazar)
        if now.weekday() >= 5:
            return False
        
        # Saat kontrolü (10:00-18:00)
        current_hour = now.hour
        
        return 10 <= current_hour <= 18
    
    def _get_previous_business_day(self, date=None) -> datetime:
        """
        Verilen tarihten bir önceki iş gününü döndürür.
        Eğer tarih belirtilmezse bugünden önceki iş gününü döndürür.
        
        Args:
            date: Başlangıç tarihi (varsayılan: bugün)
            
        Returns:
            datetime: Bir önceki iş günü
        """
        if date is None:
            date = datetime.now()
        
        # Bu algoritma biraz farklı çalışıyor:
        # 1. Eğer bugün Pazartesi (0) ise, 3 gün öncesine (Cuma) git
        # 2. Eğer bugün Pazar (6) ise, 2 gün öncesine (Cuma) git
        # 3. Eğer bugün Cumartesi (5) ise, 1 gün öncesine (Cuma) git
        # 4. Diğer günlerde 1 gün öncesine git
        
        weekday = date.weekday()
        if weekday == 0:  # Pazartesi
            prev_date = date - timedelta(days=3)
        elif weekday == 6:  # Pazar
            prev_date = date - timedelta(days=2)
        elif weekday == 5:  # Cumartesi
            prev_date = date - timedelta(days=1)
        else:
            prev_date = date - timedelta(days=1)
        
        self.logger.info(f"Önceki iş günü hesaplandı: Bugün={date.strftime('%A')} -> Önceki={prev_date.strftime('%A')}")
        
        return prev_date
    
    def load_bist_symbols(self) -> List[str]:
        """
        BIST'de işlem gören hisselerin sembollerini döndürür.
        
        Returns:
            List[str]: BIST'de işlem gören hisse senetlerinin sembolleri
        """
        try:
            # Burada BIST sembollerini almanın birkaç yolu olabilir:
            # 1. Hazır bir API kullanmak
            symbols = self.symbols  
            self.logger.info(f"Toplam {len(symbols)} BIST sembolü yüklendi")
            return symbols
            
        except Exception as e:
            self.logger.error(f"BIST sembollerini yüklerken hata: {str(e)}")
            # Hata durumunda boş liste döndür
            return []
    
    def _prepare_dataframe_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        DataFrame sütunlarını standardize eder (sütun isimlerini düzenler)
        
        Args:
            df: Standardize edilecek DataFrame
            
        Returns:
            pd.DataFrame: Sütunları standardize edilmiş DataFrame
        """
        if df is None or df.empty:
            return df
        
        # Sütun isimlerini küçük harfe çevir
        df.columns = [str(col).lower() for col in df.columns]
        
        # Bilinenen sütun isimlerini standardize et
        column_mapping = {
            'date': 'date',
            'open': 'open_price',
            'high': 'high_price',
            'low': 'low_price',
            'close': 'last_price',
            'adj close': 'last_price',
            'adj_close': 'last_price',
            'volume': 'volume',
        }
        
        # Sütun isimlerini değiştir
        df = df.rename(columns=lambda x: column_mapping.get(x, x))
        
        # Date sütunu yoksa ekle
        if 'date' not in df.columns and isinstance(df.index, pd.DatetimeIndex):
            df = df.reset_index()
            df = df.rename(columns={'index': 'date'})
        
        # Eksik sütunları doldur
        required_columns = ['date', 'open_price', 'high_price', 'low_price', 'last_price', 'volume']
        for col in required_columns:
            if col not in df.columns:
                if col == 'date':
                    continue  # Date sütunu zaten kontrol edildi
                
                # Eğer fiyat sütunları eksikse ve last_price varsa, onu kullan
                if col in ['open_price', 'high_price', 'low_price'] and 'last_price' in df.columns:
                    df[col] = df['last_price']
                    self.logger.info(f"'{col}' sütunu 'last_price' kullanılarak oluşturuldu")
                # Eğer volume eksikse, 0 doldur
                elif col == 'volume':
                    df[col] = 0
                    self.logger.info(f"'{col}' sütunu 0 değerleriyle dolduruldu")
        
        self.logger.info(f"DataFrame sütunları standardize edildi: {', '.join(df.columns)}")
        return df
    
    def fetch_stock_data(self, symbol: str, period: str = "1mo", interval: str = "1d") -> pd.DataFrame:
        """
        Belirli bir sembol için hisse senedi verilerini çeker.
        Args:
            symbol: Hisse sembolü
            period: Veri periyodu (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Veri aralığı (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
        Returns:
            pd.DataFrame: Hisse senedi verileri veya boş DataFrame (veri yoksa)
        """
        try:
            self.logger.info(f"{symbol} için {period} periyodunda veri çekiliyor...")
            
            # BIST hisseleri için ".IS" eklemek gerekli
            ticker = f"{symbol}.IS" if not symbol.endswith(".IS") else symbol
            
            df = pd.DataFrame()  # Boş DataFrame oluştur
            
            try:
                self.logger.info(f"{ticker} için veri çekiliyor...")
                
                # Ticker nesnesi oluşturarak veri çekme
                tkr = yf.Ticker(ticker)
                df = tkr.history(period=period, interval=interval)
                
                if not df.empty:
                    self.logger.info(f"{ticker} için veri başarıyla çekildi: {len(df)} satır.")
                else:
                    # Ticker nesnesiyle veri çekilemediyse download metodu ile dene
                    self.logger.info(f"{ticker} için yf.download() deneniyor...")
                    df = yf.download(ticker, period=period, interval=interval, progress=False)
                    if not df.empty:
                        self.logger.info(f"{ticker} için yf.download() başarılı oldu: {len(df)} satır.")
                    else:
                        self.logger.warning(f"{ticker} için veri çekilemedi.")
            except Exception as e:
                self.logger.error(f"{ticker} için veri çekilirken hata: {str(e)}")
                return pd.DataFrame()
            
            # Veri çekildi mi kontrol et
            if df.empty:
                self.logger.warning(f"{symbol} için veri çekilemedi")
                return pd.DataFrame()
            
            # Multiindex kontrolü
            if isinstance(df.columns, pd.MultiIndex):
                # MultiIndex sütunlarını birleştir
                df.columns = [f"{col[0]}_{col[1]}" if col[1] else f"{col[0]}" for col in df.columns]
                self.logger.debug(f"MultiIndex sütunları birleştirildi")
            
            # İndeksi sıfırla ve tarih sütununu ekle
            df = df.reset_index()
            
            # Eksik değerleri doldur
            df = df.ffill().bfill()
            
            self.logger.info(f"{symbol} için veri başarıyla çekildi, {len(df)} satır veri alındı")
            return df
            
        except Exception as e:
            self.logger.error(f"{symbol} için veri çekerken genel hata: {str(e)}")
            self.logger.error(traceback.format_exc())
            return pd.DataFrame()  # Hata durumunda boş DataFrame döndür
    
    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Teknik göstergeleri hesaplar:
        - RSI (Relative Strength Index)
        - Fibonacci Pivot Noktaları
        - Göreli Hacim
        """
        if df is None or df.empty:
            self.logger.warning("Gösterge hesaplaması için veri olmadığından atlanıyor")
            return df
            
        # Gerekli sütunların varlığını kontrol et
        required_columns = ['last_price', 'volume']
        for col in required_columns:
            if col not in df.columns:
                # Eğer last_price yoksa ve Close varsa
                if col == 'last_price' and 'Close' in df.columns:
                    df['last_price'] = df['Close']
                    self.logger.info("'Close' sütunu 'last_price' olarak kopyalandı")
                # Eğer volume yoksa ve Volume varsa
                elif col == 'volume' and 'Volume' in df.columns:
                    df['volume'] = df['Volume']
                    self.logger.info("'Volume' sütunu 'volume' olarak kopyalandı")
                else:
                    self.logger.warning(f"Gösterge hesaplaması için gereken '{col}' sütunu bulunamadı")
                    return df
        
        # Tüm sayısal sütunları kontrol et ve dönüştür
        numeric_columns = ['open_price', 'high_price', 'low_price', 'last_price', 'volume']
        for col in df.columns:
            if col in numeric_columns or any(name in str(col).lower() for name in ['open', 'high', 'low', 'close', 'volume', 'price']):
                try:
                    if df[col].dtype == 'object':
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                        self.logger.info(f"'{col}' sütunu sayısal değere dönüştürüldü")
                except Exception as e:
                    self.logger.warning(f"'{col}' sütunu dönüştürülemedi: {str(e)}")
        
        try:
            # RSI hesaplama (14 günlük period)
            if 'last_price' in df.columns and len(df) >= 15:  # En az 15 veri noktası gerekli
                try:
                    # Fiyat değişimini hesapla
                    delta = df['last_price'].diff()
                    if not delta.isna().all():  # Tüm değerler NaN değilse
                        # Kazanç ve kayıpları ayır
                        gain = delta.where(delta > 0, 0)
                        loss = -delta.where(delta < 0, 0)
                        
                        # Üssel ağırlıklı ortalama (EWM) hesapla
                        avg_gain = gain.ewm(com=14-1, min_periods=14).mean()
                        avg_loss = loss.ewm(com=14-1, min_periods=14).mean()
                        
                        # RS ve RSI hesaplama
                        rs = avg_gain / avg_loss
                        df['rsi'] = 100 - (100 / (1 + rs))
                        
                        # NaN değerleri temizle
                        df['rsi'] = df['rsi'].fillna(50)  # RSI için nötr değer
                        self.logger.info(f"RSI hesaplandı. Son değer: {df['rsi'].iloc[-1]:.2f}")
                    else:
                        self.logger.warning("RSI hesaplanamadı: Fiyat değişim verileri geçersiz")
                        df['rsi'] = 50  # RSI için nötr değer
                except Exception as e:
                    self.logger.error(f"RSI hesaplama hatası: {str(e)}\n{traceback.format_exc()}")
                    df['rsi'] = 50  # RSI için nötr değer
            else:
                self.logger.warning(f"RSI hesaplanamadı: Yetersiz veri ({len(df)} veri noktası, 15 gerekli)")
                df['rsi'] = 50
                
            # Göreli Hacim hesaplama
            if 'volume' in df.columns and len(df) >= 10:
                try:
                    # 20 günlük hareketli ortalama hesapla
                    df['volume_ma10'] = df['volume'].rolling(window=10).mean()
                    # Göreli hacim = güncel hacim / ortalama hacim
                    df['relative_volume'] = df['volume'] / df['volume_ma10']
                    # NaN değerleri temizle
                    df['relative_volume'] = df['relative_volume'].fillna(1.0)
                    self.logger.info(f"Göreli Hacim hesaplandı. Son değer: {df['relative_volume'].iloc[-1]:.2f}")
                except Exception as e:
                    self.logger.error(f"Göreli Hacim hesaplama hatası: {str(e)}")
                    df['relative_volume'] = 1.0
            else:
                self.logger.warning(f"Göreli Hacim hesaplanamadı: Yetersiz veri ({len(df)} veri noktası, 10 gerekli)")
                df['relative_volume'] = 1.0
            
            # Fibonacci Pivot Noktaları hesaplama
            if all(col in df.columns for col in ['high_price', 'low_price', 'last_price']) and len(df) >= 2:
                try:
                    # En son tamamlanmış gün/periyot verileri
                    last_high = df['high_price'].iloc[-2]
                    last_low = df['low_price'].iloc[-2]
                    last_close = df['last_price'].iloc[-2]
                    
                    # Tüm değerlerin geçerli olduğundan emin ol
                    if not (pd.isna(last_high) or pd.isna(last_low) or pd.isna(last_close)):
                        # Pivot ve Fibonacci seviyeleri
                        pivot = (last_high + last_low + last_close) / 3
                        r1 = pivot + 0.382 * (last_high - last_low)
                        s1 = pivot - 0.382 * (last_high - last_low)
                        r2 = pivot + 0.618 * (last_high - last_low)
                        s2 = pivot - 0.618 * (last_high - last_low)
                        r3 = pivot + 1.0 * (last_high - last_low)
                        s3 = pivot - 1.0 * (last_high - last_low)
                        
                        # Değerleri DataFrame'e ekle
                        df['pivot'] = pivot
                        df['r1'] = r1
                        df['s1'] = s1
                        df['r2'] = r2
                        df['s2'] = s2
                        df['r3'] = r3
                        df['s3'] = s3
                        
                        self.logger.info(f"Fibonacci Pivot hesaplandı. Pivot: {pivot:.2f}, R1: {r1:.2f}, S1: {s1:.2f}")
                    else:
                        self.logger.warning("Pivot hesaplanamadı: Geçersiz high/low/close değeri")
                        # Varsayılan değerler
                        if not pd.isna(df['last_price'].iloc[-1]):
                            default_val = df['last_price'].iloc[-1]
                            df['pivot'] = default_val
                            df['r1'] = default_val * 1.01
                            df['s1'] = default_val * 0.99
                            df['r2'] = default_val * 1.02
                            df['s2'] = default_val * 0.98
                            df['r3'] = default_val * 1.03
                            df['s3'] = default_val * 0.97
                except Exception as e:
                    self.logger.error(f"Fibonacci Pivot hesaplama hatası: {str(e)}")
                    # Varsayılan değerler
                    if 'last_price' in df.columns and not pd.isna(df['last_price'].iloc[-1]):
                        default_val = df['last_price'].iloc[-1]
                        df['pivot'] = default_val
                        df['r1'] = default_val * 1.01
                        df['s1'] = default_val * 0.99
                        df['r2'] = default_val * 1.02
                        df['s2'] = default_val * 0.98
                        df['r3'] = default_val * 1.03
                        df['s3'] = default_val * 0.97
            else:
                self.logger.warning("Fibonacci Pivot hesaplanamadı: Gereken sütunlar veya yeterli veri yok")
                
                # Alternatif sütun isimlerini kontrol et
                price_columns = {
                    'high_price': None, 
                    'low_price': None, 
                    'last_price': None
                }
                
                # Alternatif isimler için eşleştirme yap
                for col in df.columns:
                    col_lower = col.lower()
                    if ('high' in col_lower or 'yüksek' in col_lower) and price_columns['high_price'] is None:
                        price_columns['high_price'] = col
                    elif ('low' in col_lower or 'düşük' in col_lower) and price_columns['low_price'] is None:
                        price_columns['low_price'] = col
                    elif any(name in col_lower for name in ['close', 'last', 'kapanış', 'son']) and price_columns['last_price'] is None:
                        price_columns['last_price'] = col
                
                # Bulduğumuz sütunların hepsi var mı?
                if all(value is not None for value in price_columns.values()) and len(df) >= 2:
                    try:
                        # Alternatif sütunlarla hesaplama
                        high_col = price_columns['high_price']
                        low_col = price_columns['low_price']
                        close_col = price_columns['last_price']
                        
                        self.logger.info(f"Alternatif sütunlarla hesaplama: {high_col}, {low_col}, {close_col}")
                        
                        # En son tamamlanmış gün/periyot verileri
                        last_high = df[high_col].iloc[-2]
                        last_low = df[low_col].iloc[-2]
                        last_close = df[close_col].iloc[-2]
                        
                        # Tüm değerlerin geçerli olduğundan emin ol
                        if not (pd.isna(last_high) or pd.isna(last_low) or pd.isna(last_close)):
                            # Pivot ve Fibonacci seviyeleri
                            pivot = (last_high + last_low + last_close) / 3
                            r1 = pivot + 0.382 * (last_high - last_low)
                            s1 = pivot - 0.382 * (last_high - last_low)
                            r2 = pivot + 0.618 * (last_high - last_low)
                            s2 = pivot - 0.618 * (last_high - last_low)
                            r3 = pivot + 1.0 * (last_high - last_low)
                            s3 = pivot - 1.0 * (last_high - last_low)
                            
                            # Değerleri DataFrame'e ekle
                            df['pivot'] = pivot
                            df['r1'] = r1
                            df['s1'] = s1
                            df['r2'] = r2
                            df['s2'] = s2
                            df['r3'] = r3
                            df['s3'] = s3
                            
                            self.logger.info(f"Fibonacci Pivot alternatif sütunlarla hesaplandı. Pivot: {pivot:.2f}")
                            return df
                    except Exception as e:
                        self.logger.error(f"Alternatif sütunlarla hesaplamada hata: {str(e)}")
                
                # Son çare: Sayısal sütunlardan fiyat sütunlarını tahmin et
                if len(df) >= 2:
                    numeric_cols = df.select_dtypes(include='number').columns.tolist()
                    if len(numeric_cols) >= 3:
                        self.logger.warning(f"Son çare: Sayısal sütunları kullanarak hesaplama yapılıyor: {numeric_cols[:3]}")
                        try:
                            # Fiyat değerleri genellikle en yüksek sayısal değerler olur
                            # Bu yüzden ortalamalarına göre sıralayıp kullanabiliriz
                            col_means = {col: df[col].mean() for col in numeric_cols if not pd.isna(df[col].mean())}
                            sorted_cols = sorted(col_means.items(), key=lambda x: x[1], reverse=True)
                            
                            if len(sorted_cols) >= 3:
                                # En yüksek değer muhtemelen High, sonra Close, sonra Low olur
                                high_col = sorted_cols[0][0]
                                close_col = sorted_cols[1][0]
                                low_col = sorted_cols[2][0]
                                
                                self.logger.info(f"Tahmin edilen sütunlar: High={high_col}, Close={close_col}, Low={low_col}")
                                
                                # En son tamamlanmış gün/periyot verileri
                                last_high = df[high_col].iloc[-2]
                                last_low = df[low_col].iloc[-2]
                                last_close = df[close_col].iloc[-2]
                                
                                # Tüm değerlerin geçerli olduğundan emin ol
                                if not (pd.isna(last_high) or pd.isna(last_low) or pd.isna(last_close)):
                                    # Pivot ve Fibonacci seviyeleri
                                    pivot = (last_high + last_low + last_close) / 3
                                    r1 = pivot + 0.382 * (last_high - last_low)
                                    s1 = pivot - 0.382 * (last_high - last_low)
                                    r2 = pivot + 0.618 * (last_high - last_low)
                                    s2 = pivot - 0.618 * (last_high - last_low)
                                    r3 = pivot + 1.0 * (last_high - last_low)
                                    s3 = pivot - 1.0 * (last_high - last_low)
                                    
                                    # Değerleri DataFrame'e ekle
                                    df['pivot'] = pivot
                                    df['r1'] = r1
                                    df['s1'] = s1
                                    df['r2'] = r2
                                    df['s2'] = s2
                                    df['r3'] = r3
                                    df['s3'] = s3
                                    
                                    self.logger.info(f"Fibonacci Pivot tahmin edilen sütunlarla hesaplandı. Pivot: {pivot:.2f}")
                                    return df
                        except Exception as e:
                            self.logger.error(f"Sayısal sütunlarla hesaplamada hata: {str(e)}")
                
                # Hiçbir şekilde hesaplanamadıysa, mevcut fiyatı temel alan varsayılan değerler ekle
                if 'last_price' in df.columns and not df.empty and not pd.isna(df['last_price'].iloc[-1]):
                    default_val = df['last_price'].iloc[-1]
                    df['pivot'] = default_val
                    df['r1'] = default_val * 1.01
                    df['s1'] = default_val * 0.99
                    df['r2'] = default_val * 1.02
                    df['s2'] = default_val * 0.98
                    df['r3'] = default_val * 1.03
                    df['s3'] = default_val * 0.97
                    self.logger.warning(f"Fibonacci Pivot varsayılan değerlerle dolduruldu. Pivot: {default_val}")
                elif len(numeric_cols) > 0 and not df.empty:
                    # İlk sayısal sütunu kullan
                    first_num_col = numeric_cols[0]
                    if not pd.isna(df[first_num_col].iloc[-1]):
                        default_val = df[first_num_col].iloc[-1]
                        df['pivot'] = default_val
                        df['r1'] = default_val * 1.01
                        df['s1'] = default_val * 0.99
                        df['r2'] = default_val * 1.02
                        df['s2'] = default_val * 0.98
                        df['r3'] = default_val * 1.03
                        df['s3'] = default_val * 0.97
                        self.logger.warning(f"Fibonacci Pivot sayısal sütundan varsayılan değerlerle dolduruldu: {first_num_col}")
                else:
                    # Hiçbir veri yoksa varsayılan olarak 100 ata
                    default_val = 100.0
                    df['pivot'] = default_val
                    df['r1'] = 101.0
                    df['s1'] = 99.0
                    df['r2'] = 102.0
                    df['s2'] = 98.0
                    df['r3'] = 103.0
                    df['s3'] = 97.0
                    self.logger.warning(f"Fibonacci Pivot hiçbir veri olmadığından sabit değerle dolduruldu: {default_val}")
            
            # Pivot geçişini kontrol et
            if 'pivot' in df.columns and 'last_price' in df.columns and len(df) >= 2:
                try:
                    # Son kapanış pivot üstünde mi?
                    current_close = df['last_price'].iloc[-1]
                    previous_close = df['last_price'].iloc[-2]
                    pivot_value = df['pivot'].iloc[-1]
                    
                    df['is_above_pivot'] = current_close > pivot_value
                    df['pivot_cross_up'] = (current_close > pivot_value) & (previous_close <= pivot_value)
                    df['pivot_cross_down'] = (current_close < pivot_value) & (previous_close >= pivot_value)
                    
                    if df['pivot_cross_up'].iloc[-1]:
                        self.logger.info(f"Pivot yukarı geçiş tespit edildi: {previous_close:.2f} -> {current_close:.2f}, Pivot: {pivot_value:.2f}")
                    elif df['pivot_cross_down'].iloc[-1]:
                        self.logger.info(f"Pivot aşağı geçiş tespit edildi: {previous_close:.2f} -> {current_close:.2f}, Pivot: {pivot_value:.2f}")
                except Exception as e:
                    self.logger.error(f"Pivot geçiş kontrolü hatası: {str(e)}")
                    df['is_above_pivot'] = False
                    df['pivot_cross_up'] = False
                    df['pivot_cross_down'] = False
                    
            # Yüzde değişim hesaplama
            if 'last_price' in df.columns:
                try:
                    df['percent_change'] = df['last_price'].pct_change() * 100
                    df['percent_change'] = df['percent_change'].fillna(0)
                    df['percent_change'] = df['percent_change'].round(2)
                    self.logger.info(f"Yüzde değişim hesaplandı. Son değer: {df['percent_change'].iloc[-1]:.2f}%")
                except Exception as e:
                    self.logger.error(f"Yüzde değişim hesaplama hatası: {str(e)}")
        
        except Exception as e:
            self.logger.error(f"Gösterge hesaplama genel hatası: {str(e)}\n{traceback.format_exc()}")
        
        return df
    
    def apply_filters(self, df: pd.DataFrame) -> Dict[str, bool]:
        """
        Hisse senedi verilerini belirlenen kriterlere göre filtreler.
        - RSI değeri 45-65 arası olanlar
        - Göreceli hacim değeri 1.4 ve üzeri olanlar
        - Fibonacci Pivot Noktaları (1 gün, Yukarı Keser, Fiyat)
        
        Args:
            df: Filtrelenecek hisse senedi verileri
            
        Returns:
            Dict[str, bool]: Filtre sonuçlarını içeren sözlük
        """
        if df is None or df.empty:
            self.logger.warning("Filtre uygulaması için veri olmadığından atlanıyor")
            return {
                'is_selected': False,
                'rsi_filter': False,
                'volume_filter': False,
                'fibonacci_filter': False
            }
        
        # Sonuçları saklamak için sözlük
        filter_results = {
            'is_selected': False,
            'rsi_filter': False,
            'volume_filter': False,
            'fibonacci_filter': False
        }
        
        # Gerekli sütunların varlığını kontrol et
        required_columns = ['rsi', 'relative_volume', 'last_price', 'pivot']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            self.logger.warning(f"Filtre için gerekli sütunlar eksik: {', '.join(missing_columns)}")
            return filter_results
        
        try:
            # En son satırı al (güncel değerler)
            last_row = df.iloc[-1]
            
            # 1. RSI Filtresi (45-65 arası değerler)
            rsi_value = last_row['rsi']
            if 45 <= rsi_value <= 65:  # Kriterde belirtilen RSI aralığı
                filter_results['rsi_filter'] = True
                self.logger.info(f"RSI filtresi geçildi: {rsi_value:.2f} (45-65 arası)")
            
            # 2. Göreceli Hacim Filtresi (Göreceli hacim 1.4 ve üzeri)
            rel_volume = last_row['relative_volume']
            if rel_volume > 1.4:  # Kriterde belirtilen hacim değeri 
                filter_results['volume_filter'] = True
                self.logger.info(f"Göreceli hacim filtresi geçildi: {rel_volume:.2f} (>1.4)")
            
            # 3. Fibonacci Pivot Noktaları Filtresi (Yukarı Keser)
            if len(df) >= 2:
                current_price = last_row['last_price']
                pivot_value = last_row['pivot']
                previous_price = df.iloc[-2]['last_price']
                
                # Yukarı Keser - Fiyat pivot seviyesini aşağıdan yukarı kesti mi?
                if previous_price < pivot_value and current_price >= pivot_value:
                    filter_results['fibonacci_filter'] = True
                    self.logger.info(f"Fibonacci pivot yukarı kesme filtresi geçildi: Önceki: {previous_price:.2f} -> Güncel: {current_price:.2f}, Pivot: {pivot_value:.2f}")
            
            # Genel seçim - Tüm filtreleri geçen hisseler
            if (filter_results['rsi_filter'] and 
                filter_results['volume_filter'] and 
                filter_results['fibonacci_filter']):
                filter_results['is_selected'] = True
                self.logger.info("Hisse belirlenen filtreleri geçti ve seçildi")
            
        except Exception as e:
            self.logger.error(f"Filtre uygulama hatası: {str(e)}")
            self.logger.error(traceback.format_exc())
            
        return filter_results
    
    def update_base_stock(self, db: Session, symbol: str, df: pd.DataFrame, filter_results: Dict[str, bool]) -> None:
        """
        Hisse senedi verilerini veritabanına kaydeder veya günceller.
        
        Args:
            db: Veritabanı oturumu
            symbol: Hisse sembolü
            df: Hisse verileri
            filter_results: Filtre sonuçları
        """
        if df is None or df.empty:
            self.logger.warning(f"{symbol} için veritabanı güncellemesi için veri yok")
            return
        
        try:
            # Son veriyi al
            last_data = df.iloc[-1].to_dict()
            
            # Tarih bilgisi kontrolü
            date_col = 'date'
            if date_col in last_data and isinstance(last_data[date_col], (pd.Timestamp, datetime)):
                last_date = last_data[date_col]
            else:
                last_date = datetime.now()
            
            # Veritabanında bu sembol var mı diye kontrol et
            existing_stock = db.query(BaseStock).filter(BaseStock.symbol == symbol).first()
            
            if existing_stock:
                # Mevcut kaydı güncelle
                existing_stock.last_price = float(last_data.get('last_price', 0))
                existing_stock.open_price = float(last_data.get('open_price', 0))
                existing_stock.high_price = float(last_data.get('high_price', 0))
                existing_stock.low_price = float(last_data.get('low_price', 0))
                existing_stock.volume = int(last_data.get('volume', 0))
                existing_stock.rsi = float(last_data.get('rsi', 50))
                existing_stock.relative_volume = float(last_data.get('relative_volume', 1.0))
                existing_stock.pivot = float(last_data.get('pivot', 0))
                existing_stock.r1 = float(last_data.get('r1', 0))
                existing_stock.s1 = float(last_data.get('s1', 0))
                existing_stock.is_selected = filter_results.get('is_selected', False)
                existing_stock.updated_at = datetime.now()
                
                self.logger.info(f"{symbol} veritabanında güncellendi")
            else:
                # Yeni kayıt oluştur
                new_stock = BaseStock(
                    symbol=symbol,
                    last_price=float(last_data.get('last_price', 0)),
                    open_price=float(last_data.get('open_price', 0)),
                    high_price=float(last_data.get('high_price', 0)),
                    low_price=float(last_data.get('low_price', 0)),
                    volume=int(last_data.get('volume', 0)),
                    rsi=float(last_data.get('rsi', 50)),
                    relative_volume=float(last_data.get('relative_volume', 1.0)),
                    pivot=float(last_data.get('pivot', 0)),
                    r1=float(last_data.get('r1', 0)),
                    s1=float(last_data.get('s1', 0)),
                    is_selected=filter_results.get('is_selected', False),
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(new_stock)
                self.logger.info(f"{symbol} veritabanına eklendi")
            
            # Değişiklikleri kaydet
            db.commit()
            
        except Exception as e:
            db.rollback()
            self.logger.error(f"{symbol} veritabanı güncelleme hatası: {str(e)}")
            self.logger.error(traceback.format_exc())
    
    def process_all_stocks(self, db: Session) -> List[BaseStock]:
        """
        Tüm BIST hisselerini işler, verileri çeker, filtreleri uygular ve veritabanını günceller.
        
        Args:
            db: Veritabanı oturumu
            
        Returns:
            List[BaseStock]: Filtreleri geçen ve seçilen hisselerin listesi
        """
        # BIST sembollerini yükle
        symbols = self.load_bist_symbols()
        if not symbols:
            self.logger.error("BIST sembolleri yüklenemedi.")
            return []
        
        self.logger.info(f"{len(symbols)} BIST sembolü yüklendi.")
        
        # Tarih ve zaman bilgilerini logla
        now = datetime.now()
        current_time = now.time()
        weekday = now.weekday()
        weekday_name = now.strftime('%A')
        
        self.logger.info(f"Bugün: {now.strftime('%Y-%m-%d')} ({weekday_name}, weekday={weekday})")
        self.logger.info(f"Şu anki saat: {current_time.strftime('%H:%M:%S')}")
        
        # Her zaman en güncel verileri almak için 1 aylık periyot kullanacağız
        period = "1mo"
        self.logger.info(f"Veri periyodu: {period}")
        
        # İşlem sonuçlarını takip etmek için sayaçlar
        processed_count = 0
        success_count = 0
        selected_count = 0
        
        # İşlenmiş hisseler
        selected_stocks = []
        
        # Sembolleri daha küçük gruplara böl (2 sembol)
        batch_size = 2
        symbol_batches = [symbols[i:i + batch_size] for i in range(0, len(symbols), batch_size)]
        self.logger.info(f"{len(symbol_batches)} grup oluşturuldu, her grupta en fazla {batch_size} sembol var.")
        
        # Her bir sembol grubunu işle
        for batch_index, symbol_batch in enumerate(symbol_batches):
            self.logger.info(f"Grup {batch_index+1}/{len(symbol_batches)} işleniyor ({len(symbol_batch)} sembol)...")
            
            # Gruptaki her sembol için tek tek veri çek
            for symbol in symbol_batch:
                try:
                    processed_count += 1
                    
                    # YFinance'dan hisse verilerini tek tek çek
                    self.logger.info(f"Sembol {processed_count}/{len(symbols)} işleniyor: {symbol}")
                    df = self.fetch_stock_data(symbol, period=period, interval="1d")
                    
                    if df.empty:
                        self.logger.warning(f"{symbol} için veri alınamadı, işlem iptal edildi.")
                        continue
                    
                    # Veri yapısını standardize et
                    df = self._prepare_dataframe_columns(df)
                    
                    # Eğer 18:30'dan önceyse ve en az 2 gün veri varsa, bir önceki günün verilerini kullan
                    if current_time < datetime.strptime("18:30", "%H:%M").time() and len(df) >= 2:
                        self.logger.info(f"{symbol} için bir önceki günün verileri kullanılıyor.")
                        # Veriyi son gün hariç olacak şekilde kes
                        df = df.iloc[:-1]
                    
                    # Göstergeleri hesapla
                    df = self.calculate_indicators(df)
                        
                    # Filtreleri uygula
                    filter_results = self.apply_filters(df)
                    
                    # Veritabanını güncelle
                    self.update_base_stock(db, symbol, df, filter_results)
                    
                    if filter_results['is_selected']:
                        success_count += 1
                        
                        # Tüm filtrelerden geçen hisseleri seç
                        selected_stocks.append(db.query(BaseStock).filter(BaseStock.symbol == symbol).first())
                        selected_count += 1
                        
                        # Log bilgisi
                        self.logger.info(f"SEÇİLDİ - {symbol}: RSI={df['rsi'].iloc[-1]:.2f}, RelVol={df['relative_volume'].iloc[-1]:.2f}, Pivot Geçişi=Evet")
                    
                    self.logger.info(f"{symbol} işlendi")
                    
                except Exception as e:
                    self.logger.error(f"{symbol} işleme hatası: {str(e)}")
                    self.logger.error(traceback.format_exc())
            
            # Grup tamamlandı mesajı
            self.logger.info(f"Grup {batch_index+1} tamamlandı. ({batch_index+1}/{len(symbol_batches)})")
        
        # İşlem sonuçlarını logla
        self.logger.info(f"Toplam {processed_count}/{len(symbols)} hisse işlendi.")
        self.logger.info(f"Başarılı işlem: {success_count}")
        self.logger.info(f"Seçilen hisse: {selected_count}")
        
        return selected_stocks
    
    def get_selected_stocks(self, db: Session) -> List[BaseStock]:
        """
        Filtreleri geçen (seçilen) hisseleri veritabanından getirir.
        
        Args:
            db: Veritabanı oturumu
    
        Returns:
            List[BaseStock]: Filtreleri geçen (seçilen) hisseler
        """
        try:
            # is_selected=True olan hisseleri getir
            selected_stocks = db.query(BaseStock).filter(BaseStock.is_selected == True).all()
            
            self.logger.info(f"Toplam {len(selected_stocks)} seçilmiş hisse bulundu")
            
            return selected_stocks
                
        except Exception as e:
            self.logger.error(f"Seçilmiş hisseleri getirirken hata: {str(e)}")
            self.logger.error(traceback.format_exc())
            return []