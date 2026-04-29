import { readCameraApiOverride } from "@/modules/project/utils/cameraApiOverride";
import { RootState } from "@/store";
import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query";

/**
 * Dynamic base query that resolves the camera API URL from the active project,
 * preferring the current user's local override (localStorage) when set.
 */
export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const state = api.getState() as RootState;
  const projectId = state.project.activeProject?.id;
  const userId = state.auth.user?.id;
  const override = readCameraApiOverride(userId, projectId);
  const baseUrl = override ?? state.project.activeProject?.cameraApiUrl ?? "";

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

  const result = await dynamicBaseQuery(args, api, extraOptions);

  return result;
};
