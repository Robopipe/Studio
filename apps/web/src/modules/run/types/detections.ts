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
  masks?: number[][];
  /**
   * DepthAI sequence number of the inference. Set by the API on the live
   * detection WS for client-side seq-based pairing with the WebRTC video
   * track. Optional because legacy clients / replay-from-file scenarios may
   * surface detections without one.
   */
  seq?: number;
};
