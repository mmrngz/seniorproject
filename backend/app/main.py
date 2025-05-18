from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.api.routes import stocks
from app.api.routes import technical
from app.api.routes import auth
from app.api.routes import dashboard
from app.db.session import engine, Base
from app.services.scheduler_service import SchedulerService

# Günlük ayarları
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global zamanlayıcı değişkeni
scheduler_service = None

# Veritabanı tablolarını oluştur
def create_tables():
    logger.info("Veritabanı tablolarını oluşturma başlatılıyor...")
    Base.metadata.create_all(bind=engine)
    logger.info("Veritabanı tabloları oluşturuldu.")

# FastAPI uygulaması
app = FastAPI(
    title="BIST Hisse Analiz API",
    description="BIST hisse senetleri için filtreleme ve yapay zeka tahminleri sağlayan API",
    version="1.0.0",
)

# CORS ayarları - tüm originlere izin ver
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hisse senedi rotalarını kaydet
app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
app.include_router(technical.router, prefix="/api/technical", tags=["technical"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

# Uygulama başlatıldığında
@app.on_event("startup")
async def startup_event():
    global scheduler_service
    
    logger.info("Uygulama başlatılıyor...")
    create_tables()
    
    # Zamanlayıcı servisini başlat
    scheduler_service = SchedulerService()
    scheduler_started = scheduler_service.start()
    
    if scheduler_started:
        logger.info("Zamanlayıcı başlatıldı.")
    else:
        logger.warning("Zamanlayıcı başlatılamadı!")
        
    logger.info("Uygulama başlatıldı!")

# Uygulama kapatıldığında
@app.on_event("shutdown")
async def shutdown_event():
    global scheduler_service
    
    logger.info("Uygulama kapatılıyor...")
    
    # Zamanlayıcı servisini durdur
    if scheduler_service and scheduler_service.is_running:
        scheduler_service.stop()
        logger.info("Zamanlayıcı durduruldu.")
    
    logger.info("Uygulama kapatıldı!")

# Kök endpoint
@app.get("/", tags=["root"])
async def root():
    return {
        "message": "BIST Hisse Analiz API'ye Hoş Geldiniz! Dokümantasyon için /docs adresini ziyaret edin."
    }

# Not: Aşağıdaki router'lar yorum satırına alınmış, ihtiyaç duyulursa aktif hale getirilebilir
# from app.api import stocks, predictions, analysis
# app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
# app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
# app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"]) 