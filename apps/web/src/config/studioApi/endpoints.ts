export const studioApiEndpoints = {
  auth: {
    register: "auth/register",
    login: "auth/login",
    refreshToken: "auth/refresh",
    profile: "auth/profile",
    logout: "auth/logout",
  },
} as const;
