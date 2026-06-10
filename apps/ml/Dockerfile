FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV, ML libraries, and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    cmake \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libglib2.0-0 \
    libgl1 \
    libusb-1.0-0 \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
# Install main requirements using the CPU-only PyTorch index.
# This prevents pip from pulling massive nvidia-* CUDA wheels.
RUN pip install --no-cache-dir \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        -r requirements.txt && \
    # Purge heavy build dependencies after compilation
    apt-get purge -y build-essential gcc g++ cmake git && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

# Apply patches to installed dependencies
COPY patches/ ./patches/
COPY postinstall.sh .
RUN bash postinstall.sh

# Copy application code
COPY app/ ./app/

# Create directories for exports and datasets
RUN mkdir -p /app/export /app/dataset

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run as Cloud Run Job entrypoint
CMD ["python", "-m", "app.job"]
