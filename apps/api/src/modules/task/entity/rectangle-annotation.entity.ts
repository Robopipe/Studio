import { ProjectLabelEntity } from "../../project/entities/project-label.entity";
import { RectangleAnnotationSelect } from "../../../repository/types/rectangle-annotation";
import { RectangleAnnotation } from "@repo/schema";

export class RectangleAnnotationEntity {
  readonly id: number;
  readonly taskId: number;
  readonly labelId: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: ProjectLabelEntity;

  constructor(data: RectangleAnnotationSelect) {
    this.id = data.id;
    this.taskId = data.taskId;
    this.labelId = data.labelId;
    this.x = data.x;
    this.y = data.y;
    this.width = data.width;
    this.height = data.height;
    this.label = new ProjectLabelEntity(data.label);
  }

  public toResponse(): RectangleAnnotation {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      label: this.label.toResponse()
    }
  }
}
