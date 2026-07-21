import type { Project } from "@repo/schema";
import type { ProjectSelect } from "src/repository/types/project";

export class ProjectEntity {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly organizationId: number;
  readonly cameraApiUrl: string | null;
  readonly cameraMxid: string | null;
  readonly multipleDashboardConfigs: boolean;
  readonly hasLicense: boolean;
  readonly taskCount: number;
  readonly annotatedTaskCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(data: ProjectSelect) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.organizationId = data.organizationId;
    this.cameraApiUrl = data.cameraApiUrl;
    this.cameraMxid = data.cameraMxid;
    this.multipleDashboardConfigs = data.multipleDashboardConfigs;
    this.hasLicense = data.hasLicense;
    this.taskCount = data.taskCount ?? 0;
    this.annotatedTaskCount = data.annotatedTaskCount ?? 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
  }

  public toResponse(): Project {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      organizationId: this.organizationId,
      cameraApiUrl: this.cameraApiUrl,
      cameraMxid: this.cameraMxid,
      multipleDashboardConfigs: this.multipleDashboardConfigs,
      hasLicense: this.hasLicense,
      taskCount: this.taskCount,
      annotatedTaskCount: this.annotatedTaskCount,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    };
  }
}
