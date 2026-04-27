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

# Pre-compile .pyc for our app code AND for the installed dependencies.
# Saves ~0.5-1.0s of cold-start parse/compile on a Cloud Run instance —
# small in absolute terms, but consistent regardless of cache state.
# `-q 0` suppresses noise; `|| true` because pyc compile fails on stub
# files in some packages and we don't want that to block the build.
RUN python -m compileall -q -j 0 /app /usr/local/lib/python3.11/site-packages || true

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
# Cloud Run sets $PORT (default 8080). uvicorn binds 0.0.0.0 so the
# platform health checks can reach it. --no-access-log drops per-request
# logging overhead; predict requests are already logged by the app.
ENV PORT=8080

CMD ["sh", "-c", "uvicorn app.server:app --host 0.0.0.0 --port ${PORT} --workers 1 --no-access-log --loop uvloop --http httptools"]
