FROM python:3.11-slim

WORKDIR /app

# OpenCV runtime libs plus build tools — onnxsim has no ARM64 wheel and
# compiles from source on M4 Macs / arm64 Cloud Batch VMs.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

RUN mkdir -p /app/export /app/dataset

ENV PYTHONUNBUFFERED=1
# Cloud Batch containers don't always have a writable $HOME; pin Ultralytics'
# settings dir to /tmp to avoid the "not writable" warning on every run.
ENV YOLO_CONFIG_DIR=/tmp/Ultralytics

# Default to Cloud Batch job mode. Docker-compose overrides CMD to run the
# FastAPI server for local HTTP testing.
CMD ["python", "-m", "app.job"]
