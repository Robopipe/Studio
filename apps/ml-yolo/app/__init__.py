# Restore onnx.helper.float32_to_bfloat16 — removed in onnx 1.17 but still
# referenced by onnx_graphsurgeon (transitively pulled by hubai-sdk's RVC4
# converter). Without this, any code path that imports the symbol blows up
# at import time after a successful training run, killing the conversion
# step. Mirrors the patch ultralytics ships in its TF export path
# (utils/export/tensorflow.py) but applied at app init so it covers our
# ONNX-only workflow too.
#
# Must run before any submodule imports onnx-touching code. Keeping it in
# app/__init__.py ensures both the Cloud Batch entrypoint (app.job) and
# the local FastAPI server (app.main) get the patch.
import onnx.helper as _onnx_helper

if not hasattr(_onnx_helper, "float32_to_bfloat16"):
    import struct

    def _float32_to_bfloat16(fval):
        ival = struct.unpack("=I", struct.pack("=f", float(fval)))[0]
        return ival >> 16

    _onnx_helper.float32_to_bfloat16 = _float32_to_bfloat16
