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
};
