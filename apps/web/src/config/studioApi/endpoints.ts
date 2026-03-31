export const studioApiEndpoints = {
  auth: {
    register: "auth/register",
    login: "auth/login",
    refreshToken: "auth/refresh",
    profile: "auth/profile",
    logout: "auth/logout",
    forgotPassword: "auth/forgot-password",
    resetPassword: "auth/reset-password",
    selectOrganization: "auth/select-organization",
    switchOrganization: "auth/switch-organization",
    organizations: "auth/organizations",
    invitations: "auth/invitations",
    acceptInvitation: (id: number) => `auth/invitations/${id}/accept`,
    declineInvitation: (id: number) => `auth/invitations/${id}/decline`,
  },
  organizations: {
    current: "organizations/current",
    members: "organizations/current/members",
    invite: "organizations/current/invite",
    member: (userId: number) => `organizations/current/members/${userId}`,
    memberRole: (userId: number) => `organizations/current/members/${userId}/role`,
    invitations: "organizations/current/invitations",
    invitation: (id: number) => `organizations/current/invitations/${id}`,
  },
  tasks: {
    tasks: (projectId: number) => `task/${projectId}`,
    task: (projectId: number, taskId: number) => `task/${projectId}/${taskId}`,
  },
  projects: {
    projects: "projects",
    project: (projectId: number) => `projects/${projectId}`,
    projectLabels: (projectId: number) => `project-labels/${projectId}`,
    projectLabel: (projectId: number, labelId: number) =>
      `project-labels/${projectId}/${labelId}`,
    models: {
      models: (projectId: number) => `model/${projectId}`,
    },
    dashboardConfig: {
      configurations: (projectId: number) =>
        `dashboard-config/${projectId}/configurations`,
      configuration: (projectId: number, configId: number) =>
        `dashboard-config/${projectId}/configurations/${configId}`,
      evaluation: (projectId: number, configId: number) =>
        `dashboard-config/${projectId}/configurations/${configId}/evaluation`,
    },
  },
} as const;
