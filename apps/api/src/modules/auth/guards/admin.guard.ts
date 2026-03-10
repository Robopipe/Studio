import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { OrgMemberRoleEnum } from "@repo/schema";
import type { SessionUser } from "../strategies/jwt.strategy";

@Injectable()
export class AdminGuard implements CanActivate {
  /**
   * @param context - execution context
   * @returns true if the user is ADMIN or OWNER
   * @throws {ForbiddenException} if the user is a regular member
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as SessionUser;
    const adminRoles: string[] = [OrgMemberRoleEnum.ADMIN, OrgMemberRoleEnum.OWNER];

    if (!user?.role || !adminRoles.includes(user.role)) {
      throw new ForbiddenException("Only admins and owners can perform this action");
    }

    return true;
  }
}
