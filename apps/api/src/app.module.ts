import { Module } from "@nestjs/common";
import { ConfigurationModule } from "./core/configuration/configuration.module";
import { DatabaseModule } from "./core/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { ProjectModule } from "./modules/project/project.module";
import { RepositoryModule } from "./repository/repository.module";
import { AssetsModule } from "./modules/assets/assets.module";
import { TaskModule } from "./modules/task/task.module";

@Module({
  imports: [
    AuthModule,
    ConfigurationModule,
    DatabaseModule,
    RepositoryModule,
    OrganizationModule,
    ProjectModule,
    AssetsModule,
    TaskModule
  ],
})
export class AppModule {}
