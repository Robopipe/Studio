import { Inject, Injectable, Logger } from "@nestjs/common";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import type { DbConnection } from "../../../core/database/types/database.types";
import {
  TrainingBasePayload, TrainingPayload,
} from "../schema/training-external.schema";
import { ProjectRepository } from "../../../repository/services/project-repository.service";
import { ModelEntity } from "../../model/entity/model.entity";
import { TaskStatusEnum, ProjectTypeEnum } from "@repo/schema";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class TrainingExternalService {
  private readonly logger = new Logger(TrainingExternalService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly http: HttpService,
    private readonly projectRepository: ProjectRepository,
  ) {}


  /**
   * Train
   * @param model - Model entity
   */
  public async train(model: ModelEntity): Promise<void>{
    const trainingPayload = await this.getTrainingPayload(model)

    try {
      await this.http.axiosRef.post('/train', {
        body: trainingPayload
      })
    } catch(e){
      this.logger.error(`Failed starting training on machine learning service`, e)
      throw e
    }
  }

  /**
   * Get training payload for machine learning service
   * @param model - ModelEntity
   * @return TrainingPayload
   */
  private async getTrainingPayload(
    model: ModelEntity,
  ): Promise<TrainingPayload> {
    const project = await this.projectRepository.getByIdOrThrow(
      model.projectId,
    );

    const tasks = await this.db.query.taskTable.findMany({
      where: {
        projectId: model.projectId,
        status: TaskStatusEnum.DONE,
      },
      with: {
        classificationAnnotations: true,
        rectangleAnnotations: true,
        polygonAnnotations: true,
      },
    });

    const labelsIndexMap = model.labels.reduce(
      (acc: Record<number, number>, current, currentIndex) => {
        acc[current.id] = currentIndex;
        return acc;
      },
      {},
    );

    const basePayload: TrainingBasePayload = {
      id: model.id,
      training_config: {
        epochs: model.epochs,
        dataset_config: {
          dataset_split: [
            model.splitTrain,
            model.splitValidate,
            model.splitTest,
          ],
          labels: model.labels.map((_, index) => index),
        },
      },
    };

    switch (project.type){
      case ProjectTypeEnum.CLASSIFICATION: {
        const data = tasks.map((task) => ({
          file_url: task.filePath,
          width: task.width,
          height: task.height,
          labels: task.classificationAnnotations.map((annotation) => ({
            label: {
              label_number: labelsIndexMap[annotation.labelId],
            },
          })),
        }));

        return {
          ...basePayload,
          type: ProjectTypeEnum.CLASSIFICATION,
          data,
        };
      }
      case ProjectTypeEnum.SEGMENTATION: {
        const data = tasks.map((task) => ({
          file_url: task.filePath,
          width: task.width,
          height: task.height,
          labels: task.polygonAnnotations.map((annotation) => ({
            label: {
              label_number: labelsIndexMap[annotation.labelId],
            },
            points: annotation.value
          }))
        }))

        return {
          ...basePayload,
          type: ProjectTypeEnum.SEGMENTATION,
          data,
        };
      }
      case ProjectTypeEnum.DETECTION: {
        const data = tasks.map((task) => ({
          file_url: task.filePath,
          width: task.width,
          height: task.height,
          labels: task.rectangleAnnotations.map((annotation) => ({
            label: {
              label_number: labelsIndexMap[annotation.labelId],
            },
            x: annotation.x,
            y: annotation.y,
            width: annotation.width,
            height: annotation.height
          })),
        }));

        return {
          ...basePayload,
          type: ProjectTypeEnum.DETECTION,
          data,
        };
      }
    }
  }
}
