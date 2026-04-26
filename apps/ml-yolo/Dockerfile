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

# luxonis/tools — used at export time to convert Ultralytics .pt to a
# multi-output ONNX + NN archive with proper `heads` metadata. Lives in
# its OWN venv for two reasons:
#   1) License isolation: tools is AGPL-3.0; we invoke it as a CLI
#      subprocess so it stays an arm's-length, separately-built program
#      rather than linked into ml-yolo's address space.
#   2) Dependency isolation: tools requires onnx==1.21.0 and pulls
#      mmcv 1.x, both of which conflict with ml-yolo's pinned stack
#      (see onnx pin rationale in app/ml/train_model.py).
# Pinned to v0.3.5 (commit edbe7da, 2026-04-14). When bumping, verify
# that exporter output names still match what depthai_nodes' YOLO
# parsers filter on by substring (`_yolo`, `_masks`, etc.) — that
# convention is the entire reason we use tools.
RUN python3 -m venv /opt/tools-venv && \
    git clone https://github.com/luxonis/tools.git /tmp/luxonis-tools && \
    cd /tmp/luxonis-tools && \
    git checkout edbe7da1a7f75833a71d65caf1028036faa81061 && \
    git submodule update --init --recursive && \
    PIP_CONSTRAINT=constraints.txt /opt/tools-venv/bin/pip install --no-cache-dir . && \
    rm -rf /tmp/luxonis-tools

ENV ROBOPIPE_TOOLS_BIN=/opt/tools-venv/bin/tools

# Pre-download all yolo11 detection + segmentation pretrained weights into the
# image. Ultralytics' YOLO(name) constructor calls safe_download() which has a
# known silent-failure path: if a retry deletes a partial file and the loop
# exits without raising, attempt_download_asset() returns a Path to a
# non-existent file and the next torch.load() raises FileNotFoundError. By
# baking the weights at /app (the WORKDIR), YOLO()'s first existence check
# (`Path(file).exists()` against cwd) hits and skips the download entirely.
# Pin to v8.3.0 — the release tag that hosts the yolo11 family weights.
RUN cd /app && for v in \
    yolo11n yolo11s yolo11m yolo11l yolo11x \
    yolo11n-seg yolo11s-seg yolo11m-seg yolo11l-seg yolo11x-seg \
    ; do \
    curl -fL --retry 3 -o ${v}.pt \
        https://github.com/ultralytics/assets/releases/download/v8.3.0/${v}.pt; \
    done

COPY app/ ./app/

RUN mkdir -p /app/export /app/dataset

ENV PYTHONUNBUFFERED=1
# Cloud Batch containers don't always have a writable $HOME; pin Ultralytics'
# settings dir to /tmp to avoid the "not writable" warning on every run.
ENV YOLO_CONFIG_DIR=/tmp/Ultralytics

# Default to Cloud Batch job mode. Docker-compose overrides CMD to run the
# FastAPI server for local HTTP testing.
CMD ["python", "-m", "app.job"]
