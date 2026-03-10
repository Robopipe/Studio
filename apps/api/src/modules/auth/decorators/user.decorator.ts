import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { SessionUser } from '../strategies/jwt.strategy';

export const User = createParamDecorator(
  <K extends keyof SessionUser>(field: K | undefined, ctx: ExecutionContext): SessionUser | SessionUser[K] => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as SessionUser;

    return field ? user[field] : user;
  },
);
