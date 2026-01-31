import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { UserEntity } from "../../user/entities/user.entity";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import { type DbConnection } from "../../../core/database/types/database.types";
import { projectTable } from "@repo/database";
import { and, eq } from "drizzle-orm";

@Injectable()
export class ProjectGuard implements CanActivate {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const projectId = Number(request.params.projectId);
    const user = request.user as UserEntity;

    if(!user || !projectId || isNaN(projectId)){
      return false
    }

    const projectCount = await this.db.$count(projectTable, and(eq(projectTable.organizationId, user.organizationId), eq(projectTable.id, projectId)))
    return projectCount > 0
  }
}
