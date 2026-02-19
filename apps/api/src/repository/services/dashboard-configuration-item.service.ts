import { Inject, Injectable } from "@nestjs/common";
import { DB_CONNECTION } from "../../core/database/database.constant";
import { type DbConnection } from "../../core/database/types/database.types";

@Injectable()
export class DashboardConfigurationItemRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Create a dashboard configuration item by id
   */
  public async create(): Promise<void>{}

  /**
   * Update dashboard configuration item by id
   */
  public async update(): Promise<void>{}

  /**
   * (HARD) Delete dashboard configuration item by id
   * @param id
   */
  public async delete(): Promise<void>{}

  /**
   * Get all dashboard configuration items by project ID
   * @returns dashboard configuration items
   */
  public async getAllByProjectId(): Promise<void>{}
}
