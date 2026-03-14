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
import { ModelLogRepository } from "./services/model-log-repository.service";
import { DashboardConfigurationItemRepository } from "./services/dashboard-configuration-item.service";
import { DashboardConfigurationRepository } from "./services/dashboard-configuration.service";
import { DashboardEvaluationRepository } from "./services/dashboard-evaluation.service";
import { PasswordResetRepository } from "./services/password-reset-repository.service";
import { OrganizationMemberRepository } from "./services/organization-member-repository.service";
import { InvitationRepository } from "./services/invitation-repository.service";
import { EvalLimitRepository } from './services/eval-limit.service';
import { EvalTestCaseRepository } from './services/eval-test-case.service';


@Global()
@Module({
  providers: [
    ModelRepository,
    OrganizationRepository,
    OrganizationMemberRepository,
    InvitationRepository,
    PasswordResetRepository,
    ProjectRepository,
    TaskRepository,
    UserRepository,
    ProjectLabelRepository,
    ModelOutputRepository,
    ModelLogRepository,
    DashboardConfigurationItemRepository,
    DashboardConfigurationRepository,
    DashboardEvaluationRepository,
    EvalLimitRepository,
    EvalTestCaseRepository
  ],
  exports: [
    ModelRepository,
    OrganizationRepository,
    OrganizationMemberRepository,
    InvitationRepository,
    PasswordResetRepository,
    ProjectRepository,
    TaskRepository,
    UserRepository,
    ProjectLabelRepository,
    ModelOutputRepository,
    ModelLogRepository,
    DashboardConfigurationItemRepository,
    DashboardConfigurationRepository,
    DashboardEvaluationRepository,
    EvalLimitRepository,
    EvalTestCaseRepository,
  ],
})
export class RepositoryModule {}
