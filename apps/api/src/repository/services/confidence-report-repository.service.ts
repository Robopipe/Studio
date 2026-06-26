import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { confidenceReportTable, taskTable } from "@repo/database";
import { and, eq, inArray } from "drizzle-orm";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import type {
  ConfidenceReportInsert,
  ConfidenceReportSelect,
  ConfidenceReportUpdate,
} from "../types/confidence-report";
import type { ConfidenceReportTaskResult } from "@repo/schema";

@Injectable()
export class ConfidenceReportRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get the current report for a project (at most one per project).
   */
  public async findByProjectId(projectId: number): Promise<ConfidenceReportSelect | null> {
    const row = await this.db.query.confidenceReportTable.findFirst({
      where: { projectId },
    });
    return row ?? null;
  }

  /**
   * Get a report by its primary key.
   */
  public async findById(id: number): Promise<ConfidenceReportSelect | null> {
    const row = await this.db.query.confidenceReportTable.findFirst({
      where: { id },
    });
    return row ?? null;
  }

  /**
   * Create or replace the current report for a project.
   * Since there is at most one report per project (unique constraint on
   * project_id), this upserts the row by project_id.
   */
  public async upsert(data: ConfidenceReportInsert): Promise<ConfidenceReportSelect> {
    const [row] = await this.db
      .insert(confidenceReportTable)
      .values(data)
      .onConflictDoUpdate({
        target: confidenceReportTable.projectId,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!row) {
      throw new InternalServerErrorException("Failed creating confidence report");
    }
    return row;
  }

  /**
   * Partial update by report id.
   */
  public async update(id: number, data: ConfidenceReportUpdate): Promise<ConfidenceReportSelect> {
    const [row] = await this.db
      .update(confidenceReportTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(confidenceReportTable.id, id))
      .returning();

    if (!row) {
      throw new InternalServerErrorException("Failed updating confidence report");
    }
    return row;
  }

  /**
   * Write per-task scalars from a progress webhook chunk.
   * Updates meanConfidence, f1At50, minIou for each reported task.
   * Tasks with null scalars (un-annotated) still get a null write to mark
   * them as "processed" — the API only checks for explicit nulls.
   */
  public async bulkUpsertTaskScalars(
    projectId: number,
    taskResults: ConfidenceReportTaskResult[],
  ): Promise<void> {
    if (taskResults.length === 0) return;

    // Validate that all task IDs belong to this project before writing.
    const taskIds = taskResults.map((r) => r.taskId);
    const ownedTasks = await this.db
      .select({ id: taskTable.id })
      .from(taskTable)
      .where(and(inArray(taskTable.id, taskIds), eq(taskTable.projectId, projectId)));
    const ownedIds = new Set(ownedTasks.map((t) => t.id));

    for (const result of taskResults) {
      if (!ownedIds.has(result.taskId)) continue;
      await this.db
        .update(taskTable)
        .set({
          meanConfidence: result.meanConfidence ?? null,
          f1At50: result.f1At50 ?? null,
          minIou: result.minIou ?? null,
          updatedAt: new Date(),
        })
        .where(eq(taskTable.id, result.taskId));
    }
  }

  /**
   * Clear the per-task scalars for all tasks in a project when a new run
   * starts (overwrite semantics — previous run results must not linger).
   */
  public async clearTaskScalars(projectId: number): Promise<void> {
    await this.db
      .update(taskTable)
      .set({ meanConfidence: null, f1At50: null, minIou: null })
      .where(eq(taskTable.projectId, projectId));
  }
}
