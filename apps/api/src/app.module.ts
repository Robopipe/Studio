import { Module } from "@nestjs/common";
import { APP_FILTER, APP_PIPE } from "@nestjs/core";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";
import { ZodValidationPipe } from "nestjs-zod";
import { ConfigurationModule } from "./core/configuration/configuration.module";
import { DatabaseModule } from "./core/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AssetsModule } from "./modules/assets/assets.module";
import { CapturedVideoModule } from "./modules/captured-video/captured-video.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { EmailModule } from "./modules/email/email.module";
import { EvalModule } from "./modules/eval/eval.module";
import { ModelModule } from "./modules/model/model.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { PreAnnotateSettingsModule } from "./modules/pre-annotate-settings/pre-annotate-settings.module";
import { PredictModule } from "./modules/predict/predict.module";
import { ProjectModule } from "./modules/project/project.module";
import { RepositoryModule } from "./repository/repository.module";
import { TaskModule } from "./modules/task/task.module";
import { TrainingExternalModule } from "./modules/training-external/training-external.module";

@Module({
  imports: [
    SentryModule.forRoot(),
    AnalyticsModule,
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
    PreAnnotateSettingsModule,
    PredictModule,
    DashboardModule,
    EmailModule,
    EvalModule,
    CapturedVideoModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ]
})
export class AppModule {}
