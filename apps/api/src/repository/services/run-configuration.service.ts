import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { runConfigurationTable } from "@repo/database";
import { eq } from "drizzle-orm";
import { DB_CONNECTION } from "../../core/database/database.constant";
import { type DbConnection } from "../../core/database/types/database.types";
import { RunConfigurationEntity } from "../../modules/run-configuration/entity/run-configuration.entity";
import {
  RunConfigurationInsert,
  RunConfigurationUpdate,
  RunConfigurationSelect,
} from "../types/run-configuration";

@Injectable()
export class RunConfigurationRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get the run configuration of a project
   * @param projectId
   * @returns RunConfigurationEntity or null if not found
   */
  public async getByProjectId(projectId: number): Promise<RunConfigurationEntity | null> {
    const config = await this.db.query.runConfigurationTable.findFirst({
      where: { projectId },
    });

    return config ? new RunConfigurationEntity(config as RunConfigurationSelect) : null;
  }

  /**
   * Create run configuration
   * @param data - RunConfigurationInsert
   * @throws InternalServerErrorException
   * @returns created RunConfigurationEntity
   */
  public async create(data: RunConfigurationInsert): Promise<RunConfigurationEntity> {
    const [created] = await this.db.insert(runConfigurationTable).values(data).returning();

    if (!created) {
      throw new InternalServerErrorException("Failed creating run configuration");
    }

    return new RunConfigurationEntity(created as RunConfigurationSelect);
  }

  /**
   * Update the run configuration of a project
   * @param projectId
   * @param data - RunConfigurationUpdate
   * @throws InternalServerErrorException
   * @returns updated RunConfigurationEntity
   */
  public async updateByProjectId(projectId: number, data: RunConfigurationUpdate): Promise<RunConfigurationEntity> {
    const [updated] = await this.db
      .update(runConfigurationTable)
      .set(data)
      .where(eq(runConfigurationTable.projectId, projectId))
      .returning();

    if (!updated) {
      throw new InternalServerErrorException("Failed updating run configuration");
    }

    return new RunConfigurationEntity(updated as RunConfigurationSelect);
  }
}
