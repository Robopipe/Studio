import { ProjectLabelSelect } from "../../../repository/types/project-label";
import type { Label } from "@repo/schema";

export class ProjectLabelEntity {
  readonly id: number;
  readonly title: string;
  readonly name: string;
  readonly color: string;
  readonly projectId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(data: ProjectLabelSelect) {
    this.id = data.id;
    this.title = data.title;
    this.name = data.name;
    this.color = data.color;
    this.projectId = data.projectId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt
  }

  public toResponse(): Label {
    return {
      id: this.id,
      title: this.title,
      name: this.name,
      color: this.color,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null
    }
  }
}
