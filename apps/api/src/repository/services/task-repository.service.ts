import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { taskTable } from '@repo/database/schema';
import { DB_CONNECTION } from 'src/core/database/database.constant';
import type { DbConnection } from 'src/core/database/types/database.types';
import {
  TaskDetailEntity,
  TaskEntity,
} from "../../modules/task/entity/task.entity";
import { TaskInsert, TaskUpdate } from "../types/task";
import { eq } from "drizzle-orm";

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
        projectId
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
   * Update task
   * @param id
   * @param data - TaskUpdate
   */
  public async update(id: number, data: TaskUpdate): Promise<TaskEntity> {
    const [updatedTask] = await this.db.update(taskTable).set(data).where(eq(taskTable.id, id)).returning()
    if(!updatedTask){
      throw new InternalServerErrorException("Failed updating task")
    }

    return new TaskEntity(updatedTask)
  }


  /**
   * Get all tasks by project ID
   * @param projectId
   * @returns TaskEntity[]
   */
  public async getAllByProjectId(projectId: number): Promise<TaskEntity[]> {
    const tasks = await this.db.query.taskTable.findMany({
      where: {
        projectId
      },
    })

    return tasks.map((t) => new TaskEntity(t))
  }
}
