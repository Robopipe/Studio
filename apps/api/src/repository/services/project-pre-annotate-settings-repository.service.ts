import { Inject, Injectable } from "@nestjs/common";
import { projectPreAnnotateSettingsTable } from "@repo/database/schema";
import { PreAnnotateModelTypeEnum } from "@repo/schema";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import type {
  ProjectPreAnnotateSettingsSelect,
  ProjectPreAnnotateSettingsUpdate,
} from "../types/project-pre-annotate-settings";

@Injectable()
export class ProjectPreAnnotateSettingsRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  public async findByProjectAndType(
    projectId: number,
    modelType: PreAnnotateModelTypeEnum,
  ): Promise<ProjectPreAnnotateSettingsSelect | null> {
    const row = await this.db.query.projectPreAnnotateSettingsTable.findFirst({
      where: { projectId, modelType },
    });
    return row ?? null;
  }

  public async upsert(
    projectId: number,
    modelType: PreAnnotateModelTypeEnum,
    data: ProjectPreAnnotateSettingsUpdate,
  ): Promise<ProjectPreAnnotateSettingsSelect> {
    const [row] = await this.db
      .insert(projectPreAnnotateSettingsTable)
      .values({ projectId, modelType, ...data })
      .onConflictDoUpdate({
        target: [
          projectPreAnnotateSettingsTable.projectId,
          projectPreAnnotateSettingsTable.modelType,
        ],
        set: data,
      })
      .returning();
    return row!;
  }
}
