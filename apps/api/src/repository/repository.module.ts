import { Global, Module } from '@nestjs/common';
import { ModelRepository } from './services/model-repository.service';
import { OrganizationRepository } from './services/organization-repository.service';
import { ProjectRepository } from './services/project-repository.service';
import { TaskRepository } from './services/task-repository.service';
import { UserRepository } from './services/user-repository.service';
import { ProjectLabelRepository } from "./services/project-label-repository.service";
import {
  ModelOutputRepository,
} from "./services/model-output-repository.service";


@Global()
@Module({
  providers: [
    ModelRepository,
    OrganizationRepository,
    ProjectRepository,
    TaskRepository,
    UserRepository,
    ProjectLabelRepository,
    ModelOutputRepository,
  ],
  exports: [
    ModelRepository,
    OrganizationRepository,
    ProjectRepository,
    TaskRepository,
    UserRepository,
    ProjectLabelRepository,
    ModelOutputRepository,
  ],
})
export class RepositoryModule {}
