import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { taskTable, rectangleAnnotationTable, polygonAnnotationTable, classificationAnnotationTable } from "@repo/database/schema";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import { TaskDetailEntity, TaskEntity } from "../../modules/task/entity/task.entity";
import { TaskInsert } from "../types/task";
import { and, asc, count, desc, eq, isNotNull, isNull, max, sql, type SQL } from "drizzle-orm";
import { ProjectTypeEnum, TaskStatusEnum } from "@repo/schema";

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
   * Create task with auto-generated IID (transaction-safe)
   * Uses an advisory lock on the project ID to prevent race conditions
   * @param projectId
   * @param data - TaskInsert without iid
   * @returns TaskEntity
   */
  public async createWithNextIid(projectId: number, data: Omit<TaskInsert, 'iid'>): Promise<TaskEntity> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${projectId})`)

      const result = await tx
        .select({
          maxIid: max(sql`CASE WHEN ${taskTable.iid} ~ '^[0-9]+$' THEN ${taskTable.iid}::int END`),
        })
        .from(taskTable)
        .where(eq(taskTable.projectId, projectId))

      const maxNumeric = result[0]?.maxIid ?? 0
      const nextIid = String(Number(maxNumeric) + 1)

      const [createdTask] = await tx.insert(taskTable).values({ ...data, iid: nextIid }).returning()
      if (!createdTask) {
        throw new InternalServerErrorException("Failed creating task")
      }

      return new TaskEntity(createdTask)
    })
  }


  /**
   * Get all tasks by project ID
   * @param projectId
   * @param projectType - Project type enum for relations
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

  /**
   * Get all tasks by project ID with pagination
   * @param projectId
   * @param projectType - Project type enum for relations
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @param deleted
   * @returns Paginated task entities
   */
  public async getAllByProjectIdPaginated(
    projectId: number,
    projectType: ProjectTypeEnum,
    page: number,
    limit: number,
    deleted: boolean | null = false,
    annotated?: boolean,
    order: "asc" | "desc" = "asc",
    labelIds?: number[],
  ): Promise<{ data: TaskEntity[]; total: number }> {
    const offset = (page - 1) * limit;

    // Build deletedAt filter for relational query
    const deletedAtFilter: Record<string, boolean> | undefined =
      deleted === false ? { isNull: true } :
      deleted === true ? { isNotNull: true } :
      undefined;

    // Build deletedAt condition for count query
    const deletedAtCondition: SQL | undefined =
      deleted === false ? isNull(taskTable.deletedAt) :
      deleted === true ? isNotNull(taskTable.deletedAt) :
      undefined;

    // Build status filter based on annotated param
    const statusValue = annotated === true ? TaskStatusEnum.DONE
      : annotated === false ? TaskStatusEnum.TODO
      : undefined;

    const statusCondition: SQL | undefined = statusValue
      ? eq(taskTable.status, statusValue)
      : undefined;

    // Build label filter: only return tasks that have annotations with the given label IDs
    const labelCondition: SQL | undefined = labelIds?.length
      ? this.buildLabelExistsCondition(projectType, labelIds)
      : undefined;

    const [tasks, totalResult] = await Promise.all([
      this.db.query.taskTable.findMany({
        where: {
          projectId,
          ...(deletedAtFilter && { deletedAt: deletedAtFilter }),
          ...(statusValue && { status: statusValue }),
          ...(labelCondition && { RAW: labelCondition }),
        },
        orderBy: (t) => (order === "desc" ? desc(t.createdAt) : asc(t.createdAt)),
        limit,
        offset,
      }),
      this.db.select({ count: count() })
        .from(taskTable)
        .where(and(eq(taskTable.projectId, projectId), deletedAtCondition, statusCondition, labelCondition)),
    ]);

    return {
      data: tasks.map((t) => new TaskEntity(t)),
      total: totalResult[0]?.count ?? 0,
    };
  }

  private buildLabelExistsCondition(projectType: ProjectTypeEnum, labelIds: number[]): SQL {
    const inList = sql.join(labelIds.map((id) => sql`${id}`), sql`, `);
    switch (projectType) {
      case ProjectTypeEnum.DETECTION:
        return sql`EXISTS (SELECT 1 FROM ${rectangleAnnotationTable} WHERE ${rectangleAnnotationTable.taskId} = ${taskTable.id} AND ${rectangleAnnotationTable.labelId} IN (${inList}))`;
      case ProjectTypeEnum.CLASSIFICATION:
        return sql`EXISTS (SELECT 1 FROM ${classificationAnnotationTable} WHERE ${classificationAnnotationTable.taskId} = ${taskTable.id} AND ${classificationAnnotationTable.labelId} IN (${inList}))`;
      case ProjectTypeEnum.SEGMENTATION:
        return sql`EXISTS (SELECT 1 FROM ${polygonAnnotationTable} WHERE ${polygonAnnotationTable.taskId} = ${taskTable.id} AND ${polygonAnnotationTable.labelId} IN (${inList}))`;
    }
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
