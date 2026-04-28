"""Offline ONNX/NN-archive → RVC4 .dlc conversion via Luxonis modelconverter.

We use this path (instead of HubAI's hosted convert) when the user has opted
into INT8 quantization, because modelconverter accepts a local directory of
calibration images — hubai-sdk only takes a predefined-domain string or an
already-uploaded `aid_*` dataset id.

Invoked via subprocess against the venv we install in the Dockerfile. SNPE's
host binaries need its `envsetup.sh` to set up `LD_LIBRARY_PATH` / `PATH` /
`PYTHONPATH`, so we wrap the call in `bash -c "source envsetup.sh && exec ..."`.
"""

import os
import random
import shutil
import subprocess
from pathlib import Path


def _bin() -> str:
    """Path to the modelconverter CLI in its dedicated venv (set by Dockerfile)."""
    return os.environ.get(
        "ROBOPIPE_MODELCONVERTER_BIN",
        "/opt/modelconverter-venv/bin/modelconverter",
    )


def _snpe_root() -> str:
    return os.environ.get("ROBOPIPE_SNPE_ROOT", "/opt/snpe")


def convert_rvc4_int8(
    archive_path: str,
    output_dir: str,
    calibration_dir: str,
    quantization_mode: str = "INT8_STANDARD",
) -> str:
    """Run modelconverter to produce an INT8-quantized RVC4 NN archive.

    Args:
      archive_path:    Path to the tools-produced NN archive (.tar.xz) from
                       _export_via_tools(). Modelconverter detects archives
                       automatically and preserves their `heads` metadata.
      output_dir:      Local directory to write the converted artifact into.
      calibration_dir: Local directory of representative calibration images
                       (JPG/PNG). Modelconverter resizes/normalizes them to
                       match the model's input config — no manifest needed.
      quantization_mode: One of INT8_STANDARD, INT8_ACCURACY_FOCUSED,
                       INT8_INT16_MIXED, INT8_INT16_MIXED_ACCURACY_FOCUSED.

    Returns:
      Path to the produced converted artifact (NN archive `.tar.xz`).

    Raises:
      RuntimeError on subprocess non-zero exit or missing output file.
    """
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    snpe_envsetup = f"{_snpe_root()}/bin/envsetup.sh"
    if not Path(snpe_envsetup).is_file():
        raise RuntimeError(
            f"SNPE envsetup not found at {snpe_envsetup}; image is missing the "
            "modelconverter install layer."
        )

    # Cyclopts dotted-key overrides ride after --path/--output-dir. We ask for
    # an NN archive output (`--to nn_archive`) so the camera-side parsers find
    # the heads block tools generated, the same way the HubAI path delivers it.
    converter_argv = [
        _bin(),
        "convert",
        "rvc4",
        "--path",
        archive_path,
        "--output-dir",
        str(out_path),
        "--to",
        "nn_archive",
        f"calibration.path",
        calibration_dir,
        f"rvc4.quantization_mode",
        quantization_mode,
    ]

    # Wrap in bash to source envsetup.sh before exec'ing the CLI. The
    # `_ "$@"` pattern keeps the args properly quoted instead of relying on
    # string interpolation.
    cmd = [
        "bash",
        "-c",
        f'set -e; source "{snpe_envsetup}" >/dev/null; exec "$@"',
        "_",
        *converter_argv,
    ]
    print(f"[ml-yolo] modelconverter cmd: {' '.join(converter_argv)}")

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.stdout:
        print(f"[ml-yolo] modelconverter stdout:\n{result.stdout}")
    if result.stderr:
        print(f"[ml-yolo] modelconverter stderr:\n{result.stderr}")
    if result.returncode != 0:
        raise RuntimeError(
            f"modelconverter convert rvc4 failed (exit {result.returncode})"
        )

    # modelconverter writes its NN archive output into output_dir. Pick the
    # newest .tar.xz so we don't accidentally pick up a stale artifact from
    # a re-run sharing the same dir (we always pass a fresh dir, but be
    # explicit anyway).
    archives = sorted(
        out_path.rglob("*.tar.xz"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not archives:
        produced = sorted(p.name for p in out_path.iterdir() if p.is_file())
        raise RuntimeError(
            f"modelconverter produced no NN archive in {out_path}. "
            f"Found: {produced}"
        )
    return str(archives[0])


def sample_calibration_images(
    train_image_dir: str,
    out_dir: str,
    max_images: int = 400,
) -> int:
    """Copy up to `max_images` images from the training split into `out_dir`.

    Reuses the YOLO-format dataset that `prepare_dataset()` already laid out
    on disk, so the calibration distribution matches inference exactly. We
    randomize the pick (mirroring how dataset.py shuffles for the train/val/
    test split) so calibration sees a representative slice rather than e.g.
    the first 200 images sorted by filename / capture time, which can be
    distributionally narrow.

    Returns the number of images copied.
    """
    src = Path(train_image_dir)
    dst = Path(out_dir)
    dst.mkdir(parents=True, exist_ok=True)

    # Recurse so this works for both layouts that prepare_dataset() creates:
    #   detection/segmentation: <root>/<file>.jpg (flat)
    #   classification:         <root>/<label_idx>/<file>.jpg (one level deep)
    images = []
    for ext in ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"):
        images.extend(src.rglob(ext))
    # Sort first so the seeded shuffle is reproducible across runs that
    # iterate the filesystem in a different order.
    images.sort()
    random.shuffle(images)
    images = images[:max_images]

    for img in images:
        shutil.copy(img, dst / img.name)
    return len(images)
