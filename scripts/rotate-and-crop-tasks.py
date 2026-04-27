#!/usr/bin/env python3
"""Rotate 2000xH task images 90 degrees CCW and center-crop to Hx1500.

Workflow:
  1. Resolve the task list from --project-id + --max-iid (numeric `task.iid` filter).
  2. For each task:
     a. Load row from `task` (width/height/filePath/thumbnailUrl)
     b. Download original image from GCS via the public URL
     c. Verify long axis is 2000 — skip if already rotated
     d. Backup the original JPEG to `--backup-dir`
     e. Rotate 90 deg counter-clockwise -> H x 2000
     f. Center-crop the 2000-tall axis to 1500 -> H x 1500
     g. Overwrite the original GCS object with the rotated JPEG
     h. Regenerate the 400px webp thumbnail in place
     i. In one DB transaction:
          - UPDATE task SET width=H, height=1500
          - UPDATE polygon_annotation: each point (x_pct, y_pct) ->
            (y_pct, (1750*100 - 2000*x_pct) / 1500), then intersected
            with box(0, 0, 100, 100). Rows whose intersection is empty
            are deleted (or skipped with --no-delete).
          - rectangle_annotation and classification_annotation rows are untouched.

Geometry (origin top-left, y down, percent space):
  Annotation values are stored as percentages in [0, 100], with x relative to
  image width and y relative to image height. The transform is constant
  because input width is always 2000:

      new_x_pct = old_y_pct
      new_y_pct = (1750 * 100 - 2000 * old_x_pct) / 1500
                = 116.6667 - 1.3333 * old_x_pct

  Output image dims are (input_height, 1500). The transform doesn't depend on
  input_height because percentages already absorb that axis.

Dependencies (install once):
    pip install Pillow google-cloud-storage 'psycopg[binary]' shapely

Auth: relies on Application Default Credentials for GCS. Run
`gcloud auth application-default login` once if needed.

Usage:
    DATABASE_URL=postgres://... \\
    python scripts/rotate-and-crop-tasks.py \\
        --project-id 5 --max-iid 1760 \\
        --bucket robopipe-staging-assets \\
        --backup-dir .rotation-backup \\
        [--dry-run] [--limit N] [--no-thumbnails] [--no-delete]
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import unquote, urlparse

# Matches each "(x,y)" element inside a Postgres point[] text literal like
# `{"(1.5,2.5)","(3,4)"}`. Captures negatives + decimals + scientific notation.
_POINT_RE = re.compile(r"\(\s*([-+0-9.eE]+)\s*,\s*([-+0-9.eE]+)\s*\)")

REPO_ROOT = Path(__file__).resolve().parent.parent

EXPECTED_INPUT_W = 2000
TARGET_SIZE = 1500
CROP_Y_OFFSET = (EXPECTED_INPUT_W - TARGET_SIZE) // 2  # 250 — long axis cropped to 1500
PCT_MAX = 100.0


def transform_point(x_pct: float, y_pct: float) -> tuple[float, float]:
    """Map a percent-space point through the 90 CCW + crop transform.

    Constant because input width is always EXPECTED_INPUT_W (2000); height
    cancels out in percent space."""
    new_x = y_pct
    new_y = ((EXPECTED_INPUT_W - CROP_Y_OFFSET) * PCT_MAX - EXPECTED_INPUT_W * x_pct) / TARGET_SIZE
    return (new_x, new_y)


def transform_polygon(
    points: list[tuple[float, float]],
) -> list[tuple[float, float]] | None:
    """Map polygon vertices in percent space, clip to [0, 100] x [0, 100]. Returns None if degenerate."""
    from shapely.geometry import Polygon, box  # local import keeps cli help fast

    mapped = [transform_point(x, y) for x, y in points]
    if len(mapped) < 3:
        return None
    poly = Polygon(mapped)
    if not poly.is_valid:
        poly = poly.buffer(0)  # repair self-intersections
    clipped = poly.intersection(box(0.0, 0.0, PCT_MAX, PCT_MAX))
    if clipped.is_empty:
        return None
    if clipped.geom_type == "MultiPolygon":
        # keep the largest piece — annotations rarely fragment in practice
        clipped = max(clipped.geoms, key=lambda g: g.area)
    if clipped.geom_type == "GeometryCollection":
        polys = [g for g in clipped.geoms if g.geom_type == "Polygon" and g.area > 0]
        if not polys:
            return None
        clipped = max(polys, key=lambda g: g.area)
    if clipped.geom_type != "Polygon" or clipped.area <= 0:
        return None
    coords = list(clipped.exterior.coords)
    if len(coords) >= 2 and coords[0] == coords[-1]:
        coords = coords[:-1]  # drop the closing duplicate Shapely adds
    if len(coords) < 3:
        return None
    return [(float(x), float(y)) for x, y in coords]


@dataclass
class TaskRow:
    id: int
    project_id: int
    width: int
    height: int
    file_path: str
    thumbnail_url: str


def parse_object_path(public_url: str, bucket: str) -> str:
    """Extract the object path from a public GCS URL, ignoring host shape variations."""
    parsed = urlparse(public_url)
    path = unquote(parsed.path).lstrip("/")
    # Path is either "<bucket>/<object>" (storage.googleapis.com/<bucket>/...) or just "<object>"
    # (when host is "<bucket>.storage.googleapis.com"). Handle both.
    if path.startswith(f"{bucket}/"):
        return path[len(bucket) + 1 :]
    return path


def query_task_ids_by_iid(conn, project_id: int, max_iid: int) -> list[int]:
    """All task ids in `project_id` whose numeric iid is <= max_iid.

    `task.iid` is a varchar but holds a per-project numeric counter — we cast
    to int for the comparison and skip any non-numeric iids defensively."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM task "
            "WHERE project_id = %s AND iid ~ '^[0-9]+$' AND iid::bigint <= %s "
            "ORDER BY iid::bigint",
            (project_id, max_iid),
        )
        return [r[0] for r in cur.fetchall()]


