export const studioApiEndpoints = {
  auth: {
    register: "auth/register",
    login: "auth/login",
    refreshToken: "auth/refresh",
    profile: "auth/profile",
    logout: "auth/logout",
    forgotPassword: "auth/forgot-password",
    resetPassword: "auth/reset-password",
    changePassword: "auth/change-password",
    verifyEmail: "auth/verify-email",
    resendVerification: "auth/resend-verification",
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
    uploadUrl: (projectId: number) => `task/${projectId}/upload-url`,
    confirm: (projectId: number) => `task/${projectId}/confirm`,
    export: (projectId: number) => `task/${projectId}/export`,
    ids: (projectId: number) => `task/${projectId}/ids`,
    history: (projectId: number, taskId: number) => `task/${projectId}/${taskId}/history`,
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
  capturedVideos: {
    list: (projectId: number) => `captured-video/${projectId}`,
    single: (projectId: number, videoId: number) =>
      `captured-video/${projectId}/${videoId}`,
    uploadUrl: (projectId: number) => `captured-video/${projectId}/upload-url`,
    confirm: (projectId: number) => `captured-video/${projectId}/confirm`,
  },
  predict: {
    predict: (projectId: number, taskId: number) =>
      `predict/${projectId}/${taskId}`,
  },
  preAnnotateSettings: (projectId: number, modelType: string) =>
    `projects/${projectId}/pre-annotate-settings/${modelType}`,
  analytics: {
    datasetStats: (projectId: number) => `analytics/${projectId}/dataset-stats`,
  },
  confidenceReport: {
    report: (projectId: number) => `confidence-report/${projectId}`,
    regions: (projectId: number, taskId: number) =>
      `confidence-report/${projectId}/regions/${taskId}`,
  },
} as const;
