FROM python:3.12-slim

WORKDIR /app

# TensorFlow için sistem bağımlılıkları ve healthcheck için curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Python import yolunu ayarla
ENV PYTHONPATH=/app
# Log çıktılarının tamponlanmaması için
ENV PYTHONUNBUFFERED=1

# Zaman dilimini Türkiye'ye ayarla
ENV TZ=Europe/Istanbul

# Kontrol dosyası: uygulama başarıyla başladığında oluşturulur
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Başlatma betiği
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Backend uygulaması başlatılıyor..."\n\
python run.py\n\
' > /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Uygulamayı entrypoint ile başlat
ENTRYPOINT ["/app/entrypoint.sh"] 