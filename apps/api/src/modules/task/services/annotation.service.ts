import { Inject, Injectable } from "@nestjs/common";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import type { DbConnection, DbTransaction } from "../../../core/database/types/database.types";
import {
  classificationAnnotationTable,
  classificationAnnotationHistoryTable,
  rectangleAnnotationTable,
  rectangleAnnotationHistoryTable,
  polygonAnnotationTable,
  polygonAnnotationHistoryTable,
  userTable,
} from "@repo/database";
import { eq, inArray } from "drizzle-orm";
import type { TaskHistory } from "@repo/schema";
import type { TaskUpdateRequest } from "../dto/task.dto";

@Injectable()
export class AnnotationService {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Diff-and-upsert all three annotation types inside an existing transaction,
   * writing history events for each insert/update. Returns the total annotation count.
   */
  async upsertAnnotations(tx: DbTransaction, taskId: number, data: TaskUpdateRequest, userId: number): Promise<number> {
    await this.upsertRectangles(tx, taskId, data.rectangleAnnotations ?? [], userId);
    await this.upsertPolygons(tx, taskId, data.polygonAnnotations ?? [], userId);
    await this.upsertClassifications(tx, taskId, data.classificationAnnotations ?? [], userId);

    return (data.rectangleAnnotations?.length ?? 0)
      + (data.polygonAnnotations?.length ?? 0)
      + (data.classificationAnnotations?.length ?? 0);
  }

  async getHistory(taskId: number): Promise<TaskHistory> {
    const [rectRows, polyRows, clsRows] = await Promise.all([
      this.db
        .select({
          id: rectangleAnnotationHistoryTable.id,
          annotationId: rectangleAnnotationHistoryTable.annotationId,
          action: rectangleAnnotationHistoryTable.action,
          createdAt: rectangleAnnotationHistoryTable.createdAt,
          snapshot: rectangleAnnotationHistoryTable.snapshot,
          userId: userTable.id,
          userFullName: userTable.fullName,
        })
        .from(rectangleAnnotationHistoryTable)
        .leftJoin(userTable, eq(rectangleAnnotationHistoryTable.userId, userTable.id))
        .where(eq(rectangleAnnotationHistoryTable.taskId, taskId))
        .orderBy(rectangleAnnotationHistoryTable.createdAt),
      this.db
        .select({
          id: polygonAnnotationHistoryTable.id,
          annotationId: polygonAnnotationHistoryTable.annotationId,
          action: polygonAnnotationHistoryTable.action,
          createdAt: polygonAnnotationHistoryTable.createdAt,
          snapshot: polygonAnnotationHistoryTable.snapshot,
          userId: userTable.id,
          userFullName: userTable.fullName,
        })
        .from(polygonAnnotationHistoryTable)
        .leftJoin(userTable, eq(polygonAnnotationHistoryTable.userId, userTable.id))
        .where(eq(polygonAnnotationHistoryTable.taskId, taskId))
        .orderBy(polygonAnnotationHistoryTable.createdAt),
      this.db
        .select({
          id: classificationAnnotationHistoryTable.id,
          annotationId: classificationAnnotationHistoryTable.annotationId,
          action: classificationAnnotationHistoryTable.action,
          createdAt: classificationAnnotationHistoryTable.createdAt,
          snapshot: classificationAnnotationHistoryTable.snapshot,
          userId: userTable.id,
          userFullName: userTable.fullName,
        })
        .from(classificationAnnotationHistoryTable)
        .leftJoin(userTable, eq(classificationAnnotationHistoryTable.userId, userTable.id))
        .where(eq(classificationAnnotationHistoryTable.taskId, taskId))
        .orderBy(classificationAnnotationHistoryTable.createdAt),
    ]);

    return {
      rectangleHistory: this.groupRows(rectRows) as TaskHistory['rectangleHistory'],
      polygonHistory: this.groupRows(polyRows) as TaskHistory['polygonHistory'],
      classificationHistory: this.groupRows(clsRows) as TaskHistory['classificationHistory'],
    };
  }

  private async upsertRectangles(
    tx: DbTransaction,
    taskId: number,
    incoming: NonNullable<TaskUpdateRequest['rectangleAnnotations']>,
    userId: number,
  ): Promise<void> {
    const existing = await tx.select().from(rectangleAnnotationTable).where(eq(rectangleAnnotationTable.taskId, taskId));
    const existingById = new Map(existing.map(r => [r.id, r]));
    const toInsert = incoming.filter(a => !a.id || !existingById.has(a.id));
    const toUpdate = incoming.filter(a => a.id != null && existingById.has(a.id!)) as (typeof incoming[0] & { id: number })[];
    const incomingIds = new Set(incoming.filter(a => a.id).map(a => a.id!));
    const idsToDelete = existing.filter(r => !incomingIds.has(r.id)).map(r => r.id);

    if (idsToDelete.length > 0) {
      await tx.delete(rectangleAnnotationTable).where(inArray(rectangleAnnotationTable.id, idsToDelete));
    }
    if (toInsert.length > 0) {
      const inserted = await tx.insert(rectangleAnnotationTable).values(
        toInsert.map(a => ({ taskId, labelId: a.labelId, x: a.x!, y: a.y!, width: a.width!, height: a.height! }))
      ).returning();
      await tx.insert(rectangleAnnotationHistoryTable).values(
        inserted.map(r => ({
          taskId, annotationId: r.id, userId, action: 'created' as const,
          snapshot: { labelId: r.labelId, x: r.x, y: r.y, width: r.width, height: r.height },
        }))
      );
    }
    for (const a of toUpdate) {
      const existing = existingById.get(a.id)!;
      if (existing.labelId !== a.labelId || existing.x !== a.x || existing.y !== a.y || existing.width !== a.width || existing.height !== a.height) {
        await tx.update(rectangleAnnotationTable)
          .set({ labelId: a.labelId, x: a.x!, y: a.y!, width: a.width!, height: a.height! })
          .where(eq(rectangleAnnotationTable.id, a.id));
        await tx.insert(rectangleAnnotationHistoryTable).values({
          taskId, annotationId: a.id, userId, action: 'updated' as const,
          snapshot: { labelId: a.labelId, x: a.x!, y: a.y!, width: a.width!, height: a.height! },
        });
      }
    }
  }

