#!/usr/bin/env python
"""
Zamanlanmış API çağrıları yapan script.
Her gün belirli saatlerde belirlenen API rotalarını çağırarak veri güncelleme işlemlerini yapar.
"""

import os
import logging
import requests
import schedule
import time
from datetime import datetime

# Loglama yapılandırması
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scheduler.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# API URL'leri
BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000/api")
FILTERED_SYMBOLS_URL = f"{BASE_URL}/stocks/filtered-symbols?refresh=true"
FILTERED_PREDICTIONS_URL = f"{BASE_URL}/stocks/filtered-predictions?run_predictions=true"

def call_api(url, description):
    """
    Belirtilen URL'ye GET isteği gönderir ve sonucu loglar
    
    Args:
        url: İstek yapılacak URL
        description: İsteğin açıklaması (loglama için)
    """
    logger.info(f"API çağrısı yapılıyor: {description} - {url}")
    try:
        response = requests.get(url, timeout=600)  # 10 dakika timeout
        if response.status_code == 200:
            logger.info(f"API çağrısı başarılı: {description} - Durum Kodu: {response.status_code}")
            return True
        else:
            logger.error(f"API çağrısı başarısız: {description} - Durum Kodu: {response.status_code}")
            logger.error(f"Yanıt: {response.text[:500]}")  # İlk 500 karakter
            return False
    except Exception as e:
        logger.error(f"API çağrısı sırasında hata: {description} - {str(e)}")
        return False

def update_filtered_symbols():
    """Filtrelenmiş sembolleri günceller"""
    logger.info("Filtrelenmiş sembolleri güncelleme işlemi başlatılıyor...")
    success = call_api(FILTERED_SYMBOLS_URL, "Filtrelenmiş semboller")
    if success:
        logger.info("Filtrelenmiş semboller başarıyla güncellendi")
    else:
        logger.error("Filtrelenmiş semboller güncellenemedi")

def update_predictions():
    """Tahminleri günceller"""
    logger.info("Tahminleri güncelleme işlemi başlatılıyor...")
    success = call_api(FILTERED_PREDICTIONS_URL, "Filtrelenmiş tahminler")
    if success:
        logger.info("Tahminler başarıyla güncellendi")
    else:
        logger.error("Tahminler güncellenemedi")

def daily_update():
    """Her gün yapılacak güncellemeleri gerçekleştirir"""
    logger.info("Günlük güncelleme işlemi başlatılıyor...")
    logger.info(f"Şu anki zaman: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Önce sembolleri güncelle
    update_filtered_symbols()
    
    # Sonra tahminleri güncelle
    update_predictions()
    
    logger.info("Günlük güncelleme işlemi tamamlandı")

def main():
    """Ana program döngüsü"""
    logger.info("Zamanlanmış görev servisi başlatılıyor...")
    
    # Her gün saat 20:00'de çalışacak görev
    schedule.every().day.at("20:00").do(daily_update)
    
    # Uygulama başladığında ilk çalıştırma (isteğe bağlı)
    # daily_update()
    
    logger.info("Zamanlanmış görevler ayarlandı. Beklemedeyiz...")
    
    # Sonsuz döngü - görevleri kontrol et
    while True:
        schedule.run_pending()
        time.sleep(60)  # Her dakika kontrol et

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Kullanıcı tarafından durduruldu")
    except Exception as e:
        logger.critical(f"Kritik hata: {str(e)}")
        raise 