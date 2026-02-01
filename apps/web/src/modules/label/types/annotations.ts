export type RegionType = "bbox" | "polygon";

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum ToolMode {
  SELECT = "SELECT",
  PAN = "PAN",
  DRAW_BBOX = "DRAW_BBOX",
  DRAW_POLYGON = "DRAW_POLYGON",
}

export interface Annotation {
  id: string;
  labelId: string;
  labelName: string;
  color: string;
  confidence: number;
  type: RegionType;
  bbox?: BBox;
  points?: [number, number][];
}

export interface HistoryEntry {
  type: "add" | "update" | "delete";
  annotation: Annotation;
  previousAnnotation?: Annotation;
}
