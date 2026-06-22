import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  PreAnnotateModelTypeEnum,
  PreAnnotateSettings,
  PreAnnotateSettingsBlob,
} from "@repo/schema";
import { ModelRepository } from "src/repository/services/model-repository.service";
import { ProjectPreAnnotateSettingsRepository } from "src/repository/services/project-pre-annotate-settings-repository.service";
import { assertModelUsableForPreAnnotation } from "../../predict/pre-annotate-model.validator";
import { PreAnnotateSettingsEntity } from "../entities/pre-annotate-settings.entity";

@Injectable()
export class PreAnnotateSettingsService {
  constructor(
    private readonly repo: ProjectPreAnnotateSettingsRepository,
    private readonly modelRepository: ModelRepository,
  ) {}

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

    if (modelId != null) {
      const model = await this.modelRepository.getByIdAndProjectId(modelId, projectId);
      if (!model) {
        throw new NotFoundException("model not found in this project");
      }
      try {
        assertModelUsableForPreAnnotation(model, modelType);
      } catch (e) {
        if (e instanceof BadRequestException) {
          throw new BadRequestException(
            `Cannot save pre-annotate settings: ${e.message}`,
          );
        }
        throw e;
      }
    }

    const row = await this.repo.upsert(projectId, modelType, {
      modelId: modelId ?? null,
      settings: blob as PreAnnotateSettingsBlob,
    });
    return new PreAnnotateSettingsEntity(row).toResponse();
  }
}
