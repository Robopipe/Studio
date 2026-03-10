export const webRoutes = {
  auth: {
    register: "/register",
    login: "/login",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    selectOrganization: "/select-organization",
  },
  main: {
    projects: "/",
    project: "/projects/:projectId",
  },
  model: {
    modelList: "/projects/:projectId/models",
    modelDetail: "/projects/:projectId/models/:modelId",
    modelNew: "/projects/:projectId/models/new",
  },
  capture: "/projects/:projectId/capture",
  label: "/projects/:projectId/label",
  run: "/projects/:projectId/run",
  account: "/account",
} as const;
