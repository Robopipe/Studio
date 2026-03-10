import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { OrgMemberRoleEnum } from "@repo/schema";
import type { SessionUser } from "../strategies/jwt.strategy";

export const ROLES_KEY = "roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * @param context - execution context
   * @returns true if the user has one of the required roles, or if no roles are required
   * @throws {ForbiddenException} if the user lacks the required role
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<OrgMemberRoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as SessionUser;

    if (!user?.role || !requiredRoles.includes(user.role as OrgMemberRoleEnum)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}
