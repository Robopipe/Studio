import { Injectable } from "@nestjs/common";
import { LOCAL_AUTH } from "./auth-guard.const";
import { BaseAuthGuard } from "./base-auth.guard";

@Injectable()
export class LocalAuthGuard extends BaseAuthGuard(LOCAL_AUTH) {}
