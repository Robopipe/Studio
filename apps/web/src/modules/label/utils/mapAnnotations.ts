import { TaskDetail, CreateRectangleAnnotation, CreatePolygonAnnotation } from "@repo/schema";
import { Annotation } from "../types/annotations";

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
    });
  }

  return annotations;
}

export function annotationsToUpdatePayload(annotations: Annotation[]): {
  rectangleAnnotations: CreateRectangleAnnotation[];
  polygonAnnotations: CreatePolygonAnnotation[];
} {
  const rectangleAnnotations: CreateRectangleAnnotation[] = [];
  const polygonAnnotations: CreatePolygonAnnotation[] = [];

  for (const a of annotations) {
    const labelId = Number(a.labelId);
    if (a.type === "bbox" && a.bbox) {
      rectangleAnnotations.push({
        labelId,
        x: a.bbox.x,
        y: a.bbox.y,
        width: a.bbox.width,
        height: a.bbox.height,
      });
    } else if (a.type === "polygon" && a.points) {
      polygonAnnotations.push({
        labelId,
        value: a.points,
      });
    }
  }

  return { rectangleAnnotations, polygonAnnotations };
}
