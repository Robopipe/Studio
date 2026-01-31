import { Global, Module } from '@nestjs/common';
import { ModelRepository } from './services/model-repository.service';
import { OrganizationRepository } from './services/organization-repository.service';
import { ProjectRepository } from './services/project-repository.service';
import { TaskRepository } from './services/task-repository.service';
import { UserRepository } from './services/user-repository.service';


@Global()
@Module({
  providers: [
    ModelRepository,
    OrganizationRepository,
    ProjectRepository,
    TaskRepository,
    UserRepository
  ],
  exports: [
    ModelRepository,
    OrganizationRepository,
    ProjectRepository,
    TaskRepository,
    UserRepository
  ],
})
export class RepositoryModule {}
