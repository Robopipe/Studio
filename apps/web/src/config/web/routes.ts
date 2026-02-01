export const webRoutes = {
  auth: {
    register: "/register",
    login: "/login",
  },
  main: {
    projects: "/",
    project: "/projects/:id",
  },
  model: {
    modelList: "/projects/:projectId/models",
    modelDetail: "/projects/:projectId/models/:modelId",
    modelNew: "/projects/:projectId/models/new",
  },
  capture: "/capture",
} as const;
