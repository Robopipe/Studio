import { Module } from "@nestjs/common";
import { ConfigurationModule } from "./core/configuration/configuration.module";
import { DatabaseModule } from "./core/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { ProjectModule } from "./modules/project/project.module";
import { RepositoryModule } from "./repository/repository.module";
import { AssetsModule } from "./modules/assets/assets.module";
import { TaskModule } from "./modules/task/task.module";
import { TrainingExternalModule } from "./modules/training-external/training-external.module";
import { ModelModule } from "./modules/model/model.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { EmailModule } from "./modules/email/email.module";
import { APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";

@Module({
  imports: [
    AuthModule,
    ConfigurationModule,
    DatabaseModule,
    RepositoryModule,
    OrganizationModule,
    ProjectModule,
    AssetsModule,
    TaskModule,
    TrainingExternalModule,
    ModelModule,
    DashboardModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe
    }
  ]
})
export class AppModule {}
