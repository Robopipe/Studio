#!/usr/bin/env python3
"""Restore original task images from .rotation-backup back into GCS.

The rotate script saves each original at:
    .rotation-backup/<projectId>/<taskId>_<gcsBasename>

The GCS object path is `<projectId>/assets/<gcsBasename>`, so the upload target
is reconstructed by stripping the `<taskId>_` prefix and prepending the project
directory + `/assets/`. Each blob is re-uploaded with content-type image/jpeg
and made public-read (matching how `AssetsService.saveFile` originally wrote it).

This script is DB-agnostic — it only touches GCS. Restore the DB separately
(your db backup) before/after as needed.

Dependencies:
    pip install google-cloud-storage

Auth: Application Default Credentials. `gcloud auth application-default login`.

Usage:
    python scripts/restore-rotation-backup.py [--bucket NAME] [--project-id N]
                                              [--backup-dir PATH] [--dry-run]
                                              [--limit N] [--content-type TYPE]
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# Backup file names: "<taskId>_<rest>" where rest is the original GCS basename
# (e.g. "abc-uuid_image-1730123456.jpeg"). taskId is the integer primary key.
_NAME_RE = re.compile(r"^(?P<task_id>\d+)_(?P<rest>.+)$")


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--backup-dir",
        default=str(REPO_ROOT / ".rotation-backup"),
        help="Root containing per-project subdirectories (default: .rotation-backup)",
    )
    parser.add_argument(
        "--bucket",
        default=os.environ.get("BUCKET_NAME", "robopipe-staging-assets"),
        help="GCS bucket to restore into (default from BUCKET_NAME env var)",
    )
    parser.add_argument(
        "--project-id",
        type=int,
        default=None,
        help="Restrict restore to one project subdir; default = all subdirs that look like ids",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List the GCS targets that would be written, but upload nothing.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Process only the first N files (alphabetical) — for testing.",
    )
    parser.add_argument(
        "--content-type",
        default="image/jpeg",
        help="Content-Type to set on the uploaded blob (default: image/jpeg)",
    )
    parser.add_argument(
        "--failures-log",
        default=str(REPO_ROOT / "restore_failures.json"),
        help="Per-file outcome log (JSON)",
    )
    args = parser.parse_args()

    try:
        from google.cloud import storage  # noqa: F401
    except ImportError:
        print(
            "missing dependency: google-cloud-storage. "
            "Install with: pip install google-cloud-storage",
            file=sys.stderr,
        )
        return 2

    import json
    from google.cloud import storage

    backup_dir = Path(args.backup_dir).resolve()
    if not backup_dir.exists():
        print(f"backup dir not found: {backup_dir}", file=sys.stderr)
        return 2

    if args.project_id is not None:
        candidates = [backup_dir / str(args.project_id)]
    else:
        candidates = sorted(d for d in backup_dir.iterdir() if d.is_dir() and d.name.isdigit())

    project_dirs = [d for d in candidates if d.exists() and d.is_dir()]
    if not project_dirs:
        print(f"no project subdirectories found under {backup_dir}", file=sys.stderr)
        return 2

    # Pre-collect (project_id, file) tuples so --limit and progress reporting work
    # uniformly across multi-project restores.
    work: list[tuple[str, Path]] = []
    for d in project_dirs:
        for f in sorted(d.iterdir()):
            if f.is_file():
                work.append((d.name, f))

    if args.limit is not None:
        work = work[: args.limit]

    print(f"Bucket: {args.bucket}")
    print(f"Backup dir: {backup_dir}")
    print(f"Projects: {sorted({pid for pid, _ in work})}")
    print(f"Files to restore: {len(work)}")
    if args.dry_run:
        print("DRY RUN — no GCS writes.")

    storage_client = None if args.dry_run else storage.Client()
    bucket = None if args.dry_run else storage_client.bucket(args.bucket)

    results: list[dict] = []
    ok = err = 0

    for idx, (project_id, fpath) in enumerate(work, 1):
        m = _NAME_RE.match(fpath.name)
        if not m:
            results.append(
                {"file": str(fpath), "status": "error", "reason": "filename has no <taskId>_ prefix"}
            )
            err += 1
            continue

        object_path = f"{project_id}/assets/{m.group('rest')}"
        size = fpath.stat().st_size

        if args.dry_run:
            results.append(
                {
                    "file": str(fpath),
                    "status": "dry-run",
                    "object_path": object_path,
                    "size": size,
                    "task_id": int(m.group("task_id")),
                }
            )
            ok += 1
        else:
            try:
                blob = bucket.blob(object_path)
                blob.upload_from_filename(str(fpath), content_type=args.content_type)
                blob.make_public()
                results.append(
                    {
                        "file": str(fpath),
                        "status": "ok",
                        "object_path": object_path,
                        "size": size,
                        "task_id": int(m.group("task_id")),
                    }
                )
                ok += 1
            except Exception as e:
                results.append(
                    {
                        "file": str(fpath),
                        "status": "error",
                        "object_path": object_path,
                        "reason": f"{type(e).__name__}: {e}",
                    }
                )
                err += 1

        if idx % 25 == 0 or idx == len(work):
            print(f"  [{idx}/{len(work)}] ok={ok} errors={err}")

    Path(args.failures_log).write_text(json.dumps(results, indent=2))
    print()
    print(f"Done. uploaded={ok} errors={err}")
    print(f"Per-file log: {args.failures_log}")
    return 0 if err == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
