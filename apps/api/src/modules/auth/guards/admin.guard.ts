import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { UserEntity } from "src/modules/user/entities/user.entity";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserEntity;

    if (!user?.isAdmin()) {
      throw new ForbiddenException("Only admins can perform this action");
    }

    return true;
  }
}
