import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBody } from "@nestjs/swagger";
import { Token, User } from "@repo/schema/index";
import type { Request, Response } from "express";
import { Cookie } from "../decorators/cookie.decorator";
import { Public } from "../decorators/public.decorator";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { LocalAuthGuard } from "../guards/local-auth.guard";
import { AuthService } from "../services/auth.service";

@Controller("auth")
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @UseGuards(LocalAuthGuard)
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "test@example.com" },
        password: { type: "string", example: "testpassword" },
      },
    },
  })
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response): Token {
    return this.authService.login(req.user!, res);
  }

  @Post("refresh")
  refresh(
    @Cookie({ name: "refreshToken", signed: true }) refreshToken?: string,
  ): Promise<Token> {
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token cookie");
    }

    return this.authService.refreshLogin(refreshToken);
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    this.authService.logout(res);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request): User {
    return req.user!;
  }
}
