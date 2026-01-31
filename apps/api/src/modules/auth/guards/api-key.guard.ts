import {
  CanActivate,
  ExecutionContext,
  Injectable,
  mixin,
  Type,
} from "@nestjs/common";
import { AppConfig } from "../../../core/configuration/app.config";


export enum ApiKeyType {
  TRAINING_EXTERNAL
}


export function ApiKeyGuard(apiKeyType: ApiKeyType): Type<CanActivate> {
  @Injectable()
  class CronGuardMixin implements CanActivate {
    constructor(private readonly config: AppConfig) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization

      if (!authHeader) {
        return false;
      }

      return authHeader === this.getApiKey(apiKeyType)
    }

    private getApiKey(type: ApiKeyType): string {
      switch(type){
        case ApiKeyType.TRAINING_EXTERNAL:
          return this.config.ml.apiKey
      }
    }
  }
  return mixin(CronGuardMixin);
}
