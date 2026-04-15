import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { pendingTaskTable, taskTable } from "@repo/database";
import { eq, max, sql } from "drizzle-orm";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import { PendingTaskInsert, PendingTaskSelect } from "../types/pending-task";

@Injectable()
export class PendingTaskRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  public async getById(id: number): Promise<PendingTaskSelect | null> {
    const row = await this.db.query.pendingTaskTable.findFirst({
      where: { id },
    });
    return row ?? null;
  }

  /**
   * Reserve the next numeric iid for the project (gaps allowed) and insert
   * a pending-task row in a single transaction. Uses an advisory lock so
   * concurrent captures don't collide on iid. Looks across both the real
   * task table and the pending table to pick the true next iid.
   */
  public async createWithNextIid(
    projectId: number,
    data: Omit<PendingTaskInsert, "iid">,
  ): Promise<PendingTaskSelect> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${projectId})`);

      const [taskMax] = await tx
        .select({
          maxIid: max(sql`CASE WHEN ${taskTable.iid} ~ '^[0-9]+$' THEN ${taskTable.iid}::int END`),
        })
        .from(taskTable)
        .where(eq(taskTable.projectId, projectId));

      const [pendingMax] = await tx
        .select({
          maxIid: max(sql`CASE WHEN ${pendingTaskTable.iid} ~ '^[0-9]+$' THEN ${pendingTaskTable.iid}::int END`),
        })
        .from(pendingTaskTable)
        .where(eq(pendingTaskTable.projectId, projectId));

      const currentMax = Math.max(Number(taskMax?.maxIid ?? 0), Number(pendingMax?.maxIid ?? 0));
      const nextIid = String(currentMax + 1);

      const [created] = await tx
        .insert(pendingTaskTable)
        .values({ ...data, iid: nextIid })
        .returning();

      if (!created) {
        throw new InternalServerErrorException("Failed creating pending task");
      }
      return created;
    });
  }

  public async delete(id: number): Promise<void> {
    await this.db.delete(pendingTaskTable).where(eq(pendingTaskTable.id, id));
  }
}
