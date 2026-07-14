import { ConfidenceReportRegionResponse, TaskDetail, CreateRectangleAnnotation, CreatePolygonAnnotation, CreateClassificationAnnotation } from "@repo/schema";
import { Annotation } from "../types/annotations";
import { normalizeGroupOrder } from "./groupAnnotations";

export function taskDetailToAnnotations(detail: TaskDetail): Annotation[] {
  const annotations: Annotation[] = [];

  for (const rect of detail.rectangleAnnotations ?? []) {
    annotations.push({
      id: String(rect.id),
      apiId: rect.id,
      labelId: String(rect.label.id),
      labelName: rect.label.name,
      color: rect.label.color,
      type: "bbox",
      bbox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      groupId: rect.groupId ?? null,
    });
  }

  for (const poly of detail.polygonAnnotations ?? []) {
    annotations.push({
      id: String(poly.id),
      apiId: poly.id,
      labelId: String(poly.label.id),
      labelName: poly.label.name,
      color: poly.label.color,
      type: "polygon",
      points: poly.value,
      groupId: poly.groupId ?? null,
    });
  }

  for (const cls of detail.classificationAnnotations ?? []) {
    annotations.push({
      id: String(cls.id),
      apiId: cls.id,
      labelId: String(cls.label.id),
      labelName: cls.label.name,
      color: cls.label.color,
      type: "class",
    });
  }

  // Ensure group members are always contiguous in the local array regardless
  // of the order the server returns rows in (no order column exists in the DB).
  // This keeps the rest of the editing logic (drag-reorder, makeGroupContiguous)
  // consistent and prevents the sidebar from fracturing a group into singletons.
  return normalizeGroupOrder(annotations);
}

/** Prefix distinguishing inferred-region annotation ids from real annotation ids. */
export const INFERRED_ID_PREFIX = "inferred-";

/** Canvas annotation id for an inferred confidence-report region. */
export const inferredAnnotationId = (regionId: number) =>
  `${INFERRED_ID_PREFIX}${regionId}`;

/**
 * Convert inferred regions from a confidence report into the `Annotation` shape
 * used by the canvas and sidebar. These are read-only display-only annotations:
 * - `id` uses an `inferred-` prefix to avoid collisions with real annotation ids.
 * - `apiId` is left undefined so they are never sent in a save payload.
 * - `inferred = true` and `score` are set for canvas styling.
 */
export function regionsToAnnotations(
  regions: ConfidenceReportRegionResponse[],
): Annotation[] {
  return regions.map((r, i): Annotation => {
    const base: Annotation = {
      id: inferredAnnotationId(r.id),
      labelId: String(r.label.id),
      labelName: r.label.name,
      color: r.label.color,
      type: r.geometry === "RECTANGLE" ? "bbox" : "polygon",
      score: r.score,
      inferred: true,
      displayId: i + 1,
    };
    if (r.geometry === "RECTANGLE" && r.x != null && r.y != null && r.width != null && r.height != null) {
      base.bbox = { x: r.x, y: r.y, width: r.width, height: r.height };
    } else if (r.geometry === "POLYGON" && r.value) {
      base.points = r.value as [number, number][];
    }
    return base;
  });
}

/**
 * Bounding-box view of a polygon annotation — mirrors how the confidence-report
 * job evaluates polygon GT against a detection model (each polygon becomes its
 * vertex bounding box; polygons with fewer than 3 points are not evaluated).
 * Non-polygon annotations pass through unchanged.
 */
export function polygonAnnotationToBbox(a: Annotation): Annotation {
  if (a.type !== "polygon" || !a.points || a.points.length < 3) return a;
  const xs = a.points.map((p) => p[0]);
  const ys = a.points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    ...a,
    type: "bbox",
    bbox: { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y },
    points: undefined,
  };
}

export function annotationsToUpdatePayload(annotations: Annotation[]): {
  rectangleAnnotations: CreateRectangleAnnotation[];
  polygonAnnotations: CreatePolygonAnnotation[];
  classificationAnnotations: CreateClassificationAnnotation[];
} {
  const rectangleAnnotations: CreateRectangleAnnotation[] = [];
  const polygonAnnotations: CreatePolygonAnnotation[] = [];
  const classificationAnnotations: CreateClassificationAnnotation[] = [];

  for (const a of annotations) {
    const labelId = Number(a.labelId);
    if (a.type === "bbox" && a.bbox) {
      rectangleAnnotations.push({
        ...(a.apiId != null && { id: a.apiId }),
        labelId,
        x: a.bbox.x,
        y: a.bbox.y,
        width: a.bbox.width,
        height: a.bbox.height,
        ...(a.groupId != null && { groupId: a.groupId }),
      });
    } else if (a.type === "polygon" && a.points) {
      polygonAnnotations.push({
        ...(a.apiId != null && { id: a.apiId }),
        labelId,
        value: a.points,
        ...(a.groupId != null && { groupId: a.groupId }),
      });
    } else if (a.type === "class" && a.labelId) {
      classificationAnnotations.push({
        ...(a.apiId != null && { id: a.apiId }),
        labelId,
      });
    }
  }

  return { rectangleAnnotations, polygonAnnotations, classificationAnnotations };
}
