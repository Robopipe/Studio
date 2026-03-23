import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { dashboardConfigurationTable } from "@repo/database";
import { eq } from "drizzle-orm";
import { DB_CONNECTION } from "../../core/database/database.constant";
import { type DbConnection } from "../../core/database/types/database.types";
import { DashboardConfigurationEntity } from "../../modules/dashboard/entity/dashboard-configuration.entity";
import {
  DashboardConfigurationInsert,
  DashboardConfigurationUpdate,
  DashboardConfigurationSelect,
} from "../types/dashboard-configuration";

@Injectable()
export class DashboardConfigurationRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get all dashboard configurations by project ID
   * @param projectId
   * @returns DashboardConfigurationEntity[]
   */
  public async getAllByProjectId(projectId: number): Promise<DashboardConfigurationEntity[]> {
    const configs = await this.db.query.dashboardConfigurationTable.findMany({
      where: { projectId },
    });

    return configs.map((config) => new DashboardConfigurationEntity(config as DashboardConfigurationSelect));
  }

  /**
   * Get dashboard configuration by ID and project ID
   * @param id
   * @param projectId
   * @returns DashboardConfigurationEntity or null if not found
   */
  public async getByIdAndProjectId(id: number, projectId: number): Promise<DashboardConfigurationEntity | null> {
    const config = await this.db.query.dashboardConfigurationTable.findFirst({
      where: { id, projectId },
    });

    return config ? new DashboardConfigurationEntity(config as DashboardConfigurationSelect) : null;
  }

  /**
   * Create dashboard configuration
   * @param data - DashboardConfigurationInsert
   * @throws InternalServerErrorException
   * @returns created DashboardConfigurationEntity
   */
  public async create(data: DashboardConfigurationInsert): Promise<DashboardConfigurationEntity> {
    const [created] = await this.db.insert(dashboardConfigurationTable).values(data).returning();

    if (!created) {
      throw new InternalServerErrorException("Failed creating dashboard configuration");
    }

    return new DashboardConfigurationEntity(created as DashboardConfigurationSelect);
  }

  /**
   * Update dashboard configuration by id
   * @param id
   * @param data - DashboardConfigurationUpdate
   * @throws InternalServerErrorException
   * @returns updated DashboardConfigurationEntity
   */
  public async update(id: number, data: DashboardConfigurationUpdate): Promise<DashboardConfigurationEntity> {
    const [updated] = await this.db
      .update(dashboardConfigurationTable)
      .set(data)
      .where(eq(dashboardConfigurationTable.id, id))
      .returning();

    if (!updated) {
      throw new InternalServerErrorException("Failed updating dashboard configuration");
    }

    return new DashboardConfigurationEntity(updated as DashboardConfigurationSelect);
  }

  /**
   * (HARD) Delete dashboard configuration by id
   * @param id
   */
  public async delete(id: number): Promise<void> {
    await this.db.delete(dashboardConfigurationTable).where(eq(dashboardConfigurationTable.id, id));
  }
}
