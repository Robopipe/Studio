"""Resolve a tasks export JSON into a folder of locally-cached images.

Cache key is the URL's last path segment, so re-running the script only
re-downloads images whose filename isn't already present on disk.
"""

import json
import shutil
import ssl
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

import certifi

_SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())


def resolve_tasks(
    config_path: Path,
    cache_dir: Path,
    limit: int | None = None,
    workers: int = 8,
) -> list[Path]:
    cfg = json.loads(config_path.read_text())
    tasks = cfg.get("tasks", [])
    if not isinstance(tasks, list):
        raise ValueError(
            f"expected 'tasks' to be a list in {config_path}, got {type(tasks).__name__}"
        )
    if limit is not None:
        tasks = tasks[:limit]

    cache_dir.mkdir(parents=True, exist_ok=True)

    jobs: list[tuple[str, Path]] = []
    skipped_no_url = 0
    for t in tasks:
        url = t.get("filePath") if isinstance(t, dict) else None
        if not url:
            skipped_no_url += 1
            continue
        filename = Path(urlparse(url).path).name
        if not filename:
            skipped_no_url += 1
            continue
        jobs.append((url, cache_dir / filename))

    pending = [(u, p) for u, p in jobs if not p.exists()]
    print(
        f"[tasks] {len(jobs)} tasks ({skipped_no_url} skipped), "
        f"{len(jobs) - len(pending)} cached, {len(pending)} to download"
    )

    if pending:
        failed = 0
        done = 0
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(_download_one, u, p): (u, p) for u, p in pending}
            for fut in as_completed(futures):
                url, target = futures[fut]
                try:
                    fut.result()
                    done += 1
                except Exception as e:
                    failed += 1
                    print(f"[tasks] failed {target.name}: {e}", file=sys.stderr)
                if (done + failed) % 50 == 0 or (done + failed) == len(pending):
                    print(
                        f"[tasks] downloaded {done}/{len(pending)}"
                        + (f" ({failed} failed)" if failed else "")
                    )

    return sorted(p for _, p in jobs if p.exists())


def _download_one(url: str, target: Path) -> None:
    # Atomic write: stream to .part, then rename. A crash mid-download
    # leaves only the partial, so the next run retries this file cleanly.
    tmp = target.with_suffix(target.suffix + ".part")
    req = urllib.request.Request(url, headers={"User-Agent": "ml-infer/0.1"})
    with urllib.request.urlopen(req, timeout=60, context=_SSL_CONTEXT) as resp:
        if resp.status != 200:
            raise RuntimeError(f"HTTP {resp.status}")
        with open(tmp, "wb") as f:
            shutil.copyfileobj(resp, f)
    tmp.replace(target)
