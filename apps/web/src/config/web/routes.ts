export const webRoutes = {
  auth: {
    register: "/register",
    login: "/login",
  },
  main: {
    projects: "/",
    project: "/projects/:id",
  },
  capture: "/capture",
  label: "/label",
} as const;
