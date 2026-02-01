import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { taskTable, rectangleAnnotationTable, polygonAnnotationTable, classificationAnnotationTable } from "@repo/database/schema";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import { TaskDetailEntity, TaskEntity } from "../../modules/task/entity/task.entity";
import { TaskInsert } from "../types/task";
import { eq } from "drizzle-orm";
import { ProjectTypeEnum } from "@repo/schema";

@Injectable()
export class TaskRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get task by ID and project ID
   * @param id
   * @param projectId
   * @returns TaskEntity
   */
  public async getByIdAndProjectId(id: number, projectId: number): Promise<TaskDetailEntity | null> {
    const foundTask = await this.db.query.taskTable.findFirst({
      where: {
        id,
        projectId,
        deletedAt: {
          isNull: true
        }
      },
      with: {
        rectangleAnnotations: {
          with: {
            label: true,
          }
        },
        polygonAnnotations: {
          with: {
            label: true
          }
        },
        classificationAnnotations: {
          with: {
            label: true
          }
        }
      }
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return foundTask ? new TaskDetailEntity(foundTask) : null;
  }

  /**
   *Get task by ID and project id or throw
   * @param id
   * @param projectId
   * @throws NotFoundException - Task not found
   * @returns TaskDetailEntity
   */
  public async getByIdAndProjectIdOrThrow(id: number, projectId: number): Promise<TaskDetailEntity> {
    const task = await this.getByIdAndProjectId(id, projectId);
    if(!task){
      throw new NotFoundException('Task not found');
    }

    return task
  }

  /**
   * Create task
   * @param data - TaskInsert
   * @throws - InternalServerErrorException - Failed creating task
   * @returns TaskEntity
   */
  public async create(data: TaskInsert): Promise<TaskEntity> {
    const [createdTask] = await this.db.insert(taskTable).values(data).returning()
    if(!createdTask){
      throw new InternalServerErrorException("Failed creating task")
    }

    return new TaskEntity(createdTask)
  }


  /**
   * Get all tasks by project ID
   * @param projectId
   * @param projectType - Project type enum for relations
   * @returns TaskEntity[]
   */
  public async getAllByProjectId(projectId: number, projectType: ProjectTypeEnum): Promise<TaskEntity[]> {
    const tasks = await this.db.query.taskTable.findMany({
      where: {
        projectId
      },
      extras: {
        annotationCount: (table) => {
          switch (projectType){
            case ProjectTypeEnum.DETECTION:
              return this.db.$count(rectangleAnnotationTable, eq(rectangleAnnotationTable.taskId, table.id))
            case ProjectTypeEnum.CLASSIFICATION:
              return this.db.$count(classificationAnnotationTable, eq(classificationAnnotationTable.taskId, table.id))
            case ProjectTypeEnum.SEGMENTATION:
              return this.db.$count(polygonAnnotationTable, eq(polygonAnnotationTable.taskId, table.id))
          }
        }
      }
    })

    return tasks.map((t) => new TaskEntity(t))
  }

  /**
   * Delete task by id
   * @param id
   */
  public async delete(id: number): Promise<void>{
    await this.db.update(taskTable).set({
      deletedAt: new Date(),
    }).where(eq(taskTable.id, id))
  }
}
