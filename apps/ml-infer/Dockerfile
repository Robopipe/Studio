# Two build variants share this one Dockerfile so app code/deps never drift
# between them:
#   - CPU (default): the predict service. `docker build .`
#   - GPU: the confidence-report Cloud Run Job only — NOT the service, which
#     stays on the slim CPU image to protect its scale-from-zero cold start.
#     `docker build --build-arg BASE_IMAGE=nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04 \
#                    --build-arg ORT_PACKAGE=onnxruntime-gpu==1.23.0 .`
ARG BASE_IMAGE=python:3.11-slim
FROM ${BASE_IMAGE}

# ORT_PACKAGE must be re-declared after FROM to be usable below.
ARG ORT_PACKAGE=onnxruntime==1.23.0

WORKDIR /app

# OpenCV runtime libs only — ml-infer does not train, so we don't need
# build-essential/cmake or the heavy luxonis/tools toolchain.
#
# The CUDA base image (Ubuntu 22.04) ships no Python at all, so the GPU
# build also needs Python 3.11 installed here to match the CPU image's
# interpreter exactly. `command -v python3.11` is a no-op guard on the CPU
# image, which already has it — this block only does anything on the CUDA
# base.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && if ! command -v python3.11 >/dev/null 2>&1; then \
      apt-get install -y --no-install-recommends software-properties-common \
      && add-apt-repository -y ppa:deadsnakes/ppa \
      && apt-get update && apt-get install -y --no-install-recommends \
        python3.11 python3.11-venv python3.11-distutils \
      && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 \
      && update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 \
      && python3.11 -m ensurepip --upgrade \
    ; fi \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# `python -m pip` rather than a bare `pip` binary — the deadsnakes/apt
# install on the GPU base doesn't reliably put an unversioned `pip` on
# PATH, but `python` is guaranteed via update-alternatives above (and
# already present on the CPU base).
RUN python -m pip install --no-cache-dir --timeout=120 --retries=5 "${ORT_PACKAGE}" -r requirements.txt

COPY app/ ./app/

# Pre-compile .pyc for our app code AND for the installed dependencies.
# Saves ~0.5-1.0s of cold-start parse/compile on a Cloud Run instance —
# small in absolute terms, but consistent regardless of cache state.
# `-q 0` suppresses noise; `|| true` because pyc compile fails on stub
# files in some packages and we don't want that to block the build.
#
# site-packages is discovered dynamically rather than hardcoded: the
# python.org build (CPU image) uses /usr/local/lib/python3.11/site-packages,
# but the deadsnakes apt install (GPU image) uses .../dist-packages instead.
RUN python -m compileall -q -j 0 /app $(python -c "import site; print(' '.join(site.getsitepackages()))") || true

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
# Cloud Run sets $PORT (default 8080). uvicorn binds 0.0.0.0 so the
# platform health checks can reach it. --no-access-log drops per-request
# logging overhead; predict requests are already logged by the app.
ENV PORT=8080

CMD ["sh", "-c", "uvicorn app.server:app --host 0.0.0.0 --port ${PORT} --workers 1 --no-access-log --loop uvloop --http httptools"]
