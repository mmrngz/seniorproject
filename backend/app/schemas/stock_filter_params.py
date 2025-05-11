from pydantic import BaseModel, Field

class StockFilterParams(BaseModel):
    min_rsi: float = Field(50.0, description="Minimum RSI değeri")
    max_rsi: float = Field(60.0, description="Maksimum RSI değeri")
    min_rel_volume: float = Field(1.5, description="Minimum bağıl hacim")
    pivot_cross: bool = Field(True, description="Pivot geçişi filtresi uygulanacak mı")
    limit: int = Field(10, description="Döndürülecek hisse sayısı limiti") 