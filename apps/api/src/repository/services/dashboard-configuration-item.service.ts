import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { dashboardConfigurationItemTable } from "@repo/database";
import { eq, and } from "drizzle-orm";
import { DB_CONNECTION } from "../../core/database/database.constant";
import { type DbConnection } from "../../core/database/types/database.types";
import { DashboardConfigurationItemEntity } from "../../modules/dashboard/entity/dashboard-configuration-item.entity";
import {
  DashboardConfigurationItemInsert,
  DashboardConfigurationItemSelect,
  DashboardConfigurationItemUpdate,
} from "../types/dashboard-configuration-item";

@Injectable()
export class DashboardConfigurationItemRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get all dashboard configuration items by project ID
   * @param projectId
   * @returns DashboardConfigurationItemEntity[]
   */
  public async getAllByProjectId(projectId: number): Promise<DashboardConfigurationItemEntity[]> {
    const items = await this.db.query.dashboardConfigurationItemTable.findMany({
      where: { projectId },
      with: {
        targetLabel: true,
        targetParentLabel: true,
      },
    });

    // FK columns are NOT NULL so relations are always present
    return items.map((item) => new DashboardConfigurationItemEntity(item as DashboardConfigurationItemSelect));
  }

  /**
   * Get dashboard configuration item by ID and project ID
   * @param id
   * @param projectId
   * @returns DashboardConfigurationItemEntity or null
   */
  public async getByIdAndProjectId(id: number, projectId: number): Promise<DashboardConfigurationItemEntity | null> {
    const item = await this.db.query.dashboardConfigurationItemTable.findFirst({
      where: { id, projectId },
      with: {
        targetLabel: true,
        targetParentLabel: true,
      },
    });

    return item ? new DashboardConfigurationItemEntity(item as DashboardConfigurationItemSelect) : null;
  }

  /**
   * Create a dashboard configuration item
   * @param data
   * @returns DashboardConfigurationItemEntity
   */
  public async create(data: DashboardConfigurationItemInsert): Promise<DashboardConfigurationItemEntity> {
    const [created] = await this.db.insert(dashboardConfigurationItemTable).values(data).returning();

    if (!created) {
      throw new InternalServerErrorException("Failed creating dashboard configuration item");
    }

    const item = await this.db.query.dashboardConfigurationItemTable.findFirst({
      where: { id: created.id },
      with: {
        targetLabel: true,
        targetParentLabel: true,
      },
    });

    return new DashboardConfigurationItemEntity(item as DashboardConfigurationItemSelect);
  }

  /**
   * Update dashboard configuration item by id
   * @param id
   * @param data
   * @returns DashboardConfigurationItemEntity
   */
  public async update(id: number, data: DashboardConfigurationItemUpdate): Promise<DashboardConfigurationItemEntity> {
    const [updated] = await this.db
      .update(dashboardConfigurationItemTable)
      .set(data)
      .where(eq(dashboardConfigurationItemTable.id, id))
      .returning();

    if (!updated) {
      throw new InternalServerErrorException("Failed updating dashboard configuration item");
    }

    const item = await this.db.query.dashboardConfigurationItemTable.findFirst({
      where: { id: updated.id },
      with: {
        targetLabel: true,
        targetParentLabel: true,
      },
    });

    return new DashboardConfigurationItemEntity(item as DashboardConfigurationItemSelect);
  }

  /**
   * (HARD) Delete dashboard configuration item by id
   * @param id
   */
  public async delete(id: number): Promise<void> {
    await this.db.delete(dashboardConfigurationItemTable).where(eq(dashboardConfigurationItemTable.id, id));
  }
}
