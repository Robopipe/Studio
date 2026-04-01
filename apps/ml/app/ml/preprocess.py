"""
Dataset preprocessing — applies deterministic transforms to images before training.

Entries are grouped by their per-entry keep_original flag:
- Overwrite (keep_original=False): compose into one pipeline, overwrite originals
- Duplicate (keep_original=True): compose into one pipeline, save copies alongside originals
Overwrite is applied first, then duplicate (so duplicates are based on preprocessed images).
"""

import os
from pathlib import Path

import albumentations as A
import cv2

from ..models.augmentations.augmentation import Augmentation
from ..models.model_type import ModelType
from .dataset import (
    DATASET_DIR,
    IMAGE_DIR,
    LABEL_DIR,
    TEST_DIR,
    TRAIN_DIR,
    VAL_DIR,
)

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}
PREPROCESS_SUFFIX = "_preprocessed"


def _build_transform_pipeline(
    preprocessings: list[Augmentation], img_size: tuple[int, int]
) -> list[A.BasicTransform]:
    """Convert all preprocessing Augmentation models into a flat list of
    albumentations transforms with p=1.0 (deterministic)."""
    transforms = []
    for aug in preprocessings:
        configs = aug.to_config(img_size)
        for cfg in configs:
            name = cfg["name"]
            params = dict(cfg.get("params", {}))
            params["p"] = 1.0
            cls = getattr(A, name, None)
            if cls is None:
                print(f"Warning: albumentations transform '{name}' not found, skipping")
                continue
            transforms.append(cls(**params))
    return transforms


def _parse_yolo_labels(label_path: str) -> tuple[list[list[float]], list[int]]:
    """Parse YOLO-format label file. Returns (bboxes, class_ids).
    Each bbox is [cx, cy, w, h] normalized."""
    bboxes = []
    class_ids = []
    if not os.path.exists(label_path):
        return bboxes, class_ids
    with open(label_path, "r") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 5:
                continue
            class_ids.append(int(float(parts[0])))
            bboxes.append([float(x) for x in parts[1:5]])
    return bboxes, class_ids


def _write_yolo_labels(
    label_path: str, bboxes: list[list[float]], class_ids: list[int]
):
    """Write YOLO-format label file."""
    with open(label_path, "w") as f:
        for cls_id, bbox in zip(class_ids, bboxes):
            f.write(
                f"{int(cls_id)} {bbox[0]:.6f} {bbox[1]:.6f} {bbox[2]:.6f} {bbox[3]:.6f}\n"
            )


def _parse_polygon_labels(
    label_path: str,
) -> tuple[list[list[tuple[float, float]]], list[int]]:
    """Parse polygon-format label file. Returns (polygons, class_ids).
    Each polygon is a list of (x, y) normalized points."""
    polygons = []
    class_ids = []
    if not os.path.exists(label_path):
        return polygons, class_ids
    with open(label_path, "r") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 3:
                continue
            class_ids.append(int(float(parts[0])))
            coords = [float(x) for x in parts[1:]]
            points = [(coords[i], coords[i + 1]) for i in range(0, len(coords), 2)]
            polygons.append(points)
    return polygons, class_ids


def _write_polygon_labels(
    label_path: str,
    polygons: list[list[tuple[float, float]]],
    class_ids: list[int],
):
    """Write polygon-format label file."""
    with open(label_path, "w") as f:
        for cls_id, points in zip(class_ids, polygons):
            points_str = " ".join(f"{x:.6f} {y:.6f}" for x, y in points)
            f.write(f"{int(cls_id)} {points_str}\n")


def _process_classification(
    split_dir: str,
    pipeline: A.Compose,
    keep_originals: bool,
) -> int:
    """Apply the full preprocessing pipeline to all images in a classification split."""
    count = 0
    for label_dir_name in os.listdir(split_dir):
        label_dir = os.path.join(split_dir, label_dir_name)
        if not os.path.isdir(label_dir):
            continue
        for filename in list(os.listdir(label_dir)):
            filepath = os.path.join(label_dir, filename)
            ext = Path(filename).suffix.lower()
            if ext not in IMAGE_EXTENSIONS:
                continue

            image = cv2.imread(filepath)
            if image is None:
                continue

            result = pipeline(image=image)

            if keep_originals:
                stem = Path(filename).stem
                out_path = os.path.join(label_dir, f"{stem}{PREPROCESS_SUFFIX}{ext}")
                cv2.imwrite(out_path, result["image"])
            else:
                cv2.imwrite(filepath, result["image"])
            count += 1

    return count


def _process_detection(
    image_split_dir: str,
    label_split_dir: str,
    pipeline_transforms: list[A.BasicTransform],
    keep_originals: bool,
) -> int:
    """Apply the full preprocessing pipeline to all images and YOLO labels."""
    count = 0
    compose = A.Compose(
        pipeline_transforms,
        bbox_params=A.BboxParams(
            format="yolo",
            label_fields=["class_labels"],
            min_visibility=0.1,
        ),
    )

    for filename in list(os.listdir(image_split_dir)):
        filepath = os.path.join(image_split_dir, filename)
        ext = Path(filename).suffix.lower()
        if ext not in IMAGE_EXTENSIONS:
            continue
        stem = Path(filename).stem

        image = cv2.imread(filepath)
        if image is None:
            continue

        label_path = os.path.join(label_split_dir, f"{stem}.txt")
        bboxes, class_ids = _parse_yolo_labels(label_path)

        result = compose(image=image, bboxes=bboxes, class_labels=class_ids)
        out_bboxes = [list(b) for b in result["bboxes"]]
        out_class_ids = result["class_labels"]

        if keep_originals:
            out_img_path = os.path.join(
                image_split_dir, f"{stem}{PREPROCESS_SUFFIX}{ext}"
            )
            out_label_path = os.path.join(
                label_split_dir, f"{stem}{PREPROCESS_SUFFIX}.txt"
            )
            cv2.imwrite(out_img_path, result["image"])
            _write_yolo_labels(out_label_path, out_bboxes, out_class_ids)
        else:
            cv2.imwrite(filepath, result["image"])
            _write_yolo_labels(label_path, out_bboxes, out_class_ids)
        count += 1

    return count