def fetch_tasks(conn, ids: Iterable[int]) -> dict[int, TaskRow]:
    """Single SELECT for all tasks; missing ids are surfaced by the caller."""
    ids = list(ids)
    if not ids:
        return {}
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, project_id, width, height, file_path, thumbnail_url "
            "FROM task WHERE id = ANY(%s)",
            (ids,),
        )
        rows = cur.fetchall()
    return {r[0]: TaskRow(*r) for r in rows}


def format_point_array(points: list[tuple[float, float]]) -> str:
    """Postgres array-of-point literal: `{"(1.5,2.5)","(3,4)"}`."""
    return "{" + ",".join(f'"({x},{y})"' for x, y in points) + "}"


def parse_point_array_literal(literal: str) -> list[tuple[float, float]]:
    """Parse a Postgres `point[]` text representation into [(x, y), ...].

    psycopg3 has no default loader for `point`, so when we cast `value::text` we
    get strings like `'{"(1,2)","(3,4)"}'`. Regex-extract every `(x,y)` pair —
    works whether the elements are quoted or unquoted, and tolerates whitespace."""
    return [(float(x), float(y)) for x, y in _POINT_RE.findall(literal or "")]


def update_annotations(
    conn, task_id: int, output_w: int, no_delete: bool
) -> tuple[int, int]:
    """Transform every polygon row attached to `task_id` in percent space.

    Returns (polys_kept, polys_dropped). With --no-delete, "dropped" rows are
    left untouched in the DB instead of being deleted; the count still tracks
    them so you can spot tasks where the math clipped everything away."""
    polys_kept = polys_dropped = 0
    with conn.cursor() as cur:
        # Cast to text because psycopg3 has no built-in `point` loader; it'd otherwise
        # return the column as a raw array literal string we'd misinterpret.
        cur.execute(
            "SELECT id, value::text FROM polygon_annotation WHERE task_id = %s",
            (task_id,),
        )
        poly_rows = cur.fetchall()
        for pid, value_text in poly_rows:
            points = parse_point_array_literal(value_text)
            transformed = transform_polygon(points)
            if transformed is None:
                if not no_delete:
                    cur.execute("DELETE FROM polygon_annotation WHERE id = %s", (pid,))
                polys_dropped += 1
                continue
            cur.execute(
                "UPDATE polygon_annotation SET value = %s::point[] WHERE id = %s",
                (format_point_array(transformed), pid),
            )
            polys_kept += 1

        # task.annotation_count = surviving rects + polys + classifications.
        # Rects/classifications are untouched here, so just recount.
        cur.execute(
            "SELECT "
            "  (SELECT COUNT(*) FROM rectangle_annotation WHERE task_id = %s) "
            "+ (SELECT COUNT(*) FROM polygon_annotation WHERE task_id = %s) "
            "+ (SELECT COUNT(*) FROM classification_annotation WHERE task_id = %s)",
            (task_id, task_id, task_id),
        )
        total = cur.fetchone()[0]
        cur.execute(
            "UPDATE task SET annotation_count = %s, width = %s, height = %s WHERE id = %s",
            (total, output_w, TARGET_SIZE, task_id),
        )

    return polys_kept, polys_dropped


