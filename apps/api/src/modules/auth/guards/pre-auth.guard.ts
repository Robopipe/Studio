import { Injectable } from "@nestjs/common";
import { JWT_PRE_AUTH } from "./auth-guard.const";
import { BaseAuthGuard } from "./base-auth.guard";

@Injectable()
export class PreAuthGuard extends BaseAuthGuard(JWT_PRE_AUTH) {}
