# Models başlatma dosyası
from app.models.base_stock import BaseStock
from app.models.prediction_stock import PredictionStock

# Bu modelleri dışarıya açıyoruz, böylece doğrudan from models import X şeklinde import edilebilir
__all__ = ["BaseStock", "PredictionStock"] 