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
} as const;
