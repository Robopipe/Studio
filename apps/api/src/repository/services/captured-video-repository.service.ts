import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { capturedVideoTable } from "@repo/database/schema";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import { CapturedVideoEntity } from "../../modules/captured-video/entity/captured-video.entity";
import { CapturedVideoInsert } from "../types/captured-video";
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";

@Injectable()
export class CapturedVideoRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  public async create(data: CapturedVideoInsert): Promise<CapturedVideoEntity> {
    const [created] = await this.db.insert(capturedVideoTable).values(data).returning();
    if (!created) {
      throw new InternalServerErrorException("Failed creating captured video");
    }
    return new CapturedVideoEntity(created);
  }

  public async getByIdAndProjectId(id: number, projectId: number): Promise<CapturedVideoEntity | null> {
    const found = await this.db.query.capturedVideoTable.findFirst({
      where: {
        id,
        projectId,
        deletedAt: { isNull: true },
      },
    });
    return found ? new CapturedVideoEntity(found) : null;
  }

  public async getByIdAndProjectIdOrThrow(id: number, projectId: number): Promise<CapturedVideoEntity> {
    const video = await this.getByIdAndProjectId(id, projectId);
    if (!video) {
      throw new NotFoundException("Captured video not found");
    }
    return video;
  }

  public async getAllByProjectIdPaginated(
    projectId: number,
    page: number,
    limit: number,
    order: "asc" | "desc" = "desc",
  ): Promise<{ data: CapturedVideoEntity[]; total: number }> {
    const offset = (page - 1) * limit;

    const [videos, totalResult] = await Promise.all([
      this.db.query.capturedVideoTable.findMany({
        where: {
          projectId,
          deletedAt: { isNull: true },
        },
        orderBy: (t) => (order === "desc" ? desc(t.createdAt) : asc(t.createdAt)),
        limit,
        offset,
      }),
      this.db
        .select({ count: count() })
        .from(capturedVideoTable)
        .where(and(eq(capturedVideoTable.projectId, projectId), isNull(capturedVideoTable.deletedAt))),
    ]);

    return {
      data: videos.map((v) => new CapturedVideoEntity(v)),
      total: totalResult[0]?.count ?? 0,
    };
  }

  public async delete(id: number): Promise<void> {
    await this.db
      .update(capturedVideoTable)
      .set({ deletedAt: new Date() })
      .where(eq(capturedVideoTable.id, id));
  }
}
