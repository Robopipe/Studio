import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { PreAuthJwt } from '@repo/schema';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from 'src/core/configuration/app.config';
import { UserRepository } from 'src/repository/services/user-repository.service';
import { JWT_PRE_AUTH } from '../guards/auth-guard.const';

@Injectable()
export class JwtPreAuthStrategy extends PassportStrategy(Strategy, JWT_PRE_AUTH) {
  constructor(
    private readonly userRepository: UserRepository,
    configService: AppConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.jwtSecret,
    });
  }

  /**
   * @param payload - decoded JWT payload
   * @returns the user entity
   * @throws {UnauthorizedException} if the token scope isn't "pre-auth" or user doesn't exist
   */
  async validate(payload: PreAuthJwt & { scope?: string }) {
    if (payload.scope !== 'pre-auth') {
      return null;
    }

    const user = await this.userRepository.getById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
