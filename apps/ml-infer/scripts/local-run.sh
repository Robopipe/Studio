#!/usr/bin/env bash
# Local pre-annotation scoring run.
#
# Edit the values below (or override via env vars on the command line) and
# execute from apps/ml-infer/:
#
#     ./scripts/local-run.sh
#
# Prereqs (one-time):
#     python -m venv .venv && source .venv/bin/activate
#     pip install -r requirements.txt -r scripts/requirements.txt
#     gcloud auth application-default login
#     export DATABASE_URL=postgres://user:pass@host:5432/dbname

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-5}"
MODEL_ID="${MODEL_ID:-209}"
MANIFEST="${MANIFEST:-input/dataset/${PROJECT_ID}/manifest.json}"

CONF="${CONF:-0.3}"
IOU="${IOU:-0.45}"
POLY_EPSILON="${POLY_EPSILON:-0.005}"
MASK_THRESHOLD="${MASK_THRESHOLD:-0.5}"
MIN_AREA_PX="${MIN_AREA_PX:-4}"
MAX_DET="${MAX_DET:-300}"

python -m scripts.score_dataset \
  --manifest "${MANIFEST}" \
  --model-id "${MODEL_ID}" \
  --conf "${CONF}" \
  --iou "${IOU}" \
  --poly-epsilon "${POLY_EPSILON}" \
  --mask-threshold "${MASK_THRESHOLD}" \
  --min-area-px "${MIN_AREA_PX}" \
  --max-det "${MAX_DET}"
