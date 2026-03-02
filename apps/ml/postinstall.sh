#!/usr/bin/env bash
# Applies patches to installed Python dependencies.
# Run this after `pip install -r requirements.txt`.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATCHES_DIR="$SCRIPT_DIR/patches"
SITE_PACKAGES="$(python -c 'import site; print(site.getsitepackages()[0])')"

echo "Applying patches to site-packages at: $SITE_PACKAGES"

for patch_file in "$PATCHES_DIR"/*.patch; do
  [ -f "$patch_file" ] || continue
  echo "Applying patch: $(basename "$patch_file")"
  patch -p1 --forward --directory="$SITE_PACKAGES" < "$patch_file" || {
    echo "Patch $(basename "$patch_file") already applied or failed, skipping."
  }
done

echo "All patches applied."
