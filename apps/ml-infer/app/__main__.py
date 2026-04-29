import argparse
import json
import sys
from pathlib import Path

import cv2

from .model import load_model
from .output_format import detect_layout, normalize_outputs
from .postprocess import decode_yolo_seg
from .preprocess import preprocess
from .tasks_input import resolve_tasks
from .visualize import draw_polygons

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def main() -> int:
    parser = argparse.ArgumentParser(prog="ml-infer")
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--input", type=Path, help="folder of images")
    src.add_argument(
        "--tasks-config",
        type=Path,
        help="path to a tasks-export JSON; images are downloaded from each "
        "task's filePath into --cache-dir",
    )
    parser.add_argument(
        "--cache-dir",
        type=Path,
        default=Path("./cache"),
        help="where to store images downloaded via --tasks-config (default ./cache)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="when using --tasks-config, only process the first N tasks",
    )
    parser.add_argument(
        "--download-workers",
        type=int,
        default=8,
        help="parallel HTTP workers for --tasks-config downloads (default 8)",
    )
    parser.add_argument(
        "--model", required=True, type=Path, help=".onnx file or .tar.xz NN archive"
    )
    parser.add_argument(
        "--output", required=True, type=Path, help="path to write predictions JSON"
    )
    parser.add_argument(
        "--preview", type=Path, default=None, help="folder to write overlay images"
    )
    parser.add_argument(
        "--classes",
        type=str,
        default=None,
        help="comma-separated class names, in training-time order",
    )
    parser.add_argument("--conf", type=float, default=0.25)
    parser.add_argument("--iou", type=float, default=0.45)
    parser.add_argument("--max-det", type=int, default=300)
    parser.add_argument(
        "--poly-epsilon",
        type=float,
        default=0.005,
        help="approxPolyDP epsilon as fraction of contour perimeter; "
        "lower = more vertices, higher = simpler shapes (default 0.005)",
    )
    args = parser.parse_args()

    if args.tasks_config is not None:
        if not args.tasks_config.is_file():
            print(
                f"[ml-infer] --tasks-config must be a file: {args.tasks_config}",
                file=sys.stderr,
            )
            return 2
        image_paths = resolve_tasks(
            args.tasks_config,
            args.cache_dir,
            limit=args.limit,
            workers=args.download_workers,
        )
        image_paths = [p for p in image_paths if p.suffix.lower() in IMG_EXTS]
    else:
        if not args.input.is_dir():
            print(
                f"[ml-infer] --input must be a directory: {args.input}",
                file=sys.stderr,
            )
            return 2
        image_paths = sorted(
            p for p in args.input.iterdir() if p.suffix.lower() in IMG_EXTS
        )

    classes_override = (
        [c.strip() for c in args.classes.split(",") if c.strip()]
        if args.classes
        else None
    )
    loaded = load_model(args.model, classes_override)
    session = loaded.session
    class_names = loaded.class_names

    inputs = session.get_inputs()
    in_name = inputs[0].name
    in_shape = inputs[0].shape
    in_h = in_shape[2] if isinstance(in_shape[2], int) else 640
    in_w = in_shape[3] if isinstance(in_shape[3], int) else 640

    output_names = [o.name for o in session.get_outputs()]
    layout = detect_layout(output_names)
    print(f"[ml-infer] providers: {session.get_providers()}")
    print(f"[ml-infer] input: {in_name} {in_shape}")
    for o in session.get_outputs():
        print(f"[ml-infer] output: {o.name} {o.shape}")
    print(f"[ml-infer] layout: {layout}")
    print(f"[ml-infer] classes ({len(class_names)}): {class_names}")

    if not class_names:
        from .model import _infer_n_classes, _numeric_classes

        class_names = _numeric_classes(_infer_n_classes(session))
        if not class_names:
            print(
                "[ml-infer] could not infer n_classes from output shapes — "
                "pass --classes",
                file=sys.stderr,
            )
            return 2
        print(
            f"[ml-infer] no class names in archive metadata; using numeric "
            f"fallback {class_names}. Pass --classes for human-readable names.",
            file=sys.stderr,
        )

    if not image_paths:
        src_label = args.tasks_config or args.input
        print(f"[ml-infer] no images to process from {src_label}", file=sys.stderr)
        return 1

    if args.preview:
        args.preview.mkdir(parents=True, exist_ok=True)

    predictions = []
    for img_path in image_paths:
        img = cv2.imread(str(img_path))
        if img is None:
            print(f"[ml-infer] skip unreadable: {img_path.name}")
            continue
        h, w = img.shape[:2]

        tensor, meta = preprocess(img, (in_h, in_w))
        outputs = session.run(None, {in_name: tensor})
        try:
            output0, output1 = normalize_outputs(
                outputs, output_names, (in_h, in_w)
            )
        except (ValueError, StopIteration) as e:
            shapes = [(n, o.shape) for n, o in zip(output_names, outputs)]
            print(
                f"[ml-infer] could not normalize outputs ({e}); shapes were {shapes}",
                file=sys.stderr,
            )
            return 3

        polys = decode_yolo_seg(
            output0,
            output1,
            n_classes=len(class_names),
            img_shape=(h, w),
            input_shape=(in_h, in_w),
            letterbox_meta=meta,
            conf_threshold=args.conf,
            iou_threshold=args.iou,
            max_det=args.max_det,
            poly_epsilon=args.poly_epsilon,
        )

        for p in polys:
            idx = p["classIndex"]
            p["className"] = (
                class_names[idx] if idx < len(class_names) else str(idx)
            )

        predictions.append(
            {
                "image": img_path.name,
                "width": w,
                "height": h,
                "polygons": polys,
            }
        )

        if args.preview:
            preview_img = draw_polygons(img, polys, class_names)
            cv2.imwrite(str(args.preview / img_path.name), preview_img)

        print(f"[ml-infer] {img_path.name}: {len(polys)} polygons")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(
            {
                "model": args.model.name,
                "modelInputSize": [in_h, in_w],
                "classNames": class_names,
                "confThreshold": args.conf,
                "iouThreshold": args.iou,
                "predictions": predictions,
            },
            indent=2,
        )
    )
    print(f"[ml-infer] wrote {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