def rotate_and_crop_jpeg(buffer: bytes) -> tuple[bytes, int]:
    """Rotate 90 CCW and center-crop the long axis to TARGET_SIZE.

    Returns (jpeg_bytes, output_width). Output width equals input height (1499 or 1500
    in practice); output height is always TARGET_SIZE."""
    from PIL import Image

    img = Image.open(io.BytesIO(buffer))
    in_w, in_h = img.size
    if in_w != EXPECTED_INPUT_W:
        raise ValueError(
            f"unexpected image width {in_w}, want {EXPECTED_INPUT_W} (long-axis must be 2000)"
        )
    rotated = img.transpose(Image.Transpose.ROTATE_90)  # PIL ROTATE_90 == 90 CCW
    # rotated dims are (in_h, in_w). Crop the in_w-tall axis to TARGET_SIZE.
    cropped = rotated.crop((0, CROP_Y_OFFSET, in_h, CROP_Y_OFFSET + TARGET_SIZE))
    out = io.BytesIO()
    if cropped.mode != "RGB":
        cropped = cropped.convert("RGB")
    cropped.save(out, format="JPEG", quality=95, optimize=True)
    return out.getvalue(), in_h


def make_thumbnail(image_jpeg: bytes) -> bytes:
    from PIL import Image

    img = Image.open(io.BytesIO(image_jpeg))
    img.thumbnail((400, 400))  # equivalent to sharp's `fit: inside, withoutEnlargement: true`
    out = io.BytesIO()
    if img.mode != "RGB":
        img = img.convert("RGB")
    img.save(out, format="WEBP", quality=80)
    return out.getvalue()


