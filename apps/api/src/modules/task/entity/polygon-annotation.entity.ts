import { ProjectLabelEntity } from "../../project/entities/project-label.entity";
import { PolygonAnnotationSelect } from "../../../repository/types/polygon-annotation";
import type { PolygonAnnotation } from "@repo/schema";

export class PolygonAnnotationEntity {
  readonly id: number;
  readonly taskId: number;
  readonly labelId: number;
  readonly value: [number, number][];
  readonly groupId: string | null;
  readonly label: ProjectLabelEntity;

  constructor(data: PolygonAnnotationSelect) {
    this.id = data.id;
    this.taskId = data.taskId;
    this.labelId = data.labelId;
    this.value = data.value;
    this.groupId = data.groupId ?? null;
    this.label = new ProjectLabelEntity(data.label);
  }

  public toResponse(): PolygonAnnotation {
    return {
      id: this.id,
      label: this.label.toResponse(),
      value: this.value,
      groupId: this.groupId,
    }
  }
}
