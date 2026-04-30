export interface Detection {
  label: number;
  confidence: number;
}

export interface ClassificationDetection extends Detection {}

export interface BBDetection extends Detection {
  /* Bounding box coordinates: [xmin, ymin, xmax, ymax] */
  coords: [number, number, number, number];
}

export interface SegmentationDetection extends BBDetection {}

export type NNDetection =
  | ClassificationDetection
  | BBDetection
  | SegmentationDetection;

export type NNDetections = {
  detections: NNDetection[];
  /**
   * Legacy nested-int representation of the segmentation mask. Kept for
   * backward compatibility with older API builds; new builds emit
   * masks_png instead.
   */
  masks?: number[][];
  /**
   * Compact PNG-encoded segmentation mask, base64. Single-channel uint8
   * where pixel value 0 means background and N means detections[N - 1].
   * Decoded to maskBitmap on the client before being cached.
   */
  masks_png?: string;
  mask_width?: number;
  mask_height?: number;
  /**
   * DepthAI sequence number of the source frame. Stable per session, but
   * may be renumbered by parser nodes — prefer `ts_us` for matching.
   */
  seq?: number;
  /**
   * Source-frame device timestamp (microseconds since device boot).
   * Used as the join key against the timestamp burned into the WebRTC
   * video stream. Lower 32 bits match the burn-in payload.
   */
  ts_us?: number;
  /**
   * Transient client-side cache of the decoded PNG. Not on the wire.
   * Populated by the WS onmessage handler before being dispatched to
   * subscribers.
   */
  maskBitmap?: ImageBitmap;
};
