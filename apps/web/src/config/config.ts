import { cameraApiConfig } from "./cameraApi";
import { studioApiConfig } from "./studioApi";
import { webConfig } from "./web";

export const appConfig = {
  studioApi: studioApiConfig,
  cameraApi: cameraApiConfig,
  web: webConfig,
} as const;
