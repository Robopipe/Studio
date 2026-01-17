import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { users } from "@repo/database/schema/index";
import { Jwt, Token, User } from "@repo/schema/index";
import { compare } from "bcrypt";
import { eq } from "drizzle-orm";
import { Response } from "express";
import { AppConfig } from "src/core/configuration/app.config";
import { DatabaseService } from "src/core/database/services/database.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfig,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.dbService.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !(await this.checkPassword(password, user.password))) {
      return null;
    }

    const { password: _, ...rest } = user;

    return rest;
  }

  login(user: User, res: Response): Token {
    const payload = { sub: user.id.toString() };
    const accessToken = this.jwtService.sign(payload);
    const refreshTokenDuration =
      this.configService.jwt.refreshTokenDuration ?? 7 * 24 * 60 * 60; // 7 days
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenDuration,
    });

    this.setRefreshTokenCookie(res, refreshToken, refreshTokenDuration * 1000);

    return { accessToken, user };
  }

  async refreshLogin(refreshToken: string): Promise<Token> {
    const { sub } = this.jwtService.verify<Jwt>(refreshToken);
    const user = await this.dbService.db.query.users.findFirst({
      where: eq(users.id, sub),
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return { accessToken: this.jwtService.sign({ sub }), user };
  }

  logout(res: Response) {
    this.setRefreshTokenCookie(res, "", 0);
  }

  private setRefreshTokenCookie(res: Response, token: string, maxAge: number) {
    const apiHost = new URL(this.configService.apiHost).hostname;
    const webHost = this.configService.webHost
      ? new URL(this.configService.webHost).hostname
      : null;
    const domain = webHost && apiHost.includes(webHost) ? webHost : apiHost;

    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: this.configService.env !== "local",
      signed: true,
      sameSite: "strict",
      domain,
      maxAge,
    });
  }

  private checkPassword(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
