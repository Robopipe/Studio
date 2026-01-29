import { Global, Module } from '@nestjs/common';
import { AnnotationRepository } from './services/annotation-repository.service';
import { FileRepository } from './services/file-repository.service';
import { ModelRepository } from './services/model-repository.service';
import { OrganizationRepository } from './services/organization-repository.service';
import { ProjectRepository } from './services/project-repository.service';
import { TaskCommentRepository } from './services/task-comment-repository.service';
import { TaskRepository } from './services/task-repository.service';
import { UserRepository } from './services/user-repository.service';


@Global()
@Module({
  providers: [
    AnnotationRepository,
    FileRepository,
    ModelRepository,
    OrganizationRepository,
    ProjectRepository,
    TaskCommentRepository,
    TaskRepository,
    UserRepository
  ],
  exports: [
    AnnotationRepository,
    FileRepository,
    ModelRepository,
    OrganizationRepository,
    ProjectRepository,
    TaskCommentRepository,
    TaskRepository,
    UserRepository
  ],
})
export class RepositoryModule {}
