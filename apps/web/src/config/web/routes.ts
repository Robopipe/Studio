export const webRoutes = {
  auth: {
    register: "/register",
    login: "/login",
  },
  main: {
    projects: "/projects",
    project: "/projects/:id",
  },
  capture: '/capture'
} as const;
