FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV APP_MODULE=face_service:app
CMD ["sh", "-c", "gunicorn ${APP_MODULE} --bind 0.0.0.0:${PORT} --timeout 120"]
