export const webRoutes = {
  auth: {
    register: "/register",
    login: "/login",
  },
  main: {
    projects: "/projects",
    project: "/projects/:id",
  },
} as const;