def process_task(
    task: TaskRow,
    bucket,
    conn,
    backup_dir: Path,
    skip_thumbnails: bool,
    dry_run: bool,
    no_delete: bool,
) -> dict:
    """Process a single task. Returns a result dict for the summary log."""
    asset_path = parse_object_path(task.file_path, bucket.name)
    blob = bucket.blob(asset_path)

    original = blob.download_as_bytes()

    from PIL import Image

    img = Image.open(io.BytesIO(original))
    in_w, in_h = img.size

    # Already-rotated image but DB still claims pre-rotation dims = a previous run
    # uploaded the new GCS object but its DB transaction rolled back. Run only the
    # annotation transform + DB update; do NOT re-rotate / re-upload.
    if in_w != EXPECTED_INPUT_W:
        is_rotated_shape = in_w <= TARGET_SIZE and in_h == TARGET_SIZE
        if not is_rotated_shape:
            return {
                "task_id": task.id,
                "status": "error",
                "reason": f"unexpected dims {in_w}x{in_h}, want long-axis width = {EXPECTED_INPUT_W}",
            }
        if task.width == in_w and task.height == in_h:
            return {
                "task_id": task.id,
                "status": "skipped",
                "reason": f"already rotated ({in_w}x{in_h})",
            }
        # Partial state: GCS rotated, DB still has source dims. Recover.
        if dry_run:
            return {
                "task_id": task.id,
                "status": "dry-run",
                "reason": "would recover annotations only",
                "image_dims": [in_w, in_h],
                "db_dims": [task.width, task.height],
            }
        polys_kept, polys_dropped = update_annotations(conn, task.id, in_w, no_delete)
        conn.commit()
        return {
            "task_id": task.id,
            "status": "recovered",
            "output_dims": [in_w, in_h],
            "polys_kept": polys_kept,
            "polys_dropped": polys_dropped,
        }

    if not dry_run:
        backup_path = backup_dir / f"{task.project_id}" / f"{task.id}_{Path(asset_path).name}"
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        if not backup_path.exists():
            backup_path.write_bytes(original)

    rotated_jpeg, output_w = rotate_and_crop_jpeg(original)

    if dry_run:
        return {
            "task_id": task.id,
            "status": "dry-run",
            "asset_path": asset_path,
            "input_dims": [in_w, in_h],
            "output_dims": [output_w, TARGET_SIZE],
        }

    blob.upload_from_string(rotated_jpeg, content_type="image/jpeg")
    blob.make_public()

    if not skip_thumbnails and task.thumbnail_url and task.thumbnail_url != task.file_path:
        thumb_path = parse_object_path(task.thumbnail_url, bucket.name)
        thumb_blob = bucket.blob(thumb_path)
        thumb_bytes = make_thumbnail(rotated_jpeg)
        thumb_blob.upload_from_string(thumb_bytes, content_type="image/webp")
        thumb_blob.make_public()

    polys_kept, polys_dropped = update_annotations(conn, task.id, output_w, no_delete)
    conn.commit()

    return {
        "task_id": task.id,
        "status": "ok",
        "output_dims": [output_w, TARGET_SIZE],
        "polys_kept": polys_kept,
        "polys_dropped": polys_dropped,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--project-id", type=int, required=True, help="Project id to filter on.")
    parser.add_argument(
        "--max-iid",
        type=int,
        required=True,
        help="Include tasks whose numeric iid is <= this value.",
    )
    parser.add_argument("--bucket", default=os.environ.get("BUCKET_NAME", "robopipe-staging-assets"))
    parser.add_argument("--database-url", default=os.environ.get("DATABASE_URL"))
    parser.add_argument("--backup-dir", default=str(REPO_ROOT / ".rotation-backup"))
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N ids (for testing)")
    parser.add_argument("--dry-run", action="store_true", help="Skip GCS writes and DB writes")
    parser.add_argument("--no-thumbnails", action="store_true", help="Skip regenerating thumbnails")
    parser.add_argument(
        "--no-delete",
        action="store_true",
        help="Don't DELETE polygon rows whose transform clips to empty — leave them in place. "
        "Useful for a safety-first first pass; counts still report which rows would have been dropped.",
    )
    parser.add_argument(
        "--failures-log",
        default=str(REPO_ROOT / "rotation_failures.json"),
        help="Where to write per-task results / failure details",
    )
    args = parser.parse_args()

    if not args.database_url:
        print("DATABASE_URL is required (env var or --database-url)", file=sys.stderr)
        return 2

    try:
        import psycopg  # noqa: F401
        from google.cloud import storage  # noqa: F401
        from PIL import Image  # noqa: F401
        import shapely  # noqa: F401
    except ImportError as e:
        print(f"missing dependency: {e}. Install with:\n", file=sys.stderr)
        print("  pip install Pillow google-cloud-storage 'psycopg[binary]' shapely", file=sys.stderr)
        return 2

    import psycopg
    from google.cloud import storage

    backup_dir = Path(args.backup_dir).resolve()
    backup_dir.mkdir(parents=True, exist_ok=True)

    print(f"Bucket: {args.bucket}")
    print(f"Backup dir: {backup_dir}")
    if args.dry_run:
        print("DRY RUN — no GCS or DB writes.")
    if args.no_delete:
        print("NO-DELETE mode — polygons that clip to empty will be left in place.")

    storage_client = storage.Client()
    bucket = storage_client.bucket(args.bucket)

    # autocommit=False; we commit per task at the end of process_task
    conn = psycopg.connect(args.database_url, autocommit=False)
    try:
        ids = query_task_ids_by_iid(conn, args.project_id, args.max_iid)
        print(f"Found {len(ids)} tasks in project {args.project_id} with iid <= {args.max_iid}")
        if args.limit:
            ids = ids[: args.limit]
        if not ids:
            print("No tasks to process — exiting.")
            return 0
        print(f"Tasks to process: {len(ids)}")
        tasks = fetch_tasks(conn, ids)
    except Exception:
        conn.close()
        raise

    missing = [tid for tid in ids if tid not in tasks]
    if missing:
        print(f"WARNING: {len(missing)} task ids not found in DB. First few: {missing[:5]}")

    results: list[dict] = []
    ok = err = skipped = 0
    try:
        for idx, tid in enumerate(ids, 1):
            task = tasks.get(tid)
            if task is None:
                results.append({"task_id": tid, "status": "error", "reason": "not found in DB"})
                err += 1
                continue
            try:
                result = process_task(
                    task,
                    bucket,
                    conn,
                    backup_dir=backup_dir,
                    skip_thumbnails=args.no_thumbnails,
                    dry_run=args.dry_run,
                    no_delete=args.no_delete,
                )
            except Exception as e:
                conn.rollback()
                result = {"task_id": tid, "status": "error", "reason": f"{type(e).__name__}: {e}"}
            results.append(result)
            status = result["status"]
            if status in ("ok", "recovered", "dry-run"):
                ok += 1
            elif status == "skipped":
                skipped += 1
            else:
                err += 1
            if idx % 25 == 0 or idx == len(ids):
                print(f"  [{idx}/{len(ids)}] ok={ok} skipped={skipped} errors={err}")
    finally:
        conn.close()

    Path(args.failures_log).write_text(json.dumps(results, indent=2))
    print()
    print(f"Done. ok={ok} skipped={skipped} errors={err}")
    print(f"Per-task log: {args.failures_log}")
    return 0 if err == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
