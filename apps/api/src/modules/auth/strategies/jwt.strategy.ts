import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from 'src/core/configuration/app.config';
import { UserRepository } from 'src/repository/services/user-repository.service';

/** Holds the authenticated user along with their current org context from the JWT */
export interface SessionUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  organizationId: number;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: AppConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.jwtSecret,
    });
  }

  /**
   * Validates session JWTs — rejects pre-auth tokens.
   * @param payload - decoded JWT payload
   * @returns session user with org context merged in
   * @throws {UnauthorizedException} if the token is pre-auth scope or user doesn't exist
   */
  async validate(payload: Record<string, unknown>): Promise<SessionUser | null> {
    if (payload.scope === 'pre-auth') {
      return null;
    }

    const user = await this.userRepository.getById(payload.sub as number);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      organizationId: payload.orgId as number,
      role: payload.role as string,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }
}