  private async upsertPolygons(
    tx: DbTransaction,
    taskId: number,
    incoming: NonNullable<TaskUpdateRequest['polygonAnnotations']>,
    userId: number,
  ): Promise<void> {
    const existing = await tx.select().from(polygonAnnotationTable).where(eq(polygonAnnotationTable.taskId, taskId));
    const existingById = new Map(existing.map(p => [p.id, p]));
    const toInsert = incoming.filter(a => !a.id || !existingById.has(a.id));
    const toUpdate = incoming.filter(a => a.id != null && existingById.has(a.id!)) as (typeof incoming[0] & { id: number })[];
    const incomingIds = new Set(incoming.filter(a => a.id).map(a => a.id!));
    const idsToDelete = existing.filter(p => !incomingIds.has(p.id)).map(p => p.id);

    if (idsToDelete.length > 0) {
      await tx.delete(polygonAnnotationTable).where(inArray(polygonAnnotationTable.id, idsToDelete));
    }
    if (toInsert.length > 0) {
      const inserted = await tx.insert(polygonAnnotationTable).values(
        toInsert.map(a => ({ taskId, labelId: a.labelId, value: a.value! }))
      ).returning();
      await tx.insert(polygonAnnotationHistoryTable).values(
        inserted.map(p => ({
          taskId, annotationId: p.id, userId, action: 'created' as const,
          snapshot: { labelId: p.labelId, value: p.value },
        }))
      );
    }
    for (const a of toUpdate) {
      const existing = existingById.get(a.id)!;
      if (existing.labelId !== a.labelId || JSON.stringify(existing.value) !== JSON.stringify(a.value)) {
        await tx.update(polygonAnnotationTable)
          .set({ labelId: a.labelId, value: a.value! })
          .where(eq(polygonAnnotationTable.id, a.id));
        await tx.insert(polygonAnnotationHistoryTable).values({
          taskId, annotationId: a.id, userId, action: 'updated' as const,
          snapshot: { labelId: a.labelId, value: a.value! },
        });
      }
    }
  }

  private async upsertClassifications(
    tx: DbTransaction,
    taskId: number,
    incoming: NonNullable<TaskUpdateRequest['classificationAnnotations']>,
    userId: number,
  ): Promise<void> {
    const existing = await tx.select().from(classificationAnnotationTable).where(eq(classificationAnnotationTable.taskId, taskId));
    const existingById = new Map(existing.map(c => [c.id, c]));

    // A classification whose labelId differs from what's in DB is treated as a new insert
    // to avoid UNIQUE(taskId, labelId) collisions mid-transaction.
    const toKeep = new Set(
      incoming.filter(a => a.id != null && existingById.has(a.id!) && existingById.get(a.id!)!.labelId === a.labelId).map(a => a.id!)
    );
    const toInsert = incoming.filter(a => !a.id || !toKeep.has(a.id));
    const idsToDelete = existing.filter(c => !toKeep.has(c.id)).map(c => c.id);

    if (idsToDelete.length > 0) {
      await tx.delete(classificationAnnotationTable).where(inArray(classificationAnnotationTable.id, idsToDelete));
    }
    if (toInsert.length > 0) {
      const inserted = await tx.insert(classificationAnnotationTable).values(
        toInsert.map(a => ({ taskId, labelId: a.labelId }))
      ).returning();
      await tx.insert(classificationAnnotationHistoryTable).values(
        inserted.map(c => ({
          taskId, annotationId: c.id, userId, action: 'created' as const,
          snapshot: { labelId: c.labelId },
        }))
      );
    }
  }

  private groupRows(rows: Array<{ id: number; annotationId: number; action: 'created' | 'updated'; createdAt: Date; snapshot: unknown; userId: number | null; userFullName: string | null }>) {
    const groups = new Map<number, { annotationId: number; events: { id: number; action: 'created' | 'updated'; createdAt: string; user: { id: number; fullName: string } | null; snapshot: unknown }[] }>();
    for (const row of rows) {
      if (!groups.has(row.annotationId)) {
        groups.set(row.annotationId, { annotationId: row.annotationId, events: [] });
      }
      groups.get(row.annotationId)!.events.push({
        id: row.id,
        action: row.action,
        createdAt: row.createdAt.toISOString(),
        user: row.userId ? { id: row.userId, fullName: row.userFullName! } : null,
        snapshot: row.snapshot,
      });
    }
    return Array.from(groups.values());
  }
}
