import { Injectable } from "@nestjs/common";
import type {
  PreAnnotateModelTypeEnum,
  PreAnnotateSettings,
  PreAnnotateSettingsBlob,
} from "@repo/schema";
import { ProjectPreAnnotateSettingsRepository } from "src/repository/services/project-pre-annotate-settings-repository.service";
import { PreAnnotateSettingsEntity } from "../entities/pre-annotate-settings.entity";

@Injectable()
export class PreAnnotateSettingsService {
  constructor(private readonly repo: ProjectPreAnnotateSettingsRepository) {}

  public async get(
    projectId: number,
    modelType: PreAnnotateModelTypeEnum,
  ): Promise<PreAnnotateSettings | null> {
    const row = await this.repo.findByProjectAndType(projectId, modelType);
    return row ? new PreAnnotateSettingsEntity(row).toResponse() : null;
  }

  public async delete(
    projectId: number,
    modelType: PreAnnotateModelTypeEnum,
  ): Promise<void> {
    await this.repo.delete(projectId, modelType);
  }

  public async upsert(
    projectId: number,
    modelType: PreAnnotateModelTypeEnum,
    input: PreAnnotateSettings,
  ): Promise<PreAnnotateSettings> {
    const { modelId, modelType: _mt, ...blob } = input;
    const row = await this.repo.upsert(projectId, modelType, {
      modelId: modelId ?? null,
      settings: blob as PreAnnotateSettingsBlob,
    });
    return new PreAnnotateSettingsEntity(row).toResponse();
  }
}
