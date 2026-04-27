FROM python:3.11-slim

WORKDIR /app

# OpenCV runtime libs only — ml-infer does not train, so we don't need
# build-essential/cmake or the heavy luxonis/tools toolchain.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 --retries=5 -r requirements.txt

COPY app/ ./app/

ENV PYTHONUNBUFFERED=1
# Cloud Run sets $PORT (default 8080). uvicorn binds 0.0.0.0 so the
# platform health checks can reach it.
ENV PORT=8080

CMD ["sh", "-c", "uvicorn app.server:app --host 0.0.0.0 --port ${PORT}"]
