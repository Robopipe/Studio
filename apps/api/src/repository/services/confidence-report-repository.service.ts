import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { confidenceReportRegionTable, confidenceReportTable, projectLabelTable, taskTable } from "@repo/database";
import { and, eq, inArray } from "drizzle-orm";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import type {
  ConfidenceReportInsert,
  ConfidenceReportRegionInsert,
  ConfidenceReportSelect,
  ConfidenceReportUpdate,
} from "../types/confidence-report";
import type { ConfidenceReportRegionResponse, ConfidenceReportTaskResult } from "@repo/schema";

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
   * Updates meanConfidence, meanIou for each reported task.
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
          meanIou: result.meanIou ?? null,
          precision: result.precision ?? null,
          recall: result.recall ?? null,
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
      .set({ meanConfidence: null, meanIou: null, precision: null, recall: null })
      .where(eq(taskTable.projectId, projectId));
  }

  // ─── Inferred regions ────────────────────────────────────────────────────────

  /**
   * Delete all inferred regions for this report (called at run start so
   * each run starts clean — replacement semantics).
   */
  public async clearRegions(reportId: number): Promise<void> {
    await this.db
      .delete(confidenceReportRegionTable)
      .where(eq(confidenceReportRegionTable.reportId, reportId));
  }

  /**
   * Persist inferred regions from a progress webhook chunk.
   * For each task in the chunk, replaces any existing regions for that task
   * (idempotent re-delivery), then inserts the new ones.
   */
  public async bulkInsertRegions(
    reportId: number,
    projectId: number,
    taskResults: ConfidenceReportTaskResult[],
  ): Promise<void> {
    if (taskResults.length === 0) return;

    // Validate task ownership before writing (mirrors bulkUpsertTaskScalars).
    const taskIds = taskResults.map((r) => r.taskId);
    const ownedTasks = await this.db
      .select({ id: taskTable.id })
      .from(taskTable)
      .where(and(inArray(taskTable.id, taskIds), eq(taskTable.projectId, projectId)));
    const ownedIds = new Set(ownedTasks.map((t) => t.id));

    for (const result of taskResults) {
      if (!ownedIds.has(result.taskId)) continue;
      if (!result.regions || result.regions.length === 0) {
        // Still delete stale regions from a previous run (e.g. webhook retry).
        await this.db
          .delete(confidenceReportRegionTable)
          .where(
            and(
              eq(confidenceReportRegionTable.reportId, reportId),
              eq(confidenceReportRegionTable.taskId, result.taskId),
            ),
          );
        continue;
      }

      // Delete stale then insert fresh (idempotent for webhook retries).
      await this.db
        .delete(confidenceReportRegionTable)
        .where(
          and(
            eq(confidenceReportRegionTable.reportId, reportId),
            eq(confidenceReportRegionTable.taskId, result.taskId),
          ),
        );

      const rows: ConfidenceReportRegionInsert[] = result.regions.map((r) => ({
        reportId,
        taskId: result.taskId,
        labelId: r.labelId,
        geometry: r.geometry as ConfidenceReportRegionInsert["geometry"],
        score: r.score,
        iou: r.iou ?? null,
        matchedAnnotationId: r.matchedAnnotationId ?? null,
        x: r.x ?? null,
        y: r.y ?? null,
        width: r.width ?? null,
        height: r.height ?? null,
        value: r.value ? (r.value as [number, number][]) : null,
      }));

      await this.db.insert(confidenceReportRegionTable).values(rows);
    }
  }

  /**
   * Get inferred regions for a specific task, joining label info.
   * Returns an empty array when no report exists or the task has no regions.
   */
  public async getRegionsByTask(
    projectId: number,
    taskId: number,
  ): Promise<ConfidenceReportRegionResponse[]> {
    // Find the project's report.
    const report = await this.findByProjectId(projectId);
    if (!report) return [];

    const rows = await this.db
      .select({
        id: confidenceReportRegionTable.id,
        score: confidenceReportRegionTable.score,
        iou: confidenceReportRegionTable.iou,
        matchedAnnotationId: confidenceReportRegionTable.matchedAnnotationId,
        geometry: confidenceReportRegionTable.geometry,
        x: confidenceReportRegionTable.x,
        y: confidenceReportRegionTable.y,
        width: confidenceReportRegionTable.width,
        height: confidenceReportRegionTable.height,
        value: confidenceReportRegionTable.value,
        labelId: projectLabelTable.id,
        labelName: projectLabelTable.name,
        labelColor: projectLabelTable.color,
      })
      .from(confidenceReportRegionTable)
      .innerJoin(projectLabelTable, eq(confidenceReportRegionTable.labelId, projectLabelTable.id))
      .where(
        and(
          eq(confidenceReportRegionTable.reportId, report.id),
          eq(confidenceReportRegionTable.taskId, taskId),
        ),
      );

    return rows.map((row) => ({
      id: row.id,
      label: { id: row.labelId, name: row.labelName, color: row.labelColor },
      score: row.score,
      iou: row.iou,
      matchedAnnotationId: row.matchedAnnotationId,
      geometry: row.geometry,
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
      value: row.value as [number, number][] | null | undefined,
    }));
  }
}
