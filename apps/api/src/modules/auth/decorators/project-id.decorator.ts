import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

export const ProjectId = createParamDecorator(
  (
    _: unknown,
    ctx: ExecutionContext,
  ): number => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return Number(request.params.projectId)
  },
);
