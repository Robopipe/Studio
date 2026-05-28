export type RegionType = "bbox" | "polygon" | "class";

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
  apiId?: number;
  labelId: string;
  labelName: string;
  color: string;
  type: RegionType;
  bbox?: BBox;
  points?: [number, number][];
}

export type AtomicHistoryEntry =
  | { type: "add"; annotation: Annotation }
  | { type: "update"; annotation: Annotation; previousAnnotation: Annotation }
  | { type: "delete"; annotation: Annotation };

export type HistoryEntry =
  | AtomicHistoryEntry
  | { type: "batch"; label: "delete" | "paste" | "move" | "relabel"; children: AtomicHistoryEntry[] };
