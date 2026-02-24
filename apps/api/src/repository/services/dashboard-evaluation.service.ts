import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { dashboardEvaluationTable } from "@repo/database";
import { eq } from "drizzle-orm";
import { DB_CONNECTION } from "../../core/database/database.constant";
import { type DbConnection } from "../../core/database/types/database.types";
import { DashboardEvaluationEntity } from "../../modules/dashboard/entity/dashboard-evaluation.entity";
import {
  DashboardEvaluationInsert,
  DashboardEvaluationSelect,
} from "../types/dashboard-evaluation";

@Injectable()
export class DashboardEvaluationRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get evaluation by dashboard configuration ID
   * @param dashboardConfigurationId
   * @returns DashboardEvaluationEntity or null if not found
   */
  public async getByDashboardConfigurationId(dashboardConfigurationId: number): Promise<DashboardEvaluationEntity | null> {
    const evaluation = await this.db.query.dashboardEvaluationTable.findFirst({
      where: { dashboardConfigurationId },
    });

    return evaluation ? new DashboardEvaluationEntity(evaluation as DashboardEvaluationSelect) : null;
  }

  /**
   * Create or update evaluation for a dashboard configuration
   * @param data - DashboardEvaluationInsert
   * @throws InternalServerErrorException
   * @returns upserted DashboardEvaluationEntity
   */
  public async upsert(data: DashboardEvaluationInsert): Promise<DashboardEvaluationEntity> {
    const existing = await this.db.query.dashboardEvaluationTable.findFirst({
      where: { dashboardConfigurationId: data.dashboardConfigurationId },
    });

    if (existing) {
      const [updated] = await this.db
        .update(dashboardEvaluationTable)
        .set(data)
        .where(eq(dashboardEvaluationTable.id, existing.id))
        .returning();

      if (!updated) {
        throw new InternalServerErrorException("Failed updating dashboard evaluation");
      }

      return new DashboardEvaluationEntity(updated as DashboardEvaluationSelect);
    }

    const [created] = await this.db.insert(dashboardEvaluationTable).values(data).returning();

    if (!created) {
      throw new InternalServerErrorException("Failed creating dashboard evaluation");
    }

    return new DashboardEvaluationEntity(created as DashboardEvaluationSelect);
  }
}
