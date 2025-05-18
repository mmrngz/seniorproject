FROM python:3.12-slim

WORKDIR /app

# Sistem bağımlılıklarını kur
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Timezone ayarlama
ENV TZ=Europe/Istanbul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Python bağımlılıklarını kur
COPY requirements_scheduler.txt .
RUN pip install --no-cache-dir -r requirements_scheduler.txt

# Scheduler scriptini kopyala
COPY scheduler.py .

# Log dizini oluştur
RUN mkdir -p /app/logs && chmod 777 /app/logs

# Ortam değişkenleri
ENV API_BASE_URL="http://backend:8000"
ENV PYTHONUNBUFFERED=1

# Healthcheck
HEALTHCHECK --interval=60s --timeout=10s --start-period=20s --retries=3 \
  CMD test -f /app/logs/scheduler.log || exit 1

# Uygulamayı çalıştır
CMD ["python", "scheduler.py"] 