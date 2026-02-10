import { studioApiConfig } from "./studioApi";
import { webConfig } from "./web";

export const appConfig = {
  studioApi: studioApiConfig,
  web: webConfig,
} as const;
