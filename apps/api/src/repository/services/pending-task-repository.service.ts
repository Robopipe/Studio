import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { pendingTaskTable } from "@repo/database";
import { eq, sql } from "drizzle-orm";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import { PendingTaskInsert, PendingTaskSelect } from "../types/pending-task";

const UNIQUE_VIOLATION = "23505";
const MAX_IID_RETRIES = 3;

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
   * Reserve the next numeric iid + insert the pending row in a single SQL
   * round-trip. Computes `GREATEST(MAX(task), MAX(pending)) + 1` inline and
   * relies on the `UNIQUE(project_id, iid)` constraint for correctness under
   * concurrency — if two callers race, the loser retries. Cheaper than an
   * advisory-lock transaction (6 RTTs → 1 RTT in the happy path).
   *
   * Gaps in the iid sequence are acceptable (abandoned uploads leave holes).
   */
  public async createWithNextIid(
    projectId: number,
    data: Omit<PendingTaskInsert, "iid">,
  ): Promise<PendingTaskSelect> {
    const nextIidExpr = sql<string>`(GREATEST(
      COALESCE((SELECT MAX(iid::int) FROM task
                WHERE project_id = ${projectId} AND iid ~ '^[0-9]+$'), 0),
      COALESCE((SELECT MAX(iid::int) FROM pending_task
                WHERE project_id = ${projectId} AND iid ~ '^[0-9]+$'), 0)
    ) + 1)::text`;

    for (let attempt = 0; attempt < MAX_IID_RETRIES; attempt++) {
      try {
        const [created] = await this.db
          .insert(pendingTaskTable)
          .values({
            projectId,
            objectPath: data.objectPath,
            capturedAt: data.capturedAt ?? null,
            iid: nextIidExpr,
          })
          .returning();

        if (!created) {
          throw new InternalServerErrorException("Failed creating pending task");
        }
        return created;
      } catch (e) {
        if (isUniqueViolation(e) && attempt < MAX_IID_RETRIES - 1) {
          continue;
        }
        throw e;
      }
    }

    throw new InternalServerErrorException("Failed reserving iid after retries");
  }

  public async delete(id: number): Promise<void> {
    await this.db.delete(pendingTaskTable).where(eq(pendingTaskTable.id, id));
  }
}

function isUniqueViolation(e: unknown): boolean {
  const code = (e as { code?: string; cause?: { code?: string } })?.code
    ?? (e as { cause?: { code?: string } })?.cause?.code;
  return code === UNIQUE_VIOLATION;
}
