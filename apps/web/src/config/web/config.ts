import z from "zod";
import { webRoutes } from "./routes";

export const webConfig = {
  baseUrl: z.url().parse(import.meta.env.VITE_WEB_BASE_URL),
  routes: webRoutes,
} as const;
