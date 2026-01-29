import { Module } from '@nestjs/common';
import { ConfigurationModule } from './core/configuration/configuration.module';
import { DatabaseModule } from './core/database/database.module';
import { RepositoryModule } from './repository/repository.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ProjectModule } from './modules/project/project.module';

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    RepositoryModule,
    OrganizationModule,
    ProjectModule,
  ],
})
export class AppModule {}
