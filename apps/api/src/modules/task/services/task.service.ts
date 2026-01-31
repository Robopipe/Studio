import { Inject, Injectable } from "@nestjs/common";
import { AssetsService } from "../../assets/services/assets.service";
import { TaskRepository } from "../../../repository/services/task-repository.service";
import { TaskFileTypeEnum, TaskStatusEnum, ProjectTypeEnum } from "@repo/schema";
import { TaskDetailEntity, TaskEntity } from "../entity/task.entity";
import { TaskUpdateRequest } from "../dto/task.dto";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import type { DbConnection } from "../../../core/database/types/database.types";
import { classificationAnnotationTable, rectangleAnnotationTable, polygonAnnotationTable } from "@repo/database";
import { eq } from "drizzle-orm";
import { ProjectRepository } from "../../../repository/services/project-repository.service";

@Injectable()
export class TaskService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly assetsService: AssetsService,
    private readonly taskRepository: TaskRepository,
    private readonly projectRepository: ProjectRepository,
    ) {}

  /**
   * Create task from file upload
   * @param projectId
   * @param file - Express multer file
   * @returns Task Entity
   */
  public async createTask(projectId: number, file: Express.Multer.File): Promise<TaskEntity>{
    const assetName = this.assetsService.getAssetName(file.filename, projectId)
    const filePublicUrl = await this.assetsService.saveFile(file, assetName)

    return this.taskRepository.create({
      projectId,
      fileType: TaskFileTypeEnum.GS,
      filePath: filePublicUrl,
      status: TaskStatusEnum.TODO,
    })
  }

  /**
   * Get task
   * @param id
   * @param projectId
   * @returns TaskEntity
   */
  public async getTask(id: number, projectId: number): Promise<TaskDetailEntity>{
    return this.taskRepository.getByIdAndProjectIdOrThrow(id, projectId)
  }

  /**
   * Get tasks by project ID
   * @param projectId
   * @returns Task entities
   */
  public async getTasks(projectId: number): Promise<TaskEntity[]>{
    return this.taskRepository.getAllByProjectId(projectId)
  }

  /**
   * Update task annotations
   * @param id - task id
   * @param projectId
   * @param data - TaskUpdateRequest
   * @returns TaskDetailEntity
   */
  public async updateTask(id: number, projectId: number, data: TaskUpdateRequest): Promise<TaskDetailEntity>{
    const task = await this.taskRepository.getByIdAndProjectIdOrThrow(id, projectId);
    const project = await this.projectRepository.getByIdOrThrow(projectId)

    await this.db.transaction(async(tx) => {
      if(project.type === ProjectTypeEnum.SEGMENTATION){
        await tx.delete(polygonAnnotationTable).where(eq(polygonAnnotationTable.taskId, id))

        if(data.polygonAnnotations?.length){
          await tx.insert(polygonAnnotationTable).values(
            data.polygonAnnotations.map((annotation) => ({
              taskId: task.id,
              labelId: annotation.labelId,
              value: annotation.value
            })),
          );
        }

        return
      }

      if(project.type === ProjectTypeEnum.CLASSIFICATION){
        await tx.delete(classificationAnnotationTable).where(eq(classificationAnnotationTable.taskId, task.id))

        if(data.classificationAnnotations?.length){
          await tx.insert(classificationAnnotationTable).values(
            data.classificationAnnotations.map((annotation) => ({
              taskId: task.id,
              labelId: annotation.labelId,
            })),
          );
        }

        return
      }

      if(project.type === ProjectTypeEnum.DETECTION){
        await tx.delete(rectangleAnnotationTable).where(eq(rectangleAnnotationTable.taskId, id))

        if (data.rectangleAnnotations?.length) {
          await tx.insert(rectangleAnnotationTable).values(
            data.rectangleAnnotations.map((annotation) => ({
              taskId: task.id,
              labelId: annotation.labelId,
              x: annotation.x,
              y: annotation.y,
              width: annotation.width,
              height: annotation.height
            })),
          );
        }
      }
    })

    return this.getTask(id, projectId)
  }

  /**
   * Delete task
   * @param id
   * @param projectId
   * @throws NotFoundException - Task not found
   */
  public async deleteTask(id: number, projectId: number): Promise<void>{
    await this.taskRepository.getByIdAndProjectIdOrThrow(id, projectId)

    await this.taskRepository.delete(id)
  }
}
