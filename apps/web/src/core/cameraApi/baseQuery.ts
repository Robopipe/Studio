import { selectEffectiveCameraApiUrl } from "@/modules/project/services/cameraApiOverrideSlice";
import { RootState } from "@/store";
import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query";

export type CameraApiExtraOptions = { timeoutMs?: number };

/**
 * Dynamic base query that resolves the camera API URL from the active project,
 * preferring the current user's local override when set.
 */
export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  CameraApiExtraOptions
> = async (args, api, extraOptions) => {
  const state = api.getState() as RootState;
  const baseUrl = selectEffectiveCameraApiUrl(state) ?? "";

  const dynamicBaseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const contentType = headers.get("Content-Type");
      if (!contentType) {
        headers.set("Content-Type", "application/json");
      }
      return headers;
    },
  });

  const { timeoutMs, ...remainingOptions } = extraOptions ?? {};

  if (!timeoutMs) {
    return dynamicBaseQuery(args, api, remainingOptions);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  api.signal.addEventListener("abort", () => controller.abort());

  const argsWithSignal: FetchArgs =
    typeof args === "string"
      ? { url: args, signal: controller.signal }
      : { ...args, signal: controller.signal };

  try {
    return await dynamicBaseQuery(argsWithSignal, api, remainingOptions);
  } finally {
    clearTimeout(timeoutId);
  }
};
