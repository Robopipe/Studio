import { Inject, Injectable } from "@nestjs/common";
import { AssetsService } from "../../assets/services/assets.service";
import { TaskRepository } from "../../../repository/services/task-repository.service";
import { TaskFileTypeEnum, TaskStatusEnum, ProjectTypeEnum } from "@repo/schema";
import { TaskDetailEntity, TaskEntity } from "../entity/task.entity";
import { TaskUpdateRequest } from "../dto/task.dto";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import type { DbConnection } from "../../../core/database/types/database.types";
import {
  classificationAnnotationTable,
  rectangleAnnotationTable,
  polygonAnnotationTable,
  taskTable,
} from "@repo/database";
import { eq } from "drizzle-orm";
import { ProjectRepository } from "../../../repository/services/project-repository.service";
import sharp from 'sharp'

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
  public async createTask(projectId: number, file: Express.Multer.File, iid?: string, capturedAt?: string): Promise<TaskEntity>{
    const assetMetadata = await sharp(file.buffer).metadata()
    const assetName = this.assetsService.getAssetName(file.originalname, projectId, 'asset')
    const thumbnailName = this.assetsService.getAssetName(file.originalname, projectId, 'thumbnail')

    const thumbnailBuffer = await sharp(file.buffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    const [filePublicUrl, thumbnailPublicUrl] = await Promise.all([
      this.assetsService.saveFile(file.buffer, file.mimetype, assetName),
      this.assetsService.saveFile(thumbnailBuffer, 'image/webp', thumbnailName),
    ])

    const taskData = {
      projectId,
      fileType: TaskFileTypeEnum.GS,
      filePath: filePublicUrl,
      thumbnailUrl: thumbnailPublicUrl,
      status: TaskStatusEnum.TODO,
      width: assetMetadata.width,
      height: assetMetadata.height,
      ...(capturedAt && { createdAt: new Date(capturedAt) }),
    }

    if (iid) {
      return this.taskRepository.create({ ...taskData, iid })
    }

    return this.taskRepository.createWithNextIid(projectId, taskData)
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
   * Get tasks by project ID with pagination
   * @param projectId
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @param deleted - true: only deleted, false: only non-deleted, null: both
   * @returns Paginated task entities
   */
  public async getTasks(projectId: number, page: number = 1, limit: number = 50, deleted: boolean | null = false, annotated?: boolean, order: "asc" | "desc" = "asc"): Promise<{ data: TaskEntity[]; total: number }>{
    const project = await this.projectRepository.getByIdOrThrow(projectId)
    return this.taskRepository.getAllByProjectIdPaginated(projectId, project.type, page, limit, deleted, annotated, order)
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
      const setStatusDone = async () => {
          await tx.update(taskTable).set({
            status: TaskStatusEnum.DONE,
          }).where(eq(taskTable.id, id))
      }

      const setStatusTodo = async() => {
        await tx
          .update(taskTable)
          .set({
            status: TaskStatusEnum.TODO,
          })
          .where(eq(taskTable.id, id));
      }

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
          await setStatusDone()
        } else if (data.reviewed) {
          await setStatusDone()
        } else {
          await setStatusTodo()
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
          await setStatusDone()
        } else if (data.reviewed) {
          await setStatusDone()
        } else {
          await setStatusTodo();
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
          await setStatusDone()
        } else if (data.reviewed) {
          await setStatusDone()
        } else {
          await setStatusTodo();
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
    const task = await this.taskRepository.getByIdAndProjectIdOrThrow(id, projectId)

    await this.taskRepository.delete(task.id)
  }
}
