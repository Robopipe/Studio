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
