import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { dashboardConfigurationItemTable } from "@repo/database";
import { eq } from "drizzle-orm";
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
   * Get all items for a dashboard configuration
   * @param dashboardConfigurationId
   * @returns DashboardConfigurationItemEntity[]
   */
  public async getAllByDashboardConfigurationId(dashboardConfigurationId: number): Promise<DashboardConfigurationItemEntity[]> {
    const items = await this.db.query.dashboardConfigurationItemTable.findMany({
      where: { dashboardConfigurationId },
      with: {
        targetLabel: true,
        targetParentLabel: true,
      },
    });

    return items.map((item) => new DashboardConfigurationItemEntity(item as DashboardConfigurationItemSelect));
  }

  /**
   * Get item by ID and dashboard configuration ID
   * @param id
   * @param dashboardConfigurationId
   * @returns DashboardConfigurationItemEntity or null if not found
   */
  public async getByIdAndDashboardConfigurationId(id: number, dashboardConfigurationId: number): Promise<DashboardConfigurationItemEntity | null> {
    const item = await this.db.query.dashboardConfigurationItemTable.findFirst({
      where: { id, dashboardConfigurationId },
      with: {
        targetLabel: true,
        targetParentLabel: true,
      },
    });

    return item ? new DashboardConfigurationItemEntity(item as DashboardConfigurationItemSelect) : null;
  }

  /**
   * Create a dashboard configuration item
   * @param data - DashboardConfigurationItemInsert
   * @throws InternalServerErrorException
   * @returns created DashboardConfigurationItemEntity
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
   * Update a dashboard configuration item by id
   * @param id
   * @param data - DashboardConfigurationItemUpdate
   * @throws InternalServerErrorException
   * @returns updated DashboardConfigurationItemEntity
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
   * (HARD) Delete a dashboard configuration item by id
   * @param id
   */
  public async delete(id: number): Promise<void> {
    await this.db.delete(dashboardConfigurationItemTable).where(eq(dashboardConfigurationItemTable.id, id));
  }
}
