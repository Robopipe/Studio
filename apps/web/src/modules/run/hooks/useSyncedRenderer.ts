import { useCameraStream } from "@/modules/camera-stream";
import { useGetModelQuery } from "@/modules/model/services";
import { RefObject, useEffect, useRef } from "react";
import {
  renderBBoxDetection,
  renderClassificationDetection,
  renderSegmentationMask,
} from "../utils/renderDetections";

export interface UseSyncedRendererOptions {
  projectId: number;
  modelId: number;
  enabled?: boolean;
}

export interface UseSyncedRendererReturn {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

/**
 * Renders matched (video frame, detections) pairs from the camera
 * stream's frame matcher to a canvas. Replaces the legacy combo of
 * `<video>` + overlay canvas for the inference view: this hook owns the
 * displayed surface entirely, so on-screen pixels and overlays always
 * come from the same source frame. Displayed FPS = inference FPS.
 *
 * Ownership: the matcher transfers `bitmap` and `detections.maskBitmap`
 * to this hook on each emit. Both are closed after the paint completes.
 */
export const useSyncedRenderer = ({
  projectId,
  modelId,
  enabled = true,
}: UseSyncedRendererOptions): UseSyncedRendererReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const { subscribeSyncedFrames } = useCameraStream();
  const { data: model } = useGetModelQuery(
    { projectId, modelId },
    { skip: !projectId || !modelId },
  );
  // Keep model in a ref so the subscriber callback always sees the
  // latest labels without re-subscribing (re-subscribing would tear down
  // and rebuild between frames as RTK Query data refreshes).
  const modelRef = useRef(model);
  modelRef.current = model;

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeSyncedFrames((synced) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        synced.bitmap.close();
        synced.detections.maskBitmap?.close?.();
        return;
      }

      const w = synced.bitmap.width;
      const h = synced.bitmap.height;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        synced.bitmap.close();
        synced.detections.maskBitmap?.close?.();
        return;
      }

      // Double-buffer through an offscreen canvas to avoid the visible
      // flash between clearing and drawing the next composition.
      if (!offscreenRef.current) {
        offscreenRef.current = document.createElement("canvas");
      }
      const offscreen = offscreenRef.current;
      if (offscreen.width !== w || offscreen.height !== h) {
        offscreen.width = w;
        offscreen.height = h;
      }
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) {
        synced.bitmap.close();
        synced.detections.maskBitmap?.close?.();
        return;
      }

      offCtx.drawImage(synced.bitmap, 0, 0);
      const labels = modelRef.current?.labels ?? [];
      renderSegmentationMask(offCtx, labels, synced.detections);
      for (const detection of synced.detections.detections) {
        if (detection.confidence < 0.5) continue;
        renderBBoxDetection(offCtx, labels, detection);
        renderClassificationDetection(offCtx, labels, detection);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offscreen, 0, 0);

      synced.bitmap.close();
      synced.detections.maskBitmap?.close?.();
    });

    return unsubscribe;
  }, [enabled, subscribeSyncedFrames]);

  return { canvasRef };
};
