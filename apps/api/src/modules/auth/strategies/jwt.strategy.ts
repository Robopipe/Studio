import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Jwt } from "@repo/schema/index";
import { eq } from "drizzle-orm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AppConfig } from "src/core/configuration/app.config";
import { DatabaseService } from "src/core/database/services/database.service";
import { users } from "src/database/schema";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: AppConfig,
    private readonly dbService: DatabaseService,
  ) {
    const { secret } = configService.jwt;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  async validate(payload: Jwt) {
    const { sub } = payload;
    const user = await this.dbService.db.query.users.findFirst({
      where: eq(users.id, sub),
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const { password: _, ...rest } = user;

    return rest;
  }
}
