import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Jwt } from '@repo/schema';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from 'src/core/configuration/app.config';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { UserRepository } from 'src/repository/services/user-repository.service';

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

  async validate(payload: Jwt): Promise<UserEntity> {
    const { sub } = payload;
    const user = await this.userRepository.getById(sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
