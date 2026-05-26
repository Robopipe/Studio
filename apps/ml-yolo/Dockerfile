FROM python:3.10-slim

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

# python:3.10-slim ships an older pip whose resolver bails on torch's
# `typing-extensions>=4.10.0` constraint with "No matching distribution
# found" even though 4.12.2+ is in the listed available versions. The
# same requirements.txt worked under python:3.11-slim's newer pip.
# Upgrade pip first in every env (global + both venvs below).
RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 --retries=5 -r requirements.txt

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
#
# Pre-install torch CPU-only BEFORE letting tools resolve its deps.
# Otherwise pip's resolver pulls the default torch wheel for the build
# platform, which on linux/aarch64 (and amd64 for newer torch versions)
# transitively brings nvidia_cublas / cusolver / cudnn — ~1 GB of CUDA
# wheels we never use, since the export step is CPU-only. tools'
# `torch>=2.0.0` constraint is satisfied by the pre-installed 2.8.0+cpu
# wheel, so the subsequent `pip install .` skips torch reinstallation.
RUN python3 -m venv /opt/tools-venv && \
    /opt/tools-venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/tools-venv/bin/pip install --no-cache-dir --timeout=120 --retries=5 \
        --index-url https://download.pytorch.org/whl/cpu \
        --extra-index-url https://pypi.org/simple \
        torch==2.8.0+cpu torchvision==0.23.0 && \
    git clone https://github.com/luxonis/tools.git /tmp/luxonis-tools && \
    cd /tmp/luxonis-tools && \
    git checkout edbe7da1a7f75833a71d65caf1028036faa81061 && \
    git submodule update --init --recursive && \
    PIP_CONSTRAINT=constraints.txt /opt/tools-venv/bin/pip install --no-cache-dir --timeout=120 --retries=5 . && \
    rm -rf /tmp/luxonis-tools

ENV ROBOPIPE_TOOLS_BIN=/opt/tools-venv/bin/tools

# --- Luxonis modelconverter (offline ONNX/NN-archive → RVC4 .dlc) ---
# Used for INT8 RVC4 builds because it accepts a local directory of
# calibration images, unlike hubai-sdk's predefined-domain-only API.
# Apache-2.0 wrapper around Qualcomm SNPE / QAIRT (the latter governed
# by Qualcomm's AI Runtime Community license). The resulting image
# embeds SNPE binaries — KEEP THIS IMAGE ON PRIVATE REGISTRIES ONLY.
# Verify /opt/snpe/LICENSE.pdf before any redistribution decision.
#
# Apt deps mirror modelconverter's official rvc4 Dockerfile so SNPE's
# x86_64 host binaries link cleanly. libncurses5/libtinfo5 don't exist
# on bookworm; we use the t64 transitional packages where applicable.
RUN apt-get update && apt-get install -y --no-install-recommends \
    unzip \
    perl \
    libatomic1 \
    libc++-dev \
    ffmpeg \
    libcurl4 \
    libncurses6 \
    libtinfo6 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Pin to the SNPE version modelconverter v0.5.3 was tested against. The
# download is anonymous HTTPS (no Qualcomm account needed) per
# modelconverter/utils/docker_utils.py:224. Bumping requires re-checking
# modelconverter compatibility.
ARG SNPE_VERSION=2.32.6.250402
RUN cd /tmp && \
    wget --quiet --user-agent=modelconverter \
        "https://softwarecenter.qualcomm.com/api/download/software/sdks/Qualcomm_AI_Runtime_Community/All/${SNPE_VERSION}/v${SNPE_VERSION}.zip" \
        -O snpe.zip && \
    unzip -q snpe.zip -d /opt && \
    rm snpe.zip && \
    # Archive unpacks to /opt/qairt/<version>/. Fold into /opt/snpe/ \
    mv /opt/qairt/*/ /opt/snpe/ && \
    rm -rf /opt/qairt && \
    # Prune everything we don't need on x86_64 Linux host: docs, examples
    # Hexagon DSP libs, Android/Ubuntu/Windows runtimes. Reduces the image
    # by ~700 MB.
    rm -rf \
        /opt/snpe/Uninstall \
        /opt/snpe/docs \
        /opt/snpe/share \
        /opt/snpe/examples \
        /opt/snpe/benchmarks && \
    find /opt/snpe/lib -maxdepth 1 -type d \
        \( -name 'hexagon-*' -o -name '*android*' -o -name '*ubuntu*' -o -name '*windows*' \) \
        -exec rm -rf {} + && \
    find /opt/snpe/bin -maxdepth 1 -type d \
        \( -name '*windows*' -o -name '*android*' -o -name '*ubuntu*' \) \
        -exec rm -rf {} +

# modelconverter in its own venv — its pinned onnx==1.18.0 / luxonis-ml
# stack would clash with ml-yolo's Ultralytics deps if installed in the
# global env (same isolation rationale as luxonis/tools above).
RUN python3 -m venv /opt/modelconverter-venv && \
    /opt/modelconverter-venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/modelconverter-venv/bin/pip install --no-cache-dir --timeout=120 --retries=5 \
        modelconv==0.5.3

# IN_DOCKER tells modelconverter's CLI to skip its outer-Docker shell-out
# (modelconverter/__main__.py:627 — `if in_docker(): return command(...)`).
# Without this it tries to docker-run a converter image, which is impossible
# from inside this Cloud Batch container.
ENV IN_DOCKER=1
ENV ROBOPIPE_MODELCONVERTER_BIN=/opt/modelconverter-venv/bin/modelconverter
ENV ROBOPIPE_SNPE_ROOT=/opt/snpe

# Pre-download pretrained weights into the image. Ultralytics' YOLO(name)
# constructor calls safe_download() which has a known silent-failure path: if
# a retry deletes a partial file and the loop exits without raising,
# attempt_download_asset() returns a Path to a non-existent file and the next
# torch.load() raises FileNotFoundError. By baking the weights at /app (the
# WORKDIR), YOLO()'s first existence check (`Path(file).exists()` against cwd)
# hits and skips the download entirely.
# YOLO11 weights at v8.3.0; YOLO26 weights at v8.4.0 (first release that
# ships the yolo26 family).
RUN cd /app && for v in \
    yolo11n yolo11s yolo11m yolo11l yolo11x \
    yolo11n-seg yolo11s-seg yolo11m-seg yolo11l-seg yolo11x-seg \
    ; do \
    curl -fL --retry 3 -o ${v}.pt \
        https://github.com/ultralytics/assets/releases/download/v8.3.0/${v}.pt; \
    done
RUN cd /app && for v in \
    yolo26n yolo26s yolo26m yolo26l yolo26x \
    yolo26n-seg yolo26s-seg yolo26m-seg yolo26l-seg yolo26x-seg \
    ; do \
    curl -fL --retry 3 -o ${v}.pt \
        https://github.com/ultralytics/assets/releases/download/v8.4.0/${v}.pt; \
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
