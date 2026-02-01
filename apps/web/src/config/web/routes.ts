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
    modelList: "/projects/:id/models",
    modelDetail: "/projects/:id/models/:modelId",
    modelNew: "/projects/:id/models/new",
  },
  capture: "/projects/:id/capture",
  label: "/projects/:id/label",
} as const;
