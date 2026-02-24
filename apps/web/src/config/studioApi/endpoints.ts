export const studioApiEndpoints = {
  auth: {
    register: "auth/register",
    login: "auth/login",
    refreshToken: "auth/refresh",
    profile: "auth/profile",
    logout: "auth/logout",
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
      items: (projectId: number, configId: number) =>
        `dashboard-config/${projectId}/configurations/${configId}/items`,
      item: (projectId: number, configId: number, itemId: number) =>
        `dashboard-config/${projectId}/configurations/${configId}/items/${itemId}`,
      evaluation: (projectId: number, configId: number) =>
        `dashboard-config/${projectId}/configurations/${configId}/evaluation`,
    },
  },
} as const;
