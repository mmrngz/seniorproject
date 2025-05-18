#!/usr/bin/env python
import os
import logging
import requests
import schedule
import time
from datetime import datetime

# Logging yapılandırması
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("/app/logs/scheduler.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("scheduler")

# API Base URL
API_BASE_URL = os.environ.get("API_BASE_URL", "http://backend:8000")

def update_filtered_symbols():
    """Filtrelenmiş semboller verisini güncelleyen API çağrısı."""
    url = f"{API_BASE_URL}/api/stocks/filtered-symbols"
    
    try:
        logger.info(f"Filtrelenmiş semboller için API çağrısı yapılıyor: {url}")
        response = requests.get(url, timeout=120)
        
        if response.status_code == 200:
            data = response.json()
            symbol_count = len(data.get("symbols", []))
            logger.info(f"Filtrelenmiş semboller başarıyla güncellendi. {symbol_count} sembol alındı.")
            return True
        else:
            logger.error(f"Filtrelenmiş semboller güncellenemedi. Hata kodu: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Filtrelenmiş semboller güncellenirken hata oluştu: {str(e)}")
        return False

def update_predictions():
    """Tahminleri güncelleyen API çağrısı."""
    url = f"{API_BASE_URL}/api/stocks/filtered-predictions"
    
    try:
        logger.info(f"Tahminler için API çağrısı yapılıyor: {url}")
        
        # Force=true parametresi ile yeni tahminler oluşturulacak
        response = requests.get(f"{url}?force=true", timeout=300)
        
        if response.status_code == 200:
            data = response.json()
            prediction_count = len(data)
            logger.info(f"Tahminler başarıyla güncellendi. {prediction_count} tahmin alındı.")
            return True
        else:
            logger.error(f"Tahminler güncellenemedi. Hata kodu: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Tahminler güncellenirken hata oluştu: {str(e)}")
        return False

def run_daily_update():
    """Her iki API işlemini de gerçekleştirir."""
    now = datetime.now()
    logger.info(f"Günlük güncelleme başlatıldı. Zaman: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Önce filtrelenmiş sembolleri güncelle
    symbols_updated = update_filtered_symbols()
    
    if symbols_updated:
        logger.info("Filtrelenmiş semboller güncellendi, şimdi tahminler güncelleniyor...")
        # Ardından tahminleri güncelle
        predictions_updated = update_predictions()
        
        if predictions_updated:
            logger.info("Günlük güncelleme tamamlandı.")
        else:
            logger.warning("Tahminler güncellenemedi.")
    else:
        logger.warning("Filtrelenmiş semboller güncellenemedi, tahmin güncelleme adımı atlanıyor.")

def main():
    logger.info("Scheduler başlatıldı.")
    
    # Her gün saat 20:00'de güncelleme çalıştır
    schedule.every().day.at("20:00").do(run_daily_update)
    
    # Başlangıçta hemen bir kere çalıştır (isteğe bağlı)
    run_daily_update()
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # 60 saniyede bir kontrol et

if __name__ == "__main__":
    # Logs dizininin varlığını kontrol et
    if not os.path.exists("/app/logs"):
        os.makedirs("/app/logs")
        logger.info("Logs dizini oluşturuldu.")
    
    main() 