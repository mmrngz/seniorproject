# BIST Potansiyel Hisse Tahmin Sistemi

## 🎯 Proje Amacı
BIST'te işlem gören hisseleri belirli kriterlere göre filtreleyerek potansiyel yükseliş gösterecek hisseleri belirlemek ve bu hisseler için 1-2 günlük fiyat tahminleri yapmak.

## 🔍 Filtreleme Kriterleri
- RSI değeri 50-60 aralığında olan hisseler (aşırı alım/satım bölgesinde olmayan)
- Göreceli hacmi 1.5 ve üzerinde olan hisseler (ortalama hacmin üzerinde işlem gören)
- Fiyatı pivot noktasını yukarı geçen hisseler (teknik olarak alım sinyali veren)

## 📊 Teknik Analiz
Filtreleme kriterlerini geçen hisseler için aşağıdaki teknik göstergeler hesaplanır:
- Trend Göstergeleri: MACD, ADX, Hareketli Ortalamalar (9, 20, 50, 200)
- Momentum Göstergeleri: RSI, Stokastik, CCI, MFI
- Volatilite Göstergeleri: Bollinger Bantları, ATR
- Destek/Direnç Seviyeleri ve Fibonacci Geri Çekilmeleri

## 🧠 LSTM Tahminleri
- Saatlik veriler kullanılarak 24 saatlik fiyat tahmini
- Çeşitli teknik göstergeler kullanılarak model eğitimi
- Tahminler için güven skorları hesaplanması

## 🛠️ Teknolojiler
- Backend: FastAPI, Python
- Frontend: React
- Veritabanı: SQLite (Development), PostgreSQL (Production)
- ML: TensorFlow/Keras
- Deployment: Docker, Nginx

## 🚀 Başlangıç

### Gereksinimler
```bash
# Backend gereksinimleri
python >= 3.8
postgresql >= 12

# Frontend gereksinimleri
node >= 14
npm >= 6
```

### Kurulum

1. Repository'yi klonlayın
```bash
git clone [repository-url]
cd bist-tahmin-sistemi
```

2. Backend kurulumu
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

3. Uygulamayı çalıştırın
```bash
python run.py
```

4. API belgelerine erişin
```
http://localhost:8000/docs
```

## 🧩 Servisler

### BaseStockService
- BIST sembollerini yükleme
- Hisse verilerini çekme
- RSI, göreceli hacim ve pivot noktaları hesaplama
- Filtreleme kriterlerini uygulama

### TechnicalService
- Detaylı teknik analiz göstergelerini hesaplama
- Destek ve direnç seviyelerini bulma
- Fibonacci seviyelerini hesaplama
- Teknik analiz sinyalleri oluşturma

### PredictionService
- Saatlik hisse verilerini işleme
- LSTM modeli oluşturma ve eğitme
- Fiyat tahminleri yapma
- Tahmin güven skorları hesaplama

## 📁 Proje Yapısı
```
bist-tahmin-sistemi/
├── backend/
│   ├── app/
│   │   ├── api/          # API rotaları
│   │   ├── db/           # Veritabanı modelleri ve bağlantısı
│   │   ├── models/       # Veri modelleri
│   │   ├── schemas/      # Pydantic şemaları
│   │   └── services/     # İş mantığı servisleri
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── notebooks/            # Veri analizi ve test notebook'ları
└── docker/               # Docker yapılandırmaları
```

## 📈 API Endpointleri

### Hisse Senedi İşlemleri
- `GET /api/stocks/symbols` - Tüm BIST sembollerini listeler
- `GET /api/stocks/filtered` - Filtrelere uyan hisseleri döndürür
- `GET /api/stocks/selected` - Tüm filtreleri geçen hisseleri döndürür
- `GET /api/stocks/{symbol}` - Belirli bir hissenin detaylarını gösterir
- `GET /api/stocks/{symbol}/refresh` - Hisse verilerini yeniler

### Teknik Analiz
- `GET /api/stocks/technical/{symbol}` - Hisse için teknik analiz gösterir
- `GET /api/stocks/technical` - Tüm seçili hisselerin teknik analizlerini gösterir

### Tahminler
- `GET /api/stocks/prediction/{symbol}` - Hisse için LSTM tahminlerini gösterir
- `GET /api/stocks/predictions` - Tüm seçili hisselerin tahminlerini gösterir

## 📝 Lisans
Bu proje [MIT](LICENSE) lisansı altında lisanslanmıştır. 