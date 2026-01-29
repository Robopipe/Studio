import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Jwt, Token } from '@repo/schema';
import { compare } from 'bcrypt';
import type { Response } from 'express';
import { AppConfig } from 'src/core/configuration/app.config';
import { DB_CONNECTION } from 'src/core/database/database.constant';
import type { DbConnection } from 'src/core/database/types/database.types';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { UserRepository } from 'src/repository/services/user-repository.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfig,
  ) {}

  /**
   * Authenticate user - used by Passport LocalStrategy
   */
  public async validateUser(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.db.query.userTable.findFirst({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.checkPassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...rest } = user;
    return new UserEntity(rest);
  }

  /**
   * Login user
   */
  public login(user: UserEntity, res: Response): Token {
    const payload = { sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    const refreshTokenDuration =
      this.configService.jwt.refreshTokenDuration ?? 7 * 24 * 60 * 60; // 7 days
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenDuration,
    });

    this.setRefreshTokenCookie(res, refreshToken, refreshTokenDuration * 1000);

    return { accessToken, user: user.toDto() };
  }

  /**
   * Refresh authentication token
   */
  public async refreshLogin(refreshToken: string): Promise<Token> {
    const { sub } = this.jwtService.verify<Jwt>(refreshToken);
    const user = await this.userRepository.getById(sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { accessToken: this.jwtService.sign({ sub }), user: user.toDto() };
  }

  /**
   * Logout - clears refresh token cookie
   */
  public logout(res: Response): void {
    this.setRefreshTokenCookie(res, '', 0);
  }

  private setRefreshTokenCookie(res: Response, token: string, maxAge: number) {
    const apiHost = new URL(this.configService.apiHost).hostname;
    const webHost = this.configService.webHost
      ? new URL(this.configService.webHost).hostname
      : null;
    const domain = webHost && apiHost.includes(webHost) ? webHost : apiHost;

    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: this.configService.env !== 'local',
      signed: true,
      sameSite: 'strict',
      domain,
      maxAge,
    });
  }

  private checkPassword(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
