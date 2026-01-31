import { ClassificationAnnotationSelect } from "../../../repository/types/classification-annotation";
import { ProjectLabelEntity } from "../../project/entities/project-label.entity";
import type { ClassificationAnnotation } from "@repo/schema";

export class ClassificationAnnotationEntity {
  readonly id: number;
  readonly taskId: number;
  readonly labelId: number;
  readonly label: ProjectLabelEntity

  constructor(data: ClassificationAnnotationSelect) {
    this.id = data.id;
    this.taskId = data.taskId;
    this.labelId = data.labelId;
    this.label = new ProjectLabelEntity(data.label)
  }

  public toResponse(): ClassificationAnnotation {
    return {
      id: this.id,
      label: this.label.toResponse(),
    }
  }
}