def _process_segmentation(
    image_split_dir: str,
    label_split_dir: str,
    pipeline_transforms: list[A.BasicTransform],
    keep_originals: bool,
) -> int:
    """Apply the full preprocessing pipeline to all images and polygon labels."""
    count = 0

    for filename in list(os.listdir(image_split_dir)):
        filepath = os.path.join(image_split_dir, filename)
        ext = Path(filename).suffix.lower()
        if ext not in IMAGE_EXTENSIONS:
            continue
        stem = Path(filename).stem

        image = cv2.imread(filepath)
        if image is None:
            continue

        img_h, img_w = image.shape[:2]
        label_path = os.path.join(label_split_dir, f"{stem}.txt")
        polygons, class_ids = _parse_polygon_labels(label_path)

        # Flatten polygon points into keypoints (pixel coords)
        keypoints = []
        poly_map = []  # (polygon_idx, point_count)
        for poly_idx, points in enumerate(polygons):
            poly_map.append((poly_idx, len(points)))
            for x_norm, y_norm in points:
                keypoints.append((x_norm * img_w, y_norm * img_h))

        compose = A.Compose(
            pipeline_transforms,
            keypoint_params=A.KeypointParams(format="xy", remove_invisible=False),
        )

        result = compose(image=image, keypoints=keypoints)
        out_image = result["image"]
        out_keypoints = result["keypoints"]
        new_h, new_w = out_image.shape[:2]

        # Reconstruct polygons from transformed keypoints
        out_polygons = []
        kp_idx = 0
        for _, point_count in poly_map:
            poly_points = []
            for _ in range(point_count):
                if kp_idx < len(out_keypoints):
                    px, py = out_keypoints[kp_idx]
                    poly_points.append((px / new_w, py / new_h))
                kp_idx += 1
            out_polygons.append(poly_points)

        if keep_originals:
            out_img_path = os.path.join(
                image_split_dir, f"{stem}{PREPROCESS_SUFFIX}{ext}"
            )
            out_label_path = os.path.join(
                label_split_dir, f"{stem}{PREPROCESS_SUFFIX}.txt"
            )
            cv2.imwrite(out_img_path, out_image)
            _write_polygon_labels(out_label_path, out_polygons, class_ids)
        else:
            cv2.imwrite(filepath, out_image)
            _write_polygon_labels(label_path, out_polygons, class_ids)
        count += 1

    return count


def _run_pipeline(
    dataset_dir: str,
    entries: list[Augmentation],
    task_type: ModelType,
    keep_originals: bool,
) -> int:
    """Run a single preprocessing pass (overwrite or duplicate) for a group of entries."""
    img_size = (480, 640) if task_type != ModelType.CLASSIFICATION else (512, 512)
    val_dir = "valid" if task_type == ModelType.CLASSIFICATION else VAL_DIR
    split_names = [TRAIN_DIR, val_dir, TEST_DIR]

    transforms = _build_transform_pipeline(entries, img_size)
    if not transforms:
        return 0

    total = 0
    if task_type == ModelType.CLASSIFICATION:
        pipeline = A.Compose(transforms)
        for split_name in split_names:
            split_path = os.path.join(dataset_dir, split_name)
            if os.path.isdir(split_path):
                total += _process_classification(split_path, pipeline, keep_originals)
    else:
        image_dir = os.path.join(dataset_dir, IMAGE_DIR)
        label_dir = os.path.join(dataset_dir, LABEL_DIR)
        process_fn = (
            _process_detection
            if task_type == ModelType.DETECTION
            else _process_segmentation
        )
        for split_name in split_names:
            img_split = os.path.join(image_dir, split_name)
            lbl_split = os.path.join(label_dir, split_name)
            if os.path.isdir(img_split):
                total += process_fn(img_split, lbl_split, transforms, keep_originals)

    return total


def preprocess_dataset(
    dir: str,
    preprocessings: list[Augmentation],
    task_type: ModelType,
):
    """
    Compose preprocessing transforms into pipelines and apply them to the dataset.

    Entries are split by their keep_original flag:
    1. Overwrite group (keep_original=False): applied first, overwrites originals
    2. Duplicate group (keep_original=True): applied second on already-preprocessed
       images, saves copies with '_preprocessed' suffix alongside originals

    Args:
        dir: Base temp directory containing the dataset/ subdirectory
        preprocessings: List of preprocessing transforms with per-entry keep_original
        task_type: Classification, Detection, or Segmentation
    """
    dataset_dir = f"{dir}/{DATASET_DIR}"

    overwrite_entries = [p for p in preprocessings if not p.keep_original]
    duplicate_entries = [p for p in preprocessings if p.keep_original]

    total = 0

    if overwrite_entries:
        count = _run_pipeline(dataset_dir, overwrite_entries, task_type, False)
        print(f"Preprocessing (overwrite): {count} images overwritten")
        total += count

    if duplicate_entries:
        count = _run_pipeline(dataset_dir, duplicate_entries, task_type, True)
        print(f"Preprocessing (duplicate): {count} copies created")
        total += count

    if total == 0:
        print("No valid preprocessing transforms found, skipping")
