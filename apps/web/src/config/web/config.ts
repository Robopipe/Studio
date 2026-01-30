import z from "zod";
import { webRoutes } from "./routes";

export const webConfig = {
  baseUrl: z.url().parse(import.meta.env.BASE_URL),
  routes: webRoutes,
} as const;
