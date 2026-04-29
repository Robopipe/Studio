import { Label } from "@repo/schema";
import {
  BBDetection,
  ClassificationDetection,
  NNDetection,
  NNDetections,
} from "../types/detections";

export type DetectionRenderer = (
  ctx: CanvasRenderingContext2D,
  labels: Label[],
  detection: NNDetection,
) => void;

const isBBDetection = (detection: NNDetection): detection is BBDetection => {
  return (detection as BBDetection).coords !== undefined;
};

const isClassificationDetection = (
  detection: NNDetection,
): detection is ClassificationDetection => {
  return !("coords" in detection) && !("points" in detection);
};

export const renderBBoxDetection: DetectionRenderer = (
  ctx,
  labels,
  detection,
) => {
  if (!isBBDetection(detection)) return;
  const label = labels[detection.label];
  if (!label) return;
  const [xmin, ymin, xmax, ymax] = detection.coords;
  const { width, height } = ctx.canvas;
  const [x, y, w, h] = [
    xmin * width,
    ymin * height,
    (xmax - xmin) * width,
    (ymax - ymin) * height,
  ];

  // render rectangle with semi-transparent fill
  ctx.strokeStyle = label.color;
  ctx.fillStyle = `${label.color}33`; // add alpha for transparency
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillRect(x, y, w, h);
  ctx.font = "14px Inter";
  ctx.fillStyle = label.color;
  const text = `${label.name} (${(detection.confidence * 100).toFixed(1)}%)`;
  const textWidth = ctx.measureText(text).width;
  const textHeight = 16; // approximate height
  ctx.fillRect(x, y - textHeight, textWidth + 4, textHeight);
  ctx.fillStyle = "#fff";
  ctx.fillText(text, x + 2, y - 4);
};

export const renderClassificationDetection: DetectionRenderer = (
  ctx,
  labels,
  detection,
) => {
  if (!isClassificationDetection(detection)) return;
  const label = labels[detection.label];
  if (!label) return;
  const text = `${label.name} (${(detection.confidence * 100).toFixed(1)}%)`;
  ctx.font = "16px Inter";
  ctx.fillStyle = label.color;
  ctx.fillText(text, 10, 20);
};

/**
 * Recolor a label-index buffer in place: pixel value 0 = background (alpha 0),
 * pixel value N = detections[N - 1]'s label color at ~53% alpha. The buffer
 * comes from either a decoded PNG ImageBitmap (R channel) or the legacy
 * nested int array, both unified here.
 */
const recolorMask = (
  data: Uint8ClampedArray,
  indexAt: (px: number) => number,
  pixels: number,
  labels: Label[],
  detections: NNDetections,
) => {
  for (let p = 0; p < pixels; p++) {
    const labelIdx = indexAt(p);
    if (labelIdx < 0) continue; // background
    const detLabel = detections.detections[labelIdx];
    if (!detLabel) continue;
    const label = labels[detLabel.label];
    if (!label) continue;
    const color = label.color;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const idx = p * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 0x88;
  }
};

const drawScaled = (
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
) => {
  const prevSmoothing = ctx.imageSmoothingEnabled;
  const prevQuality = ctx.imageSmoothingQuality;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.imageSmoothingEnabled = prevSmoothing;
  ctx.imageSmoothingQuality = prevQuality;
};

export const renderSegmentationMask = (
  ctx: CanvasRenderingContext2D,
  labels: Label[],
  detections: NNDetections,
) => {
  // Preferred path: PNG-encoded mask decoded to an ImageBitmap by the WS
  // handler. Pixel value 0 = background, N = detections[N - 1].
  const bmp = detections.maskBitmap;
  if (bmp) {
    const w = bmp.width;
    const h = bmp.height;
    const offscreen = document.createElement("canvas");
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    // Read mask indices from the bitmap. drawImage paints background pixels
    // as opaque (R=G=B=0, A=255) — so we must NOT reuse this buffer as the
    // output, or background regions cover the video with opaque black.
    offCtx.drawImage(bmp, 0, 0);
    const indexData = offCtx.getImageData(0, 0, w, h).data;

    // Write into a fresh, fully-transparent buffer. Background pixels stay
    // at alpha 0 so the WebRTC video shows through; only labeled pixels
    // get a translucent color.
    const out = offCtx.createImageData(w, h);
    recolorMask(
      out.data,
      (p) => indexData[p * 4] - 1,
      w * h,
      labels,
      detections,
    );
    offCtx.putImageData(out, 0, 0);
    drawScaled(ctx, offscreen);
    return;
  }

  // Legacy fallback for older API builds that still emit nested int arrays.
  const masks = detections.masks;
  if (!masks) return;
  const maskHeight = masks.length;
  const maskWidth = masks[0]?.length ?? 0;
  if (maskWidth === 0 || maskHeight === 0) return;

  const offscreen = document.createElement("canvas");
  offscreen.width = maskWidth;
  offscreen.height = maskHeight;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) return;
  const imageData = offCtx.createImageData(maskWidth, maskHeight);
  const data = imageData.data;
  recolorMask(
    data,
    (p) => masks[(p / maskWidth) | 0][p % maskWidth],
    maskWidth * maskHeight,
    labels,
    detections,
  );
  offCtx.putImageData(imageData, 0, 0);
  drawScaled(ctx, offscreen);
};
