import { z } from "zod";
import { ApiConfig } from "../types/apiConfig";
import { cameraApiEndpoints } from "./endpoints";

export const cameraApiConfig: ApiConfig = {
  baseUrl: z.url().parse(import.meta.env.VITE_CAMERA_API_BASE_URL),
  endpoints: cameraApiEndpoints,
} as const;
