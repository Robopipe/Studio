import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserEntity } from 'src/modules/user/entities/user.entity';


export const User = createParamDecorator(
  <K extends keyof UserEntity>(field: K | undefined, ctx: ExecutionContext): UserEntity | UserEntity[K] => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as UserEntity;

    return field ? user[field] : user;
  },
);
