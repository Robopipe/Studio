import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { taskTable, rectangleAnnotationTable, polygonAnnotationTable, classificationAnnotationTable } from "@repo/database/schema";
import { alias } from "drizzle-orm/pg-core";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import { TaskDetailEntity, TaskEntity } from "../../modules/task/entity/task.entity";
import { TaskInsert } from "../types/task";
import { and, asc, count, desc, eq, inArray, isNotNull, isNull, max, sql, type SQL } from "drizzle-orm";
import type { TaskSortBy } from "@repo/schema";
import { TaskStatusEnum } from "@repo/schema";

const METRIC_SORT_COLUMNS = {
  meanConfidence: taskTable.meanConfidence,
  meanIou: taskTable.meanIou,
  precision: taskTable.precision,
  recall: taskTable.recall,
} as const;

/**
 * Build the ORDER BY clause for task list queries.
 * Metric columns always use NULLS LAST (un-scored tasks sink to the bottom).
 * A stable `DESC id` tiebreaker is appended for deterministic pagination.
 */
function buildTaskOrderBy(sortBy: TaskSortBy, sortOrder: "asc" | "desc"): SQL[] {
  const orderFn = sortOrder === "desc" ? desc : asc;
  if (sortBy in METRIC_SORT_COLUMNS) {
    const col = METRIC_SORT_COLUMNS[sortBy as keyof typeof METRIC_SORT_COLUMNS];
    const dir = sql.raw(sortOrder === "desc" ? "desc" : "asc");
    return [sql`${col} ${dir} nulls last`, desc(taskTable.id)];
  }
  const col = sortBy === "updatedAt" ? taskTable.updatedAt : taskTable.createdAt;
  return [orderFn(col), desc(taskTable.id)];
}

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
    page: number,
    limit: number,
    deleted: boolean | null = false,
    annotated?: boolean,
    sortBy: TaskSortBy = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
    labelIds?: number[],
    ids?: number[],
    updatedBy?: number[],
  ): Promise<{ data: TaskEntity[]; total: number }> {
    const offset = (page - 1) * limit;

    // Build deletedAt condition
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
    const buildLabelCondition = labelIds?.length
      ? this.buildLabelExistsCondition(labelIds)
      : undefined;

    // Build id filter: restrict to the explicit set of task IDs
    const idsCondition: SQL | undefined = ids?.length
      ? inArray(taskTable.id, ids)
      : undefined;

    // Build updatedBy filter
    const updatedByCondition: SQL | undefined = updatedBy?.length
      ? inArray(taskTable.updatedBy, updatedBy)
      : undefined;

    const whereCondition = and(
      eq(taskTable.projectId, projectId),
      deletedAtCondition,
      statusCondition,
      idsCondition,
      updatedByCondition,
      buildLabelCondition?.(taskTable.id),
    );

    const [tasks, totalResult] = await Promise.all([
      this.db.select()
        .from(taskTable)
        .where(whereCondition)
        .orderBy(...buildTaskOrderBy(sortBy, sortOrder))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: count() })
        .from(taskTable)
        .where(whereCondition),
    ]);

    return {
      data: tasks.map((t) => new TaskEntity(t)),
      total: totalResult[0]?.count ?? 0,
    };
  }

  /**
   * Ordered list of non-deleted task IDs for a project, honoring the same
   * `annotated` / `labelIds` / `order` filters as the list endpoint. Returns
   * only the id column — used by the client for cross-page select-all and
   * shift-click range selection without loading every task row.
   */
  public async getAllIdsByProjectId(
    projectId: number,
    annotated?: boolean,
    labelIds?: number[],
    sortBy: TaskSortBy = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
  ): Promise<number[]> {
    const statusValue = annotated === true ? TaskStatusEnum.DONE
      : annotated === false ? TaskStatusEnum.TODO
      : undefined;

    const statusCondition: SQL | undefined = statusValue
      ? eq(taskTable.status, statusValue)
      : undefined;

    const buildLabelCondition = labelIds?.length
      ? this.buildLabelExistsCondition(labelIds)
      : undefined;

    const rows = await this.db
      .select({ id: taskTable.id })
      .from(taskTable)
      .where(
        and(
          eq(taskTable.projectId, projectId),
          isNull(taskTable.deletedAt),
          statusCondition,
          buildLabelCondition?.(taskTable.id),
        ),
      )
      .orderBy(...buildTaskOrderBy(sortBy, sortOrder));

    return rows.map((r) => r.id);
  }

  private buildLabelExistsCondition(labelIds: number[]): (taskId: SQL | typeof taskTable.id) => SQL {
    const inList = sql.join(labelIds.map((id) => sql`${id}`), sql`, `);
    const labelCount = sql`${labelIds.length}`;
    return (taskId) => {
      return sql`(
        SELECT COUNT(DISTINCT label_id) FROM (
          SELECT ${rectangleAnnotationTable.labelId} AS label_id FROM ${rectangleAnnotationTable} WHERE ${rectangleAnnotationTable.taskId} = ${taskId} AND ${rectangleAnnotationTable.labelId} IN (${inList})
          UNION
          SELECT ${polygonAnnotationTable.labelId} FROM ${polygonAnnotationTable} WHERE ${polygonAnnotationTable.taskId} = ${taskId} AND ${polygonAnnotationTable.labelId} IN (${inList})
          UNION
          SELECT ${classificationAnnotationTable.labelId} FROM ${classificationAnnotationTable} WHERE ${classificationAnnotationTable.taskId} = ${taskId} AND ${classificationAnnotationTable.labelId} IN (${inList})
        ) AS matched_labels
      ) = ${labelCount}`;
    };
  }

  /**
   * Fetch all non-deleted tasks for a project with their full annotation
   * set, honoring the same `annotated` + `labelIds` filters as the list
   * endpoint. No pagination — intended for the export endpoint.
   */
  public async getAllForExport(
    projectId: number,
    annotated?: boolean,
    labelIds?: number[],
  ): Promise<TaskDetailEntity[]> {
    const statusValue = annotated === true ? TaskStatusEnum.DONE
      : annotated === false ? TaskStatusEnum.TODO
      : undefined;

    const buildLabelCondition = labelIds?.length
      ? this.buildLabelExistsCondition(labelIds)
      : undefined;

    const tasks = await this.db.query.taskTable.findMany({
      where: {
        projectId,
        deletedAt: { isNull: true },
        ...(statusValue && { status: statusValue }),
        ...(buildLabelCondition && { RAW: (table: typeof taskTable) => buildLabelCondition(table.id) }),
      },
      orderBy: (t) => asc(t.createdAt),
      with: {
        rectangleAnnotations: { with: { label: true } },
        polygonAnnotations: { with: { label: true } },
        classificationAnnotations: { with: { label: true } },
      },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return tasks.map((t) => new TaskDetailEntity(t));
  }

  /**
   * Non-deleted tasks matching the given ids, scoped to a project.
   * Ids from other projects or soft-deleted tasks are silently omitted.
   */
  public async getAllByIdsAndProjectId(ids: number[], projectId: number): Promise<TaskEntity[]> {
    if (ids.length === 0) return [];

    const tasks = await this.db
      .select()
      .from(taskTable)
      .where(
        and(
          inArray(taskTable.id, ids),
          eq(taskTable.projectId, projectId),
          isNull(taskTable.deletedAt),
        ),
      );

    return tasks.map((t) => new TaskEntity(t));
  }

  /**
   * Ids of tasks in the source project that already have a non-deleted copy
   * in the target project (via cross-project import). Powers the picker's
   * "already imported" state.
   */
  public async getImportedSourceTaskIds(
    targetProjectId: number,
    sourceProjectId: number,
  ): Promise<number[]> {
    const sourceTask = alias(taskTable, "source_task");

    const rows = await this.db
      .select({ id: taskTable.sourceTaskId })
      .from(taskTable)
      .innerJoin(sourceTask, eq(sourceTask.id, taskTable.sourceTaskId))
      .where(
        and(
          eq(taskTable.projectId, targetProjectId),
          eq(sourceTask.projectId, sourceProjectId),
          isNull(taskTable.deletedAt),
        ),
      );

    return rows
      .map((r) => r.id)
      .filter((id): id is number => id !== null);
  }

  /**
   * Which of the given camera-API event ids already exist as non-deleted
   * tasks imported from the given dashboard.
   */
  public async getImportedEventIds(
    projectId: number,
    dashboardId: number,
    eventIds: number[],
  ): Promise<number[]> {
    if (eventIds.length === 0) return [];

    const rows = await this.db
      .select({ eventId: taskTable.sourceEventId })
      .from(taskTable)
      .where(
        and(
          eq(taskTable.projectId, projectId),
          eq(taskTable.sourceDashboardId, dashboardId),
          inArray(taskTable.sourceEventId, eventIds),
          isNull(taskTable.deletedAt),
        ),
      );

    return rows
      .map((r) => r.eventId)
      .filter((id): id is number => id !== null);
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
