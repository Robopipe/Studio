#!/usr/bin/env python3
"""Pre-download training images to a local cache, rewriting config file_urls.

Usage:
    # Native venv (default): rewrites file_url to absolute host paths
    python scripts/cache-training-images.py <input_config.json> [output_config.json]

    # Docker container: rewrites file_url to /app/training-cache/images/<file>
    python scripts/cache-training-images.py --docker <input_config.json>

Reads a full ml-yolo training config, downloads every `data[].file_url` that
points at http(s) to .training-cache/images/ (relative to the repo root), and
writes a new config whose file_urls point at the cached copies.

Safe to re-run — skips files already on disk. The training service's
`prepare_dataset()` then uses `shutil.copy()` instead of `requests.get()`,
eliminating the per-run GCS download.
"""

import argparse
import json
import os
import ssl
import sys
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

REPO_ROOT = Path(__file__).resolve().parent.parent
HOST_CACHE_DIR = REPO_ROOT / ".training-cache" / "images"
CONTAINER_CACHE_DIR = "/app/training-cache/images"


def _ssl_context(insecure: bool) -> ssl.SSLContext:
    """Build an SSL context. macOS's brew Python doesn't bundle CA certs, so
    stdlib's default context fails cert verification. Use certifi if available
    (installed in the apps/ml-yolo venv); fall back to unverified with a loud
    warning (safe here — we're pulling public GCS URLs)."""
    if insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    try:
        import certifi  # type: ignore[import-not-found]

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        print(
            "WARNING: certifi not installed — disabling SSL verification for GCS "
            "downloads. This is acceptable for public GCS URLs but not ideal. "
            "Install certifi (`pip install certifi`) or run from the ml-yolo "
            "venv to enable cert verification.",
            file=sys.stderr,
        )
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx


def extract_filename(url: str) -> str:
    """Return the URL's path basename (strips query params). Robopipe signed
    GCS URLs embed a uuid_uuid_image-<ts>.jpeg pattern, so collisions are
    negligible in practice."""
    name = os.path.basename(urlparse(url).path)
    if not name:
        raise ValueError(f"URL has no filename component: {url}")
    return name


def download_if_missing(url: str, dest: Path, ssl_ctx: ssl.SSLContext) -> bool:
    """Download url → dest unless already cached. Returns True if downloaded."""
    if dest.exists() and dest.stat().st_size > 0:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".partial")
    try:
        req = Request(url, headers={"User-Agent": "robopipe-cache-training-images/1"})
        with urlopen(req, timeout=60, context=ssl_ctx) as resp, tmp.open("wb") as f:
            while True:
                chunk = resp.read(64 * 1024)
                if not chunk:
                    break
                f.write(chunk)
        tmp.rename(dest)
    except BaseException:
        tmp.unlink(missing_ok=True)
        raise
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="Input training config JSON")
    parser.add_argument(
        "output",
        nargs="?",
        help="Output config JSON (default: <input stem>.cached.json alongside input)",
    )
    parser.add_argument(
        "--docker",
        action="store_true",
        help="Rewrite file_url with container-visible /app/training-cache/images/<file> "
        "paths (requires the docker-compose bind mount). Default: absolute host paths "
        "for native venv runs.",
    )
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Skip SSL certificate verification. Use if certifi is unavailable and "
        "you're on brew-installed macOS Python; GCS assets are public so the risk "
        "is low.",
    )
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    if not input_path.exists():
        print(f"Input not found: {input_path}", file=sys.stderr)
        return 1

    output_path = (
        Path(args.output).resolve()
        if args.output
        else input_path.with_name(input_path.stem + ".cached.json")
    )

    with input_path.open() as f:
        cfg = json.load(f)

    data = cfg.get("data", [])
    total = len(data)
    if total == 0:
        print("No data[] entries to cache — writing unchanged config")
        with output_path.open("w") as f:
            json.dump(cfg, f, indent=2)
        return 0

    HOST_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path_style = f"{CONTAINER_CACHE_DIR}/<file>" if args.docker else f"{HOST_CACHE_DIR}/<file>"
    print(f"Cache dir: {HOST_CACHE_DIR}")
    print(f"Rewriting {total} data[].file_url entries to {path_style}")

    ssl_ctx = _ssl_context(args.insecure)

    downloaded = 0
    cached = 0
    skipped_local = 0
    errors: list[tuple[int, str]] = []

    for idx, entry in enumerate(data):
        url = entry.get("file_url", "")
        if not url.startswith(("http://", "https://")):
            skipped_local += 1
            continue

        try:
            filename = extract_filename(url)
        except ValueError as e:
            errors.append((idx, str(e)))
            continue

        host_path = HOST_CACHE_DIR / filename
        try:
            did_download = download_if_missing(url, host_path, ssl_ctx)
        except (HTTPError, URLError, TimeoutError, OSError) as e:
            errors.append((idx, f"{filename}: {e}"))
            continue

        if did_download:
            downloaded += 1
        else:
            cached += 1

        entry["file_url"] = (
            f"{CONTAINER_CACHE_DIR}/{filename}" if args.docker else str(host_path)
        )

        if (idx + 1) % 50 == 0 or (idx + 1) == total:
            print(f"  [{idx + 1}/{total}] downloaded={downloaded} cached={cached}")

    with output_path.open("w") as f:
        json.dump(cfg, f, indent=2)

    print()
    print(f"Downloaded: {downloaded}")
    print(f"Already cached: {cached}")
    if skipped_local:
        print(f"Already local (unchanged): {skipped_local}")
    if errors:
        print(f"Errors: {len(errors)}")
        for idx, msg in errors[:10]:
            print(f"  data[{idx}]: {msg}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more")
    print(f"Rewritten config: {output_path}")
    return 0 if not errors else 2


if __name__ == "__main__":
    sys.exit(main())
