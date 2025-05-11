import uvicorn
import os
import logging
from dotenv import load_dotenv

# Günlük ayarları
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log")
    ]
)
logger = logging.getLogger(__name__)

load_dotenv()

if __name__ == "__main__":
    # Portu .env dosyasından veya varsayılan 8000 olarak al
    port = int(os.getenv("PORT", 8000))
    
    # Uygulamayı başlat
    logger.info(f"API http://localhost:{port} adresinde başlatılıyor...")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False  # Production ortamında reload kapatılmalı
    )
    
    logger.info(f"API http://localhost:{port} adresinde çalışıyor. API dokümantasyonu için /docs adresini ziyaret edin.") 