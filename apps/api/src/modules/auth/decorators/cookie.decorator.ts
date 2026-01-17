import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export type CookieDecoratorOptions = {
  name?: string;
  signed?: boolean;
};

export const Cookie = createParamDecorator(
  (options: CookieDecoratorOptions, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const cookies = options.signed ? req.signedCookies : req.cookies;

    return options.name
      ? (cookies?.[options.name] as string | undefined)
      : cookies;
  },
);
