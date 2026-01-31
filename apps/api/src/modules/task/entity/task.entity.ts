import { TaskDetailSelect, TaskSelect } from "../../../repository/types/task";
import { TaskFileTypeEnum, TaskStatusEnum } from "@repo/schema";
import { RectangleAnnotationEntity } from "./rectangle-annotation.entity";
import { PolygonAnnotationEntity } from "./polygon-annotation.entity";
import { ClassificationAnnotationEntity } from "./classification-annotation.entity";
import { Task, TaskDetail } from "@repo/schema";

export class TaskEntity {
  readonly id: number;
  readonly projectId: number;
  readonly fileType: TaskFileTypeEnum;
  readonly filePath: string;
  readonly status: TaskStatusEnum;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(data: TaskSelect) {
    this.id = data.id;
    this.projectId = data.projectId;
    this.fileType = data.fileType;
    this.filePath = data.filePath;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt
  }

  public toResponse(): Task {
    return {
      id: this.id,
      fileType: this.fileType,
      filePath: this.filePath,
      status: this.status,
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
    super(data);
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
