import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { modelTable } from '@repo/database';
import { and, asc, eq } from "drizzle-orm";
import { DB_CONNECTION } from 'src/core/database/database.constant';
import type { DbConnection } from 'src/core/database/types/database.types';
import { ModelEntity } from "../../modules/model/entity/model.entity";
import { ModelInsert, ModelUpdate } from "../types/model";

@Injectable()
export class ModelRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get all models by project id
   * @param projectId
   * @returns ModelEntity[]
   */
  public async getAllByProjectId(projectId: number): Promise<ModelEntity[]> {
    const models = await this.db.query.modelTable.findMany({
      where: {
        projectId,
        deletedAt: {
          isNull: true
        },
      },
      with: {
        labels: {
          orderBy: (l) => asc(l.id),
        },
        augmentations: true,
        preprocessings: true,
      },
      orderBy: (m) => asc(m.createdAt)
    });

    return Promise.all(models.map(async (model) => {
      const taskIds = await this.getVersionTaskIds(model.datasetVersionId);
      return new ModelEntity({ ...model, taskIds });
    }));
  }

  /**
   * Get by id
   * @param id
   * @returns ModelEntity or null if not found
   */
  public async getById(id: number): Promise<ModelEntity | null>{
    const foundModel = await this.db.query.modelTable.findFirst({
      where: {
        id,
      },
      with: {
        labels: {
          orderBy: (l) => asc(l.id),
        },
        augmentations: true,
        preprocessings: true,
      },
    });

    if (!foundModel) return null;
    const taskIds = await this.getVersionTaskIds(foundModel.datasetVersionId);
    return new ModelEntity({ ...foundModel, taskIds });
  }

  /**
   * Get model by ID and project ID
   * @param id
   * @param projectId
   * @returns ModelEntity or null if not found
   */
  public async getByIdAndProjectId(id: number, projectId: number): Promise<ModelEntity | null>{
    const foundModel = await this.db.query.modelTable.findFirst({
      where: {
        id,
        projectId
      },
      with: {
        labels: {
          orderBy: (l) => asc(l.id)
        },
        augmentations: true,
        preprocessings: true,
      }
    })

    if (!foundModel) return null;
    const taskIds = await this.getVersionTaskIds(foundModel.datasetVersionId);
    return new ModelEntity({ ...foundModel, taskIds });
  }

  /**
   * Create
   * @param data - ModelInsert
   * @throws InternalServerErrorException - Failed creating model
   */
  public async create(data: ModelInsert): Promise<ModelEntity> {
    const [createdModel] = await this.db.insert(modelTable).values(data).returning()

    if(!createdModel){
      throw new InternalServerErrorException("Failed creating model")
    }

    return new ModelEntity({...createdModel, labels: [], augmentations: [], preprocessings: [], taskIds: []})
  }


  /**
   * Update
   * @param id
   * @param data - ModelUpdate
   * @throws InternalServerErrorException - Failed updating model
   */
  public async update(id: number, data: ModelUpdate): Promise<ModelEntity>{
    const [updatedModel] = await this.db.update(modelTable).set(data).where(eq(modelTable.id, id)).returning()

    if(!updatedModel){
      throw new InternalServerErrorException("Failed updating model")
    }

    const modelLabels = await this.db.query.modelLabelTable.findMany({
      where: {
        modelId: id
      },
      with: {
        label: true
      },
      orderBy: (p) => asc(p.labelId)
    })
    const labels = modelLabels.map((modelLabel) => modelLabel.label).filter((l) => !!l)

    const augmentations = await this.db.query.modelAugmentationTable.findMany({
      where: { modelId: id },
    })

    const preprocessings = await this.db.query.modelPreprocessingTable.findMany({
      where: { modelId: id },
    })

    const taskIds = await this.getVersionTaskIds(updatedModel.datasetVersionId);

    return new ModelEntity({...updatedModel, labels, augmentations, preprocessings, taskIds})
  }

  /**
   * Check if model exists by ID and project ID
   * @param id
   * @param projectId
   * @return boolean
   */
  public async existsByIdAndProjectId(id: number, projectId: number): Promise<boolean>{
    const modelCount = await this.db.$count(modelTable, and(eq(modelTable.id, id), eq(modelTable.projectId, projectId)))
    return modelCount > 0
  }

  /**
   * Soft-Delete model
   * @param id
   */
  public async delete(id: number): Promise<void>{
    await this.db.update(modelTable).set({
      deletedAt: new Date()
    }).where(eq(modelTable.id, id))
  }

  /**
   * Get task IDs associated with a model's dataset version
   * @param datasetVersionId
   * @returns number[] of task IDs
   */
  private async getVersionTaskIds(datasetVersionId: number | null): Promise<number[]> {
    if (!datasetVersionId) return [];
    const rows = await this.db.query.datasetVersionTaskTable.findMany({
      where: { datasetVersionId },
    });
    return rows.map((row) => row.taskId);
  }
}
