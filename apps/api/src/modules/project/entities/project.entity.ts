import type { Project, ProjectTypeEnum } from "@repo/schema";
import type { ProjectSelect } from "src/repository/types/project";

export class ProjectEntity {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly organizationId: number;
  readonly type: ProjectTypeEnum;
  readonly cameraApiUrl: string | null;
  readonly multipleDashboardConfigs: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(data: ProjectSelect) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.organizationId = data.organizationId;
    this.cameraApiUrl = data.cameraApiUrl;
    this.multipleDashboardConfigs = data.multipleDashboardConfigs;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
  }

  public toResponse(): Project {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      organizationId: this.organizationId,
      cameraApiUrl: this.cameraApiUrl,
      multipleDashboardConfigs: this.multipleDashboardConfigs,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    };
  }
}
