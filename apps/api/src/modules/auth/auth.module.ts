import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AppConfig } from "src/core/configuration/app.config";
import { DatabaseModule } from "src/core/database/database.module";
import { AuthController } from "./controllers/auth.controller";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { AuthService } from "./services/auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: AppConfig) => ({
        secret: configService.jwt.secret,
        signOptions: {
          expiresIn: configService.jwt.accessTokenDuration ?? 15 * 60, // 15 minutes
        },
      }),
      inject: [AppConfig],
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    LocalAuthGuard,
    JwtAuthGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
