export const webRoutes = {
  auth: {
    register: "/register",
    login: "/login",
  },
  main: {
    projects: "/",
    project: "/projects/:id",
  },
  train: {
    trainList: "/projects/:id/train",
    trainDetail: "/projects/:id/train/:modelId",
    trainNew: "/projects/:id/train/new",
  },
  capture: "/capture",
} as const;
