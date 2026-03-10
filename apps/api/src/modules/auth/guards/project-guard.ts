import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import type { SessionUser } from "../strategies/jwt.strategy";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import { type DbConnection } from "../../../core/database/types/database.types";
import { projectTable } from "@repo/database";
import { and, eq } from "drizzle-orm";

@Injectable()
export class ProjectGuard implements CanActivate {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Checks that the project belongs to the user's current organization.
   * @param context - execution context (expects projectId route param)
   * @returns true if the project belongs to the user's org
   */
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const projectId = Number(request.params.projectId);
    const user = request.user as SessionUser;

    if(!user || !projectId || isNaN(projectId)){
      return false
    }

    const projectCount = await this.db.$count(projectTable, and(eq(projectTable.organizationId, user.organizationId), eq(projectTable.id, projectId)))
    return projectCount > 0
  }
}
