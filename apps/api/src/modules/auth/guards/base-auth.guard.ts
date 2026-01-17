import { ExecutionContext, Injectable } from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

export const BaseAuthGuard = (type?: string | string[]) => {
  @Injectable()
  class BaseAuthGuard extends AuthGuard(type) {
    constructor(readonly reflector: Reflector) {
      super();
    }

    canActivate(ctx: ExecutionContext) {
      return this.isPublic(ctx) || super.canActivate(ctx);
    }

    isPublic(ctx: ExecutionContext): boolean {
      const handlerGuards = this.reflector.get<unknown>(
        GUARDS_METADATA,
        ctx.getHandler(),
      );

      if (
        Array.isArray(handlerGuards) &&
        handlerGuards.some((g) => this instanceof g)
      ) {
        return false;
      }

      return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
    }
  }

  return BaseAuthGuard;
};
