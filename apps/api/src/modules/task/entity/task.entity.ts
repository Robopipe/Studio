import { TaskDetailSelect, TaskSelect } from "../../../repository/types/task";
import { TaskFileTypeEnum, TaskStatusEnum } from "@repo/schema";
import { RectangleAnnotationEntity } from "./rectangle-annotation.entity";
import { PolygonAnnotationEntity } from "./polygon-annotation.entity";
import { ClassificationAnnotationEntity } from "./classification-annotation.entity";
import { Task, TaskDetail } from "@repo/schema";

export class TaskEntity {
  readonly id: number;
  readonly iid: string;
  readonly projectId: number;
  readonly fileType: TaskFileTypeEnum;
  readonly filePath: string;
  readonly thumbnailUrl: string;
  readonly width: number;
  readonly height: number;
  readonly status: TaskStatusEnum;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly annotationCount: number;
  readonly updatedBy: number | null;
  readonly meanConfidence: number | null;
  readonly meanIou: number | null;
  readonly precision: number | null;
  readonly recall: number | null;
  readonly sourceDashboardId: number | null;
  readonly sourceEventId: number | null;
  readonly sourceTaskId: number | null;

  constructor(data: TaskSelect) {
    this.id = data.id;
    this.iid = data.iid;
    this.projectId = data.projectId;
    this.fileType = data.fileType;
    this.filePath = data.filePath;
    this.thumbnailUrl = data.thumbnailUrl;
    this.status = data.status;
    this.width = data.width;
    this.height = data.height;
    this.annotationCount = data.annotationCount;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
    this.updatedBy = data.updatedBy ?? null;
    this.meanConfidence = data.meanConfidence ?? null;
    this.meanIou = data.meanIou ?? null;
    this.precision = data.precision ?? null;
    this.recall = data.recall ?? null;
    this.sourceDashboardId = data.sourceDashboardId ?? null;
    this.sourceEventId = data.sourceEventId ?? null;
    this.sourceTaskId = data.sourceTaskId ?? null;
  }

  public toResponse(): Task {
    return {
      id: this.id,
      iid: this.iid,
      fileType: this.fileType,
      filePath: this.filePath,
      thumbnailUrl: this.thumbnailUrl,
      status: this.status,
      width: this.width,
      height: this.height,
      annotationCount: this.annotationCount,
      updatedBy: this.updatedBy,
      meanConfidence: this.meanConfidence,
      meanIou: this.meanIou,
      precision: this.precision,
      recall: this.recall,
      sourceDashboardId: this.sourceDashboardId,
      sourceEventId: this.sourceEventId,
      sourceTaskId: this.sourceTaskId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    }
  }
}

export class TaskDetailEntity extends TaskEntity {
  readonly rectangleAnnotations: RectangleAnnotationEntity[];
  readonly polygonAnnotations: PolygonAnnotationEntity[];
  readonly classificationAnnotations: ClassificationAnnotationEntity[];

  constructor(data: TaskDetailSelect) {
    const annotationCount = data.rectangleAnnotations.length + data.polygonAnnotations.length + data.classificationAnnotations.length
    super({...data, annotationCount});

    this.rectangleAnnotations = data.rectangleAnnotations.map((rA) => new RectangleAnnotationEntity(rA))
    this.polygonAnnotations = data.polygonAnnotations.map(
      (pA) => new PolygonAnnotationEntity(pA),
    );
    this.classificationAnnotations = data.classificationAnnotations.map(
      (cA) => new ClassificationAnnotationEntity(cA),
    );
  }

  public toDetailResponse(): TaskDetail{
    return {
      ...this.toResponse(),
      rectangleAnnotations: this.rectangleAnnotations.map((rA) => rA.toResponse()),
      polygonAnnotations: this.polygonAnnotations.map((pA) => pA.toResponse()),
      classificationAnnotations: this.classificationAnnotations.map((cA) => cA.toResponse())
    }
  }
}
