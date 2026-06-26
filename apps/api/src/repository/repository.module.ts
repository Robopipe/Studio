import { Global, Module } from '@nestjs/common';
import { AnalyticsRepository } from './services/analytics-repository.service';
import { ModelRepository } from './services/model-repository.service';
import { OrganizationRepository } from './services/organization-repository.service';
import { ProjectRepository } from './services/project-repository.service';
import { TaskRepository } from './services/task-repository.service';
import { PendingTaskRepository } from './services/pending-task-repository.service';
import { UserRepository } from './services/user-repository.service';
import { ProjectLabelRepository } from "./services/project-label-repository.service";
import {
  ModelOutputRepository,
} from "./services/model-output-repository.service";
import { ModelLogRepository } from "./services/model-log-repository.service";
import { DashboardConfigurationRepository } from "./services/dashboard-configuration.service";
import { DashboardEvaluationRepository } from "./services/dashboard-evaluation.service";
import { PasswordResetRepository } from "./services/password-reset-repository.service";
import { EmailVerificationRepository } from "./services/email-verification-repository.service";
import { OrganizationMemberRepository } from "./services/organization-member-repository.service";
import { InvitationRepository } from "./services/invitation-repository.service";
import { EvalLimitRepository } from './services/eval-limit.service';
import { EvalTestCaseRepository } from './services/eval-test-case.service';
import { EvalThresholdRepository } from './services/eval-threshold.service';
import { CapturedVideoRepository } from './services/captured-video-repository.service';
import { ProjectPreAnnotateSettingsRepository } from './services/project-pre-annotate-settings-repository.service';
import { ConfidenceReportRepository } from './services/confidence-report-repository.service';


@Global()
@Module({
  providers: [
    AnalyticsRepository,
    ModelRepository,
    OrganizationRepository,
    OrganizationMemberRepository,
    InvitationRepository,
    PasswordResetRepository,
    EmailVerificationRepository,
    ProjectRepository,
    TaskRepository,
    PendingTaskRepository,
    UserRepository,
    ProjectLabelRepository,
    ModelOutputRepository,
    ModelLogRepository,

    DashboardConfigurationRepository,
    DashboardEvaluationRepository,
    EvalLimitRepository,
    EvalTestCaseRepository,
    EvalThresholdRepository,
    CapturedVideoRepository,
    ProjectPreAnnotateSettingsRepository,
    ConfidenceReportRepository,
  ],
  exports: [
    AnalyticsRepository,
    ModelRepository,
    OrganizationRepository,
    OrganizationMemberRepository,
    InvitationRepository,
    PasswordResetRepository,
    EmailVerificationRepository,
    ProjectRepository,
    TaskRepository,
    PendingTaskRepository,
    UserRepository,
    ProjectLabelRepository,
    ModelOutputRepository,
    ModelLogRepository,

    DashboardConfigurationRepository,
    DashboardEvaluationRepository,
    EvalLimitRepository,
    EvalTestCaseRepository,
    EvalThresholdRepository,
    CapturedVideoRepository,
    ProjectPreAnnotateSettingsRepository,
    ConfidenceReportRepository,
  ],
})
export class RepositoryModule {}
