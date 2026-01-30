import z from "zod";
import { studioApiEndpoints } from "./endpoints";

export const studioApiConfig = {
  baseUrl: z.url().parse(import.meta.env.VITE_STUDIO_API_BASE_URL),
  endpoints: studioApiEndpoints,
} as const;
