# ml-infer

Local prototype that runs a YOLO segmentation ONNX over a folder of
images (or a tasks-export JSON) and produces polygon annotations + an
overlay preview. Runtime is `onnxruntime` only — no PyTorch required.

## Install

### Option A — dedicated venv

```bash
cd apps/ml-infer
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Option B — reuse your existing PyTorch env

The script doesn't import torch. If you already have a Python env (e.g.
the ml-yolo training env), just add the three runtime deps:

```bash
pip install onnxruntime opencv-python certifi
```

Then run `python -m app …` from `apps/ml-infer/`.

## Usage

### From a tasks-export JSON (downloads + caches images)

```bash
python -m app \
  --tasks-config ./input-config/tasks1.json \
  --cache-dir ./cache \
  --limit 100 \
  --model ./models/seg1.onnx.tar.xz \
  --output ./output/predictions.json \
  --preview ./preview \
  --poly-epsilon 0.002
```

- Re-running skips files already in `--cache-dir` (keyed by URL filename).
- Drop `--limit` to process all tasks.
- `--download-workers N` (default 8) parallelizes HTTPS downloads.

### From a local folder of images

```bash
python -m app \
  --input ./input \
  --model ./models/seg1.onnx.tar.xz \
  --output ./output/predictions.json \
  --preview ./preview \
  --poly-epsilon 0.002
```

`--input` and `--tasks-config` are mutually exclusive.

## Tunables

| flag              | default | what it does                                                                                |
| ----------------- | ------: | ------------------------------------------------------------------------------------------- |
| `--conf`          |  `0.25` | per-class confidence threshold                                                              |
| `--iou`           |  `0.45` | NMS IoU threshold                                                                           |
| `--max-det`       |   `300` | cap on detections per image                                                                 |
| `--poly-epsilon`  | `0.005` | `approxPolyDP` epsilon as a fraction of contour perimeter — lower = more vertices           |
| `--classes`       |    auto | comma-separated class names in training-time order; falls back to numeric (`"0","1",…`)     |

## Output

`predictions.json`:

```jsonc
{
  "model": "seg1.onnx.tar.xz",
  "modelInputSize": [1280, 1280],
  "classNames": ["0", "1", ...],
  "predictions": [
    {
      "image": "img_001.jpeg",
      "width": 1984, "height": 1500,
      "polygons": [
        { "classIndex": 3, "className": "3", "score": 0.92,
          "value": [[x, y], [x, y], ...] }
      ]
    }
  ]
}
```

`value` coordinates are in original-image pixel space, matching the API's
`polygonAnnotationSchema` (`packages/schema/src/task/task.schema.ts`).

## Supported model formats

- Standard Ultralytics YOLOv8/v11 segmentation ONNX (one 3D + one 4D output)
- luxonis/tools-converted segmentation NN archive (`*_yolov8` + `*_masks` +
  `protos_output`, with constant-1.0 objectness slot) — even when shipped
  as a raw `.onnx.tar.xz` that's actually a plain ONNX protobuf
