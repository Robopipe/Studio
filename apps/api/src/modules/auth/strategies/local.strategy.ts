import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { Strategy } from "passport-local";
import { AuthService } from "../services/auth.service";
import { UserSelect } from "src/repository/types/user";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ passReqToCallback: true, usernameField: "email" });
  }

  async validate(req: Request, email: string, password: string): Promise<UserSelect> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return user;
  }
}
