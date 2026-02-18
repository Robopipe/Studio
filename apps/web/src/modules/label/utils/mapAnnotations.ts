import { TaskDetail, CreateRectangleAnnotation, CreatePolygonAnnotation, CreateClassificationAnnotation } from "@repo/schema";
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

  return annotations;
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
    } else if (a.type === "class" && a.labelId) {
      classificationAnnotations.push({
        labelId,
      });
    }
  }

  return { rectangleAnnotations, polygonAnnotations, classificationAnnotations };
}
