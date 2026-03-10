import { Injectable } from "@nestjs/common";
import { JWT_AUTH, JWT_PRE_AUTH } from "./auth-guard.const";
import { BaseAuthGuard } from "./base-auth.guard";

/**
 * Accepts both pre-auth and session tokens.
 * Useful for endpoints that need to work in both auth phases
 * (e.g., listing organizations).
 */
@Injectable()
export class EitherAuthGuard extends BaseAuthGuard([JWT_PRE_AUTH, JWT_AUTH]) {}
