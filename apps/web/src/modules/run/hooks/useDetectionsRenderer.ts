import { useGetModelQuery } from "@/modules/model/services";
import { RefObject, useCallback, useEffect, useRef } from "react";
import { NNDetections } from "../types/detections";
import {
  renderBBoxDetection,
  renderClassificationDetection,
  renderSegmentationMask,
} from "../utils/renderDetections";

export interface UseDetectionsRendererOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  projectId: number;
  modelId: number;
  enabled?: boolean;
}

export interface UseDetectionsRendererReturn {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  renderDetections: (detections: NNDetections) => void;
}

export const useDetectionsRenderer = ({
  videoRef,
  projectId,
  modelId,
  enabled = true,
}: UseDetectionsRendererOptions): UseDetectionsRendererReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const { data } = useGetModelQuery(
    { projectId, modelId },
    { skip: !projectId || !modelId },
  );

  const getOffscreenCanvas = useCallback(
    (width: number, height: number): HTMLCanvasElement => {
      if (!offscreenRef.current) {
        offscreenRef.current = document.createElement("canvas");
      }
      const offscreen = offscreenRef.current;
      if (offscreen.width !== width || offscreen.height !== height) {
        offscreen.width = width;
        offscreen.height = height;
      }
      return offscreen;
    },
    [],
  );

  const renderDetections = useCallback(
    async (detections: NNDetections) => {
      if (!canvasRef.current || !videoRef.current || !enabled) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Double-buffer: draw to offscreen canvas first, then swap in one draw call to avoid flickering
      const offscreen = getOffscreenCanvas(canvas.width, canvas.height);
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
      renderSegmentationMask(offCtx, data?.labels || [], detections);
      for (const detection of detections.detections) {
        if (detection.confidence < 0.5) continue;
        renderBBoxDetection(offCtx, data?.labels || [], detection);
        renderClassificationDetection(offCtx, data?.labels || [], detection);
      }

      // Single
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offscreen, 0, 0);
    },
    [data, getOffscreenCanvas, enabled],
  );

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !enabled) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const syncCanvasSize = () => {
      const [elW, elH] = [video.clientWidth, video.clientHeight];
      const [mediaW, mediaH] = [video.videoWidth, video.videoHeight];
      const mediaAR = mediaW / mediaH;
      const elAR = elW / elH;
      let renderW, renderH;

      if (mediaAR > elAR) {
        renderW = elW;
        renderH = elW / mediaAR;
      } else {
        renderH = elH;
        renderW = elH * mediaAR;
      }
      canvas.width = renderW;
      canvas.height = renderH;
    };
    syncCanvasSize();
    window.addEventListener("resize", syncCanvasSize);
    video.addEventListener("loadedmetadata", syncCanvasSize);

    return () => {
      window.removeEventListener("resize", syncCanvasSize);
      video.removeEventListener("loadedmetadata", syncCanvasSize);
    };
  }, [videoRef.current, canvasRef.current, enabled]);

  return { canvasRef, renderDetections };
};
