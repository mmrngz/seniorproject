import logging
import asyncio
import schedule
import time
import threading
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import SessionLocal
from app.services.base_stock_service import BaseStockService
from app.services.prediction_service import PredictionService
from app.models.base_stock import BaseStock
from app.models.prediction_stock import PredictionStock

class SchedulerService:
    """
    Otomatik görevleri zamanlayan servis.
    Her gün belirli saatlerde veri çekme, analiz ve tahmin işlemlerini gerçekleştirir.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.base_service = BaseStockService()
        self.prediction_service = PredictionService()
        self.is_running = False
        self.thread = None
    
    def start(self):
        """
        Zamanlayıcı servisini başlat
        """
        if self.is_running:
            self.logger.warning("Zamanlayıcı zaten çalışıyor")
            return False
        
        self.logger.info("Zamanlayıcı başlatılıyor...")
        
        # Hergün 18:30'da verileri güncelle (BIST kapanışından sonra)
        schedule.every().day.at("18:30").do(self.daily_update)
        
        # Hergün 20:00'da tahminleri güncelle
        schedule.every().day.at("20:00").do(self.predict_potential_stocks)
        
        # Pazartesi günleri 09:00'da haftalık rapor oluştur
        schedule.every().monday.at("09:00").do(self.generate_weekly_report)
        
        # Ayrı bir thread'de çalıştır
        self.thread = threading.Thread(target=self._run_scheduler)
        self.thread.daemon = True  # Ana program sonlandığında thread'i de sonlandır
        self.thread.start()
        
        self.is_running = True
        self.logger.info("Zamanlayıcı başlatıldı")
        return True
    
    def stop(self):
        """
        Zamanlayıcı servisini durdur
        """
        if not self.is_running:
            self.logger.warning("Zamanlayıcı zaten durmuş durumda")
            return False
        
        self.logger.info("Zamanlayıcı durduruluyor...")
        self.is_running = False
        
        # Tüm zamanlanmış görevleri temizle
        schedule.clear()
        
        self.logger.info("Zamanlayıcı durduruldu")
        return True
    
    def _run_scheduler(self):
        """
        Zamanlayıcıyı çalıştıran iç metod
        """
        self.logger.info("Zamanlayıcı thread'i başlatıldı")
        
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)  # 1 dakika bekle
    
    def daily_update(self):
        """
        Günlük veri güncelleme işlemi
        """
        self.logger.info("Günlük veri güncelleme başlatılıyor...")
        
        # Saat kontrolü yap - 18:30'dan önce mi?
        now = datetime.now()
        current_time = now.time()
        is_before_market_close = current_time < datetime.strptime("18:30", "%H:%M").time()
        
        if is_before_market_close:
            self.logger.info("Saat 18:30'dan önce olduğu için bir önceki iş gününün verileriyle işlem yapılacak.")
        else:
            self.logger.info("Saat 18:30'dan sonra olduğu için güncel verilerle işlem yapılacak.")
        
        try:
            # Veritabanı oturumu oluştur
            db = SessionLocal()
            
            # Tüm hisseleri işle ve filtrele
            selected_stocks = self.base_service.process_all_stocks(db)
            
            self.logger.info(f"Günlük güncelleme tamamlandı. {len(selected_stocks)} hisse seçildi.")
            
            db.close()
            return True
            
        except Exception as e:
            self.logger.error(f"Günlük güncelleme hatası: {str(e)}")
            return False
    
    def predict_potential_stocks(self):
        """
        Potansiyel yükseliş gösterecek hisseler için tahmin yap
        """
        self.logger.info("Potansiyel hisseler için tahmin başlatılıyor...")
        
        # Saat kontrolü yap - 18:30'dan önce mi?
        now = datetime.now()
        current_time = now.time()
        is_before_market_close = current_time < datetime.strptime("18:30", "%H:%M").time()
        
        if is_before_market_close:
            self.logger.info("Saat 18:30'dan önce olduğu için bir önceki iş gününün verileriyle tahmin yapılacak.")
            days_for_prediction = 30  # Daha geniş bir veri aralığı kullan
        else:
            self.logger.info("Saat 18:30'dan sonra olduğu için güncel verilerle tahmin yapılacak.")
            days_for_prediction = 15  # Normal veri aralığı
        
        try:
            # Veritabanı oturumu oluştur
            db = SessionLocal()
            
            # Filtreleme kriterleri geçen hisseleri al
            selected_stocks = db.query(BaseStock).filter(BaseStock.is_selected == True).all()
            
            if not selected_stocks:
                self.logger.warning("Filtreleme sonucunda hiçbir hisse seçilmedi. Tahmin yapılmayacak.")
                db.close()
                return False
                
            # Seçilen hisselerin sembollerini logla
            selected_symbols = [stock.symbol for stock in selected_stocks]
            self.logger.info(f"TAHMİN BAŞLATILIYOR: {len(selected_symbols)} hisse seçildi")
            self.logger.info(f"TAHMİN EDİLECEK SEMBOLLER: {', '.join(selected_symbols)}")
            
            # Hisseler için tahminler yap
            predictions = self.prediction_service.predict_with_hourly_data(db, selected_symbols, days=days_for_prediction)
            
            if predictions:
                self.logger.info(f"Toplam {len(predictions)} hisse için tahmin yapıldı")
                self._report_predictions(predictions)
            else:
                self.logger.warning("Hiçbir hisse için tahmin yapılamadı")
            
            db.close()
            return True
            
        except Exception as e:
            self.logger.error(f"Tahmin işlemi hatası: {str(e)}")
            return False
    
    def generate_weekly_report(self):
        """
        Haftalık performans raporu oluştur
        """
        self.logger.info("Haftalık rapor oluşturuluyor...")
        
        try:
            # Veritabanı oturumu oluştur
            db = SessionLocal()
            
            # Geçen hafta tahmin edilen hisseleri al
            week_ago = datetime.now() - timedelta(days=7)
            predictions = db.query(PredictionStock).filter(PredictionStock.prediction_date >= week_ago).all()
            
            # Başarılı ve başarısız tahminleri hesapla
            success_count = 0
            fail_count = 0
            
            for pred in predictions:
                # Gerçekleşen fiyatı al (şu anki fiyat)
                base_stock = pred.base_stock
                current_price = base_stock.last_price
                
                # Tahmin edilen fiyat
                if pred.best_model == "lstm":
                    predicted_price = pred.lstm_predicted_price
                    change_percent = pred.lstm_change_percent
                elif pred.best_model == "gru":
                    predicted_price = pred.gru_predicted_price
                    change_percent = pred.gru_change_percent
                else:
                    predicted_price = pred.attention_predicted_price
                    change_percent = pred.attention_change_percent
                
                # Tahmin başarılı mı?
                if change_percent > 0 and current_price > pred.current_price:
                    success_count += 1
                elif change_percent < 0 and current_price < pred.current_price:
                    success_count += 1
                else:
                    fail_count += 1
            
            # Başarı oranını hesapla
            total = success_count + fail_count
            success_rate = (success_count / total * 100) if total > 0 else 0
            
            self.logger.info(f"Haftalık rapor: Toplam {total} tahmin, {success_count} başarılı (%{success_rate:.2f})")
            
            # Raporu kaydet ve bildirim gönder
            self._save_weekly_report(success_count, fail_count, success_rate)
            
            db.close()
            return True
            
        except Exception as e:
            self.logger.error(f"Haftalık rapor hatası: {str(e)}")
            return False
    
    def _report_predictions(self, predictions: List[PredictionStock]):
        """
        Tahmin sonuçlarını raporla (konsol, dosya veya bildirim olarak)
        """
        if not predictions:
            self.logger.info("Potansiyel yükseliş gösteren hisse bulunamadı")
            return
        
        # Tahminleri yazdır
        self.logger.info("--- POTANSİYEL YÜKSELİŞ GÖSTEREN HİSSELER ---")
        self.logger.info(f"Tahmin Tarihi: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        self.logger.info("-" * 50)
        
        for pred in predictions:
            symbol = pred.base_stock.symbol
            current = pred.current_price
            
            # LSTM tahminleri
            lstm_price = pred.lstm_predicted_price if pred.lstm_predicted_price else 0
            lstm_change = pred.lstm_change_percent if pred.lstm_change_percent else 0
            
            # GRU tahminleri
            gru_price = pred.gru_predicted_price if pred.gru_predicted_price else 0
            gru_change = pred.gru_change_percent if pred.gru_change_percent else 0
            
            # En iyi model
            best_model = pred.best_model.upper()
            
            self.logger.info(f"Sembol: {symbol}")
            self.logger.info(f"Mevcut Fiyat: {current:.2f} TL")
            self.logger.info(f"LSTM Tahmini: {lstm_price:.2f} TL (%{lstm_change:.2f})")
            self.logger.info(f"GRU Tahmini: {gru_price:.2f} TL (%{gru_change:.2f})")
            self.logger.info(f"En İyi Model: {best_model}")
            self.logger.info("-" * 50)
    
    def _save_weekly_report(self, success_count: int, fail_count: int, success_rate: float):
        """
        Haftalık raporu kaydet
        """
        report_date = datetime.now().strftime("%Y-%m-%d")
        report_text = f"""
        HAFTALIK TAHMİN PERFORMANS RAPORU
        Tarih: {report_date}
        
        Toplam Tahmin: {success_count + fail_count}
        Başarılı Tahmin: {success_count}
        Başarısız Tahmin: {fail_count}
        Başarı Oranı: %{success_rate:.2f}
        """
        
        # Raporu dosyaya kaydet (ileride veritabanına da kaydedilebilir)
        try:
            with open(f"reports/weekly_report_{report_date}.txt", "w") as f:
                f.write(report_text)
            self.logger.info(f"Haftalık rapor kaydedildi: reports/weekly_report_{report_date}.txt")
        except Exception as e:
            self.logger.error(f"Rapor kaydetme hatası: {str(e)}") 