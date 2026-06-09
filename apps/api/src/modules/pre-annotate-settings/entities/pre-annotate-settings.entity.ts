import type {
  PreAnnotateModelTypeEnum,
  PreAnnotateSettings,
} from "@repo/schema";
import type { ProjectPreAnnotateSettingsSelect } from "src/repository/types/project-pre-annotate-settings";

export class PreAnnotateSettingsEntity {
  readonly projectId: number;
  readonly modelType: PreAnnotateModelTypeEnum;
  readonly modelId: number | null;
  readonly settings: ProjectPreAnnotateSettingsSelect["settings"];

  constructor(data: ProjectPreAnnotateSettingsSelect) {
    this.projectId = data.projectId;
    this.modelType = data.modelType as PreAnnotateModelTypeEnum;
    this.modelId = data.modelId ?? null;
    this.settings = data.settings;
  }

  public toResponse(): PreAnnotateSettings {
    return {
      modelType: this.modelType,
      modelId: this.modelId,
      ...this.settings,
    } as PreAnnotateSettings;
  }
}
