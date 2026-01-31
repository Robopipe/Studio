import { Injectable, NotFoundException } from "@nestjs/common";
import { AssetsService } from "../../assets/services/assets.service";
import { TaskRepository } from "../../../repository/services/task-repository.service";
import { TaskFileTypeEnum, TaskStatusEnum } from "@repo/schema";
import { TaskDetailEntity, TaskEntity } from "../entity/task.entity";

@Injectable()
export class TaskService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly taskRepository: TaskRepository
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
    const task = await this.taskRepository.getByIdAndProjectId(id, projectId)
    if(!task){
      throw new NotFoundException("Task not found")
    }
    return task
  }

  /**
   * Get tasks by project ID
   * @param projectId
   * @returns Task entities
   */
  public async getTasks(projectId: number): Promise<TaskEntity[]>{
    return this.taskRepository.getAllByProjectId(projectId)
  }

  public async updateTask(projectId: number, id: number): Promise<void>{}
  public async deleteTask(projectId: number, id: number): Promise<void>{}
}
