import { Injectable } from "@nestjs/common";
import { JWT_AUTH } from "./auth-guard.const";
import { BaseAuthGuard } from "./base-auth.guard";

@Injectable()
export class JwtAuthGuard extends BaseAuthGuard(JWT_AUTH) {}
