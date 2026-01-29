import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserEntity } from 'src/modules/user/entities/user.entity';

/**
 * Parameter decorator that extracts the authenticated user from the request.
 *
 * @example
 * // Get full user entity
 * @Get('profile')
 * getProfile(@User() user: UserEntity) {
 *   return user.toDto();
 * }
 *
 * @example
 * // Get specific property
 * @Get('org')
 * getOrg(@User('organizationId') orgId: number) {
 *   return orgId;
 * }
 */
export const User = createParamDecorator(
  <K extends keyof UserEntity>(data: K | undefined, ctx: ExecutionContext): UserEntity | UserEntity[K] => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as UserEntity;

    return data ? user[data] : user;
  },
);
